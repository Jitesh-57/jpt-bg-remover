import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

// One-time migration: copy AI-generated landing images from PixelBin CDN into
// Supabase Storage (public "landing" bucket) so the site no longer depends on PixelBin.
// Hit GET /api/migrate-landing-images once, then the landing page is updated to use
// the returned Supabase URLs. Safe to delete this route afterwards.

const PB = "https://cdn.pixelbin.io/v2/misty-band-06f445";
const BUCKET = "landing";

// key → { src CDN url (web-optimized), dest filename in bucket }
const IMAGES: Record<string, { src: string; dest: string }> = {
  hero:        { src: `${PB}/t.resize(w:1600)~t.compress(q:80)/landing/result_0.png`,            dest: "hero.png" },
  "bg-removal":{ src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/bg-removal/result_0.png`,   dest: "bg-removal.png" },
  "ai-edit":   { src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/ai-edit/result_0.png`,      dest: "ai-edit.png" },
  upscale:     { src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/upscale/result_0.png`,      dest: "upscale.png" },
  "bg-generate":{src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/bg-generate/result_0.png`,  dest: "bg-generate.png" },
  resize:      { src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/resize/result_0.png`,       dest: "resize.png" },
  color:       { src: `${PB}/t.resize(w:760)~t.compress(q:75)/landing/color/result_0.png`,        dest: "color.png" },
};

export async function GET() {
  const admin = createAdminSupabase();

  // Ensure public bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) {
      return NextResponse.json({ error: `Bucket create failed: ${error.message}` }, { status: 500 });
    }
  }

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const [key, { src, dest }] of Object.entries(IMAGES)) {
    try {
      const res = await fetch(src);
      if (!res.ok) { errors[key] = `fetch ${res.status}`; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      const { error } = await admin.storage.from(BUCKET).upload(dest, buf, {
        contentType: "image/png",
        upsert: true,
      });
      if (error) { errors[key] = error.message; continue; }
      const { data } = admin.storage.from(BUCKET).getPublicUrl(dest);
      results[key] = data.publicUrl;
    } catch (e) {
      errors[key] = String(e).slice(0, 120);
    }
  }

  return NextResponse.json({ results, errors });
}
