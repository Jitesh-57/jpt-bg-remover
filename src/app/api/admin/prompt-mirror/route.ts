import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-token";
import { userMessage, operatorDetail } from "@/lib/user-message";
import { ALL } from "@/lib/prompts/data";
import { MIRROR_BUCKET, mirrorName } from "@/lib/prompts/media";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Copies the dataset's result images into our own storage.
 *
 * The prompts are licensed; the pictures are hosted on someone else's CDN.
 * Hotlinking 903 files on every page view is fragile in both directions —
 * they can move or rate-limit them, and we would be spending their bandwidth
 * to do it. The site renders the originals until a mirrored copy exists, so
 * this is an improvement that can be run at leisure rather than a dependency.
 *
 *   GET /api/admin/prompt-mirror?token=…              what is missing
 *   GET /api/admin/prompt-mirror?token=…&apply=1      copy a batch
 *   GET /api/admin/prompt-mirror?token=…&apply=1&batch=40
 *
 * Re-running is safe: anything already in the bucket is skipped. Unlike the
 * generation routes this costs nothing but bandwidth, so the batches are
 * larger.
 */

const DEFAULT_BATCH = 25;
const MAX_BATCH = 60;
/** Bigger than any legitimate result image; a redirect to an HTML error page
 *  is the usual reason a "download" comes back enormous. */
const MAX_BYTES = 12 * 1024 * 1024;

/** Every distinct source image in the dataset, in a stable order. */
function sourceUrls(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of ALL) {
    for (const u of [...r.images, r.videoThumbnail]) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const apply = req.nextUrl.searchParams.get("apply") === "1";
  const batchSize = Math.min(
    MAX_BATCH,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("batch") || "", 10) || DEFAULT_BATCH)
  );

  const supabase = createAdminSupabase();

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!(buckets || []).some((b) => b.name === MIRROR_BUCKET)) {
    if (!apply) {
      return NextResponse.json({
        applied: false, bucket: MIRROR_BUCKET, bucketExists: false,
        total: sourceUrls().length,
        note: `The bucket does not exist yet. Re-run with &apply=1 and it is created as a public bucket, then a batch of ${batchSize} images copied.`,
      });
    }
    const { error } = await supabase.storage.createBucket(MIRROR_BUCKET, { public: true });
    if (error) {
      console.error("[prompt-mirror] createBucket", error.message);
      return NextResponse.json({ error: `Could not create the storage bucket: ${error.message}` }, { status: 502 });
    }
  }

  /*
    The listing caps at 1000 per call and the mirror is larger than that, so
    it is paged. Getting this wrong would mean re-downloading the first 1000
    files on every run and never reaching the rest.
  */
  const have = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data } = await supabase.storage.from(MIRROR_BUCKET).list("", { limit: 1000, offset });
    const page = data || [];
    for (const f of page) have.add(f.name);
    if (page.length < 1000) break;
  }

  const all = sourceUrls();
  const missing = all.filter((u) => !have.has(mirrorName(u)));

  if (!apply) {
    return NextResponse.json({
      applied: false, bucket: MIRROR_BUCKET, bucketExists: true,
      total: all.length, mirrored: all.length - missing.length, missing: missing.length,
      note: missing.length
        ? `Nothing copied. Re-run with &apply=1 to mirror ${Math.min(batchSize, missing.length)} of them.`
        : "Every image is mirrored.",
    });
  }

  const batch = missing.slice(0, batchSize);
  const results: Record<string, string> = {};
  let copied = 0;

  for (const url of batch) {
    const key = mirrorName(url);
    try {
      const res = await fetch(url, { headers: { "user-agent": "pixelshine-prompt-mirror/1.0" } });
      if (!res.ok) throw new Error(`source responded ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) throw new Error(`unexpectedly large (${buf.length} bytes)`);
      if (buf.length < 512) throw new Error(`too small to be an image (${buf.length} bytes)`);
      const contentType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      if (!contentType.startsWith("image/")) throw new Error(`not an image (${contentType})`);

      const { error } = await supabase.storage
        .from(MIRROR_BUCKET)
        .upload(key, buf, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      copied += 1;
      results[key] = `ok (${Math.round(buf.length / 1024)} KB)`;
    } catch (e) {
      console.error(`[prompt-mirror] ${url}:`, operatorDetail(e));
      results[key] = `failed: ${userMessage(e, "could not be copied")}`;
    }
  }

  const remaining = missing.length - copied;
  return NextResponse.json({
    applied: true,
    bucket: MIRROR_BUCKET,
    copied,
    attempted: batch.length,
    remaining,
    done: remaining <= 0,
    results,
    note: remaining > 0
      ? `Call this again to copy the next ${Math.min(batchSize, remaining)}.`
      : "Every image is mirrored. The library now serves its own copies.",
  });
}
