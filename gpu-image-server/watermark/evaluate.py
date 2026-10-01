"""Check the trained remover on real watermarked photos.

    python -m watermark.evaluate --images D:/test/watermarked --out eval-out

For every photo it writes a sheet — original | detected mask | cleaned — so
you can judge the results by eye. If you also have hand-drawn masks (white =
watermark, same file name, any image format) pass --masks to get the
detector's IoU on real data, which is the number to watch between training
runs. Synthetic validation scores are always higher than real ones.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
from PIL import Image

from .remover import WatermarkRemover
from .synth import find_images


def _mask_for(masks_dir: Path, photo: Path) -> Path | None:
    for p in masks_dir.glob(photo.stem + ".*"):
        return p
    return None


def main() -> None:
    ap = argparse.ArgumentParser(description="Run the watermark remover over a folder and score it.")
    ap.add_argument("--images", required=True, help="folder of real watermarked photos")
    ap.add_argument("--masks", help="optional folder of ground-truth masks (white = watermark)")
    ap.add_argument("--out", default="eval-out")
    ap.add_argument("--threshold", type=float, default=0.5)
    ap.add_argument("--text", action=argparse.BooleanOptionalAction, default=True, help="remove text marks")
    ap.add_argument("--logo", action=argparse.BooleanOptionalAction, default=True, help="remove logo marks")
    args = ap.parse_args()

    remover = WatermarkRemover()
    os.makedirs(args.out, exist_ok=True)
    masks_dir = Path(args.masks) if args.masks else None
    inter = union = 0
    found = 0
    photos = find_images(args.images)
    for photo in photos:
        img = Image.open(photo).convert("RGB")
        prob = remover.detect(img)
        raw = remover.build_mask(prob, args.text, args.logo, args.threshold)
        result = remover.remove(img, args.text, args.logo, threshold=args.threshold)
        found += result.found

        if masks_dir and (gt_path := _mask_for(masks_dir, photo)):
            gt = np.asarray(Image.open(gt_path).convert("L").resize(img.size, Image.NEAREST)) > 127
            pred = raw > 0
            inter += int((gt & pred).sum())
            union += int((gt | pred).sum())

        sheet = Image.new("RGB", (img.width * 3, img.height))
        sheet.paste(img, (0, 0))
        tint = np.asarray(img, dtype=np.float32).copy()
        on = np.asarray(result.mask) > 0
        tint[on] = tint[on] * 0.35 + np.array([255, 40, 40]) * 0.65
        sheet.paste(Image.fromarray(tint.astype(np.uint8)), (img.width, 0))
        sheet.paste(result.image, (img.width * 2, 0))
        sheet.thumbnail((2400, 2400))
        sheet.save(Path(args.out) / f"{photo.stem}.jpg", quality=88)
        print(f"{photo.name}: {'removed' if result.found else 'nothing found'} "
              f"({result.coverage * 100:.1f}% of frame, {result.timings}, {result.engine})")

    print(f"\n{found}/{len(photos)} photos had a watermark detected. Sheets in {args.out}/ (original | mask | cleaned)")
    if union:
        print(f"Detector IoU on your real masks: {inter / union:.3f}")


if __name__ == "__main__":
    main()
