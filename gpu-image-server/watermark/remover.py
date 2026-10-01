"""Watermark removal at inference time: detect -> mask -> inpaint.

    remover = WatermarkRemover()
    result = remover.remove(image, remove_text=True, remove_logo=True)
    result.image, result.mask, result.found

Large photos are never squashed down to the model's size as a whole. The
detector runs on a resized copy at the scale it was trained at,
then each marked area is cut out with some surrounding context, inpainted at
a size LaMa handles well, and pasted back — so every pixel outside the
watermark stays exactly as uploaded.
"""
from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DETECTOR_PATH = Path(os.getenv("WM_DETECTOR", ROOT / "weights" / "wm_detector.pt"))
LAMA_PATH = Path(os.getenv("WM_LAMA", ROOT / "weights" / "big-lama.pt"))
# TorchScript export of the official big-lama checkpoint (Apache-2.0),
# published by the simple-lama-inpainting project.
LAMA_URL = os.getenv("WM_LAMA_URL", "https://github.com/enesmsahin/simple-lama-inpainting/releases/download/v0.1.0/big-lama.pt")

DETECT_LONG = int(os.getenv("WM_DETECT_LONG", "1536"))  # cap on the detector input's long edge (panoramas)
LAMA_MAX = int(os.getenv("WM_LAMA_MAX", "1024"))       # biggest crop LaMa sees, long edge


@dataclass
class Removal:
    image: Image.Image
    mask: Image.Image                 # L mode, 255 = removed
    found: bool                       # did the detector (or the brush) mark anything?
    coverage: float                   # share of the frame that was rebuilt
    timings: dict = field(default_factory=dict)
    engine: str = "lama"


class WatermarkRemover:
    def __init__(self, device: Optional[str] = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._detector = None
        self._detector_size = 512
        self._lama = None
        self._lama_failed = False
        self._lock = threading.Lock()  # one GPU job at a time on a 6 GB card

    # ── Models (loaded on first use, not at server start) ────────────────────

    @property
    def detector_ready(self) -> bool:
        return self._detector is not None or DETECTOR_PATH.exists()

    def _get_detector(self):
        if self._detector is None:
            if not DETECTOR_PATH.exists():
                raise FileNotFoundError(
                    f"No trained detector at {DETECTOR_PATH}. Train one with `python -m watermark.train`, "
                    "or use manual mode (send a mask)."
                )
            from .model import load_detector

            model, ckpt = load_detector(DETECTOR_PATH, self.device)
            if self.device == "cuda":
                model = model.half()
            self._detector = model
            self._detector_size = int(ckpt.get("size", 512))
            print(f"[watermark] detector loaded from {DETECTOR_PATH} (val IoU {ckpt.get('best_iou', float('nan')):.3f})")
        return self._detector

    def _get_lama(self):
        if self._lama is None and not self._lama_failed:
            try:
                if not LAMA_PATH.exists():
                    LAMA_PATH.parent.mkdir(parents=True, exist_ok=True)
                    print(f"[watermark] downloading LaMa weights (~200 MB) to {LAMA_PATH} ...")
                    torch.hub.download_url_to_file(LAMA_URL, str(LAMA_PATH))
                self._lama = torch.jit.load(str(LAMA_PATH), map_location=self.device).eval()
                print(f"[watermark] LaMa loaded on {self.device}")
            except Exception as e:  # network down, file corrupt…  still remove, with OpenCV
                self._lama_failed = True
                print(f"[watermark] LaMa unavailable ({e}); falling back to OpenCV inpainting")
        return self._lama

    # ── Detection ────────────────────────────────────────────────────────────

    @torch.no_grad()
    def detect(self, img: Image.Image) -> np.ndarray:
        """Per-pixel probabilities, shape (2, H, W): [text, logo]."""
        from .model import to_tensor

        model = self._get_detector()
        W, H = img.size
        # Match the scale the detector was trained at: synth.py sizes every
        # watermark relative to the crop's short side (the training size), so
        # the photo's short side is brought to that size too. Feeding it at a
        # larger size makes marks look bigger than anything seen in training.
        scale = self._detector_size / min(W, H)
        if max(W, H) * scale > DETECT_LONG:  # very wide or tall image: cap the long side
            scale = DETECT_LONG / max(W, H)
        # The U-Net halves the size five times, so both sides must divide by 32.
        dw, dh = max(32, round(W * scale / 32) * 32), max(32, round(H * scale / 32) * 32)
        x = to_tensor(img.resize((dw, dh), Image.BILINEAR)).unsqueeze(0).to(self.device)
        if self.device == "cuda":
            x = x.half()
        prob = torch.sigmoid(model(x).float())[0].cpu().numpy()
        return np.stack([cv2.resize(p, (W, H), interpolation=cv2.INTER_LINEAR) for p in prob])

    @staticmethod
    def build_mask(prob: np.ndarray, remove_text: bool, remove_logo: bool, threshold: float = 0.5) -> np.ndarray:
        chans = [c for c, on in ((0, remove_text), (1, remove_logo)) if on]
        if not chans:
            return np.zeros(prob.shape[1:], dtype=np.uint8)
        mask = (prob[chans].max(axis=0) > threshold).astype(np.uint8) * 255
        # Drop specks: a real watermark is never a few stray pixels.
        n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        min_area = max(12, int(mask.size * 2e-5))
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < min_area:
                mask[labels == i] = 0
        return mask

    @staticmethod
    def grow(mask: np.ndarray) -> np.ndarray:
        """Close the gaps inside and between letters, then widen the mask so
        anti-aliased edges and glow go too. A ring of untouched watermark pixels
        left around a stroke is exactly the "ghost" people notice."""
        side = min(mask.shape)
        close = max(3, int(side * 0.012)) | 1
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close)))
        k = max(5, int(side * 0.01)) | 1
        return cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)), iterations=1)

    # ── Inpainting ───────────────────────────────────────────────────────────

    @torch.no_grad()
    def _lama_fill(self, rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
        lama = self._get_lama()
        if lama is None:
            return cv2.inpaint(rgb, mask, 5, cv2.INPAINT_TELEA)
        h, w = mask.shape
        ph, pw = (8 - h % 8) % 8, (8 - w % 8) % 8
        img = np.pad(rgb, ((0, ph), (0, pw), (0, 0)), mode="reflect")
        m = np.pad(mask, ((0, ph), (0, pw)), mode="reflect")
        x = torch.from_numpy(img).permute(2, 0, 1)[None].float().div(255).to(self.device)
        mk = torch.from_numpy((m > 127).astype(np.float32))[None, None].to(self.device)
        out = lama(x, mk)[0].permute(1, 2, 0).clamp(0, 1).mul(255).byte().cpu().numpy()
        return out[:h, :w]

    def inpaint(self, img: Image.Image, mask: np.ndarray) -> np.ndarray:
        rgb = np.asarray(img.convert("RGB")).copy()
        H, W = mask.shape
        # Group nearby marks (the letters of one word, a logo and its caption)
        # so each gets inpainted with shared context rather than letter by letter.
        reach = max(9, int(min(H, W) * 0.03)) | 1
        groups = cv2.dilate(mask, np.ones((reach, reach), np.uint8))
        n, _, stats, _ = cv2.connectedComponentsWithStats(groups, connectivity=8)
        out = rgb.copy()
        for i in range(1, n):
            x, y, w, h = stats[i, :4]
            margin = max(48, int(max(w, h) * 0.5))
            x0, y0 = max(0, x - margin), max(0, y - margin)
            x1, y1 = min(W, x + w + margin), min(H, y + h + margin)
            crop, cmask = rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1]
            if not cmask.any():
                continue
            ch, cw = cmask.shape
            s = min(1.0, LAMA_MAX / max(ch, cw))
            if s < 1.0:
                small = cv2.resize(crop, (round(cw * s), round(ch * s)), interpolation=cv2.INTER_AREA)
                smask = cv2.resize(cmask, (round(cw * s), round(ch * s)), interpolation=cv2.INTER_NEAREST)
                smask = cv2.dilate(smask, np.ones((3, 3), np.uint8))
                filled = cv2.resize(self._lama_fill(small, smask), (cw, ch), interpolation=cv2.INTER_CUBIC)
            else:
                filled = self._lama_fill(crop, cmask)
            # Feather the seam so the patch blends instead of showing an edge.
            soft = cv2.GaussianBlur(cmask.astype(np.float32) / 255, (0, 0), sigmaX=1.2)
            soft = np.maximum(soft, (cmask > 0).astype(np.float32))[..., None]
            region = out[y0:y1, x0:x1].astype(np.float32)
            out[y0:y1, x0:x1] = (filled.astype(np.float32) * soft + region * (1 - soft)).astype(np.uint8)
        return out

    # ── Public entry point ───────────────────────────────────────────────────

    def remove(
        self,
        img: Image.Image,
        remove_text: bool = True,
        remove_logo: bool = True,
        manual_mask: Optional[Image.Image] = None,
        threshold: float = 0.5,
    ) -> Removal:
        img = img.convert("RGB")
        t = {}
        with self._lock:
            t0 = time.time()
            if manual_mask is not None:
                m = np.asarray(manual_mask.convert("L").resize(img.size, Image.NEAREST))
                mask = (m > 127).astype(np.uint8) * 255
            else:
                mask = self.build_mask(self.detect(img), remove_text, remove_logo, threshold)
            t["detect"] = round(time.time() - t0, 2)
            if not mask.any():
                return Removal(img, Image.fromarray(mask), False, 0.0, t, "none")
            mask = self.grow(mask)
            t1 = time.time()
            out = self.inpaint(img, mask)
            t["inpaint"] = round(time.time() - t1, 2)
        engine = "lama" if self._lama is not None else "opencv"
        return Removal(Image.fromarray(out), Image.fromarray(mask), True, float((mask > 0).mean()), t, engine)

    def status(self) -> dict:
        return {
            "detector": self.detector_ready,
            "detector_path": str(DETECTOR_PATH),
            "lama": LAMA_PATH.exists(),
            "device": self.device,
        }
