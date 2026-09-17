import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { createAdminSupabase } from "@/lib/auth";
import { geminiGenerateFromText } from "@/lib/gemini";
import { deriveBlogPrompt } from "@/lib/blog-images";
import { POSTS } from "@/app/blog/_data/posts";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Blog-image generator.
 *
 * The comment here used to describe a daily Vercel cron and an after() chain,
 * neither of which existed. What actually drove it was a browser loop holding
 * a token published in this repository.
 *
 * Run it with:
 *
 *   GET /api/cron/blog-images?token=<ADMIN_IMAGE_TOKEN>
 *
 * Idempotent — it skips images that already exist — and each call does one
 * small batch and reports `remaining`, so call it again while that is above
 * zero.
 *
 * Deliberately not self-chaining. site-images does chain, and needed a kill
 * switch to go with it, because once a run is walking the queue spending money
 * there is no way to stop it from outside. A generator you have to ask again
 * is the safer shape for one nobody is watching.
 */
const BUCKET = "landing";
const BATCH = 2;

export async function GET(req: NextRequest) {
  /*
    ADMIN_IMAGE_TOKEN, not a token written in this file.

    This was `?token=jptblog2026` — in a public repository, so the guard
    protected nothing, on an endpoint that spends real money generating
    images. Anyone who read the repo could run it in a loop.

    A Vercel cron still passes on its own header, so adding a schedule later
    needs no change here. There is no vercel.json today; the only thing that
    ever called this was a browser loop, which is now gone (a browser cannot
    hold a secret, so there is no safe version of that).
  */
  if (req.headers.get("x-vercel-cron") === null) {
    const denied = requireAdmin(req);
    if (denied) return denied;
  }

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
        const url = await geminiGenerateFromText(prompt, { aspect_ratio: "16:9" });
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
