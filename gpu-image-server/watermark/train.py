"""Train the watermark detector.

    python -m watermark.train --images D:/datasets/clean-photos

Defaults are sized for an RTX 3050 (6 GB): 512px crops, batch 8, mixed
precision. Expect ~20-30 min per epoch of 2,000 steps; 15 epochs overnight
gets a usable model. The best checkpoint (by validation IoU) is written to
weights/wm_detector.pt, which the server picks up on its next request.

Clean photos: any few thousand watermark-free photos you have the right to
use — your own shots, or an openly licensed set (check the licence allows
commercial training). More variety (people, products, landscapes, screenshots,
documents) means fewer false alarms on real uploads.
"""
from __future__ import annotations

import argparse
import math
import time
from pathlib import Path

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from .model import (
    CLASSES, WatermarkDataset, build_detector, find_fonts, find_logos, load_detector, save_detector, split_photos,
)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "weights" / "wm_detector.pt"


def dice_loss(logits: torch.Tensor, target: torch.Tensor, eps: float = 1.0) -> torch.Tensor:
    p = torch.sigmoid(logits)
    inter = (p * target).sum(dim=(2, 3))
    total = p.sum(dim=(2, 3)) + target.sum(dim=(2, 3))
    return (1 - (2 * inter + eps) / (total + eps)).mean()


def loss_fn(logits: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    # BCE keeps every pixel honest; Dice stops thin text strokes from being
    # drowned out by the much larger clean background.
    return F.binary_cross_entropy_with_logits(logits, target) + dice_loss(logits, target)


@torch.no_grad()
def evaluate(model, loader, device, amp: bool) -> dict:
    model.eval()
    inter = torch.zeros(len(CLASSES))
    union = torch.zeros(len(CLASSES))
    any_inter = any_union = 0.0
    losses = []
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        with torch.autocast(device_type=device.split(":")[0], enabled=amp):
            logits = model(x)
        losses.append(loss_fn(logits.float(), y).item())
        pred = (torch.sigmoid(logits.float()) > 0.5).float()
        inter += (pred * y).sum(dim=(0, 2, 3)).cpu()
        union += ((pred + y) > 0).float().sum(dim=(0, 2, 3)).cpu()
        pa, ya = pred.amax(1), y.amax(1)
        any_inter += (pa * ya).sum().item()
        any_union += ((pa + ya) > 0).float().sum().item()
    model.train()
    iou = (inter / union.clamp(min=1)).tolist()
    return {
        "loss": sum(losses) / max(1, len(losses)),
        "iou_text": iou[0],
        "iou_logo": iou[1],
        "iou_any": any_inter / max(1.0, any_union),  # what removal actually uses
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Train the Pixel Shine watermark detector.")
    ap.add_argument("--images", required=True, help="folder of clean (watermark-free) photos")
    ap.add_argument("--fonts", help="extra folder of .ttf/.otf fonts (system fonts are found automatically)")
    ap.add_argument("--logos", help="folder of transparent logo PNGs you own, mixed in with drawn logos")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--encoder", default="resnet34")
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--steps", type=int, default=2000, help="training steps per epoch")
    ap.add_argument("--val-samples", type=int, default=400)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--resume", action="store_true", help="continue from --out if it exists")
    ap.add_argument("--no-pretrained", action="store_true", help="skip the ImageNet encoder download (testing only)")
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() and not args.cpu else "cpu"
    amp = device == "cuda"
    torch.backends.cudnn.benchmark = device == "cuda"

    train_photos, val_photos = split_photos(args.images)
    fonts = find_fonts(args.fonts)
    logos = find_logos(args.logos)
    print(f"[data] {len(train_photos)} train photos, {len(val_photos)} val photos, {len(fonts)} fonts, {len(logos)} logos")
    if not fonts:
        print("[data] warning: no .ttf/.otf fonts found — pass --fonts; text will use Pillow's default font only")

    train_ds = WatermarkDataset(train_photos, args.size, args.steps * args.batch, fonts, logos)
    val_ds = WatermarkDataset(val_photos, args.size, args.val_samples, fonts, logos, fixed=True, seed=1234)
    loader_kw = dict(batch_size=args.batch, num_workers=args.workers, pin_memory=device == "cuda",
                     persistent_workers=args.workers > 0)
    train_dl = DataLoader(train_ds, shuffle=False, drop_last=True, **loader_kw)
    val_dl = DataLoader(val_ds, shuffle=False, **loader_kw)

    out = Path(args.out)
    best = -1.0
    start_epoch = 0
    last = out.with_name(out.stem + "_last.pt")
    if args.resume and (last.exists() or out.exists()):
        model, ckpt = load_detector(last if last.exists() else out, device)
        model.train()
        best = ckpt.get("best_iou", -1.0)
        start_epoch = ckpt.get("epoch", 0)
        print(f"[train] resumed from {out} (epoch {start_epoch}, best IoU {best:.3f})")
    else:
        model = build_detector(args.encoder, pretrained=not args.no_pretrained).to(device)

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    total = args.epochs * args.steps
    done = start_epoch * args.steps
    warmup = max(1, min(500, total // 10))
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda s: min(1.0, (s + done + 1) / warmup) * 0.5 * (1 + math.cos(math.pi * min(1.0, (s + done) / total)))
    )
    scaler = torch.amp.GradScaler(device.split(":")[0], enabled=amp)

    print(f"[train] device={device} amp={amp} epochs={args.epochs} steps/epoch={args.steps} batch={args.batch} size={args.size}")
    for epoch in range(start_epoch, args.epochs):
        t0 = time.time()
        running = 0.0
        for step, (x, y) in enumerate(train_dl, 1):
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            with torch.autocast(device_type=device.split(":")[0], enabled=amp):
                logits = model(x)
            loss = loss_fn(logits.float(), y)
            opt.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
            sched.step()
            running += loss.item()
            if step % 50 == 0 or step == args.steps:
                rate = step / (time.time() - t0)
                eta = (args.steps - step) / max(rate, 1e-6)
                print(f"  epoch {epoch + 1} step {step}/{args.steps} loss {running / step:.4f} "
                      f"lr {sched.get_last_lr()[0]:.2e} ({rate:.1f} it/s, epoch ETA {eta / 60:.1f} min)", flush=True)

        m = evaluate(model, val_dl, device, amp)
        print(f"[val] epoch {epoch + 1}: loss {m['loss']:.4f}  IoU text {m['iou_text']:.3f}  "
              f"logo {m['iou_logo']:.3f}  any {m['iou_any']:.3f}  ({(time.time() - t0) / 60:.1f} min)")
        save_detector(model, last, args.encoder, args.size, {"epoch": epoch + 1, "best_iou": best, **m})
        if m["iou_any"] > best:
            best = m["iou_any"]
            save_detector(model, out, args.encoder, args.size, {"epoch": epoch + 1, "best_iou": best, **m})
            print(f"[save] new best ({best:.3f}) -> {out}")

    print(f"[done] best validation IoU {best:.3f}. Weights: {out}")


if __name__ == "__main__":
    main()
