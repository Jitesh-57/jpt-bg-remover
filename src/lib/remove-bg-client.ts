"use client";

// Background removal for the "Remove BG" tool — free for everyone.
//
// Two engines, tried in order:
//   1. In-browser (@imgly/background-removal) — free, on-device, no server,
//      no Google quota. Best case: instant and private.
//   2. Server fallback (/api/remove-bg → Gemini) — used if the in-browser
//      engine fails to load/run (e.g. old device, model CDN blocked). The
//      route is ungated/free, so this works for everyone too.

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Free, in-browser background removal. Returns a transparent-PNG data URL.
 * The source is normalized to a Blob first — passing a data-URL string trips
 * the library's internal URL parsing on some builds ("e.replace is not a
 * function"); a Blob goes straight to the decode path and avoids it.
 */
export async function removeBackgroundLocal(src: string | Blob): Promise<string> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  const { removeBackground } = await import("@imgly/background-removal");
  const out = await removeBackground(blob, { output: { format: "image/png" } });
  return blobToDataUrl(out);
}

/** Server (Gemini) fallback. Returns a data URL or throws with the server error. */
async function removeBackgroundServer(dataUrl: string): Promise<string> {
  const res = await fetch("/api/remove-bg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  let data: { dataUrl?: string; error?: string } = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (res.ok && data.dataUrl) return data.dataUrl;
  throw new Error(data.error || "Background removal failed. Please try again.");
}

/**
 * Remove the background, preferring the free in-browser engine and falling
 * back to the server if it can't run. Free for everyone either way.
 */
export async function removeBackgroundSmart(dataUrl: string): Promise<string> {
  try {
    return await removeBackgroundLocal(dataUrl);
  } catch (localErr) {
    console.warn("[remove-bg] in-browser engine failed, falling back to server:", localErr);
    return removeBackgroundServer(dataUrl);
  }
}
