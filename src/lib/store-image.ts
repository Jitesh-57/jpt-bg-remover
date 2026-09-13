import { createAdminSupabase } from "@/lib/auth";

/**
 * store-image.ts — putting a generated image somewhere it can be linked to.
 *
 * The AI routes hand the browser a data URL and keep nothing, so "the generated
 * URL" did not exist to store: My Generations kept a 25KB base64 thumbnail in a
 * database column, and the full image only ever lived in the tab that made it.
 *
 * This writes the image to Storage and returns its public URL, which is what
 * generations.result_url holds.
 *
 * Never throws. A generation that worked must not fail because the copy could
 * not be filed — the user already has their image in the response.
 */

const BUCKET = "generations";

function parseDataUrl(dataUrl: string): { bytes: Buffer; mime: string } | null {
  const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1] || "image/png";
  const body = m[3];
  return { bytes: Buffer.from(body, m[2] ? "base64" : "utf8"), mime };
}

async function fetchRemote(url: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    mime: res.headers.get("content-type") || "image/png",
  };
}

/**
 * Stores an image and returns its public URL.
 *
 * `src` may be a data URL or a remote URL. A URL already pointing at our own
 * Storage is returned unchanged rather than copied.
 */
export async function storeImage(src: string, prefix: string, userId: string): Promise<string | null> {
  try {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    if (base && src.startsWith(`${base}/storage/v1/object/public/`)) return src;

    const got = src.startsWith("data:") ? parseDataUrl(src) : await fetchRemote(src);
    if (!got || !got.bytes.length) return null;

    const ext = (got.mime.split("/")[1] || "png").split("+")[0].replace(/[^a-z0-9]/gi, "") || "png";
    // Foldered by user so one account's images can be found, listed or removed
    // together — and so the path itself carries who it belongs to.
    const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = createAdminSupabase();
    const { error } = await supabase.storage.from(BUCKET).upload(path, got.bytes, {
      contentType: got.mime,
      upsert: true,
    });

    if (error) {
      // The bucket is created on demand, once, rather than being a setup step
      // someone has to remember — the same reason the site-image generator does.
      if (/bucket not found/i.test(error.message)) {
        await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
        const retry = await supabase.storage.from(BUCKET).upload(path, got.bytes, {
          contentType: got.mime,
          upsert: true,
        });
        if (retry.error) throw new Error(retry.error.message);
      } else {
        throw new Error(error.message);
      }
    }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error(`[store-image] could not store ${prefix} for ${userId}: ${(e as Error).message}`);
    return null;
  }
}
