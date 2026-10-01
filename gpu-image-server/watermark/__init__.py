"""Pixel Shine's own visible-watermark remover.

Two models in a chain:

  1. detector  — a U-Net that predicts where the watermark is, with one mask
                 channel for text marks and one for logos. Trained here, on
                 synthetic data made by stamping random watermarks onto clean
                 photos (synth.py / train.py).
  2. inpainter — LaMa (Apache-2.0) fills the masked area from its
                 surroundings. Pretrained; OpenCV's Telea inpainting is the
                 fallback when the LaMa weights are not available.

remover.py glues them together for the server's /watermark/remove endpoint.
"""
