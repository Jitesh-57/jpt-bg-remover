/**
 * Which app creatives actually exist, resolved server-side at ISR time.
 *
 * The homepage used to front eight hand-picked apps whether or not their
 * example image had been generated, so the gallery showed flat gradient tiles
 * and the 21:9 showcase frame was an empty dark box — the images are produced
 * in batches and the set fills in over time.
 *
 * Listing the bucket once per revalidation is enough to only ever feature apps
 * that have a real picture, and to fall back gracefully: an empty result (no
 * keys configured, the list call failing) means "unknown", and callers keep
 * their own default rather than rendering nothing.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Where previewUrl() points. Keep in step with it. */
const PREFIX = "creative/v2";
const IMAGE_EXT = /\.(png|jpe?g|webp|avif)$/i;

/** Slugs with an example image in `landing/creative/v2`. Empty means unknown. */
export async function appsWithExamples(): Promise<Set<string>> {
  if (!SUPABASE_URL || !KEY) return new Set();
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/landing`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix: `${PREFIX}/`,
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return new Set();
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) return new Set();
    return new Set(
      rows
        .map((r) => (r && typeof r === "object" ? (r as { name?: unknown }).name : null))
        .filter((n): n is string => typeof n === "string" && IMAGE_EXT.test(n))
        // The list is scoped to the prefix, so names come back bare.
        .map((n) => n.replace(/^.*\//, "").replace(IMAGE_EXT, ""))
    );
  } catch {
    return new Set();
  }
}
