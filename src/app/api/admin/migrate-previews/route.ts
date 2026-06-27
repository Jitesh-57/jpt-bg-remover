import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * One-time migration endpoint: download the 12 Creative App before/after previews
 * from the PixelBin CDN and upload them to Supabase Storage (bucket "landing",
 * path creative/<slug>.png) — the exact path previewUrl() points to.
 *
 * Runs server-side on Vercel (which can reach both hosts). Protected by a token:
 *   set MIGRATE_TOKEN in the Vercel env, then visit:
 *   https://www.sjpt.in/api/admin/migrate-previews?token=YOUR_TOKEN
 */

const PIXELBIN_CDN = "https://cdn.pixelbin.io/v2/misty-band-06f445";
const BUCKET = "landing";

// slug -> PixelBin source path (saree's asset landed at the storage root).
const SOURCES: Record<string, string> = {
  "saree-photoshoot": "creative/result_0.png",
  "3d-figurine": "creative/3d-figurine/result_0.png",
  "retro-bollywood": "creative/retro-bollywood/result_0.png",
  "polaroid-photo": "creative/polaroid-photo/result_0.png",
  "restore-old-photos": "creative/restore-old-photos/result_0.png",
  "couple-photoshoot": "creative/couple-photoshoot/result_0.png",
  "professional-headshot": "creative/professional-headshot/result_0.png",
  "festival-photoshoot": "creative/festival-photoshoot/result_0.png",
  "pet-portrait": "creative/pet-portrait/result_0.png",
  "anime-style": "creative/anime-style/result_0.png",
  "passport-photo": "creative/passport-photo/result_0.png",
  "background-changer": "creative/background-changer/result_0.png",
};

export async function GET(req: NextRequest) {
  // Fixed token (no env dependency). Safe because this endpoint only re-uploads
  // a fixed set of 12 known preview images (idempotent). Temporary — remove the
  // route after the one-time migration is done.
  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  const expected = (process.env.MIGRATE_TOKEN || "jptmigrate2026").trim();
  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const results: Record<string, string> = {};

  for (const [slug, srcPath] of Object.entries(SOURCES)) {
    try {
      // Pull a resized (~1200px) copy to keep file sizes reasonable.
      const src = `${PIXELBIN_CDN}/t.resize(w:1200)/${srcPath}`;
      const res = await fetch(src);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`creative/${slug}.png`, bytes, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);

      results[slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[slug] = `FAILED: ${(e as Error).message}`;
    }
  }

  const ok = Object.values(results).filter((r) => r.startsWith("ok")).length;
  return NextResponse.json({ uploaded: ok, total: Object.keys(SOURCES).length, results });
}
