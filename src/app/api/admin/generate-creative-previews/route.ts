import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { generateImageFromText } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * One-time: generate a representative preview image for each new Creative App
 * via PixelBin text-to-image (no source photo — synthetic subjects only) and
 * upload it to Supabase Storage (landing bucket) at creative/<slug>.png, the
 * exact path previewUrl() in src/lib/creative-apps.ts already points to.
 * Token-protected; idempotent (skips files that already exist unless ?force=1).
 *
 *   /api/admin/generate-creative-previews?token=jptblog2026&slug=christmas-photo
 *   /api/admin/generate-creative-previews?token=jptblog2026   (does all, one request — may be slow)
 */
const BUCKET = "landing";

const PROMPTS: Record<string, string> = {
  "linkedin-banner": "A professional LinkedIn cover banner image: clean corporate gradient in deep blue tones, subtle abstract geometric shapes, professional and modern, wide banner composition with negative space for text overlay, high quality, photographic.",
  "christmas-photo": "A warm festive Christmas portrait of a smiling young adult: soft string lights, a decorated tree in the background, a cozy red sweater, golden bokeh, joyful holiday mood, photorealistic studio portrait.",
  "baby-photoshoot": "A soft dreamy studio portrait of a happy baby: warm pastel tones, gentle diffused lighting, a cozy knitted wrap, clean minimal backdrop, professional newborn-photography style.",
  "graduation-photo": "A proud graduation portrait of a young adult wearing an academic cap and gown, holding a rolled diploma, campus backdrop, warm celebratory lighting, photorealistic.",
  "gym-transformation": "An energetic fitness portrait of an athletic person in gym wear, dynamic gym lighting, toned physique, motivational mood, photorealistic.",
  "ghibli-style": "A dreamy hand-painted Japanese animated-film style portrait of a young person in a lush green countryside, soft watercolour background, warm nostalgic lighting, Studio-Ghibli-inspired illustration.",
  "y2k-aesthetic": "A Y2K early-2000s aesthetic photo of a young person: flash-lit digital-camera look, glossy highlights, bold saturated colours, slight grain, point-and-shoot photography style.",
  "wedding-invite-photo": "An elegant wedding-invitation style portrait of a couple in formal attire, soft romantic golden-hour lighting, tasteful neutral backdrop with negative space, photorealistic.",
  "corporate-avatar": "A clean professional profile-avatar portrait of a person in business-casual attire, soft solid-colour background, friendly approachable expression, framed tightly like a profile icon, photorealistic.",
  "old-money-aesthetic": "A quiet-luxury 'old money' aesthetic portrait: tailored neutral-toned classic clothing, soft natural light, elegant library backdrop, timeless understated mood, photorealistic editorial photo.",
};

export async function GET(req: NextRequest) {
  if ((req.nextUrl.searchParams.get("token") || "").trim() !== "jptblog2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get("force") === "1";
  const onlySlug = req.nextUrl.searchParams.get("slug");
  const supabase = createAdminSupabase();
  const { data: existing } = await supabase.storage.from(BUCKET).list("creative", { limit: 1000 });
  const have = new Set((existing || []).map((f) => f.name));
  const results: Record<string, string> = {};

  const entries = onlySlug
    ? Object.entries(PROMPTS).filter(([slug]) => slug === onlySlug)
    : Object.entries(PROMPTS);

  if (onlySlug && entries.length === 0) {
    return NextResponse.json({ error: `Unknown slug: ${onlySlug}` }, { status: 400 });
  }

  for (const [slug, prompt] of entries) {
    const name = `${slug}.png`;
    try {
      if (!force && have.has(name)) { results[slug] = "skipped (exists)"; continue; }
      const cdnUrl = await generateImageFromText(prompt, { aspect_ratio: "16:9", output_resolution: "1K" });
      const res = await fetch(cdnUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(`creative/${name}`, bytes, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      results[slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[slug] = `FAILED: ${(e as Error).message}`;
    }
  }
  return NextResponse.json({ results });
}
