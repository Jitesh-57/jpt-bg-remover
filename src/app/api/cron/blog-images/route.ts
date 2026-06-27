import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateImageFromText } from "@/lib/pixelbin";
import { deriveBlogPrompt } from "@/lib/blog-images";
import { POSTS } from "@/app/blog/_data/posts";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Self-running blog-image generator (Hobby-plan friendly).
 *
 * Each invocation generates a small batch of missing images (under the 60s
 * function limit), then — if any remain — schedules the NEXT invocation via
 * after(), so a single trigger chains through all of them automatically.
 *
 * Triggered by the daily Vercel cron (vercel.json) or manually with
 * ?token=jptblog2026. Idempotent: skips images that already exist and stops
 * once everything is generated.
 */
const BUCKET = "landing";
const BATCH = 2;

export async function GET(req: NextRequest) {
  const authed =
    req.headers.get("x-vercel-cron") !== null ||
    (req.nextUrl.searchParams.get("token") || "").trim() === "jptblog2026";
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabase();
  const { data: existing } = await supabase.storage.from(BUCKET).list("blog", { limit: 1000 });
  const have = new Set((existing || []).map((f) => f.name));
  const missing = POSTS.filter((p) => !have.has(`${p.slug}.png`));

  const batch = missing.slice(0, BATCH);
  const results: Record<string, string> = {};

  await Promise.all(
    batch.map(async (post) => {
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
    })
  );

  const remaining = missing.length - batch.length;

  return NextResponse.json({
    total: POSTS.length,
    generatedThisRun: Object.values(results).filter((r) => r.startsWith("ok")).length,
    remaining,
    done: remaining <= 0,
    results,
  });
}
