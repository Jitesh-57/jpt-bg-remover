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

  // ── Creative app before/after prompts ──────────────────────────────────────
  if (has("funko pop")) {
    return `A dramatic before-and-after split image: left half shows an ordinary smartphone selfie of a smiling young adult in casual colourful clothes against a plain wall; right half shows the same person transformed into a hyper-realistic Funko Pop vinyl collectible figure inside a retail collector box, sharp product-photography detail, glossy plastic texture. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("glow up")) {
    return `A striking before-and-after portrait split down the middle: left half shows a dim, flat, slightly tired-looking selfie with dull lighting; right half shows the same person radiant and polished — glowing skin, warm professional lighting, vibrant editorial colour grade. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("comic book")) {
    return `A vivid before-and-after split image: left half shows an ordinary portrait photograph of a young adult; right half shows the same person transformed into a bold comic book illustration — thick ink outlines, cel-shading, dramatic superhero lighting, vivid colours. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("coastal cowgirl")) {
    return `A beautiful before-and-after lifestyle photo split: left half shows a plain indoor selfie of a young woman in casual clothes; right half shows the same woman styled in the coastal cowgirl aesthetic — sun-bleached hair, straw cowboy hat, golden beach sunset background, warm sandy colour palette. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("astronaut")) {
    return `A stunning before-and-after split image: left half shows an ordinary selfie of a smiling young adult against a plain wall; right half shows the same person transformed into a NASA astronaut portrait — full spacesuit, helmet with visor reflection, deep space and Earth's curve in the background, dramatic studio lighting. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("old hollywood", "glamour")) {
    return `A dramatic before-and-after portrait split: left half shows a modern casual colour photograph of a young woman; right half shows the same person transformed into an Old Hollywood glamour portrait — Rembrandt lighting, silver-screen aesthetic, fine film grain, deep velvet shadows, timeless black-and-white elegance. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("prom")) {
    return `A beautiful before-and-after portrait split: left half shows a casual selfie of a teenager in everyday clothes; right half shows the same person transformed into a stunning prom portrait — elegant formal gown, soft flattering studio lighting, romantic bokeh background with fairy lights. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("claymation", "clay")) {
    return `A charming before-and-after split image: left half shows an ordinary smartphone selfie of a young adult; right half shows the same person transformed into a clay-sculpted claymation character — smooth clay texture, vivid saturated colours, tactile handmade quality reminiscent of stop-motion animation. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("pixel art", "pixel")) {
    return `A fun before-and-after split image: left half shows a regular portrait photograph of a young adult; right half shows the same person rendered as a detailed pixel art avatar — classic 8-bit retro game aesthetic, cohesive colour palette, recognisable likeness in pixel form. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("thanksgiving")) {
    return `A warm before-and-after portrait split: left half shows an ordinary casual photo of a person in everyday clothes; right half shows the same person in a cosy Thanksgiving setting — autumn leaves, warm golden light, festive seasonal styling, harvest decorations in the background. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("saree")) {
    return `A vibrant before-and-after portrait split: left half shows a simple selfie of a young woman in casual Western clothing; right half shows the same woman beautifully styled in a rich silk saree with traditional Indian jewellery, studio lighting, elegant backdrop. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("anime")) {
    return `A striking before-and-after split image: left half shows a regular portrait photograph of a young person; right half shows the same person transformed into a high-quality anime illustration — large expressive eyes, clean ink lines, vivid cel-shading, vibrant Studio Ghibli-inspired colour palette. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("couple")) {
    return `A romantic before-and-after portrait split: left half shows two individual casual selfies of a man and woman; right half shows both people composed together in a professional couple portrait with golden-hour sunset lighting, natural body language, warm romantic colour grade. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("bollywood", "retro")) {
    return `A nostalgic before-and-after photo split: left half shows a plain modern digital photograph of a person; right half shows the same photo transformed with a warm retro Bollywood film aesthetic — golden amber colour grade, fine film grain, soft diffusion, high contrast, 1970s Indian cinema look. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("figurine", "3d figure", "action figure")) {
    return `A fascinating before-and-after split image: left half shows an ordinary selfie of a young adult; right half shows the same person transformed into a photorealistic 3D collectible action figure — plastic texture, display base, blister packaging, sharp product-photography studio lighting. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }
  if (has("festival", "holi", "diwali")) {
    return `A vibrant before-and-after portrait split: left half shows a plain selfie of a smiling young woman; right half shows the same woman in a joyful festival scene — Holi powder colours flying, vivid magenta and yellow, celebratory energy, warm festival lighting. Bold BEFORE and AFTER label badges. ${STYLE}`;
  }

  // ── Upscale / enhance specific prompts ────────────────────────────────────
  if (has("print", "printing", "large format", "canvas")) {
    return `A clean before-and-after demonstration: left half shows a small pixelated photo that looks poor when enlarged; right half shows the same image upscaled to crisp 4K print quality with sharp detail, fine texture and rich colour, ready for large-format printing. ${STYLE}`;
  }
  if (has("free", "unlimited", "no sign", "no account", "no download")) {
    return `A bright, clean concept image of AI photo enhancement: a smartphone screen showing a blurry photo on the left transforming into a sharp, clear, enhanced version on the right, with a clean user interface and 'Free' label, modern minimal design. ${STYLE}`;
  }
  if (has("comparison", "before and after", "before after", "result")) {
    return `A professional side-by-side comparison of AI image upscaling: left half shows a zoomed-in blurry low-resolution photo with pixelation visible; right half shows the same photo after AI super-resolution — crisp edges, fine texture, detailed skin and hair, dramatically sharper. ${STYLE}`;
  }

  // ── Existing topic rules ───────────────────────────────────────────────────
  if (has("old photo", "restore", "restoration", "vintage", "family memor", "damaged")) {
    return `A side-by-side before-and-after of an old family photograph in a wooden frame: the left side is faded, scratched and torn; the right side is fully restored, sharp and naturally colourised. ${STYLE}`;
  }
  if (has("remove background", "transparent", "white background", "cutout", "around hair", "passport")) {
    return `A studio product photo of a subject cleanly cut out from its background, shown on a transparent checkerboard pattern, crisp edges, professional e-commerce look. ${STYLE}`;
  }
  if (has("headshot", "linkedin", "profile picture", "corporate", "team", "selfie")) {
    return `A polished professional corporate headshot of a person against a soft neutral studio background, confident natural expression, flattering lighting. ${STYLE}`;
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
  if (has("creative")) {
    return `A vibrant 4K digital artwork: a before-and-after split showing an ordinary photo on the left transforming into a stunning AI-generated creative portrait on the right, rich colour and dramatic lighting. ${STYLE}`;
  }
  // Default: upscaling / enhancing / sharpening / resolution / clarity / unblur
  return `A side-by-side before-and-after comparison of a photograph split down the middle: the left half is blurry and low-resolution, the right half is sharp, detailed and high-resolution 4K. ${STYLE}`;
}
