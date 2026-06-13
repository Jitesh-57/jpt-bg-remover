"use client";

// Smart canvas upscaler — no API, no cost, runs entirely in the browser.
// Pipeline: scale 2×/4× (high-quality) → contrast +4% → saturation +5% → sharpen +50%

type Scale = "2x" | "4x";

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Sharpness convolution kernel — k controls strength (0–1)
function applySharpness(ctx: CanvasRenderingContext2D, W: number, H: number, k: number) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  const kernel = [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0];

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            v += src[((y + ky) * W + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        out[(y * W + x) * 4 + c] = Math.max(0, Math.min(255, v));
      }
      out[(y * W + x) * 4 + 3] = src[(y * W + x) * 4 + 3]; // alpha unchanged
    }
  }
  // Copy border pixels as-is
  for (let i = 0; i < src.length; i += 4) {
    const x = (i / 4) % W, y = Math.floor(i / 4 / W);
    if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
      out[i] = src[i]; out[i + 1] = src[i + 1]; out[i + 2] = src[i + 2]; out[i + 3] = src[i + 3];
    }
  }
  ctx.putImageData(new ImageData(out, W, H), 0, 0);
}

export async function upscaleImage(dataUrl: string, scale: Scale): Promise<string> {
  const img = await loadImg(dataUrl);
  const factor = scale === "4x" ? 4 : 2;
  const W = img.naturalWidth * factor;
  const H = img.naturalHeight * factor;

  // Step 1: Scale up with high-quality interpolation
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);

  // Step 2: Apply contrast +4% and saturation +5% via CSS filter on a fresh draw
  const canvas2 = document.createElement("canvas");
  canvas2.width = W;
  canvas2.height = H;
  const ctx2 = canvas2.getContext("2d")!;
  ctx2.filter = "contrast(103%) saturate(103%)";
  ctx2.drawImage(canvas, 0, 0);

  // Step 3: Apply sharpness kernel (k = 0.3 → 30/100)
  applySharpness(ctx2, W, H, 0.3);

  // Return as high-quality JPEG (PNG for 4x to preserve detail)
  return canvas2.toDataURL(scale === "4x" ? "image/png" : "image/jpeg", 0.95);
}
