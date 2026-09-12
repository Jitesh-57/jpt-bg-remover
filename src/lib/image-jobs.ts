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
import { categoryOf } from "@/lib/app-content";
import { CONVERSIONS, buildContent } from "@/lib/conversions";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";

export type JobSet = "home" | "tools" | "apps" | "presets" | "samples" | "programmatic" | "social";

export interface ImageJob {
  /** Which batch this belongs to. */
  set: JobSet;
  /** Supabase bucket name. */
  bucket: string;
  /** Path inside the bucket, including the extension. */
  path: string;
  /** Aspect ratio string the model understands. */
  aspect: string;
  prompt: string;
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
function beforeAfter(before: string, after: string, aspect = "16:10"): string {
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

/* ── 1. homepage ────────────────────────────────────────────────────────── */

const HOME: ImageJob[] = [
  {
    set: "home", bucket: LANDING, path: "home-hero.png", aspect: "21:9",
    prompt: beforeAfter(
      "a plain smartphone selfie of a smiling adult in casual clothes against a blank beige wall, flat indoor lighting",
      "the same person as a polished studio portrait: tailored clothing, soft key light with a gentle fill, a clean dark neutral backdrop, confident relaxed expression",
      "21:9"
    ),
  },
  {
    set: "home", bucket: LANDING, path: "home-step-1.png", aspect: "16:10",
    prompt: `A photograph being dropped onto a large empty upload area on a dark desk surface: a single printed photo mid-air above a softly glowing rounded rectangle outline, a hand just releasing it. Warm accent light in deep orange. ${STYLE}`,
  },
  {
    set: "home", bucket: LANDING, path: "home-step-2.png", aspect: "16:10",
    prompt: `A neat grid of nine small portrait thumbnails on a dark surface, each showing the same person in a different photographic style — studio, outdoor, formal, casual — with one thumbnail clearly highlighted by a deep orange border. ${STYLE}`,
  },
  {
    set: "home", bucket: LANDING, path: "home-step-3.png", aspect: "16:10",
    prompt: `A finished high-resolution portrait print resting on a dark desk beside a phone showing the same image, lit warmly, nothing overlaid on the print, clean and uncluttered. ${STYLE}`,
  },
];

/* ── 2. tool landing pages ──────────────────────────────────────────────── */

const TOOLS: ImageJob[] = [
  { set: "tools", bucket: LANDING, path: "page-remove-bg.png", aspect: "16:10",
    prompt: beforeAfter(
      "a pair of running shoes photographed on a cluttered kitchen worktop with background distractions",
      "the same shoes on a pure white seamless background with a soft contact shadow beneath them, centred with even margins") },

  { set: "tools", bucket: LANDING, path: "page-upscale.png", aspect: "16:10",
    prompt: beforeAfter(
      "a small, soft, slightly pixelated portrait photograph, visibly low resolution",
      "the same portrait sharp and detailed, with clear skin texture and individual strands of hair resolved") },

  { set: "tools", bucket: LANDING, path: "page-ai-editor.png", aspect: "16:10",
    prompt: beforeAfter(
      "a plain photo of a person standing in a dim hallway",
      "the same person in the same pose, now outdoors at golden hour with warm low sun rimming the hair and a softly blurred park behind") },

  { set: "tools", bucket: LANDING, path: "page-ai-headshot.png", aspect: "16:10",
    prompt: beforeAfter(
      "a casual selfie of an adult in a t-shirt taken at arm's length against a bedroom wall",
      "the same person as a corporate headshot: charcoal suit, white shirt, neutral grey studio backdrop, even professional lighting") },

  // The upscale page shows two separate frames rather than one split image.
  { set: "tools", bucket: LANDING, path: "upscale-before.jpg", aspect: "16:10",
    prompt: `A deliberately low-resolution, soft, slightly pixelated photograph of a young adult's face, framed head and shoulders against a plain background — it must read as a small image that has been enlarged too far. ${STYLE}` },
  { set: "tools", bucket: LANDING, path: "upscale-after.jpg", aspect: "16:10",
    prompt: `A very sharp, high-resolution photograph of a young adult's face, framed head and shoulders against a plain background, with crisp skin texture, visible individual eyelashes and clearly resolved hair strands. Same framing and composition as a standard head-and-shoulders portrait. ${STYLE}` },

  { set: "tools", bucket: LANDING, path: "image-compressor-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a photograph of a coastal landscape shown large and heavy, with a small stack of storage drives beside it suggesting a very large file",
      "the same landscape photograph looking identical in quality but paired with a single small storage chip, suggesting a far smaller file") },

  { set: "tools", bucket: LANDING, path: "image-converter-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a photograph of a bicycle against a brick wall, shown as a flat rectangular photo print",
      "the same bicycle photograph but cut out onto a transparent checkerboard background, edges clean around the spokes") },

  { set: "tools", bucket: LANDING, path: "image-cropper-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a wide photograph of a person standing off to one side with a lot of empty space around them",
      "the same photograph cropped tight and square, the person centred and filling the frame") },

  { set: "tools", bucket: LANDING, path: "image-resizer-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a very large photographic print of a city street laid on a desk, extending past the edges of the frame",
      "the same city street photograph as a small, neat, perfectly proportioned print sitting squarely on the same desk") },

  { set: "tools", bucket: LANDING, path: "rotate-flip-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a photograph of a lighthouse lying on its side, rotated ninety degrees the wrong way",
      "the same lighthouse photograph upright and correctly oriented, horizon level") },

  { set: "tools", bucket: LANDING, path: "add-text-watermark-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a clean photograph of a plated dish on a wooden table with nothing over it",
      "the same photograph with a subtle semi-transparent diagonal watermark pattern of simple abstract marks across it, evenly spaced and unobtrusive") },

  { set: "tools", bucket: LANDING, path: "meme-generator-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a plain photograph of a surprised-looking cat on a sofa",
      "the same photograph with thick empty white caption bars added above and below the image, ready for text but containing none") },

  { set: "tools", bucket: LANDING, path: "photo-to-pdf-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "three loose photographic prints scattered untidily on a dark desk",
      "the same three photographs neatly stacked as pages of a bound document, squared up and aligned") },

  { set: "tools", bucket: LANDING, path: "tiktok-watermark-remover-hero.png", aspect: "16:10",
    prompt: beforeAfter(
      "a phone held in a hand showing a vertical video of a dancer, with a small semi-transparent abstract mark in the corner of the video",
      "the same phone and the same video frame, completely clean with no mark in any corner") },

  // Standalone pages (Blogs bucket)
  { set: "tools", bucket: BLOGS, path: "blur-image-before-after.png", aspect: "16:10",
    prompt: beforeAfter(
      "a photograph of two people standing beside a parked car, faces and the car's plate clearly visible",
      "the same photograph with the faces and the plate cleanly blurred out, everything else untouched and sharp") },

  { set: "tools", bucket: BLOGS, path: "qr-code-generator-showcase.png", aspect: "16:10",
    prompt: `A crisp black-and-white QR code printed on a white card resting on a dark desk beside a phone whose camera is pointed at it. The QR code must be a plausible dense square QR pattern. No text anywhere. ${STYLE}` },
];

// The watermark-remover page shows four separate before/after pairs.
const WATERMARK_CASES: { before: string; after: string }[] = [
  { before: "a product photograph of a ceramic mug on a pale surface with a semi-transparent abstract logo mark across the centre",
    after: "the same mug photograph completely clean, the surface behind it fully rebuilt with no trace of the mark" },
  { before: "a photograph of a mountain lake with a small semi-transparent block of abstract marks and a date stamp in the lower corner",
    after: "the same lake photograph with the corner entirely clean, water and sky continuing naturally" },
  { before: "a stock-style photograph of a person working at a laptop, covered by a large faint repeating diagonal pattern of abstract marks",
    after: "the same photograph with the pattern entirely removed and full detail restored" },
  { before: "a photograph of a painted canvas with a handwritten-looking signature mark in the lower right corner",
    after: "the same canvas photograph with the corner clean, the paint texture continuing through where the mark was" },
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

/**
 * The "before" half of an app's comparison image, by category.
 *
 * This used to be a ten-entry hand-written map, which meant 190 apps had no
 * creative to generate at all. Deriving it from the category covers all of
 * them, and the "after" half is the app's own prompt, so each image is still
 * specific to its app.
 */
const BEFORE_BY_CAT: Record<string, string> = {
  headshot: "a casual arm's-length selfie of an adult in a plain t-shirt against a bedroom wall, flat uneven indoor light",
  portrait: "an ordinary smartphone snapshot of an adult standing in a dim hallway in everyday clothes",
  style: "a plain, unremarkable smartphone portrait of an adult against a blank wall in even flat light",
  retouch: "a smartphone portrait of an adult with visible forehead shine, a green colour cast from overhead office lighting and one small blemish on the cheek",
  restore: "an old damaged photographic print: faded to magenta, a crease across one corner, surface scratches and dust, edges worn",
  background: "a photograph of an adult standing in a cluttered kitchen, dishes and cupboards distracting behind them",
  remove: "a holiday photograph of a landmark with three unrelated strangers walking through the frame and a litter bin at the edge",
  enhance: "a small, soft, visibly low-resolution and slightly noisy photograph of a face, clearly enlarged too far",
  product: "a product photographed on a cluttered domestic worktop under yellow kitchen lighting, crumbs and objects behind it",
  social: "an off-centre snapshot of an adult in a wide frame with the subject too small and a lot of dead space",
  fun: "a plain, ordinary smartphone selfie of an adult in colourful casual clothes against a blank wall",
};

/**
 * Subject overrides, matched on words in the app's slug or name.
 *
 * The category alone is not enough: a "Car Photo Editor" and a "Jewellery
 * Photo Editor" are both `product`, and showing a person — or the wrong
 * object — in the "before" half makes the card read as unrelated to the tool.
 * First match wins, so the more specific keywords are listed first.
 */
const SUBJECT_RULES: [RegExp, string][] = [
  [/piercing|beard|glasses|braces|tattoo|hairstyle|hair-color|bangs|curly|blonde|bald|buzz-cut|long-hair|eyebrow|eye-color|smile|expression/,
    "a clear front-facing smartphone portrait of an adult in plain even light against a blank wall, no accessories and nothing unusual about the face"],
  [/unpixelate|unblur|upscal|enlarge|sharpen|denoise|hd-photo|4k|image-enlarger/,
    "a small, soft, visibly low-resolution and slightly pixelated photograph of a face, clearly enlarged far past its real size"],
  [/muscle|\babs\b|six-pack|body-editor|fitness|gym|skinny|slim/,
    "an ordinary smartphone photograph of an adult standing in a plain t-shirt in an undecorated room, flat indoor light"],
  [/\bpet|dog|cat\b/, "an ordinary snapshot of a dog sitting on a living-room floor, taken from standing height in flat indoor light"],
  [/baby|toddler|kid/, "an ordinary snapshot of a baby sitting on a plain rug, flat indoor light, slightly awkward framing"],
  [/couple|wedding|anniversary|engagement/, "an ordinary snapshot of two adults standing side by side in everyday clothes against a plain wall"],
  [/family|group/, "an ordinary snapshot of three adults standing in a row in everyday clothes in a plain room"],
  [/\bcar\b|automotive|dealer|vehicle/, "a used car photographed in a residential driveway on an overcast day, bins and a fence visible behind it"],
  [/bike|motorcycle|truck/, "a motorcycle photographed in a plain concrete car park on a dull day, clutter in the background"],
  [/jewel|ring|necklace/, "a gold ring photographed on a kitchen worktop under yellow domestic lighting, dust visible on the metal"],
  [/food|restaurant|menu|dish/, "a plated meal photographed on a restaurant table under dim yellow light, cutlery and a glass crowding the frame"],
  [/real-estate|house|property|interior|room|home-decor|hotel|architect/, "a living room photographed on a phone in dull daylight: uneven exposure, a cluttered coffee table and a crooked horizon"],
  [/saree|dress|outfit|fashion|clothing|apparel/, "an ordinary snapshot of an adult in plain everyday clothes standing against a blank wall in flat light"],
  [/shoe|sneaker|watch|headphone|bottle|electronic|gadget|amazon|ecommerce|shopify|product|beauty/, "a single consumer product photographed on a cluttered domestic worktop under yellow kitchen lighting"],
  [/logo|icon|signature|png-maker/, "a hand-drawn mark on white paper photographed on a desk, the paper edges and shadows visible"],
  [/thumbnail|youtube|banner|cover|poster|album/, "an ordinary off-centre snapshot of an adult with a lot of dead space around them and nowhere obvious for a title"],
  [/old-photo|restoration|colorize|colourise|black-and-white|yearbook/, "an old damaged photographic print: faded towards magenta, a crease across one corner, surface scratches and dust"],
  [/passport|visa|\bid\b/, "a casual arm's-length selfie of an adult against a patterned wall, head tilted, uneven shadow across the face"],
];

/** The "before" half for an app: a keyword rule if one matches, else its category. */
function beforeSubjectFor(app: CreativeApp): string {
  const hay = `${app.slug} ${app.h1}`.toLowerCase();
  for (const [re, subject] of SUBJECT_RULES) if (re.test(hay)) return subject;
  return BEFORE_BY_CAT[categoryOf(app)] || BEFORE_BY_CAT.portrait;
}

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

const APPS: ImageJob[] = CREATIVE_APPS.map((a) => ({
  set: "apps" as const,
  bucket: LANDING,
  path: `creative/${a.slug}.png`,
  // 4:5 portrait: these files are the app's card on the homepage and the hub
  // as well as the showcase on its own page, so the split runs top to bottom.
  aspect: "4:5",
  prompt: NO_INPUT_PHOTO.has(a.slug)
    ? `A single finished example of exactly what this tool produces: ${a.prompt} Presented cleanly and centred, filling the frame, as a portfolio example. Absolutely no text, letters, numbers, badges or captions anywhere in the image. ${STYLE}`
    : beforeAfter(beforeSubjectFor(a), a.prompt, "4:5"),
}));

/* ── 4. preset thumbnails, one set per category ─────────────────────────── */

/**
 * `<category>__<preset-id>.png` covers every app in that category, which is
 * 74 files instead of the 1,200 that per-app thumbnails would need.
 */
const PRESETS: ImageJob[] = (() => {
  const out: ImageJob[] = [];
  const seen = new Set<string>();
  for (const app of CREATIVE_APPS) {
    const cat = app.cat;
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    const subject =
      cat === "product" ? "a single consumer product"
      : cat === "restore" ? "an old family photograph"
      : cat === "remove" ? "a photograph with unwanted objects removed"
      : cat === "enhance" ? "a sharp, detailed photograph"
      : "an adult person";
    for (const p of presetsFor(app, "solo")) {
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
        prompt: `A small thumbnail example of an adult person photographed in this exact treatment: ${p.modifier} It must read instantly as an example of "${p.label}". Single subject, tightly framed, no borders. ${STYLE}`,
      });
    }
  }
  for (const slug of ["passport-photo", "professional-headshot"]) {
    const app = CREATIVE_APPS.find((a) => a.slug === slug);
    if (!app) continue;
    for (const p of presetsFor(app, "solo")) {
      out.push({
        set: "presets", bucket: PRESET_IMAGE_BUCKET, path: `${slug}__${p.id}.png`, aspect: "3:4",
        prompt: `A small thumbnail example of an adult person photographed in this exact treatment: ${p.modifier} It must read instantly as an example of "${p.label}". Single subject, tightly framed, no borders. ${STYLE}`,
      });
    }
  }
  return out;
})();

/* ── 5. sample photos users can try without uploading ───────────────────── */

const SAMPLES: ImageJob[] = [
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample1.png", aspect: "3:4",
    prompt: `An ordinary, honest smartphone portrait of a smiling adult woman in a plain top against a blank light wall, even flat indoor light, whole face clearly visible and front-facing. It should look like a real everyday selfie, not a professional photo. ${STYLE}` },
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample2.png", aspect: "3:4",
    prompt: `An ordinary, honest smartphone portrait of a smiling adult man in a plain shirt against a blank light wall, even flat indoor light, whole face clearly visible and front-facing. It should look like a real everyday selfie, not a professional photo. ${STYLE}` },
  { set: "samples", bucket: PRESET_IMAGE_BUCKET, path: "sample3.png", aspect: "3:4",
    prompt: `An ordinary smartphone photograph of a single consumer product — a pair of headphones — on a plain pale table under ordinary room lighting, whole product in frame, slightly dull and unstyled. ${STYLE}` },
];

/* ── 6. programmatic tool pages ─────────────────────────────────────────── */

const PROGRAMMATIC: ImageJob[] = [
  ...CONVERSIONS.map((c) => {
    const ct = buildContent(c);
    return {
      set: "programmatic" as const, bucket: BLOGS, path: `convert-${c.slug}.png`, aspect: "16:10",
      prompt: beforeAfter(
        `a photograph of a potted plant on a windowsill presented as a single ${ct.fromLabel} file: one plain flat photo print lying on a dark desk`,
        `the same photograph presented as a ${ct.toLabel} file, visually identical in quality, sitting in the same position on the same desk${c.to === "png" ? ", shown against a transparent checkerboard to indicate transparency support" : ""}`
      ),
    };
  }),
  ...COMPRESSIONS.map((c) => ({
    set: "programmatic" as const, bucket: BLOGS, path: `${c.slug}.png`, aspect: "16:10",
    prompt: beforeAfter(
      "a photograph of a harbour at sunset shown alongside a tall stack of storage drives, suggesting a very large file",
      `the same harbour photograph looking identical in quality, now alongside a single small storage chip, suggesting roughly ${c.label}`
    ),
  })),
  ...CROPS.map((c) => ({
    set: "programmatic" as const, bucket: BLOGS, path: `${c.slug}.png`, aspect: "16:10",
    prompt: beforeAfter(
      "a wide photograph of an adult standing off-centre with a great deal of empty space around them",
      `the same photograph cropped to the framing described by "${c.h1.replace(/ \(.*\)$/, "")}", the subject correctly placed and filling the frame`
    ),
  })),
];

/* ── 7. the social share card ───────────────────────────────────────────── */

const SOCIAL: ImageJob[] = [
  { set: "social", bucket: LANDING, path: "og-default.png", aspect: "16:9",
    prompt: beforeAfter(
      "a plain smartphone selfie of an adult against a blank wall",
      "the same person as a polished studio portrait with warm deep-orange accent lighting and a clean near-black backdrop"
    ) },
];

/* ── the full list ──────────────────────────────────────────────────────── */

export const IMAGE_JOBS: ImageJob[] = [
  ...HOME, ...TOOLS, ...APPS, ...PRESETS, ...SAMPLES, ...PROGRAMMATIC, ...SOCIAL,
];

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
