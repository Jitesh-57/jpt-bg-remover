"use client";

// Fully client-side AI upscaling via UpscalerJS (ESRGAN on TensorFlow.js).
// Runs in the user's browser — no API, no API key, no per-image cost.

type Scale = "2x" | "4x";

async function loadUpscaler(scale: Scale) {
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();

  const { default: Upscaler } = await import("upscaler");
  const model =
    scale === "4x"
      ? (await import("@upscalerjs/esrgan-slim/4x")).default
      : (await import("@upscalerjs/esrgan-slim/2x")).default;

  return new Upscaler({ model });
}

type UpscalerInstance = Awaited<ReturnType<typeof loadUpscaler>>;
const cache: Partial<Record<Scale, UpscalerInstance>> = {};

async function getUpscaler(scale: Scale): Promise<UpscalerInstance> {
  const existing = cache[scale];
  if (existing) return existing;
  const instance = await loadUpscaler(scale);
  cache[scale] = instance;
  return instance;
}

export async function upscaleImage(dataUrl: string, scale: Scale): Promise<string> {
  const upscaler = await getUpscaler(scale);
  // patchSize tiles large images so WebGL doesn't run out of memory.
  const result = await upscaler.upscale(dataUrl, {
    output: "base64",
    patchSize: 128,
    padding: 6,
  });
  return result.startsWith("data:") ? result : `data:image/png;base64,${result}`;
}
