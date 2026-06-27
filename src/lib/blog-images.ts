/**
 * blog-images.ts — content-matched hero images for blog posts.
 *
 * Images are generated with Nano Banana Pro (server-side, via
 * /api/admin/generate-blog-images) and served from Supabase Storage
 * (landing/blog/<slug>.png). previewUrl is deterministic by slug.
 */

const SUPABASE_PUBLIC = "https://lwworujvfttxkrjfrgav.supabase.co/storage/v1/object/public/landing";

/** Public Supabase URL for a blog post's hero image. */
export function blogImageUrl(slug: string): string {
  return `${SUPABASE_PUBLIC}/blog/${slug}.png`;
}

const STYLE = "Editorial, clean, modern, high quality, soft natural lighting, no text or words, no watermark, 16:9.";

/**
 * Build a content-relevant image prompt from a post's title + category.
 * Picks a visual motif by topic so each image actually reflects the article
 * (a before/after restoration for "restore old photos", a clean cutout for
 * "remove background", a professional portrait for "headshot", etc.).
 */
export function deriveBlogPrompt(title: string, category: string): string {
  const t = `${title} ${category}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("old photo", "restore", "restoration", "vintage", "family memor", "damaged")) {
    return `A side-by-side before-and-after of an old family photograph in a wooden frame: the left side is faded, scratched and torn; the right side is fully restored, sharp and naturally colourised. ${STYLE}`;
  }
  if (has("remove background", "transparent", "white background", "cutout", "around hair", "passport")) {
    return `A studio product photo of a subject cleanly cut out from its background, shown on a transparent checkerboard pattern, crisp edges, professional e-commerce look. ${STYLE}`;
  }
  if (has("headshot", "linkedin", "profile picture", "corporate", "team", "selfie")) {
    return `A polished professional corporate headshot of a person against a soft neutral studio background, confident natural expression, flattering lighting. ${STYLE}`;
  }
  if (has("anime", "ai art", "wallpaper", "creative")) {
    return `A vibrant 4K digital artwork wallpaper, dreamy detailed illustration with rich colour and depth, gallery quality. ${STYLE}`;
  }
  if (has("product", "ecommerce", "e-commerce", "store", "amazon", "shopify")) {
    return `A bright, crisp e-commerce product photograph on a clean white studio background with soft shadows, catalogue quality. ${STYLE}`;
  }
  if (has("real estate", "property", "listing", "interior")) {
    return `A bright, sharp real-estate interior photograph of a tastefully furnished living room with large windows and natural daylight, wide-angle, magazine quality. ${STYLE}`;
  }
  if (has("background", "object", "remove object", "editor", "photoshop", "text prompt", "change background")) {
    return `A creative concept of AI photo editing: a portrait whose background transforms from a plain room into a beautiful sunset scene, split down the middle, modern and clean. ${STYLE}`;
  }
  if (has("wedding")) {
    return `A side-by-side before-and-after of a wedding photograph: left is soft and blurry, right is sharp, bright and beautifully enhanced. ${STYLE}`;
  }
  // Default: upscaling / enhancing / sharpening / resolution / clarity / unblur
  return `A side-by-side before-and-after comparison of a photograph split down the middle: the left half is blurry and low-resolution, the right half is sharp, detailed and high-resolution 4K. ${STYLE}`;
}
