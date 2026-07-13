"use client";

// Free, unlimited background removal — 100% in-browser via
// @imgly/background-removal. Runs entirely on the user's device: no server,
// no Gemini, no credits, no quota.
//
// The first run downloads a small AI model to the device (cached afterwards,
// so subsequent removals are instant and work offline). We use the "small"
// (quantized) model so that one-time download is as light as possible for
// mobile connections.

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Remove the background in-browser. Returns a transparent-PNG data URL.
 *
 * @param src   data-URL string or Blob (normalized to a Blob to avoid the
 *              library's internal URL parsing).
 * @param onProgress optional 0–100 callback, reports the one-time model
 *              download progress so the UI can show it on slow connections.
 */
export async function removeBackgroundLocal(
  src: string | Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  const { removeBackground } = await import("@imgly/background-removal");
  const out = await removeBackground(blob, {
    model: "isnet_quint8", // smallest (quantized) model → fastest first-load download
    output: { format: "image/png" },
    progress: onProgress
      ? (key: string, current: number, total: number) => {
          // Only surface the model-download phase (key starts with "fetch").
          if (key.startsWith("fetch") && total > 0) {
            onProgress(Math.min(99, Math.round((current / total) * 100)));
          }
        }
      : undefined,
  });
  return blobToDataUrl(out);
}
