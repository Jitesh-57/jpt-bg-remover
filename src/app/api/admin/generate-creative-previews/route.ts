import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { geminiGenerateFromText } from "@/lib/gemini";
import { CREATIVE_APPS } from "@/lib/creative-apps";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * One-time: generate a true before/after comparison preview image for a
 * Creative App via PixelBin text-to-image (synthetic subjects, no real photo
 * needed) and upload it to Supabase Storage (landing bucket) at
 * creative/<slug>.png — the exact path previewUrl() points to.
 * Token-protected; idempotent (skips files that already exist unless ?force=1).
 *
 *   /api/admin/generate-creative-previews?token=jptblog2026&slug=funko-pop-figure
 */
const BUCKET = "landing";

// Plain, ordinary "before" subject description per app — matched to what the
// app's real prompt expects as input, so the before/after pairing reads naturally.
const BEFORE_SUBJECT: Record<string, string> = {
  "funko-pop-figure": "an ordinary, plainly-lit smartphone selfie of a young adult in colourful casual clothes against a blank wall",
  "claymation-portrait": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
  "comic-book-cover": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
  "coastal-cowgirl": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
  "old-hollywood-glamour": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
  "prom-photoshoot": "an ordinary, plainly-lit smartphone selfie of a young adult in casual clothes against a blank wall",
  "thanksgiving-photoshoot": "an ordinary, plainly-lit smartphone selfie of a young adult in casual clothes against a blank wall",
  "glow-up-filter": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall, slightly tired and dimly lit",
  "astronaut-photoshoot": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
  "pixel-art-avatar": "an ordinary, plainly-lit smartphone selfie of a young adult against a blank wall",
};

function buildPrompt(slug: string, afterPrompt: string, before: string): string {
  return `Create a single wide before/after comparison image, split into two equal vertical halves with a thin clean white divider line down the middle.
Left half: ${before}. This half should look like an unedited, very ordinary, slightly mundane phone photo — plain and unpolished.
Right half: the SAME subject, but transformed as follows — ${afterPrompt}
Add a small bold rounded label badge in the top-left corner of the left half reading exactly "BEFORE" in white text on a dark semi-transparent background, and a matching label badge in the top-right corner of the right half reading exactly "AFTER" in white text on a dark semi-transparent background. Clean, professional, app-store-screenshot style composition. The two halves must clearly depict the same subject, just before and after the transformation.`;
}

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

  const targets = onlySlug
    ? CREATIVE_APPS.filter((a) => a.slug === onlySlug)
    : CREATIVE_APPS.filter((a) => a.slug in BEFORE_SUBJECT);

  if (onlySlug && targets.length === 0) {
    return NextResponse.json({ error: `Unknown slug: ${onlySlug}` }, { status: 400 });
  }

  for (const app of targets) {
    const name = `${app.slug}.png`;
    const before = BEFORE_SUBJECT[app.slug];
    if (!before) { results[app.slug] = "skipped (no before-subject configured)"; continue; }
    try {
      if (!force && have.has(name)) { results[app.slug] = "skipped (exists)"; continue; }
      const prompt = buildPrompt(app.slug, app.prompt, before);
      const cdnUrl = await geminiGenerateFromText(prompt, { aspect_ratio: "16:9" });
      const res = await fetch(cdnUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(`creative/${name}`, bytes, { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      results[app.slug] = `ok (${Math.round(bytes.length / 1024)} KB)`;
    } catch (e) {
      results[app.slug] = `FAILED: ${(e as Error).message}`;
    }
  }
  return NextResponse.json({ results });
}
