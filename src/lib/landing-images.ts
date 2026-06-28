// Public URLs for AI-generated landing images stored in the Supabase "landing" bucket.
// Built from NEXT_PUBLIC_SUPABASE_URL so we never hardcode the project ref.
// Files are populated once via GET /api/migrate-landing-images.

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/** Public URL for a file in the Supabase `landing` bucket (e.g. "hero.png"). */
export function landingImg(file: string): string {
  if (!SUPA) return "";
  return `${SUPA}/storage/v1/object/public/landing/${file}`;
}

// Per-tool landing page showcase images, keyed by pageId.
export const PAGE_IMAGES: Record<string, string> = {
  "remove-bg": landingImg("page-remove-bg.png"),
  upscale: landingImg("page-upscale.png"),
  "ai-editor": landingImg("page-ai-editor.png"),
  headshot: landingImg("page-ai-headshot.png"),
};

// Before/after pairs for split-view showcases (Supabase Storage).
export const PAGE_BEFORE_AFTER: Record<string, { before: string; after: string }> = {
  upscale: {
    before: landingImg("upscale-before.jpg"),
    after: landingImg("upscale-after.jpg"),
  },
};
