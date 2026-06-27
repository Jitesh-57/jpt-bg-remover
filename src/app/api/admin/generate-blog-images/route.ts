import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateImageFromText } from "@/lib/pixelbin";
import { deriveBlogPrompt } from "@/lib/blog-images";
import { POSTS } from "@/app/blog/_data/posts";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * One-time batch generator: for each blog post, generate a content-matched
 * hero image with Nano Banana Pro and upload it to Supabase Storage
 * (landing/blog/<slug>.png). Runs server-side on Vercel (reaches PixelBin +
 * Supabase). Token-protected.
 *
 * Process in batches to stay under the function time limit:
 *   /api/admin/generate-blog-images?token=jptblog2026&offset=0&limit=6
 * Use the returned `nextOffset` for the next call until `done` is true.
 * Idempotent: pass force=1 to regenerate images that already exist.
 */
const BUCKET = "landing";

export async function GET(req: NextRequest) {
  // Fixed token (independent of MIGRATE_TOKEN). Safe: only generates a fixed set
  // of blog images and uploads them to a known path. Temporary one-time endpoint.
  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  if (token !== "jptblog2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "6", 10), 12);
  const force = req.nextUrl.searchParams.get("force") === "1";

  const supabase = createAdminSupabase();
  const slice = POSTS.slice(offset, offset + limit);
  const results: Record<string, string> = {};

  for (const post of slice) {
    const path = `blog/${post.slug}.png`;
    try {
      if (!force) {
        const { data: existing } = await supabase.storage.from(BUCKET).list("blog", { search: `${post.slug}.png` });
        if (existing && existing.some((f) => f.name === `${post.slug}.png`)) {
          results[post.slug] = "skipped (exists)";
          continue;
        }
      }
      const prompt = deriveBlogPrompt(post.title, post.category);
      const url = await generateImageFromText(prompt, { aspect_ratio: "16:9", output_resolution: "1K" });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch result ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      results[post.slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[post.slug] = `FAILED: ${(e as Error).message}`;
    }
  }

  const nextOffset = offset + slice.length;
  const done = nextOffset >= POSTS.length;
  return NextResponse.json({
    processed: slice.length,
    offset,
    nextOffset: done ? null : nextOffset,
    done,
    total: POSTS.length,
    results,
  });
}
