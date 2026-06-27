/**
 * headshot-thumbs.ts — preview thumbnails for each AI Headshot style.
 *
 * One thumbnail per style (men + women), generated with Nano Banana Pro using
 * the style's own prompt (with a generic model instead of a reference photo)
 * and served from Supabase Storage (landing/headshot/<gender>-<id>.png).
 */

const SUPABASE_PUBLIC = "https://lwworujvfttxkrjfrgav.supabase.co/storage/v1/object/public/landing";

export type HeadshotGender = "men" | "women";

/** Public Supabase URL for a style's thumbnail. */
export function headshotThumbUrl(gender: HeadshotGender, id: number): string {
  return `${SUPABASE_PUBLIC}/headshot/${gender}-${id}.png`;
}

/** Turn a style's reference-photo prompt into a standalone text-to-image prompt. */
export function deriveHeadshotThumbPrompt(prompt: string, gender: HeadshotGender): string {
  const subject = gender === "men" ? "a professional male model" : "a professional female model";
  const base = prompt.replace(/the person from the reference photo/gi, subject);
  return `Studio headshot photograph of ${subject} — a fictional, generic person (not a real identity), realistic and photorealistic. ${base}`;
}
