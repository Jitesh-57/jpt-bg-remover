/**
 * image-jobs.ts — every image slot on the site, as a generatable job.
 *
 * docs/image-slots.md lists what each page looks for. This turns that list
 * into jobs the admin route can run: a bucket, a path, an aspect ratio and a
 * prompt. Nothing here calls a model — it only describes what to make.
 *
 * The paths must match what the pages actually request, so they are derived
 * from the same modules the pages use rather than retyped.
 */

import { CREATIVE_APPS, type CreativeApp } from "@/lib/creative-apps";
import { CAT_META, type AppCat } from "@/lib/app-catalog";
import { presetsFor, PRESET_IMAGE_BUCKET } from "@/lib/app-presets";
import { CONVERSIONS, buildContent } from "@/lib/conversions";
import { FAL_ASPECT_RATIOS } from "@/lib/fal";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";

export type JobSet = "sources" | "home" | "tools" | "apps" | "presets" | "samples" | "programmatic" | "social";

export interface ImageJob {
  /** Which batch this belongs to. */
  set: JobSet;
  /** Supabase bucket name. */
  bucket: string;
  /** Path inside the bucket, including the extension. */
  path: string;
  /** Aspect ratio. Must be one of FAL_ASPECT_RATIOS. */
  aspect: string;
  prompt: string;
  /**
   * When set, this job is an *edit* of that source image rather than a fresh
   * generation, and `prompt` is sent to the model exactly as written.
   *
   * This is what makes an app's card show what the app actually does. Asking a
   * text-to-image model to imagine a before/after produces its guess at the
   * result; running the app's own prompt over a real photo produces the
   * result. The source is a path in the `landing` bucket, generated once by
   * the "sources" set.
   */
  editOf?: string;
  /**
   * A source to use when `editOf` does not exist.
   *
   * Six of the twelve sources are refused by fal's content checker and Gemini
   * is out of quota, which left roughly forty app cards unable to be built at
   * all. A near-enough substitute that does exist is worth far more than a
   * blank card: a try-on filter demonstrated on the clean portrait rather than
   * the plain one loses nothing a visitor would notice.
   */
  editOfFallback?: string;
}

const LANDING = "landing";
const BLOGS = "Blogs";

/** Shared tail: these creatives are UI illustration, not art. */
const STYLE =
  "Photorealistic, clean, modern, soft even lighting, uncluttered composition, no text, no words, no lettering, no watermark, no logos, no UI chrome.";

/**
 * A two-panel comparison — the shape every before/after slot wants.
 *
 * Two deliberate choices here:
 *
 * The panels are never asked to carry "BEFORE" / "AFTER" text. Generated
 * lettering is the least reliable thing these models do, and a misspelled
 * badge burned into 200 images cannot be fixed without regenerating all of
 * them. The labels are drawn over the image in HTML instead, where they are
 * crisp, translatable and free.
 *
 * The split follows the slot's shape. A left/right split inside a 4:5 card
 * gives two panels about 125px wide on the homepage grid, which is too narrow
 * to read either half — so tall slots stack top and bottom instead.
 */
function beforeAfter(before: string, after: string, aspect = "16:9"): string {
  const tall = aspect === "4:5" || aspect === "3:4" || aspect === "9:16";
  const geometry = tall
    ? `A single image divided into two equal halves stacked vertically, separated by a thin clean light divider line across the middle.
Top half: ${before}
Bottom half: the SAME subject after the change — ${after}`
    : `A single image divided into two equal halves side by side, separated by a thin clean light divider line down the middle.
Left half: ${before}
Right half: the SAME subject after the change — ${after}`;
  return `${geometry}
Both halves must clearly show the same subject from the same angle, so the difference reads as one change rather than two unrelated photos. Absolutely no text, letters, numbers, badges, labels or captions anywhere in the image. ${STYLE}`;
}

/* ── 0. source photographs ──────────────────────────────────────────────── */

/**
 * The real input photos every app card is built from.
 *
 * Twelve of these, generated once. Each is a deliberately ordinary photograph
 * — the kind of picture someone would actually upload — because it is the
 * "before" half of every comparison that uses it, and a before that looks
 * professionally shot makes the after look like it did nothing.
 */
const SOURCE_SUBJECTS: Record<string, string> = {
  // Faces, front-facing and unobstructed — the input the filter and try-on
  // tools need. Four of them, deliberately different people, because these
  // cover roughly fifty app cards between them.
  "face-1": "A clear front-facing smartphone portrait of a South Asian woman in her twenties against a plain pale wall in even daylight. No glasses, no hat, no jewellery, neutral expression, hair simple and tidy. An ordinary photo, well lit but completely unstyled.",
  "face-2": "A clear front-facing smartphone portrait of a Black man in his thirties with short hair and a clean-shaven face, against a plain light grey wall in even indoor light. No glasses or accessories, relaxed neutral expression. An ordinary unstyled phone photo.",
  "face-3": "A clear front-facing smartphone portrait of an East Asian woman in her thirties against a plain white wall in soft window light. Shoulder-length hair, no accessories, gentle neutral expression. Plain and unretouched.",
  "face-4": "A clear front-facing smartphone portrait of a white man in his forties with short greying hair, against a plain beige wall in flat ceiling light. No glasses, no hat, neutral expression, nothing styled about the photo.",

  // Ordinary head-and-shoulders snapshots — the generic "before".
  "plain-1": "A plain, ordinary phone photograph of a smiling South Asian man in his thirties in a simple t-shirt against a blank magnolia wall. Flat, uneven indoor ceiling light. Whole face clearly visible and front-facing. It must look like a real everyday phone photo: slightly soft, unstyled, no retouching.",
  "plain-2": "A plain, ordinary phone photograph of a Latina woman in her twenties in a plain sweatshirt against a bare white wall, taken at arm's length. Uneven flat indoor light, slightly off-centre framing, no retouching.",
  "plain-3": "A plain, ordinary phone photograph of a Middle Eastern man in his twenties in a plain shirt, standing in front of a bare painted wall in a hallway. Flat light, slightly soft focus, completely unstyled.",

  // Full-length, for body, outfit and fashion tools.
  "body-1": "An ordinary smartphone photograph of a South Asian man in his thirties standing square to camera in a plain fitted t-shirt and jeans, in an undecorated room with a bare wall behind. Flat indoor light, full body in frame.",
  "body-2": "An ordinary smartphone photograph of a Black woman in her twenties standing square to camera in plain everyday jeans and a plain top, against a bare wall in a plain room. Flat indoor light, full body in frame.",
  "body-3": "An ordinary smartphone photograph of a white woman in her thirties standing full length in a simple plain dress against a blank wall, flat uneven indoor light, nothing styled.",

  // Badly lit snapshots — the ones the mood, colour and enhance tools fix.
  "dim-1": "An ordinary smartphone snapshot of a South Asian woman in her thirties standing in a dim hallway in everyday clothes. Underexposed, slight motion softness, a warm yellow cast from a ceiling bulb. Clearly an unedited phone photo.",
  "dim-2": "An ordinary smartphone snapshot of a young man standing outdoors on an overcast afternoon in a plain jacket, flat grey light, dull washed-out colour, a cluttered street behind him.",
  "dim-3": "An ordinary smartphone snapshot of a woman in her twenties sitting at a table in a dimly lit room, harsh direct flash from the phone, hard shadow on the wall behind her.",

  // More than one person.
  "couple-1": "An ordinary smartphone snapshot of two friends in their thirties standing side by side in everyday clothes against a plain wall, flat indoor light, both faces clearly visible, slightly awkward framing.",
  "couple-2": "An ordinary smartphone snapshot of a young couple standing close together outdoors in front of a plain garden fence on a dull day, everyday clothes, flat light, both faces clearly visible.",
  "family-1": "An ordinary smartphone snapshot of three family members standing in a row in a plain living room in everyday clothes, flat ceiling light, slightly crooked framing, all faces visible.",
  "baby-1": "An ordinary snapshot of a baby sitting on a plain rug in a living room, flat indoor light, slightly awkward framing, nothing styled.",

  // Animals.
  "pet-dog": "An ordinary snapshot of a friendly dog sitting on a living-room floor, photographed from standing height in flat indoor light. Cluttered domestic background, nothing styled.",
  "pet-cat": "An ordinary snapshot of a cat sitting on a kitchen chair, photographed from standing height under yellow ceiling light, cluttered domestic background.",

  // Objects, for the e-commerce and product tools. Four different categories,
  // so a headphone photo does not end up standing in for a bottle of serum.
  "product-headphones": "A pair of over-ear headphones photographed on a cluttered domestic kitchen worktop under yellow overhead lighting. Crumbs and household objects visible behind them. An honest, unstyled phone photo.",
  "product-bottle": "A single skincare bottle photographed on a bathroom shelf under warm domestic lighting, other bottles and clutter visible behind it, slightly soft focus.",
  "product-shoe": "A single running shoe photographed on a wooden floor beside a skirting board in dull daylight, dust and a cable visible nearby, unstyled phone photo.",
  "product-watch": "A wristwatch photographed lying on a cluttered desk under yellow lamplight, papers and a mug edge in frame, slightly soft focus.",

  // Vehicles.
  "car-hatchback": "A used hatchback car photographed in a residential driveway on a dull overcast day. Wheelie bins and a fence visible behind it, puddles on the tarmac, flat grey light.",
  "car-suv": "A dusty SUV photographed in a supermarket car park on a grey day, other cars and a trolley bay visible behind it, flat dull light.",
  "bike-motorcycle": "A motorcycle photographed in a plain concrete car park on a dull day, clutter and a wall behind it, flat grey light.",
  "truck-pickup": "A working pickup truck photographed on a gravel yard on an overcast day, a fence and stacked pallets behind it, flat light and dull colour.",

  // Small valuables.
  "jewellery-ring": "A gold ring photographed on a kitchen worktop under warm yellow domestic lighting, slightly out of focus, dust visible on the metal, cluttered surface.",
  "jewellery-necklace": "A silver necklace photographed lying on a dark wooden table under warm domestic lighting, tangled slightly, dust visible, cluttered surface.",

  // Places and food.
  "room-living": "A living room photographed on a phone in dull daylight: uneven exposure, a cluttered coffee table, a crooked horizon and a washed-out window.",
  "room-kitchen": "A domestic kitchen photographed on a phone under yellow ceiling light: cluttered worktops, uneven exposure, dull colour and a slightly tilted frame.",
  "food-plate": "A plated meal photographed on a restaurant table under dim yellow light, cutlery and a glass crowding the frame, dull colour and a shadow across the plate.",

  // Damaged and low-quality inputs.
  "old-print-1": "A photograph of an old damaged printed family photo lying on a table: colours faded towards magenta, a crease across one corner, surface scratches, dust and worn edges. Shot flat from above.",
  "old-print-2": "A photograph of an old black-and-white printed portrait lying on a table: yellowed, foxed at the edges, a tear across the lower corner, dust and fine scratches across the surface. Shot flat from above.",
  "lowres-1": "A deliberately low-resolution, soft and slightly pixelated photograph of a man's face, head and shoulders against a plain background. It must clearly read as a small image that has been enlarged far past its real size.",
  "lowres-2": "A deliberately low-resolution, blurry and noisy photograph of a woman's face against a plain wall, visibly compressed and enlarged far past its real size, soft edges and blocky detail.",
};

/**
 * The apps that take no input photo.
 *
 * A before/after split would misrepresent these — there is no "before" — so
 * they get a single example of what the tool produces instead.
 *
 * This is an explicit list rather than a pattern, because both patterns I
 * tried were wrong in both directions. Matching the slug put "comic-book-cover"
 * in here on account of "book-cover", when it is very much photo-based.
 * Matching the prompt for a demonstrative missed the removal tools and caught
 * the profile-picture makers, whose prompts happen not to say "this" even
 * though a user uploads a photo to every one of them. The list below was read
 * off the 200 prompts by hand; anything not named here gets a before/after.
 */
const NO_INPUT_PHOTO = new Set([
  "text-to-emoji",
  "birth-flower-tattoo",
  "album-cover-generator",
  "movie-poster-generator",
  "book-cover-generator",
  "logo-maker",
  "gaming-logo-maker",
  "icon-generator",
  "ai-character-generator",
  "linkedin-banner-maker",
]);

/** Public URL of a source photo in the landing bucket. */
export function sourceImageUrl(name: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/landing/sources/${name}.png`;
}

const SOURCES: ImageJob[] = Object.entries(SOURCE_SUBJECTS).map(([name, prompt]) => ({
  set: "sources" as const,
  bucket: LANDING,
  path: `sources/${name}.png`,
  aspect: "4:5",
  prompt: `${prompt} No text, letters or numbers anywhere in the image. ${STYLE}`,
}));

/**
 * Source groups, keyed by what kind of photo an app needs.
 *
 * The point of the groups is variety. One source per kind meant the same
 * stock-looking man appeared on forty different app cards, which made the
 * catalogue read as one tool repeated rather than two hundred. Every group now
 * holds several genuinely different subjects and an app is assigned one by a
 * hash of its slug, so the assignment is stable — the app page shows the same
 * "before" as the card — while neighbouring apps in the grid get different
 * people, ages and settings.
 */
const SOURCE_GROUPS: Record<string, string[]> = {
  face: ["face-1", "face-2", "face-3", "face-4"],
  plain: ["plain-1", "plain-2", "plain-3", "face-1", "face-2"],
  body: ["body-1", "body-2", "body-3"],
  dim: ["dim-1", "dim-2", "dim-3", "plain-2"],
  group: ["couple-1", "couple-2", "family-1"],
  baby: ["baby-1"],
  pet: ["pet-dog", "pet-cat"],
  product: ["product-headphones", "product-bottle", "product-shoe", "product-watch"],
  vehicle: ["car-hatchback", "car-suv", "bike-motorcycle", "truck-pickup"],
  jewellery: ["jewellery-ring", "jewellery-necklace"],
  place: ["room-living", "room-kitchen"],
  food: ["food-plate"],
  restore: ["old-print-1", "old-print-2"],
  lowres: ["lowres-1", "lowres-2"],
};

/** Which group an app's card should be built from. First match wins. */
const SOURCE_RULES: [RegExp, keyof typeof SOURCE_GROUPS][] = [
  [/unpixelate|unblur|upscal|enlarge|sharpen|denoise|hd-photo|4k|image-enlarger/, "lowres"],
  [/old-photo|restoration|colorize|colourise|black-and-white|yearbook|ancestor/, "restore"],
  [/piercing|beard|glasses|braces|hairstyle|hair-color|bangs|curly|blonde|bald|buzz-cut|long-hair|eyebrow|eye-color|smile|expression|baby-face|no-beard|teeth|freckle|makeup|lipstick|passport|visa|\bid\b|headshot|profile-pic|linkedin/, "face"],
  [/baby|toddler|kid|newborn/, "baby"],
  [/couple|wedding|anniversary|engagement|family|group|baby-predictor|reunion/, "group"],
  [/muscle|\babs\b|six-pack|body-editor|fitness|gym|skinny|slim|outfit|dress|saree|suit|fashion|apparel|clothing|try-on|tattoo/, "body"],
  [/\bpet|dog|cat\b|puppy|kitten/, "pet"],
  [/\bcar\b|automotive|dealer|vehicle|bike|motorcycle|truck|license-plate/, "vehicle"],
  [/jewel|ring|necklace|watch-photo/, "jewellery"],
  [/food|restaurant|menu|dish|cafe|bakery/, "food"],
  [/real-estate|house|property|interior|room|home-decor|hotel|architect|airbnb/, "place"],
  [/product|amazon|ecommerce|shopify|ebay|magento|woocommerce|beauty|electronics|gadget|png-maker|white-background|background-remover|shoe|sneaker|bottle|furniture/, "product"],
  [/aesthetic|photoshoot|selfie|travel|instagram|facebook|birthday|festival|christmas|diwali|halloween|graduation|prom|thanksgiving|maternity|retro|vintage|filter/, "dim"],
];

/** FNV-1a, so the choice within a group is stable across builds. */
function hashSlug(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function groupFor(app: CreativeApp): keyof typeof SOURCE_GROUPS {
  const hay = `${app.slug} ${app.h1}`.toLowerCase();
  for (const [re, g] of SOURCE_RULES) if (re.test(hay)) return g;
  return "plain";
}

/** The source photo an app's creative is built from — exported so the app page
 * can show that same photo as the "before" beside the generated result. */
export function sourceFor(app: CreativeApp): string {
  const pool = SOURCE_GROUPS[groupFor(app)];
  return pool[hashSlug(app.slug) % pool.length];
}

/**
 * Substitute when an app's assigned source cannot be generated.
 *
 * The next member of the same group, so a refused photo is replaced by one of
 * the same kind rather than by something unrelated. Single-member groups fall
 * back to a clear face, which is the safest generic "before".
 */
function fallbackFor(app: CreativeApp): string | undefined {
  const pool = SOURCE_GROUPS[groupFor(app)];
  if (pool.length < 2) return "face-1";
  const i = hashSlug(app.slug) % pool.length;
  return pool[(i + 1) % pool.length];
}

/* ── 1. homepage ────────────────────────────────────────────────────────── */

const HOME: ImageJob[] = [
  {
    set: "home", bucket: LANDING, path: "home-hero.png", aspect: "21:9",
    prompt: beforeAfter(
      "a plain smartphone selfie of a smiling person in casual clothes against a blank beige wall, flat indoor lighting",
      "the same person as a polished studio portrait: tailored clothing, soft key light with a gentle fill, a clean dark neutral backdrop, confident relaxed expression",
      "21:9"
    ),
  },
  {
    set: "home", bucket: LANDING, path: "home-step-1.png", aspect: "16:9",
    prompt: `A photograph being dropped onto a large empty upload area on a dark desk surface: a single printed photo mid-air above a softly glowing rounded rectangle outline, a hand just releasing it. Warm accent light in deep orange. ${STYLE}`,
  },
  {
    set: "home", bucket: LANDING, path: "home-step-2.png", aspect: "16:9",
    prompt: `A neat grid of nine small portrait thumbnails on a dark surface, each showing the same person in a different photographic style — studio, outdoor, formal, casual — with one thumbnail clearly highlighted by a deep orange border. ${STYLE}`,
  },
  {
    set: "home", bucket: LANDING, path: "home-step-3.png", aspect: "16:9",
    prompt: `A finished high-resolution portrait print resting on a dark desk beside a phone showing the same image, lit warmly, nothing overlaid on the print, clean and uncluttered. ${STYLE}`,
  },
];

/* ── 2. tool landing pages ──────────────────────────────────────────────── */

const TOOLS: ImageJob[] = [
  { set: "tools", bucket: LANDING, path: "page-remove-bg.png", aspect: "16:9",
    prompt: beforeAfter(
      "a pair of running shoes photographed on a cluttered kitchen worktop with background distractions",
      "the same shoes on a pure white seamless background with a soft contact shadow beneath them, centred with even margins") },

  { set: "tools", bucket: LANDING, path: "page-upscale.png", aspect: "16:9",
    prompt: beforeAfter(
      "a small, soft, slightly pixelated portrait photograph, visibly low resolution",
      "the same portrait sharp and detailed, with clear skin texture and individual strands of hair resolved") },

  { set: "tools", bucket: LANDING, path: "page-ai-editor.png", aspect: "16:9",
    prompt: beforeAfter(
      "a plain photo of a person standing in a dim hallway",
      "the same person in the same pose, now outdoors at golden hour with warm low sun rimming the hair and a softly blurred park behind") },

  { set: "tools", bucket: LANDING, path: "page-ai-headshot.png", aspect: "16:9",
    prompt: beforeAfter(
      "a casual selfie of a person in a t-shirt taken at arm's length against a bedroom wall",
      "the same person as a corporate headshot: charcoal suit, white shirt, neutral grey studio backdrop, even professional lighting") },

  // The upscale page shows two separate frames rather than one split image.
  { set: "tools", bucket: LANDING, path: "upscale-before.jpg", aspect: "16:9",
    prompt: `A deliberately low-resolution, soft, slightly pixelated photograph of a person's face, framed head and shoulders against a plain background — it must read as a small image that has been enlarged too far. ${STYLE}` },
  { set: "tools", bucket: LANDING, path: "upscale-after.jpg", aspect: "16:9",
    prompt: `A very sharp, high-resolution photograph of a person's face, framed head and shoulders against a plain background, with crisp skin texture, visible individual eyelashes and clearly resolved hair strands. Same framing and composition as a standard head-and-shoulders portrait. ${STYLE}` },

  { set: "tools", bucket: LANDING, path: "image-compressor-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a photograph of a coastal landscape shown large and heavy, with a small stack of storage drives beside it suggesting a very large file",
      "the same landscape photograph looking identical in quality but paired with a single small storage chip, suggesting a far smaller file") },

  { set: "tools", bucket: LANDING, path: "image-converter-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a photograph of a bicycle against a brick wall, shown as a flat rectangular photo print",
      "the same bicycle photograph but cut out onto a transparent checkerboard background, edges clean around the spokes") },

  { set: "tools", bucket: LANDING, path: "image-cropper-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a wide photograph of a person standing off to one side with a lot of empty space around them",
      "the same photograph cropped tight and square, the person centred and filling the frame") },

  { set: "tools", bucket: LANDING, path: "image-resizer-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a very large photographic print of a city street laid on a desk, extending past the edges of the frame",
      "the same city street photograph as a small, neat, perfectly proportioned print sitting squarely on the same desk") },

  { set: "tools", bucket: LANDING, path: "rotate-flip-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a photograph of a lighthouse lying on its side, rotated ninety degrees the wrong way",
      "the same lighthouse photograph upright and correctly oriented, horizon level") },

  { set: "tools", bucket: LANDING, path: "add-text-watermark-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a clean photograph of a plated dish on a wooden table with nothing over it",
      "the same photograph with a subtle semi-transparent diagonal watermark pattern of simple abstract marks across it, evenly spaced and unobtrusive") },

  { set: "tools", bucket: LANDING, path: "meme-generator-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a plain photograph of a surprised-looking cat on a sofa",
      "the same photograph with thick empty white caption bars added above and below the image, ready for text but containing none") },

  { set: "tools", bucket: LANDING, path: "photo-to-pdf-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "three loose photographic prints scattered untidily on a dark desk",
      "the same three photographs neatly stacked as pages of a bound document, squared up and aligned") },

  { set: "tools", bucket: LANDING, path: "tiktok-watermark-remover-hero.png", aspect: "16:9",
    prompt: beforeAfter(
      "a phone held in a hand showing a vertical video of a dancer, with a small semi-transparent abstract mark in the corner of the video",
      "the same phone and the same video frame, completely clean with no mark in any corner") },

  // Standalone pages (Blogs bucket)
  { set: "tools", bucket: BLOGS, path: "blur-image-before-after.png", aspect: "16:9",
    prompt: beforeAfter(
      "a photograph of two people standing beside a parked car, faces and the car's plate clearly visible",
      "the same photograph with the faces and the plate cleanly blurred out, everything else untouched and sharp") },

  { set: "tools", bucket: BLOGS, path: "qr-code-generator-showcase.png", aspect: "16:9",
    prompt: `A crisp black-and-white QR code printed on a white card resting on a dark desk beside a phone whose camera is pointed at it. The QR code must be a plausible dense square QR pattern. No text anywhere. ${STYLE}` },
];

// The watermark-remover page shows four separate before/after pairs.
const WATERMARK_CASES: { before: string; after: string }[] = [
  { before: "a product photograph of a ceramic mug on a pale surface with a faint translucent overlay of abstract geometric shapes across the centre",
    after: "the same mug photograph completely clean, the surface behind it fully rebuilt with no trace of the overlay" },
  { before: "a photograph of a mountain lake with a faint translucent panel of abstract shapes and a small orange numeric stamp in the lower corner",
    after: "the same lake photograph with the corner entirely clean, water and sky continuing naturally" },
  { before: "a stock-style photograph of a person working at a laptop, covered by a large faint repeating diagonal pattern of abstract translucent shapes",
    after: "the same photograph with the pattern entirely removed and full detail restored" },
  { before: "a photograph of a painted canvas with a small handwritten-looking squiggle in the lower right corner",
    after: "the same canvas photograph with the corner clean, the paint texture continuing through where the squiggle was" },
];
WATERMARK_CASES.forEach((c, i) => {
  TOOLS.push(
    { set: "tools", bucket: BLOGS, path: `watermark-before-${i + 1}.png`, aspect: "4:3",
      prompt: `${c.before}. Photographic, clean composition. No text anywhere in the image. ${STYLE}` },
    { set: "tools", bucket: BLOGS, path: `watermark-after-${i + 1}.png`, aspect: "4:3",
      prompt: `${c.after}. Photographic, clean composition, identical framing to the version that still had the mark. No text anywhere in the image. ${STYLE}` },
  );
});

/* ── 3. the 200 app cards ───────────────────────────────────────────────── */

const APPS: ImageJob[] = CREATIVE_APPS.map((a) => {
  const noInput = NO_INPUT_PHOTO.has(a.slug);
  return {
    set: "apps" as const,
    bucket: LANDING,
    // v2/: see previewUrl() — the old folder holds stale collages that the
    // generator would otherwise treat as already done.
    path: `creative/v2/${a.slug}.png`,
    // 4:5 portrait: the card on the homepage and the hub, and the "after" on
    // the app's own page, where the source photo sits beside it.
    aspect: "4:5",
    // The app's own prompt, unchanged — so the image is the tool's real output
    // rather than a model's impression of it.
    prompt: noInput
      ? `A single finished example of exactly what this tool produces: ${a.prompt} Presented cleanly and centred, filling the frame, as a portfolio example. No text, letters or numbers anywhere in the image. ${STYLE}`
      : a.prompt,
    ...(noInput
      ? {}
      : (() => {
          const src = sourceFor(a);
          const alt = fallbackFor(a);
          return {
            editOf: `sources/${src}.png`,
            ...(alt ? { editOfFallback: `sources/${alt}.png` } : {}),
          };
        })()),
  };
});

/* ── 4. preset thumbnails, one set per category ─────────────────────────── */

/**
 * `<category>__<preset-id>.png` covers every app in that category, which is
 * 74 files instead of the 1,200 that per-app thumbnails would need.
 */
/**
 * Who or what a preset thumbnail shows.
 *
 * "a person" for every people-facing thumbnail meant a category's six tiles
 * were six pictures of the same invented model, and the grid read as one photo
 * recoloured six times. Rotating through these by a hash of the filename keeps
 * each tile stable between runs while making the row look like six examples.
 */
const THUMB_PEOPLE = [
  "a South Asian woman in her twenties",
  "a Black man in his thirties",
  "an East Asian woman in her thirties",
  "a white man in his forties",
  "a Latina woman in her thirties",
  "a Middle Eastern man in his twenties",
];

const THUMB_PRODUCTS = [
  "a single pair of over-ear headphones",
  "a single skincare bottle",
  "a single running shoe",
  "a single wristwatch",
];

/** A stable subject for a thumbnail, varied by its filename. */
function thumbSubject(cat: string | undefined, file: string): string {
  const h = hashSlug(file);
  if (cat === "product") return THUMB_PRODUCTS[h % THUMB_PRODUCTS.length];
  if (cat === "restore") return "an old family photograph";
  if (cat === "remove") return "a photograph with unwanted objects removed";
  if (cat === "enhance") return "a sharp, detailed photograph";
  return THUMB_PEOPLE[h % THUMB_PEOPLE.length];
}

const PRESETS: ImageJob[] = (() => {
  const out: ImageJob[] = [];
  const seen = new Set<string>();
  for (const app of CREATIVE_APPS) {
    const cat = app.cat;
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    for (const p of presetsFor(app, "solo")) {
      const subject = thumbSubject(cat, `${cat}__${p.id}`);
      out.push({
        set: "presets", bucket: PRESET_IMAGE_BUCKET, path: `${cat}__${p.id}.png`, aspect: "3:4",
        prompt: `A small thumbnail example of ${subject}, shown in this exact treatment: ${p.modifier} It must read instantly as an example of "${p.label}" for ${CAT_META[cat as AppCat]?.label ?? cat}. Single subject, tightly framed, no borders. ${STYLE}`,
      });
    }
  }

  // The 42 hand-written apps carry no category, so they fall back to either a
  // per-slug override or the generic framing set. Both still need thumbnails,
  // or those apps show an empty preset grid.
  const generic = CREATIVE_APPS.find((a) => !a.cat);
  if (generic) {
    for (const p of presetsFor(generic, "solo")) {
      out.push({
        set: "presets", bucket: PRESET_IMAGE_BUCKET, path: `preset__${p.id}.png`, aspect: "3:4",
        prompt: `A small thumbnail example of ${thumbSubject(undefined, `preset__${p.id}`)} photographed in this exact treatment: ${p.modifier} It must read instantly as an example of "${p.label}". Single subject, tightly framed, no borders. ${STYLE}`,
      });
    }
  }
  for (const slug of ["passport-photo", "professional-headshot"]) {
    const app = CREATIVE_APPS.find((a) => a.slug === slug);
    if (!app) continue;
    for (const p of presetsFor(app, "solo")) {
      out.push({
        set: "presets", bucket: PRESET_IMAGE_BUCKET, path: `${slug}__${p.id}.png`, aspect: "3:4",
        prompt: `A small thumbnail example of ${thumbSubject(undefined, `${slug}__${p.id}`)} photographed in this exact treatment: ${p.modifier} It must read instantly as an example of "${p.label}". Single subject, tightly framed, no borders. ${STYLE}`,
      });
    }
  }
  return out;
})();

/* ── 5. sample photos users can try without uploading ───────────────────── */

const SAMPLES: ImageJob[] = [
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample1.png", aspect: "3:4",
    prompt: `An ordinary, honest smartphone portrait of a smiling South Asian woman in her twenties in a plain top against a blank light wall, even flat indoor light, whole face clearly visible and front-facing. It should look like a real everyday selfie, not a professional photo. ${STYLE}` },
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample2.png", aspect: "3:4",
    prompt: `An ordinary, honest smartphone portrait of a smiling Black man in his thirties in a plain shirt against a blank light wall, even flat indoor light, whole face clearly visible and front-facing. It should look like a real everyday selfie, not a professional photo. ${STYLE}` },
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample3.png", aspect: "3:4",
    prompt: `An ordinary smartphone photograph of a single consumer product — a pair of headphones — on a plain pale table under ordinary room lighting, whole product in frame, slightly dull and unstyled. ${STYLE}` },
];

/* ── 6. programmatic tool pages ─────────────────────────────────────────── */

const PROGRAMMATIC: ImageJob[] = [
  ...CONVERSIONS.map((c) => {
    const ct = buildContent(c);
    return {
      set: "programmatic" as const, bucket: BLOGS, path: `convert-${c.slug}.png`, aspect: "16:9",
      prompt: beforeAfter(
        `a photograph of a potted plant on a windowsill presented as a single ${ct.fromLabel} file: one plain flat photo print lying on a dark desk`,
        `the same photograph presented as a ${ct.toLabel} file, visually identical in quality, sitting in the same position on the same desk${c.to === "png" ? ", shown against a transparent checkerboard to indicate transparency support" : ""}`
      ),
    };
  }),
  ...COMPRESSIONS.map((c) => ({
    set: "programmatic" as const, bucket: BLOGS, path: `${c.slug}.png`, aspect: "16:9",
    prompt: beforeAfter(
      "a photograph of a harbour at sunset shown alongside a tall stack of storage drives, suggesting a very large file",
      `the same harbour photograph looking identical in quality, now alongside a single small storage chip, suggesting roughly ${c.label}`
    ),
  })),
  ...CROPS.map((c) => ({
    set: "programmatic" as const, bucket: BLOGS, path: `${c.slug}.png`, aspect: "16:9",
    prompt: beforeAfter(
      "a wide photograph of a person standing off-centre with a great deal of empty space around them",
      `the same photograph cropped to the framing described by "${c.h1.replace(/ \(.*\)$/, "")}", the subject correctly placed and filling the frame`
    ),
  })),
];

/* ── 7. the social share card ───────────────────────────────────────────── */

const SOCIAL: ImageJob[] = [
  { set: "social", bucket: LANDING, path: "og-default.png", aspect: "16:9",
    prompt: beforeAfter(
      "a plain smartphone selfie of a person against a blank wall",
      "the same person as a polished studio portrait with warm deep-orange accent lighting and a clean near-black backdrop"
    ) },
];

/* ── the full list ──────────────────────────────────────────────────────── */

// Sources first: every app card is an edit of one of them, so they have to
// exist before the apps set can run.
export const IMAGE_JOBS: ImageJob[] = assertRatios([
  ...SOURCES, ...HOME, ...TOOLS, ...APPS, ...PRESETS, ...SAMPLES, ...PROGRAMMATIC, ...SOCIAL,
]);

/**
 * Rejects a job list carrying a ratio fal will not accept.
 *
 * "16:10" cost a whole production run: 23 jobs each failed with a 422 that the
 * Gemini fallback then reported as a rate limit. Checking the list when the
 * module loads turns that into a build failure instead.
 */
function assertRatios(jobs: ImageJob[]): ImageJob[] {
  const allowed = new Set<string>(FAL_ASPECT_RATIOS);
  const bad = jobs.filter((j) => !allowed.has(j.aspect));
  if (bad.length) {
    throw new Error(
      `Unsupported aspect ratios in image-jobs: ${bad
        .map((j) => `${j.path} (${j.aspect})`)
        .slice(0, 5)
        .join(", ")}. fal accepts: ${FAL_ASPECT_RATIOS.join(", ")}.`
    );
  }
  return jobs;
}

export function jobsFor(set: string | null): ImageJob[] {
  if (!set || set === "all") return IMAGE_JOBS;
  return IMAGE_JOBS.filter((j) => j.set === set);
}

/** Count per set, for the route's summary output. */
export function jobCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of IMAGE_JOBS) out[j.set] = (out[j.set] || 0) + 1;
  out.all = IMAGE_JOBS.length;
  return out;
}
