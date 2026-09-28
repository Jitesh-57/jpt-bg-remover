import { EDITS_BUCKET, EDITS_PATH, EMPTY_EDITS, editsPublicUrl, type PageEdits } from "@/lib/page-edits";

/**
 * Reading and writing the page-edits document. Server-only: writing needs the
 * service key.
 */

async function read(init: RequestInit, stamp: number): Promise<PageEdits> {
  const url = editsPublicUrl();
  if (!url) return EMPTY_EDITS;
  try {
    const res = await fetch(`${url}?t=${stamp}`, init);
    if (!res.ok) return EMPTY_EDITS;
    const json = (await res.json()) as PageEdits;
    return json && typeof json === "object" && json.pages && typeof json.pages === "object" ? json : EMPTY_EDITS;
  } catch {
    return EMPTY_EDITS;
  }
}

/**
 * Cached on the same five-minute window as the layout's other reads, so this
 * doesn't make pages regenerate more often. Browsers fetch a fresh copy
 * themselves (see SiteEdits), which is what makes a change show within a minute.
 */
export function readEdits(): Promise<PageEdits> {
  return read({ next: { revalidate: 300 } }, Math.floor(Date.now() / 300_000));
}

/** Uncached: for read-modify-write in the admin API. */
export function readEditsNow(): Promise<PageEdits> {
  return read({ cache: "no-store" }, Date.now());
}

export async function writeEdits(next: PageEdits): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  try {
    const res = await fetch(`${base}/storage/v1/object/${EDITS_BUCKET}/${EDITS_PATH}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
        // Short, so visitors pick a change up within a minute.
        "Cache-Control": "public, max-age=30",
      },
      body: JSON.stringify(next),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the write (${res.status}).` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}

/** Uploads a WebP for the editor and returns its public URL. Content-addressed, so re-uploading the same file is free. */
export async function uploadEditImage(bytes: Buffer): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };
  const { createHash } = await import("crypto");
  const name = `edits/${createHash("sha1").update(bytes).digest("hex").slice(0, 20)}.webp`;
  try {
    const res = await fetch(`${base}/storage/v1/object/${EDITS_BUCKET}/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "image/webp",
        "x-upsert": "true",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) return { ok: false, error: `Storage refused the upload (${res.status}).` };
    return { ok: true, url: `${base}/storage/v1/object/public/${EDITS_BUCKET}/${name}` };
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}
