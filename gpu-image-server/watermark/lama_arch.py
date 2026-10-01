"""LaMa (big-lama) rebuilt in plain PyTorch, so it can be exported to ONNX.

The TorchScript file the server uses can't be exported as-is: LaMa's Fast
Fourier Convolutions call torch.fft.rfftn / irfftn, which have no ONNX
equivalent that browsers can run. Here the same network is written out
module by module, with each 2-D real FFT replaced by multiplication with
fixed DFT matrices. That is mathematically the same transform, it exports
to plain MatMul nodes, and it runs on WebGPU and WebAssembly.

The weights are copied straight from big-lama.pt; export_onnx.py checks the
rebuilt network against the original before writing anything.
"""
from __future__ import annotations

import math
from functools import lru_cache

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


@lru_cache(maxsize=None)
def _dft_np(n: int, w2: int | None = None, inverse_w: bool = False):
    """cos/sin DFT matrices, built in numpy so that ONNX export stores them as
    constants (a browser runtime has no Cos/Sin kernels to rebuild them)."""
    k = np.arange(n, dtype=np.float64)
    ang = 2 * np.pi * np.outer(k, k) / n
    c, s = np.cos(ang), np.sin(ang)
    if w2 is None:
        return c, s
    c, s = c[:, :w2], s[:, :w2]
    if not inverse_w:
        return c, s
    weight = np.full(w2, 2.0)
    weight[0] = 1.0
    if n % 2 == 0:
        weight[-1] = 1.0
    return (c * weight).T.copy(), (s * weight).T.copy()


def _dft_mats(n: int, device, dtype, w2: int | None = None, inverse_w: bool = False):
    c, s = _dft_np(n, w2, inverse_w)
    return torch.from_numpy(c).to(device, dtype), torch.from_numpy(s).to(device, dtype)


class FourierUnit(nn.Module):
    """rfft2 (ortho) -> 1x1 conv + BN + ReLU on [real, imag] -> irfft2, via matrices."""

    def __init__(self, ch: int):
        super().__init__()
        self.conv_layer = nn.Conv2d(ch * 2, ch * 2, 1, bias=False)
        self.bn = nn.BatchNorm2d(ch * 2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Plain ints: during ONNX export these become constants (the browser
        # model is fixed at 512x512), so the DFT matrices are stored, not rebuilt.
        c, h, w = int(x.shape[1]), int(x.shape[2]), int(x.shape[3])
        w2 = w // 2 + 1
        ch_, sh_ = _dft_mats(h, x.device, x.dtype)                     # (h, h)
        cw, sw = _dft_mats(w, x.device, x.dtype, w2)                   # (w, w2)
        icw, isw = _dft_mats(w, x.device, x.dtype, w2, inverse_w=True)  # (w2, w)
        scale = 1.0 / math.sqrt(h * w)

        # Forward real 2-D DFT: along W (real -> half spectrum), then along H.
        ar = torch.matmul(x, cw)
        ai = -torch.matmul(x, sw)
        xr = (torch.matmul(ch_, ar) + torch.matmul(sh_, ai)) * scale
        xi = (torch.matmul(ch_, ai) - torch.matmul(sh_, ar)) * scale

        # Same channel layout as the original: [c0.real, c0.imag, c1.real, ...]
        f = torch.stack([xr, xi], dim=2).reshape(-1, c * 2, h, w2)
        f = F.relu(self.bn(self.conv_layer(f)))
        f = f.reshape(-1, c, 2, h, w2)
        yr, yi = f[:, :, 0], f[:, :, 1]

        # Inverse: complex DFT along H, then the half-spectrum inverse along W.
        zr = torch.matmul(ch_, yr) - torch.matmul(sh_, yi)
        zi = torch.matmul(ch_, yi) + torch.matmul(sh_, yr)
        return (torch.matmul(zr, icw) - torch.matmul(zi, isw)) * scale


class SpectralTransform(nn.Module):
    def __init__(self, cin: int, cout: int):
        super().__init__()
        self.conv1 = nn.Sequential(nn.Conv2d(cin, cout // 2, 1, bias=False), nn.BatchNorm2d(cout // 2), nn.ReLU(True))
        self.fu = FourierUnit(cout // 2)
        self.conv2 = nn.Conv2d(cout // 2, cout, 1, bias=False)

    def forward(self, x):
        x = self.conv1(x)
        return self.conv2(x + self.fu(x))


def _conv(cin, cout, k, stride=1, pad=None):
    pad = k // 2 if pad is None else pad
    return nn.Conv2d(cin, cout, k, stride, padding=pad, padding_mode="reflect", bias=False)


class FFC(nn.Module):
    def __init__(self, cin_l, cin_g, cout_l, cout_g, k, stride=1, pad=None):
        super().__init__()
        self.convl2l = _conv(cin_l, cout_l, k, stride, pad) if cin_l and cout_l else None
        self.convl2g = _conv(cin_l, cout_g, k, stride, pad) if cin_l and cout_g else None
        self.convg2l = _conv(cin_g, cout_l, k, stride, pad) if cin_g and cout_l else None
        self.convg2g = SpectralTransform(cin_g, cout_g) if cin_g and cout_g else None

    def forward(self, xl, xg=None):
        out_l = self.convl2l(xl) if self.convl2l is not None else 0
        if self.convg2l is not None:
            out_l = out_l + self.convg2l(xg)
        out_g = None
        if self.convl2g is not None:
            out_g = self.convl2g(xl)
        if self.convg2g is not None:
            out_g = self.convg2g(xg) if out_g is None else out_g + self.convg2g(xg)
        return out_l, out_g


class FFC_BN_ACT(nn.Module):
    def __init__(self, cin_l, cin_g, cout_l, cout_g, k, stride=1, pad=None):
        super().__init__()
        self.ffc = FFC(cin_l, cin_g, cout_l, cout_g, k, stride, pad)
        self.bn_l = nn.BatchNorm2d(cout_l) if cout_l else None
        self.bn_g = nn.BatchNorm2d(cout_g) if cout_g else None

    def forward(self, xl, xg=None):
        l, g = self.ffc(xl, xg)
        l = F.relu(self.bn_l(l))
        g = F.relu(self.bn_g(g)) if g is not None else None
        return l, g


class FFCResnetBlock(nn.Module):
    def __init__(self, cl=128, cg=384):
        super().__init__()
        self.conv1 = FFC_BN_ACT(cl, cg, cl, cg, 3)
        self.conv2 = FFC_BN_ACT(cl, cg, cl, cg, 3)

    def forward(self, xl, xg):
        l, g = self.conv1(xl, xg)
        l, g = self.conv2(l, g)
        return xl + l, xg + g


class LamaGenerator(nn.Module):
    """big-lama: 3 downsamplings, 18 FFC resnet blocks (75% global), 3 upsamplings."""

    def __init__(self):
        super().__init__()
        self.init = FFC_BN_ACT(4, 0, 64, 0, 7, pad=0)  # input is reflection-padded by 3 in forward()
        self.down1 = FFC_BN_ACT(64, 0, 128, 0, 3, 2)
        self.down2 = FFC_BN_ACT(128, 0, 256, 0, 3, 2)
        self.down3 = FFC_BN_ACT(256, 0, 128, 384, 3, 2)
        self.blocks = nn.ModuleList(FFCResnetBlock() for _ in range(18))
        self.up = nn.ModuleList([
            nn.ConvTranspose2d(512, 256, 3, 2, 1, output_padding=1),
            nn.ConvTranspose2d(256, 128, 3, 2, 1, output_padding=1),
            nn.ConvTranspose2d(128, 64, 3, 2, 1, output_padding=1),
        ])
        self.up_bn = nn.ModuleList([nn.BatchNorm2d(256), nn.BatchNorm2d(128), nn.BatchNorm2d(64)])
        self.out = nn.Conv2d(64, 3, 7)

    def forward(self, x):
        l, _ = self.init(F.pad(x, (3, 3, 3, 3), mode="reflect"))
        l, _ = self.down1(l)
        l, _ = self.down2(l)
        l, g = self.down3(l)
        for blk in self.blocks:
            l, g = blk(l, g)
        y = torch.cat([l, g], 1)
        for conv, bn in zip(self.up, self.up_bn):
            y = F.relu(bn(conv(y)))
        return torch.sigmoid(self.out(F.pad(y, (3, 3, 3, 3), mode="reflect")))


class Lama(nn.Module):
    """image (0-1 RGB) + mask (1 = fill) -> image with the masked area filled, 0-1."""

    def __init__(self):
        super().__init__()
        self.generator = LamaGenerator()

    def forward(self, image, mask):
        masked = image * (1 - mask)
        pred = self.generator(torch.cat([masked, mask], 1))
        return mask * pred + (1 - mask) * image


def _remap_key(k: str) -> str | None:
    """big-lama.pt's Sequential indices -> this module's names."""
    p = k.split(".")
    assert p[:3] == ["model", "generator", "model"], k
    i, rest = int(p[3]), p[4:]
    if p[-1] == "num_batches_tracked":
        return None
    if i == 1:
        return "generator.init." + ".".join(rest)
    if i in (2, 3, 4):
        return f"generator.down{i - 1}." + ".".join(rest)
    if 5 <= i <= 22:
        return f"generator.blocks.{i - 5}." + ".".join(rest)
    ups = {24: "up.0", 27: "up.1", 30: "up.2", 25: "up_bn.0", 28: "up_bn.1", 31: "up_bn.2", 34: "out"}
    if i in ups:
        return f"generator.{ups[i]}." + ".".join(rest)
    raise KeyError(k)


def load_from_torchscript(path: str) -> Lama:
    src = torch.jit.load(path, map_location="cpu").state_dict()
    model = Lama().eval()
    mapped = {}
    for k, v in src.items():
        nk = _remap_key(k)
        if nk is not None:
            mapped[nk] = v
    missing, unexpected = model.load_state_dict(mapped, strict=False)
    missing = [m for m in missing if not m.endswith("num_batches_tracked")]
    if missing or unexpected:
        raise RuntimeError(f"weight mismatch: missing={missing[:5]} unexpected={unexpected[:5]}")
    return model
