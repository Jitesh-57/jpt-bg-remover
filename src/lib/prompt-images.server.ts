// Server-side bucket listing. Runs on Vercel (which can reach Supabase) at
// build/ISR time, so resolved image URLs ship inside the HTML instead of
// depending on a client fetch. Uses the service-role key when present so the
// listing is not subject to storage RLS; falls back to the anon key.
// Only imported by the server component, so the key never reaches the client.

import { BUCKET } from "@/lib/prompt-images";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif)$/i;

export async function listBucketImagesServer(): Promise<string[]> {
  if (!SUPABASE_URL || !KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(BUCKET)}`, {
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
