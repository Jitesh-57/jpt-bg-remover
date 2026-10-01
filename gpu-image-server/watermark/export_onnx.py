"""Export the watermark models to ONNX so the website can run them in the browser.

    python -m watermark.export_onnx

writes, into weights/onnx/:

  lama-512.onnx         LaMa inpainting, fixed 512x512 input (~100 MB)
  wm-detector.onnx      our trained detector, any size divisible by 32 (~49 MB)

Each file is checked against the PyTorch model it came from before it is
kept. Upload both somewhere that serves files with CORS (a Hugging Face model
repo is simplest, see the README), then set NEXT_PUBLIC_WM_LAMA_URL and
NEXT_PUBLIC_WM_DETECTOR_URL in Vercel.

Weights are stored as float16 to halve the download, with a Cast back to
float32 in front of every use, so the maths still runs in float32 and works
on every browser backend (WebGPU and plain WebAssembly).
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import numpy as np
import torch

from .remover import DETECTOR_PATH, LAMA_PATH, LAMA_URL

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "weights" / "onnx"
LAMA_SIZE = 512


def _export(model: torch.nn.Module, args: tuple, path: Path, names_in, names_out, dynamic=None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model, args, str(path),
        input_names=names_in, output_names=names_out,
        opset_version=17, dynamic_axes=dynamic, do_constant_folding=True, dynamo=False,
    )


def store_weights_fp16(path: Path, min_elements: int = 1024) -> None:
    """Rewrite convolution weights (4-D float32 initializers) as float16 + a Cast
    node back to float32. Everything else — biases, BatchNorm, and LaMa's DFT
    matrices, which need full precision — stays float32."""
    import onnx
    from onnx import helper, numpy_helper

    model = onnx.load(str(path))
    g = model.graph
    new_inits, casts = [], []
    for init in g.initializer:
        if init.data_type == onnx.TensorProto.FLOAT and len(init.dims) == 4 and np.prod(init.dims) >= min_elements:
            arr = numpy_helper.to_array(init).astype(np.float16)
            half = numpy_helper.from_array(arr, init.name + "__fp16")
            new_inits.append(half)
            casts.append(helper.make_node("Cast", [half.name], [init.name], to=onnx.TensorProto.FLOAT, name=init.name + "__cast"))
        else:
            new_inits.append(init)
    del g.initializer[:]
    g.initializer.extend(new_inits)
    nodes = list(g.node)
    del g.node[:]
    g.node.extend(casts + nodes)
    onnx.checker.check_model(model)
    onnx.save(model, str(path))


# Operators onnxruntime-web runs on both WebGPU and WebAssembly. Anything else
# in an exported graph would only fail later, in a visitor's browser.
_BROWSER_OPS = {
    "Add", "Cast", "Concat", "Constant", "Conv", "ConvTranspose", "Div", "Gather", "MatMul", "Mul",
    "Neg", "Pad", "Relu", "Reshape", "Shape", "Sigmoid", "Slice", "Split", "Squeeze", "Sub",
    "Transpose", "Unsqueeze", "BatchNormalization", "MaxPool", "Resize", "Identity", "Expand",
    "ConstantOfShape", "Range", "Equal", "Where", "Floor", "Sqrt", "Pow", "ReduceMean",
}


def _require_only_browser_ops(path: Path) -> None:
    import onnx

    ops = {n.op_type for n in onnx.load(str(path)).graph.node}
    bad = sorted(ops - _BROWSER_OPS)
    print(f"[ops] {path.name}: {', '.join(sorted(ops))}")
    if bad:
        path.unlink()
        raise SystemExit(f"[ops] {path.name} uses operators browsers may not run: {bad}; file removed")


def _check(path: Path, feeds: dict, expected: np.ndarray, label: str, max_tol: float, mean_tol: float) -> None:
    import onnxruntime as ort

    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    t = time.time()
    got = sess.run(None, feeds)[0]
    err = np.abs(got - expected)
    mb = path.stat().st_size / 1e6
    print(f"[{label}] {path.name}: {mb:.1f} MB, diff vs PyTorch max {err.max():.4f} / mean {err.mean():.5f}, "
          f"onnxruntime CPU {time.time() - t:.1f}s")
    if err.max() > max_tol or err.mean() > mean_tol:
        path.unlink()
        raise SystemExit(f"[{label}] ONNX output is too far from PyTorch (limits {max_tol} / {mean_tol}); file removed")


def _smooth_image(size: int) -> torch.Tensor:
    """A photo-like test input: soft gradients and blobs, not white noise."""
    yy, xx = torch.meshgrid(torch.linspace(0, 1, size), torch.linspace(0, 1, size), indexing="ij")
    chans = [0.5 + 0.4 * torch.sin(6 * xx + 2 * c) * torch.cos(4 * yy - c) for c in range(3)]
    return torch.stack(chans)[None].clamp(0, 1)


def export_lama(out: Path) -> None:
    from .lama_arch import load_from_torchscript

    if not LAMA_PATH.exists():
        LAMA_PATH.parent.mkdir(parents=True, exist_ok=True)
        print(f"[lama] downloading {LAMA_URL}")
        torch.hub.download_url_to_file(LAMA_URL, str(LAMA_PATH))
    model = load_from_torchscript(str(LAMA_PATH))
    img = _smooth_image(LAMA_SIZE)
    mask = torch.zeros(1, 1, LAMA_SIZE, LAMA_SIZE)
    mask[..., 150:330, 90:400] = 1
    with torch.no_grad():
        ref_ts = torch.jit.load(str(LAMA_PATH), map_location="cpu").eval()(img, mask).numpy()
    _export(model, (img, mask), out, ["image", "mask"], ["output"])
    store_weights_fp16(out)
    _require_only_browser_ops(out)
    # fp16 weights cost a little precision: measured on photos, ~0.002 mean
    # (under half a brightness level out of 255) — invisible in a filled area.
    _check(out, {"image": img.numpy(), "mask": mask.numpy()}, ref_ts, "lama", max_tol=0.1, mean_tol=0.01)


def export_detector(out: Path) -> None:
    from .model import load_detector

    if not DETECTOR_PATH.exists():
        print(f"[detector] skipped: no trained detector at {DETECTOR_PATH} (run python -m watermark.train first)")
        return
    model, ckpt = load_detector(DETECTOR_PATH, "cpu")
    size = int(ckpt.get("size", 512))
    x = torch.randn(1, 3, size, size + 96)
    with torch.no_grad():
        ref = torch.sigmoid(model(x)).numpy()

    class WithSigmoid(torch.nn.Module):
        """Probabilities, plus the training crop size as a second output — the
        browser must feed images at the scale the detector learned (see
        remover.detect), and this way the number travels with the model."""

        def __init__(self, m):
            super().__init__()
            self.m = m

        def forward(self, x):
            return torch.sigmoid(self.m(x)), torch.full((1,), float(size))

    _export(WithSigmoid(model), (x,), out, ["image"], ["prob", "train_size"],
            dynamic={"image": {2: "height", 3: "width"}, "prob": {2: "height", 3: "width"}})
    store_weights_fp16(out)
    _require_only_browser_ops(out)
    _check(out, {"image": x.numpy()}, ref, "detector", max_tol=0.1, mean_tol=0.01)
    print(f"[detector] trained at {size}px, validation IoU {ckpt.get('best_iou', float('nan')):.3f}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Export the watermark models to ONNX for the browser.")
    ap.add_argument("--out", default=str(OUT_DIR))
    ap.add_argument("--skip-lama", action="store_true")
    ap.add_argument("--skip-detector", action="store_true")
    args = ap.parse_args()
    out = Path(args.out)
    if not args.skip_lama:
        export_lama(out / "lama-512.onnx")
    if not args.skip_detector:
        export_detector(out / "wm-detector.onnx")
    print(f"[done] files in {out}")


if __name__ == "__main__":
    main()
