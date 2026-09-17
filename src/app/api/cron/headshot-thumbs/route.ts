import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { createAdminSupabase } from "@/lib/auth";
import { geminiGenerateFromText } from "@/lib/gemini";
import { MEN_STYLES, WOMEN_STYLES } from "@/lib/headshot-prompts";
import { deriveHeadshotThumbPrompt, HeadshotGender } from "@/lib/headshot-thumbs";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generates a preview thumbnail for each AI Headshot style (men + women) with
 * Nano Banana Pro and uploads them to Supabase (landing/headshot/<gender>-<id>.png).
 * Run it with:
 *
 *   GET /api/cron/headshot-thumbs?token=<ADMIN_IMAGE_TOKEN>
 *
 * Idempotent — it skips thumbnails that already exist — and each call does one
 * small batch and reports `remaining`, so call it again while that is above
 * zero.
 *
 * Deliberately not self-chaining: see the note in blog-images.
 */
const BUCKET = "landing";
const BATCH = 2;

type Item = { gender: HeadshotGender; id: number; prompt: string };
const ITEMS: Item[] = [
  ...WOMEN_STYLES.map((s) => ({ gender: "women" as const, id: s.id, prompt: s.prompt })),
  ...MEN_STYLES.map((s) => ({ gender: "men" as const, id: s.id, prompt: s.prompt })),
];

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
  const { data: existing } = await supabase.storage.from(BUCKET).list("headshot", { limit: 1000 });
  const have = new Set((existing || []).map((f) => f.name));
  const missing = ITEMS.filter((it) => !have.has(`${it.gender}-${it.id}.png`));

  const batch = missing.slice(0, BATCH);
  const results: Record<string, string> = {};

  await Promise.all(
    batch.map(async (it) => {
      const key = `${it.gender}-${it.id}`;
      try {
        const prompt = deriveHeadshotThumbPrompt(it.prompt, it.gender);
        const url = await geminiGenerateFromText(prompt, { aspect_ratio: "1:1" });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const bytes = Buffer.from(await res.arrayBuffer());
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(`headshot/${key}.png`, bytes, { contentType: "image/png", upsert: true });
        if (error) throw new Error(error.message);
        results[key] = `ok (${Math.round(bytes.length / 1024)} KB)`;
      } catch (e) {
        results[key] = `FAILED: ${(e as Error).message}`;
      }
    })
  );

  const remaining = missing.length - batch.length;
  return NextResponse.json({ total: ITEMS.length, remaining, done: remaining <= 0, results });
}
