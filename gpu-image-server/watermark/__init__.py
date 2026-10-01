"""LaMa export for sjpt.io's free, in-browser watermark remover.

The visitor paints over a watermark and LaMa (Apache-2.0) fills the painted
area, running in their browser with onnxruntime-web. This package only
produces that browser model:

  lama_arch.py   — LaMa rebuilt in plain PyTorch, FFTs as DFT-matrix products
  export_onnx.py — writes and verifies lama-512.onnx
"""
