"""Synthetic training data: random watermarks stamped onto clean photos.

Every sample is made on the fly, so the detector never sees the same image
twice and nothing has to be labelled by hand: the code that draws the
watermark already knows exactly where it put it, and that is the mask.

    image  — the clean photo with watermarks composited on top (RGB)
    mask   — 2 x H x W, channel 0 = text marks, channel 1 = logo marks

What gets drawn (all at random size, angle, colour, opacity and position):
  - text: "© name", "@handle", web addresses, "SAMPLE"/"PROOF" stamps,
          dates and camera timestamps, with optional outline or shadow
  - tiled text: one phrase repeated diagonally across the whole frame
  - logos: procedurally drawn badges (rings, shields, initials, stars) or,
           if you pass --logos, your own transparent PNGs
About 8% of samples get no watermark at all, so the model learns to leave
clean photos alone.

Preview what it makes:
    python -m watermark.synth --images path/to/photos --out previews --count 24
"""
from __future__ import annotations

import argparse
import io
import math
import os
import random
import string
from pathlib import Path
from typing import Optional, Sequence

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# Fonts that draw symbols instead of letters make useless "text".
_SKIP_FONTS = ("wingding", "webding", "symbol", "marlett", "mdl2", "emoji", "dingbat", "opensymbol", "bookshelf")
_FONT_DIRS = [
    "C:/Windows/Fonts",
    os.path.expanduser("~/AppData/Local/Microsoft/Windows/Fonts"),
    "/usr/share/fonts",
    "/usr/local/share/fonts",
    os.path.expanduser("~/.fonts"),
    "/Library/Fonts",
    "/System/Library/Fonts",
]


def find_images(root: str | Path) -> list[Path]:
    root = Path(root)
    files = [p for p in root.rglob("*") if p.suffix.lower() in IMAGE_EXTS]
    if not files:
        raise SystemExit(f"No images found under {root}")
    return sorted(files)


def _draws_latin(path: str) -> bool:
    """False for fonts that render ordinary letters as empty boxes (symbol and CJK-only fonts)."""
    def glyph(font, ch: str) -> bytes:
        im = Image.new("L", (48, 48))
        ImageDraw.Draw(im).text((4, 4), ch, font=font, fill=255)
        return im.tobytes()

    try:
        font = ImageFont.truetype(path, 32)
        missing = glyph(font, "\U0010fffd")  # never in a font -> its "missing glyph" box
        return all(glyph(font, c) not in (missing, bytes(48 * 48)) for c in "Aa0@")
    except Exception:
        return False


def find_fonts(extra: Optional[str] = None) -> list[str]:
    dirs = ([extra] if extra else []) + _FONT_DIRS
    out: set[str] = set()
    for d in dirs:
        if not d or not os.path.isdir(d):
            continue
        for p in Path(d).rglob("*"):
            if p.suffix.lower() in (".ttf", ".otf") and not any(s in p.name.lower() for s in _SKIP_FONTS):
                out.add(str(p))
    return sorted(f for f in out if _draws_latin(f))


def find_logos(root: Optional[str]) -> list[str]:
    if not root:
        return []
    return [str(p) for p in Path(root).rglob("*.png")]


# ── Random text ───────────────────────────────────────────────────────────────

_SYL = ["ka", "ri", "mo", "la", "ve", "sa", "no", "ta", "ji", "ra", "pe", "lu", "an", "el", "is", "or", "un", "da", "mi", "ko", "zen", "vio", "star", "lux", "pix", "foto", "art", "nova"]
_STAMPS = ["SAMPLE", "PREVIEW", "PROOF", "DRAFT", "COPYRIGHT", "WATERMARK", "DO NOT COPY", "CONFIDENTIAL", "STOCK", "DEMO"]
_TLDS = [".com", ".in", ".net", ".io", ".co", ".photo", ".studio"]


def _name(rng: random.Random) -> str:
    return "".join(rng.choice(_SYL) for _ in range(rng.randint(2, 3))).capitalize()


def random_text(rng: random.Random) -> str:
    n = _name(rng)
    year = rng.randint(1998, 2026)
    kind = rng.random()
    if kind < 0.22:
        return f"© {n}" + (f" {year}" if rng.random() < 0.5 else "")
    if kind < 0.36:
        return f"@{n.lower()}{rng.choice(['', '_', '.'])}{rng.choice(['', str(rng.randint(1, 99)), 'photo', 'art'])}"
    if kind < 0.50:
        return rng.choice(["www.", ""]) + n.lower() + rng.choice(_TLDS)
    if kind < 0.62:
        return rng.choice(_STAMPS)
    if kind < 0.72:
        return f"{n} {rng.choice(['Photography', 'Studio', 'Images', 'Films', 'Pictures', 'Creative'])}"
    if kind < 0.82:  # camera-style date stamp
        d = f"{year}/{rng.randint(1, 12):02d}/{rng.randint(1, 28):02d}"
        return d + (f" {rng.randint(0, 23):02d}:{rng.randint(0, 59):02d}" if rng.random() < 0.6 else "")
    if kind < 0.90:
        return f"'{rng.randint(0, 99):02d} {rng.randint(1, 12)} {rng.randint(1, 28)}"
    words = "".join(rng.choice(string.ascii_letters) for _ in range(rng.randint(4, 10)))
    return words if rng.random() < 0.5 else words.upper()


# ── Drawing helpers ───────────────────────────────────────────────────────────

def _color(rng: random.Random) -> tuple[int, int, int]:
    r = rng.random()
    if r < 0.45:
        return (255, 255, 255)
    if r < 0.65:
        return (0, 0, 0)
    if r < 0.80:
        g = rng.randint(90, 200)
        return (g, g, g)
    if r < 0.88:  # the orange of camera date stamps
        return (255, rng.randint(120, 170), rng.randint(0, 40))
    return (rng.randint(0, 255), rng.randint(0, 255), rng.randint(0, 255))


def _font(rng: random.Random, fonts: Sequence[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for _ in range(4):
        if not fonts:
            break
        try:
            return ImageFont.truetype(rng.choice(fonts), size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1 ships a scalable default
    except TypeError:
        return ImageFont.load_default()


def _text_patch(rng: random.Random, fonts: Sequence[str], text: str, size: int) -> Image.Image:
    """Text drawn on a transparent RGBA patch, optionally outlined or shadowed."""
    font = _font(rng, fonts, size)
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    stroke = rng.choice([0, 0, 0, max(1, size // 18)])
    l, t, r, b = probe.textbbox((0, 0), text, font=font, stroke_width=stroke)
    pad = size // 3 + stroke + 4
    w, h = r - l + 2 * pad, b - t + 2 * pad
    patch = Image.new("RGBA", (max(w, 2), max(h, 2)), (0, 0, 0, 0))
    d = ImageDraw.Draw(patch)
    color = _color(rng)
    if rng.random() < 0.2:  # soft drop shadow
        off = max(1, size // 14)
        shadow = Image.new("RGBA", patch.size, (0, 0, 0, 0))
        ImageDraw.Draw(shadow).text((pad - l + off, pad - t + off), text, font=font, fill=(0, 0, 0, 200))
        patch = Image.alpha_composite(patch, shadow.filter(ImageFilter.GaussianBlur(off)))
        d = ImageDraw.Draw(patch)
    stroke_fill = (0, 0, 0) if sum(color) > 380 else (255, 255, 255)
    d.text((pad - l, pad - t), text, font=font, fill=color + (255,), stroke_width=stroke, stroke_fill=stroke_fill + (255,))
    return patch


def _logo_patch(rng: random.Random, fonts: Sequence[str], logos: Sequence[str], size: int) -> Image.Image:
    """A badge-like logo, either from the user's PNGs or drawn procedurally."""
    if logos and rng.random() < 0.6:
        try:
            img = Image.open(rng.choice(logos)).convert("RGBA")
            img.thumbnail((size, size), Image.LANCZOS)
            if rng.random() < 0.5:  # flatten to one colour, as most stamped logos are
                solid = Image.new("RGBA", img.size, _color(rng) + (255,))
                solid.putalpha(img.getchannel("A"))
                img = solid
            return img
        except OSError:
            pass

    s = size
    patch = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(patch)
    color = _color(rng) + (255,)
    lw = max(2, s // rng.randint(14, 30))
    m = lw + 1
    shape = rng.choice(["ring", "disc", "square", "shield", "hex", "star", "camera"])
    if shape == "ring":
        d.ellipse([m, m, s - m, s - m], outline=color, width=lw)
        if rng.random() < 0.5:
            d.ellipse([s * 0.18, s * 0.18, s * 0.82, s * 0.82], outline=color, width=max(1, lw // 2))
    elif shape == "disc":
        d.ellipse([m, m, s - m, s - m], fill=color)
    elif shape == "square":
        d.rounded_rectangle([m, m, s - m, s - m], radius=s // rng.randint(5, 12), outline=color, width=lw)
    elif shape == "shield":
        d.polygon([(s / 2, m), (s - m, s * 0.2), (s - m, s * 0.55), (s / 2, s - m), (m, s * 0.55), (m, s * 0.2)], outline=color, width=lw)
    elif shape == "hex":
        pts = [(s / 2 + (s / 2 - m) * math.cos(a), s / 2 + (s / 2 - m) * math.sin(a)) for a in (math.pi / 3 * i + math.pi / 6 for i in range(6))]
        d.polygon(pts, outline=color, width=lw)
    elif shape == "star":
        pts = []
        for i in range(10):
            rad = (s / 2 - m) * (1 if i % 2 == 0 else 0.45)
            a = -math.pi / 2 + i * math.pi / 5
            pts.append((s / 2 + rad * math.cos(a), s / 2 + rad * math.sin(a)))
        d.polygon(pts, fill=color if rng.random() < 0.5 else None, outline=color, width=lw)
    else:  # camera
        d.rounded_rectangle([m, s * 0.3, s - m, s * 0.85], radius=s // 10, outline=color, width=lw)
        d.ellipse([s * 0.32, s * 0.4, s * 0.68, s * 0.76], outline=color, width=lw)
        d.rectangle([s * 0.36, s * 0.18, s * 0.6, s * 0.3], fill=color)

    if shape not in ("disc", "camera", "star") and rng.random() < 0.85:
        initials = "".join(rng.choice(string.ascii_uppercase) for _ in range(rng.randint(1, 3)))
        font = _font(rng, fonts, int(s * (0.42 if len(initials) < 3 else 0.3)))
        l, t, r, b = d.textbbox((0, 0), initials, font=font)
        d.text(((s - (r - l)) / 2 - l, (s - (b - t)) / 2 - t), initials, font=font, fill=color)
    elif shape == "disc":
        initials = "".join(rng.choice(string.ascii_uppercase) for _ in range(rng.randint(1, 2)))
        font = _font(rng, fonts, int(s * 0.45))
        l, t, r, b = d.textbbox((0, 0), initials, font=font)
        # Knock the letters out of the disc.
        d.text(((s - (r - l)) / 2 - l, (s - (b - t)) / 2 - t), initials, font=font, fill=(0, 0, 0, 0))

    # A brand name under the badge, sometimes — still part of the logo.
    if rng.random() < 0.3:
        name = _name(rng).upper()
        font = _font(rng, fonts, max(8, s // 6))
        l, t, r, b = d.textbbox((0, 0), name, font=font)
        wide = Image.new("RGBA", (max(s, r - l + 8), s + (b - t) + s // 10), (0, 0, 0, 0))
        wide.alpha_composite(patch, ((wide.width - s) // 2, 0))
        ImageDraw.Draw(wide).text(((wide.width - (r - l)) / 2 - l, s + s // 20 - t), name, font=font, fill=color)
        patch = wide
    return patch


def _composite_at(dst: Image.Image, patch: Image.Image, x: int, y: int) -> None:
    """alpha_composite `patch` with its top-left at (x, y), clipped to `dst` on every side."""
    sx, sy = max(0, -x), max(0, -y)
    w = min(patch.width - sx, dst.width - max(0, x))
    h = min(patch.height - sy, dst.height - max(0, y))
    if w > 0 and h > 0:
        dst.alpha_composite(patch.crop((sx, sy, sx + w, sy + h)), (max(0, x), max(0, y)))


def _paste(layer: Image.Image, patch: Image.Image, rng: random.Random, corner: bool) -> None:
    W, H = layer.size
    pw, ph = patch.size
    if pw >= W or ph >= H:
        scale = min((W - 2) / pw, (H - 2) / ph)
        patch = patch.resize((max(1, int(pw * scale)), max(1, int(ph * scale))), Image.LANCZOS)
        pw, ph = patch.size
    if corner:  # most real watermarks hug a corner or sit dead centre
        mx, my = int(W * rng.uniform(0.01, 0.06)), int(H * rng.uniform(0.01, 0.06))
        x = rng.choice([mx, W - pw - mx, (W - pw) // 2])
        y = rng.choice([my, H - ph - my, (H - ph) // 2])
    else:
        x, y = rng.randint(-pw // 4, W - pw * 3 // 4), rng.randint(-ph // 4, H - ph * 3 // 4)
    _composite_at(layer, patch, x, y)


def _tiled(rng: random.Random, fonts: Sequence[str], size: tuple[int, int]) -> Image.Image:
    W, H = size
    text = random_text(rng)
    patch = _text_patch(rng, fonts, text, int(min(W, H) * rng.uniform(0.04, 0.09)))
    angle = rng.uniform(-40, 40)
    big = Image.new("RGBA", (int(W * 1.6), int(H * 1.6)), (0, 0, 0, 0))
    sx, sy = patch.width + int(W * rng.uniform(0.05, 0.25)), patch.height + int(H * rng.uniform(0.08, 0.3))
    for row, y in enumerate(range(0, big.height, sy)):
        for x in range(-(row % 2) * sx // 2, big.width, sx):
            _composite_at(big, patch, x, y)
    big = big.rotate(angle, resample=Image.BICUBIC)
    left, top = (big.width - W) // 2, (big.height - H) // 2
    return big.crop((left, top, left + W, top + H))


# ── The sample generator ──────────────────────────────────────────────────────

def make_sample(
    photo: Image.Image,
    rng: random.Random,
    fonts: Sequence[str],
    logos: Sequence[str] = (),
) -> tuple[Image.Image, np.ndarray]:
    """Stamp random watermarks onto `photo`. Returns (image, mask[2,H,W] uint8 0/1)."""
    photo = photo.convert("RGB")
    W, H = photo.size
    base = min(W, H)
    layers = {"text": Image.new("RGBA", (W, H), (0, 0, 0, 0)), "logo": Image.new("RGBA", (W, H), (0, 0, 0, 0))}

    if rng.random() >= 0.08:
        n = rng.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
        for _ in range(n):
            kind = rng.choices(["text", "tiled", "logo"], weights=[0.5, 0.15, 0.35])[0]
            if kind == "tiled":
                tile = _tiled(rng, fonts, (W, H))
                tile.putalpha(tile.getchannel("A").point(lambda a, o=rng.uniform(0.25, 0.6): int(a * o)))
                layers["text"].alpha_composite(tile)
                continue
            if kind == "text":
                patch = _text_patch(rng, fonts, random_text(rng), int(base * rng.uniform(0.03, 0.14)))
            else:
                patch = _logo_patch(rng, fonts, logos, int(base * rng.uniform(0.08, 0.32)))
            if rng.random() < 0.35:
                patch = patch.rotate(rng.uniform(-45, 45), resample=Image.BICUBIC, expand=True)
            opacity = rng.uniform(0.3, 1.0)
            patch.putalpha(patch.getchannel("A").point(lambda a, o=opacity: int(a * o)))
            _paste(layers[kind], patch, rng, corner=rng.random() < 0.6)

    out = photo.convert("RGBA")
    mask = np.zeros((2, H, W), dtype=np.uint8)
    for i, key in enumerate(("text", "logo")):
        layer = layers[key]
        alpha = np.asarray(layer.getchannel("A"))
        # Anything at least faintly visible counts as watermark. Below ~4% the
        # mark is invisible to a person too, and labelling it only adds noise.
        mask[i] = alpha > 10
        if rng.random() < 0.15:  # multiply blend: darkens instead of covering
            rgb = np.asarray(out.convert("RGB"), dtype=np.float32)
            lay = np.asarray(layer.convert("RGB"), dtype=np.float32)
            a = (alpha.astype(np.float32) / 255)[..., None]
            mixed = rgb * (1 - a) + (rgb * lay / 255) * a
            out = Image.fromarray(mixed.clip(0, 255).astype(np.uint8)).convert("RGBA")
        else:
            out.alpha_composite(layer)
    img = out.convert("RGB")

    # Most watermarked photos people upload have been through JPEG at least once.
    if rng.random() < 0.7:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=rng.randint(45, 95))
        img = Image.open(io.BytesIO(buf.getvalue())).convert("RGB")
    return img, mask


def random_crop(photo: Image.Image, size: int, rng: random.Random) -> Image.Image:
    """Resize so the short side lands between `size` and 2x `size`, then crop a square."""
    photo = photo.convert("RGB")
    w, h = photo.size
    target = rng.randint(size, int(size * 2))
    scale = target / min(w, h)
    photo = photo.resize((max(size, round(w * scale)), max(size, round(h * scale))), Image.BICUBIC)
    w, h = photo.size
    x, y = rng.randint(0, w - size), rng.randint(0, h - size)
    crop = photo.crop((x, y, x + size, y + size))
    return crop.transpose(Image.FLIP_LEFT_RIGHT) if rng.random() < 0.5 else crop


def overlay_preview(img: Image.Image, mask: np.ndarray) -> Image.Image:
    """Image with text marks tinted red and logo marks tinted blue, beside the original."""
    arr = np.asarray(img, dtype=np.float32).copy()
    arr[mask[0] > 0] = arr[mask[0] > 0] * 0.4 + np.array([255, 0, 0]) * 0.6
    arr[mask[1] > 0] = arr[mask[1] > 0] * 0.4 + np.array([0, 90, 255]) * 0.6
    both = Image.new("RGB", (img.width * 2, img.height))
    both.paste(img, (0, 0))
    both.paste(Image.fromarray(arr.astype(np.uint8)), (img.width, 0))
    return both


def main() -> None:
    ap = argparse.ArgumentParser(description="Preview synthetic watermark samples.")
    ap.add_argument("--images", required=True, help="folder of clean photos")
    ap.add_argument("--out", default="synth-preview")
    ap.add_argument("--count", type=int, default=16)
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--fonts", help="extra folder of .ttf/.otf fonts")
    ap.add_argument("--logos", help="folder of transparent logo PNGs (your own)")
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    photos = find_images(args.images)
    fonts = find_fonts(args.fonts)
    logos = find_logos(args.logos)
    print(f"{len(photos)} photos, {len(fonts)} fonts, {len(logos)} logos")
    os.makedirs(args.out, exist_ok=True)
    for i in range(args.count):
        crop = random_crop(Image.open(rng.choice(photos)), args.size, rng)
        img, mask = make_sample(crop, rng, fonts, logos)
        overlay_preview(img, mask).save(os.path.join(args.out, f"sample_{i:03d}.jpg"), quality=90)
    print(f"wrote {args.count} previews to {args.out}/ (left: input, right: red = text mask, blue = logo mask)")


if __name__ == "__main__":
    main()
