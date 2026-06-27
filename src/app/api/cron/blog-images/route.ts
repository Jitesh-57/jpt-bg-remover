import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateImageFromText } from "@/lib/pixelbin";
import { deriveBlogPrompt } from "@/lib/blog-images";
import { POSTS } from "@/app/blog/_data/posts";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Self-running blog-image generator. A Vercel cron (see vercel.json) hits this
 * automatically; it finds every blog post that doesn't yet have a Supabase
 * image and generates + uploads it. Idempotent — once all images exist it's a
 * no-op, so it safely stops. Also manually triggerable with ?token=jptblog2026.
 */
const BUCKET = "landing";
const CONCURRENCY = 4;
const TIME_BUDGET_MS = 250_000;

export async function GET(req: NextRequest) {
  const authed =
    req.headers.get("x-vercel-cron") !== null ||
    (req.nextUrl.searchParams.get("token") || "").trim() === "jptblog2026";
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabase();

  // One list call to find which images already exist.
  const { data: existing } = await supabase.storage.from(BUCKET).list("blog", { limit: 1000 });
  const have = new Set((existing || []).map((f) => f.name));
  const missing = POSTS.filter((p) => !have.has(`${p.slug}.png`));

  const results: Record<string, string> = {};
  const start = Date.now();
  let i = 0;

  async function worker() {
    while (i < missing.length && Date.now() - start < TIME_BUDGET_MS) {
      const post = missing[i++];
      try {
        const prompt = deriveBlogPrompt(post.title, post.category);
        const url = await generateImageFromText(prompt, { aspect_ratio: "16:9", output_resolution: "1K" });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const bytes = Buffer.from(await res.arrayBuffer());
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(`blog/${post.slug}.png`, bytes, { contentType: "image/png", upsert: true });
        if (error) throw new Error(error.message);
        results[post.slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
      } catch (e) {
        results[post.slug] = `FAILED: ${(e as Error).message}`;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const generated = Object.values(results).filter((r) => r.startsWith("ok")).length;
  const remaining = missing.length - Object.keys(results).length;
  return NextResponse.json({
    total: POSTS.length,
    alreadyHad: have.size,
    missingAtStart: missing.length,
    generatedThisRun: generated,
    remaining: Math.max(0, remaining),
    done: remaining <= 0,
    results,
  });
}
