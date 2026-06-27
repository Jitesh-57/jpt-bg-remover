import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateImageFromText } from "@/lib/pixelbin";
import { MEN_STYLES, WOMEN_STYLES } from "@/lib/headshot-prompts";
import { deriveHeadshotThumbPrompt, HeadshotGender } from "@/lib/headshot-thumbs";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generates a preview thumbnail for each AI Headshot style (men + women) with
 * Nano Banana Pro and uploads them to Supabase (landing/headshot/<gender>-<id>.png).
 * Small batches to stay under Hobby's 60s limit; idempotent (skips existing).
 * Triggered by the headshot page's filler or manually with ?token=jptblog2026.
 */
const BUCKET = "landing";
const BATCH = 2;

type Item = { gender: HeadshotGender; id: number; prompt: string };
const ITEMS: Item[] = [
  ...WOMEN_STYLES.map((s) => ({ gender: "women" as const, id: s.id, prompt: s.prompt })),
  ...MEN_STYLES.map((s) => ({ gender: "men" as const, id: s.id, prompt: s.prompt })),
];

export async function GET(req: NextRequest) {
  const authed =
    req.headers.get("x-vercel-cron") !== null ||
    (req.nextUrl.searchParams.get("token") || "").trim() === "jptblog2026";
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        const url = await generateImageFromText(prompt, { aspect_ratio: "1:1", output_resolution: "1K" });
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
