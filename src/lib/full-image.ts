/**
 * full-image.ts — the full-size result, ready to send to /api/generations/save.
 *
 * My Creations used to receive only a 320px thumbnail, so every saved image
 * came back blurry. This hands over the real thing instead:
 *
 *   - a web URL is passed as is; the server copies it into our Storage
 *   - a data URL (made in the browser) is sent at its full resolution,
 *     re-encoded as high-quality WebP only when it is too big for one request
 *     (serverless request bodies stop at ~4.5MB), and scaled down only if even
 *     that is not enough
 */

const MAX_CHARS = 3_900_000; // base64 characters, leaving room for the rest of the body

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image could not be read"));
    img.src = src;
  });
}

function encode(img: HTMLImageElement, scale: number, quality: number): string | null {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, c.width, c.height);
  try { return c.toDataURL("image/webp", quality); } catch { return null; }
}

export async function fullImagePayload(url: string | null | undefined): Promise<{ imageUrl?: string; image?: string }> {
  if (!url) return {};
  if (/^https?:\/\//i.test(url)) return { imageUrl: url };
  try {
    let src = url;
    if (src.startsWith("blob:")) {
      const blob = await (await fetch(src)).blob();
      src = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
    }
    if (!src.startsWith("data:image/")) return {};
    if (src.length <= MAX_CHARS && /^data:image\/(png|jpeg|webp);base64,/.test(src)) return { image: src };
    const img = await load(src);
    for (const [scale, quality] of [[1, 0.92], [1, 0.82], [0.85, 0.85], [0.7, 0.85], [0.55, 0.85]] as const) {
      const out = encode(img, scale, quality);
      if (out && out.length <= MAX_CHARS) return { image: out };
    }
  } catch { /* fall through: the thumbnail is still saved */ }
  return {};
}
