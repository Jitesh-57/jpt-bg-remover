// Resolves reference images for the 80s prompt gallery.
//
// The Supabase bucket is not reachable from the build environment, so
// filenames cannot be baked in. Instead the browser lists the bucket once
// using the public anon key and matches each file to a prompt by name. This
// works regardless of how the files are named ("01. Title.png", "title.jpg",
// "1980s Couple Walking.webp"), and needs no code change when files are added.

import type { Prompt } from "@/lib/prompts-80s";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const BUCKET = "Prompt template images";

const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif)$/i;

/** Strip extension, any leading "01." / "01 -" numbering, and all punctuation. */
function norm(s: string): string {
  return s
    .replace(IMAGE_EXT, "")
    .toLowerCase()
    .replace(/^\s*\d{1,3}\s*[.)\-_]*\s*/, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Leading number in a filename, if it looks like an index ("07 rooftop.png"). */
function leadingNumber(s: string): number | null {
  const m = s.match(/^\s*(\d{1,3})\b/);
  return m ? parseInt(m[1], 10) : null;
}

export function publicUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodeURIComponent(name)}`;
}

/** Lists image filenames in the bucket. Returns [] on any failure (private
 *  bucket, no anon read policy, offline) so the UI just shows placeholders. */
export async function listBucketImages(): Promise<string[]> {
  if (!SUPABASE_URL || !ANON_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(BUCKET)}`, {
      method: "POST",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 1000, sortBy: { column: "name", order: "asc" } }),
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

/** Maps prompt id -> image URL, best-effort, by matching names.
 *
 *  Files in the bucket are named "01. 1980s Couple Walking.png", so the
 *  leading number is an exact key to the prompt number and is tried first.
 *  Title matching only handles files that carry no index. */
export function matchImages(prompts: Prompt[], files: string[]): Record<string, string> {
  if (!files.length) return {};

  const normed = files.map((f) => ({ file: f, key: norm(f), num: leadingNumber(f) }));
  const taken = new Set<string>();
  const out: Record<string, string> = {};

  const claim = (id: string, file: string) => {
    if (taken.has(file) || out[id]) return;
    taken.add(file);
    out[id] = publicUrl(file);
  };

  // Pass 1: leading index number. Authoritative for this bucket.
  for (const p of prompts) {
    const hit = normed.find((f) => !taken.has(f.file) && f.num === p.n);
    if (hit) claim(p.id, hit.file);
  }
  // Pass 2: exact normalised title, for any file without an index.
  for (const p of prompts) {
    if (out[p.id]) continue;
    const key = norm(p.title);
    const hit = normed.find((f) => !taken.has(f.file) && f.num === null && f.key === key);
    if (hit) claim(p.id, hit.file);
  }
  // Pass 3: one name contained in the other.
  for (const p of prompts) {
    if (out[p.id]) continue;
    const key = norm(p.title);
    const hit = normed.find(
      (f) => !taken.has(f.file) && f.num === null && f.key.length > 3 && (f.key.includes(key) || key.includes(f.key))
    );
    if (hit) claim(p.id, hit.file);
  }
  return out;
}
