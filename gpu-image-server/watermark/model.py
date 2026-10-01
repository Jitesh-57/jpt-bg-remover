"""The watermark detector: a U-Net predicting a text mask and a logo mask.

A ResNet-34 encoder pretrained on ImageNet already knows edges, letters and
textures, so the network only has to learn what makes a watermark a
watermark — which is why a single overnight run on a 6 GB card is enough.
"""
from __future__ import annotations

import random
from pathlib import Path
from typing import Optional, Sequence

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset

from .synth import find_fonts, find_images, find_logos, make_sample, random_crop

CLASSES = ("text", "logo")
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def build_detector(encoder: str = "resnet34", pretrained: bool = True) -> torch.nn.Module:
    import segmentation_models_pytorch as smp

    return smp.Unet(
        encoder_name=encoder,
        encoder_weights="imagenet" if pretrained else None,
        classes=len(CLASSES),
        activation=None,  # logits; sigmoid at inference
    )


def save_detector(model: torch.nn.Module, path: str | Path, encoder: str, size: int, extra: Optional[dict] = None) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "encoder": encoder, "size": size, "classes": CLASSES, **(extra or {})}, path)


def load_detector(path: str | Path, device: str = "cpu") -> tuple[torch.nn.Module, dict]:
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    model = build_detector(ckpt.get("encoder", "resnet34"), pretrained=False)
    model.load_state_dict(ckpt["state_dict"])
    return model.to(device).eval(), ckpt


def to_tensor(img: Image.Image) -> torch.Tensor:
    arr = (np.asarray(img.convert("RGB"), dtype=np.float32) / 255 - MEAN) / STD
    return torch.from_numpy(arr.transpose(2, 0, 1).copy())


class WatermarkDataset(Dataset):
    """Endless synthetic samples. `fixed=True` makes item i the same every time (for validation)."""

    def __init__(
        self,
        photos: Sequence[Path],
        size: int = 512,
        length: int = 10_000,
        fonts: Optional[Sequence[str]] = None,
        logos: Sequence[str] = (),
        fixed: bool = False,
        seed: int = 0,
    ):
        self.photos = list(photos)
        self.size = size
        self.length = length
        self.fonts = list(fonts) if fonts is not None else find_fonts()
        self.logos = list(logos)
        self.fixed = fixed
        self.seed = seed

    def __len__(self) -> int:
        return self.length

    def __getitem__(self, i: int):
        rng = random.Random(self.seed * 1_000_003 + i) if self.fixed else random.Random()
        for _ in range(5):  # skip the odd unreadable file
            try:
                photo = Image.open(rng.choice(self.photos))
                photo.load()
                break
            except OSError:
                continue
        crop = random_crop(photo, self.size, rng)
        img, mask = make_sample(crop, rng, self.fonts, self.logos)
        return to_tensor(img), torch.from_numpy(mask.astype(np.float32))


def split_photos(root: str, val_fraction: float = 0.03, seed: int = 0) -> tuple[list[Path], list[Path]]:
    photos = find_images(root)
    rng = random.Random(seed)
    rng.shuffle(photos)
    n_val = max(1, int(len(photos) * val_fraction)) if len(photos) > 1 else 0
    return photos[n_val:] or photos, photos[:n_val] or photos


__all__ = [
    "CLASSES", "WatermarkDataset", "build_detector", "save_detector", "load_detector",
    "to_tensor", "split_photos", "find_fonts", "find_logos",
]
