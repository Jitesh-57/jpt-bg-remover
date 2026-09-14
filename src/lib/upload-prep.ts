/**
 * upload-prep.ts — shrink a photo to something an upload route will accept.
 *
 * The serverless request body is capped at about 4.5MB. A photo straight off a
 * modern phone is routinely larger, and the platform rejects it with a plain
 * text "Request Entity Too Large" before any route code runs — which is not
 * JSON, so a client calling res.json() on it threw
 *
 *   Unexpected token 'R', "Request En"... is not valid JSON
 *
 * and the user saw that instead of an explanation. Downscaling in the browser
 * fixes the cause; parseJsonResponse below keeps the symptom honest for
 * whatever still slips through.
 */

const MAX_EDGE = 2048;
/** Target ceiling, comfortably under the platform's body limit. */
const MAX_BYTES = 3.5 * 1024 * 1024;

function loadFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file could not be read as an image.")); };
    img.src = url;
  });
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not re-encode the image."))),
      "image/jpeg",
      quality
    )
  );

/**
 * Returns a file small enough to upload.
 *
 * Longest edge capped at 2048px — more than any of these models use — then
 * JPEG quality stepped down until it fits. A file that is already small enough
 * is returned untouched, so nothing is recompressed needlessly.
 */
export async function prepareForUpload(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file;

  const img = await loadFile(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  let blob = await canvasToBlob(canvas, 0.9);
  for (const q of [0.8, 0.7, 0.6]) {
    if (blob.size <= MAX_BYTES) break;
    blob = await canvasToBlob(canvas, q);
  }

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

/**
 * Parses a response body that is supposed to be JSON but might not be.
 *
 * A platform-level rejection (413 too large, 504 timeout, 502) answers with
 * text or HTML. Calling res.json() on that throws a parser error, and the
 * parser error is what reached the user. This returns a message about what
 * actually happened instead.
 */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  try {
    return (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    if (res.status === 413) {
      throw new Error("That image is too large to upload. Try one under 4MB.");
    }
    if (res.status === 504 || res.status === 408) {
      throw new Error("That took longer than expected and was stopped. Please try again.");
    }
    console.error(`[parseJsonResponse] non-JSON ${res.status} response`);
    throw new Error("Something went wrong. Please try again in a moment.");
  }
}

const loadDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = dataUrl;
  });

/** Rough byte count of a base64 data URL's payload. */
export function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
}

/**
 * The same treatment as prepareForUpload, for an image already read as a data
 * URL — which is how the app workspace holds the upload.
 *
 * Sending one of those in a JSON body is what produced the 413: base64 adds a
 * third again on top of a photo that was already over the limit.
 */
export async function prepareDataUrl(dataUrl: string): Promise<string> {
  if (dataUrlBytes(dataUrl) <= MAX_BYTES) return dataUrl;

  const img = await loadDataUrl(dataUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  let out = canvas.toDataURL("image/jpeg", 0.9);
  for (const q of [0.8, 0.7, 0.6]) {
    if (dataUrlBytes(out) <= MAX_BYTES) break;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}
