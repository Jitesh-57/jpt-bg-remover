import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * One-time: copy the remaining PixelBin-CDN creatives into Supabase Storage
 * (landing bucket) so nothing is served from PixelBin. Token-protected;
 * idempotent (skips files that already exist unless ?force=1).
 *   /api/admin/migrate-creatives?token=jptblog2026
 */
const BUCKET = "landing";
const PB = "https://cdn.pixelbin.io/v2/misty-band-06f445";

// target Supabase filename -> source PixelBin URL (fetch resized where large)
const FILES: Record<string, string> = {
  "hero-annotated.png": `${PB}/t.resize(w:1300)/landing/hero-annotated/result_0.png`,
  "upscale-before.jpg": `${PB}/original/landing/upscale-before.jpg`,
  "upscale-after.jpg": `${PB}/original/landing/upscale-after.jpg`,
};

export async function GET(req: NextRequest) {
  if ((req.nextUrl.searchParams.get("token") || "").trim() !== "jptblog2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get("force") === "1";
  const supabase = createAdminSupabase();
  const { data: existing } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  const have = new Set((existing || []).map((f) => f.name));
  const results: Record<string, string> = {};

  for (const [name, src] of Object.entries(FILES)) {
    try {
      if (!force && have.has(name)) { results[name] = "skipped (exists)"; continue; }
      const res = await fetch(src);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const contentType = name.endsWith(".png") ? "image/png" : "image/jpeg";
      const { error } = await supabase.storage.from(BUCKET).upload(name, bytes, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      results[name] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[name] = `FAILED: ${(e as Error).message}`;
    }
  }
  return NextResponse.json({ results });
}
