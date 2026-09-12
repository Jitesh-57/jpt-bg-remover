// Resolves preset thumbnails for the AI apps from Supabase Storage, server-side
// at ISR time. Files are matched by name ("<app-slug>__<preset-id>.png"), so
// thumbnails can be uploaded later with no code change and no redeploy.

import { PRESET_IMAGE_BUCKET, presetImageStem } from "@/lib/app-presets";
import type { Preset } from "@/lib/app-presets";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const IMAGE_EXT = /\.(png|jpe?g|webp|avif)$/i;

function publicUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(PRESET_IMAGE_BUCKET)}/${encodeURIComponent(name)}`;
}

async function listBucket(): Promise<string[]> {
  if (!SUPABASE_URL || !KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(PRESET_IMAGE_BUCKET)}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 1000, sortBy: { column: "name", order: "asc" } }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r) => (r && typeof r === "object" ? (r as { name?: unknown }).name : null))
      .filter((n): n is string => typeof n === "string" && IMAGE_EXT.test(n));
  } catch {
    return [];
  }
}

const norm = (s: string) => s.replace(IMAGE_EXT, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * preset id -> thumbnail URL, for the presets that have an image uploaded.
 *
 * Three names are tried in order, most specific first:
 *   <app-slug>__<preset-id>   this app only
 *   <category>__<preset-id>   every app in the category (66 files cover 200 apps)
 *   preset__<preset-id>       the last-resort shared thumbnail
 *
 * Per-app thumbnails would mean 200 x 6 uploads, so the category name is the
 * one most worth filling in; the per-app name is there to override it where a
 * specific app deserves its own artwork.
 */
export async function presetImagesFor(
  appSlug: string,
  presets: Preset[],
  cat?: string
): Promise<Record<string, string>> {
  const files = await listBucket();
  if (!files.length) return {};
  const out: Record<string, string> = {};
  for (const p of presets) {
    const stems = [
      presetImageStem(appSlug, p.id),
      ...(cat ? [presetImageStem(cat, p.id)] : []),
      presetImageStem("preset", p.id),
    ].map(norm);
    for (const want of stems) {
      const hit = files.find((f) => norm(f) === want);
      if (hit) { out[p.id] = publicUrl(hit); break; }
    }
  }
  return out;
}

/** Sample photos users can try without uploading, from the same bucket. */
export async function sampleImages(): Promise<string[]> {
  const files = await listBucket();
  return files.filter((f) => /^sample[-_ ]?\d/i.test(f)).slice(0, 3).map(publicUrl);
}
