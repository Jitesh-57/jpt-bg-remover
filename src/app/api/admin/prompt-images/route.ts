import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateFromText } from "@/lib/ai-image";
import { requireAdmin } from "@/lib/admin-token";
import { userMessage, operatorDetail } from "@/lib/user-message";
import { PROMPTS, PROMPT_BY_SLUG } from "@/lib/prompt-library";
import { examplePromptFor, LIBRARY_BUCKET } from "@/lib/prompt-library-images";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Fills the prompt library's example images.
 *
 * The library renders a designed placeholder for any prompt with no picture,
 * so the page works from the moment it ships. This is what replaces those
 * placeholders with real examples, one generation per prompt, written to the
 * "Prompt library images" bucket under the prompt's own slug — which is
 * exactly what lib/prompt-library-images.ts matches on.
 *
 *   GET /api/admin/prompt-images?token=…               what is missing
 *   GET /api/admin/prompt-images?token=…&apply=1       generate a batch
 *   GET /api/admin/prompt-images?token=…&apply=1&slug= just that one
 *
 * Every generation costs real money at the provider, so it is deliberately
 * batched and never runs on its own schedule: nothing here is triggered by a
 * page view. Re-running is safe — anything already in the bucket is skipped.
 */

/** Small enough to finish inside maxDuration with room for a slow queue. */
const DEFAULT_BATCH = 4;
const MAX_BATCH = 8;

/** fal's accepted ratios. A library ratio outside this list is nudged home. */
const RATIO_MAP: Record<string, string> = {
  "1:1": "1:1", "4:5": "4:5", "3:4": "3:4", "2:3": "2:3", "9:16": "9:16",
  "3:2": "3:2", "16:9": "16:9", "4:3": "4:3",
  // Banner shapes no image model offers: generated wide, then cropped by the
  // page's own object-fit rather than asked for and silently ignored.
  "3:1": "16:9", "4:1": "16:9", "1.91:1": "16:9",
};

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const apply = req.nextUrl.searchParams.get("apply") === "1";
  const only = (req.nextUrl.searchParams.get("slug") || "").trim();
  const batchSize = Math.min(
    MAX_BATCH,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("batch") || "", 10) || DEFAULT_BATCH)
  );

  if (only && !PROMPT_BY_SLUG[only]) {
    return NextResponse.json({ error: `No prompt with the slug "${only}".` }, { status: 404 });
  }

  const supabase = createAdminSupabase();

  /*
    The bucket is created here rather than by hand.

    Every other image bucket on this project had to be made in the Supabase
    dashboard first, and a missing one fails as an opaque "Bucket not found"
    from the upload call. Creating it public, since these images are rendered
    on a public page by URL.
  */
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === LIBRARY_BUCKET);
  if (!exists) {
    if (!apply) {
      return NextResponse.json({
        applied: false,
        bucket: LIBRARY_BUCKET,
        bucketExists: false,
        note: `The bucket does not exist yet. Re-run with &apply=1 and it will be created as a public bucket, then a batch of ${batchSize} images generated.`,
        missing: PROMPTS.length,
      });
    }
    const { error } = await supabase.storage.createBucket(LIBRARY_BUCKET, { public: true });
    if (error) {
      console.error("[prompt-images] createBucket", error.message);
      return NextResponse.json(
        { error: `Could not create the storage bucket: ${error.message}` },
        { status: 502 }
      );
    }
  }

  const { data: listed } = await supabase.storage.from(LIBRARY_BUCKET).list("", { limit: 1000 });
  const have = new Set((listed || []).map((f) => f.name));

  const pool = only ? [PROMPT_BY_SLUG[only]] : PROMPTS;
  // `only` regenerates deliberately; a bulk run never repeats work.
  const missing = only ? pool : pool.filter((p) => !have.has(`${p.slug}.png`));

  if (!apply) {
    return NextResponse.json({
      applied: false,
      bucket: LIBRARY_BUCKET,
      bucketExists: true,
      total: PROMPTS.length,
      have: PROMPTS.length - missing.length,
      missing: missing.length,
      nextBatch: missing.slice(0, batchSize).map((p) => p.slug),
      note: missing.length
        ? `Nothing generated. Re-run with &apply=1 to generate ${Math.min(batchSize, missing.length)} of them.`
        : "Every prompt already has an image.",
    });
  }

  const batch = missing.slice(0, batchSize);
  const results: Record<string, string> = {};

  /*
    Sequential, not parallel.

    Four concurrent generations is exactly the burst that gets a fal account
    rate-limited, and a 429 partway through a paid batch wastes the requests
    that already succeeded. One at a time is slower and finishes.
  */
  for (const p of batch) {
    try {
      const url = await generateFromText(examplePromptFor(p), {
        aspect_ratio: RATIO_MAP[p.ratio] || "1:1",
        strict: true,
        budgetMs: 55_000,
      });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`could not download the generated image (${res.status})`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const { error } = await supabase.storage
        .from(LIBRARY_BUCKET)
        .upload(`${p.slug}.png`, bytes, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      results[p.slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      console.error(`[prompt-images] ${p.slug}:`, operatorDetail(e));
      results[p.slug] = `failed: ${userMessage(e)}`;
      // A credential or billing failure will fail every remaining one the same
      // way. Stopping leaves the rest for a later run instead of burning them.
      if (/temporarily unavailable/i.test(results[p.slug])) break;
    }
  }

  const ok = Object.values(results).filter((r) => r.startsWith("ok")).length;
  const remaining = missing.length - ok;

  return NextResponse.json({
    applied: true,
    bucket: LIBRARY_BUCKET,
    generated: ok,
    attempted: Object.keys(results).length,
    remaining,
    done: remaining <= 0,
    results,
    note: remaining > 0
      ? `Call this again to generate the next ${Math.min(batchSize, remaining)}.`
      : "Every prompt now has an example image.",
  });
}
