"""
JPT AI — self-hosted image generation + editing server.

Runs Stable Diffusion (and optionally SDXL/FLUX) on your own GPU and exposes a
small HTTP API your website can call. Tuned to run well on a 6 GB card like the
RTX 3050 by defaulting to SD 1.5 with memory-saving options.

Endpoints
  GET  /health            -> model + device info
  POST /generate          -> text -> image
  POST /edit              -> image + prompt -> edited image (img2img)
  POST /inpaint           -> image + mask + prompt -> region edit / bg swap

All POST endpoints accept an optional  "enhance": true  which runs the prompt
through GitHub Models (GPT-4o) first for richer detail (see prompt_brain.py).

Auth: set API_TOKEN in the environment; clients must send  Authorization: Bearer <token>.
"""
from __future__ import annotations

import base64
import io
import os
import time
from typing import Optional

import torch
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from prompt_brain import enhance_prompt

# ── Config ────────────────────────────────────────────────────────────────────
# Default model is chosen for a 6 GB GPU. Override with MODEL_ID to use SDXL
# ("stabilityai/stable-diffusion-xl-base-1.0") or FLUX ("black-forest-labs/FLUX.1-schnell").
MODEL_ID   = os.getenv("MODEL_ID", "Lykon/dreamshaper-8")   # strong general-purpose SD 1.5 checkpoint
API_TOKEN  = os.getenv("API_TOKEN", "")                     # shared secret; empty = open (dev only)
HOST       = os.getenv("HOST", "0.0.0.0")
PORT       = int(os.getenv("PORT", "7860"))

_lower = MODEL_ID.lower()
FAMILY = "flux" if "flux" in _lower else "sdxl" if "xl" in _lower else "sd15"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
VRAM_GB = (torch.cuda.get_device_properties(0).total_memory / 1e9) if DEVICE == "cuda" else 0.0
# FLUX likes bfloat16; SD/SDXL use float16 on GPU, float32 on CPU.
if DEVICE == "cpu":
    DTYPE = torch.float32
elif FAMILY == "flux":
    DTYPE = torch.bfloat16
else:
    DTYPE = torch.float16
# Anything under ~12 GB streams weights from CPU to fit. The RTX 3050 (6 GB) hits this.
LOW_VRAM = VRAM_GB > 0 and VRAM_GB < 12

txt2img = None
img2img = None
inpaint = None


def _optimize(pipe):
    """Apply memory savings so big models fit on small cards."""
    try: pipe.enable_attention_slicing()
    except Exception: pass
    try: pipe.enable_vae_slicing()
    except Exception: pass
    try: pipe.enable_vae_tiling()
    except Exception: pass
    if LOW_VRAM:
        # Streams layers between CPU and GPU — slower but fits 6 GB.
        try:
            pipe.enable_model_cpu_offload()
            return pipe
        except Exception:
            pass
    return pipe.to(DEVICE)


def load_models():
    """Load the text2img pipeline and derive img2img / inpaint from it."""
    global txt2img, img2img, inpaint
    t0 = time.time()
    print(f"[load] model={MODEL_ID} family={FAMILY} device={DEVICE} vram={VRAM_GB:.1f}GB "
          f"dtype={DTYPE} low_vram={LOW_VRAM}")

    if FAMILY == "flux":
        from diffusers import FluxPipeline, FluxImg2ImgPipeline, FluxInpaintPipeline
        txt2img = FluxPipeline.from_pretrained(MODEL_ID, torch_dtype=DTYPE)
        txt2img = _optimize(txt2img)
        img2img = FluxImg2ImgPipeline.from_pipe(txt2img)
        inpaint = FluxInpaintPipeline.from_pipe(txt2img)
    else:
        from diffusers import (
            AutoPipelineForText2Image,
            AutoPipelineForImage2Image,
            AutoPipelineForInpainting,
        )
        txt2img = AutoPipelineForText2Image.from_pretrained(
            MODEL_ID, torch_dtype=DTYPE, safety_checker=None, requires_safety_checker=False
        )
        txt2img = _optimize(txt2img)
        # from_pipe reuses the same weights (no extra VRAM) for the other tasks.
        img2img = AutoPipelineForImage2Image.from_pipe(txt2img)
        inpaint = AutoPipelineForInpainting.from_pipe(txt2img)

    print(f"[load] ready in {time.time() - t0:.1f}s")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="JPT AI Image Server")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.on_event("startup")
def _startup():
    load_models()


def _auth(authorization: Optional[str]):
    if not API_TOKEN:
        return  # open mode (local dev only)
    if authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid or missing API token")


def _b64_to_image(data: str) -> Image.Image:
    if "," in data:  # strip data URL prefix
        data = data.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")


def _image_to_dataurl(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _steps_and_guidance(steps: Optional[int], guidance: Optional[float]):
    """Sensible defaults per model family."""
    if FAMILY == "flux":            # schnell is a 4-step, guidance-free model
        return steps or 4, guidance if guidance is not None else 0.0
    if FAMILY == "sdxl":
        return steps or 28, guidance if guidance is not None else 6.0
    return steps or 30, guidance if guidance is not None else 7.0  # sd15


# ── Request models ────────────────────────────────────────────────────────────
class GenerateReq(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, watermark, text, deformed"
    width: int = 1920               # final output size — Full HD by default
    height: int = 1080
    steps: Optional[int] = None
    guidance: Optional[float] = None
    seed: Optional[int] = None
    enhance: bool = False
    hd: bool = True                 # two-stage hi-res: generate native, then upscale + add detail


class EditReq(BaseModel):
    image: str                 # base64 / data URL
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, watermark, text, deformed"
    strength: float = 0.55     # how much to change (0=keep, 1=ignore original)
    steps: Optional[int] = None
    guidance: Optional[float] = None
    seed: Optional[int] = None
    enhance: bool = False


class InpaintReq(BaseModel):
    image: str                 # base64 / data URL
    mask: str                  # white = area to change, black = keep
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, watermark, text, deformed"
    steps: Optional[int] = None
    guidance: Optional[float] = None
    seed: Optional[int] = None
    enhance: bool = False


class UpscaleReq(BaseModel):
    image: str                 # base64 / data URL
    width: int = 1920          # target size (Full HD by default)
    height: int = 1080
    prompt: Optional[str] = "high quality, sharp, detailed, crisp"
    negative_prompt: Optional[str] = "blurry, low quality, watermark, text, deformed"
    seed: Optional[int] = None


def _generator(seed: Optional[int]):
    if seed is None:
        return None
    return torch.Generator(device="cpu" if LOW_VRAM else DEVICE).manual_seed(int(seed))


# ── Hi-res (Full HD) pipeline ────────────────────────────────────────────────
# Diffusion models render best at their native size (SD1.5 ~768, SDXL ~1024).
# To reach Full HD / 4K on a 6 GB card we render native, then upscale the image
# and run a light img2img pass ("hi-res fix") that adds real detail at the larger
# size — the standard way to get sharp HD from a small GPU without running out
# of VRAM. The heaviest img2img stage is capped, then a final Lanczos resize
# hits the exact target so we never OOM at 1920+ on 6 GB.
BASE_LONG = 1024 if FAMILY in ("sdxl", "flux") else 768   # native render long-edge
HIRES_CAP = 1536 if LOW_VRAM else 2048                    # heaviest detail-pass long-edge


def _round8(v: float) -> int:
    return max(8, int(round(v / 8)) * 8)


def _fit(long_edge: int, w: int, h: int):
    """Scale (w,h) so the long edge == long_edge, keep aspect, round to /8."""
    scale = long_edge / max(w, h)
    return _round8(w * scale), _round8(h * scale)


def _to_size(img: Image.Image, w: int, h: int) -> Image.Image:
    return img if img.size == (w, h) else img.resize((w, h), Image.LANCZOS)


def _hires(base: Image.Image, tw: int, th: int, prompt: str, negative: str,
           steps: int, guidance: float, seed: Optional[int]) -> Image.Image:
    """Upscale `base` toward (tw, th) and add detail with a light img2img pass."""
    target_long = max(tw, th)
    if target_long <= max(base.size):
        return _to_size(base, tw, th)
    inter_w, inter_h = _fit(min(target_long, HIRES_CAP), tw, th)
    upscaled = base.resize((inter_w, inter_h), Image.LANCZOS)
    kwargs = dict(
        prompt=prompt, image=upscaled, strength=0.35,
        num_inference_steps=max(18, int(steps * 0.7)), guidance_scale=guidance,
        generator=_generator(seed),
    )
    if FAMILY != "flux":
        kwargs["negative_prompt"] = negative
    detailed = img2img(**kwargs).images[0]
    return _to_size(detailed, tw, th)   # final exact-size (Full HD / 4K)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_ID,
        "family": FAMILY,
        "device": DEVICE,
        "vram_gb": round(VRAM_GB, 1),
        "low_vram": LOW_VRAM,
        "prompt_brain": bool(os.getenv("GITHUB_TOKEN")),
    }


@app.post("/generate")
def generate(req: GenerateReq, authorization: Optional[str] = Header(None)):
    _auth(authorization)
    steps, guidance = _steps_and_guidance(req.steps, req.guidance)
    prompt = enhance_prompt(req.prompt, "generate") if req.enhance else req.prompt
    t0 = time.time()

    # Stage 1 — render at the model's native resolution (keeps the aspect ratio).
    do_hd = req.hd and max(req.width, req.height) > BASE_LONG
    gw, gh = _fit(BASE_LONG, req.width, req.height) if do_hd else (req.width, req.height)
    kwargs = dict(
        prompt=prompt, width=gw, height=gh,
        num_inference_steps=steps, guidance_scale=guidance,
        generator=_generator(req.seed),
    )
    if FAMILY != "flux":
        kwargs["negative_prompt"] = req.negative_prompt
    image = txt2img(**kwargs).images[0]

    # Stage 2 — upscale + add detail to hit the exact target (Full HD / 4K).
    if do_hd:
        image = _hires(image, req.width, req.height, prompt, req.negative_prompt or "",
                       steps, guidance, req.seed)

    return {
        "dataUrl": _image_to_dataurl(image),
        "seconds": round(time.time() - t0, 1),
        "size": f"{image.width}x{image.height}",
        "prompt": prompt,
    }


@app.post("/edit")
def edit(req: EditReq, authorization: Optional[str] = Header(None)):
    _auth(authorization)
    steps, guidance = _steps_and_guidance(req.steps, req.guidance)
    prompt = enhance_prompt(req.prompt, "edit") if req.enhance else req.prompt
    init = _b64_to_image(req.image)
    t0 = time.time()
    kwargs = dict(
        prompt=prompt, image=init, strength=req.strength,
        num_inference_steps=steps, guidance_scale=guidance,
        generator=_generator(req.seed),
    )
    if FAMILY != "flux":
        kwargs["negative_prompt"] = req.negative_prompt
    image = img2img(**kwargs).images[0]
    return {"dataUrl": _image_to_dataurl(image), "seconds": round(time.time() - t0, 1), "prompt": prompt}


@app.post("/inpaint")
def inpaint_route(req: InpaintReq, authorization: Optional[str] = Header(None)):
    _auth(authorization)
    steps, guidance = _steps_and_guidance(req.steps, req.guidance)
    prompt = enhance_prompt(req.prompt, "edit") if req.enhance else req.prompt
    init = _b64_to_image(req.image)
    mask = _b64_to_image(req.mask).convert("L")
    t0 = time.time()
    kwargs = dict(
        prompt=prompt, image=init, mask_image=mask,
        num_inference_steps=steps, guidance_scale=guidance,
        generator=_generator(req.seed),
    )
    if FAMILY != "flux":
        kwargs["negative_prompt"] = req.negative_prompt
    image = inpaint(**kwargs).images[0]
    return {"dataUrl": _image_to_dataurl(image), "seconds": round(time.time() - t0, 1), "prompt": prompt}


@app.post("/upscale")
def upscale_route(req: UpscaleReq, authorization: Optional[str] = Header(None)):
    _auth(authorization)
    steps, guidance = _steps_and_guidance(None, None)
    init = _b64_to_image(req.image)
    t0 = time.time()
    image = _hires(init, req.width, req.height, req.prompt or "high quality, sharp, detailed",
                   req.negative_prompt or "", steps, guidance, req.seed)
    return {
        "dataUrl": _image_to_dataurl(image),
        "seconds": round(time.time() - t0, 1),
        "size": f"{image.width}x{image.height}",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
