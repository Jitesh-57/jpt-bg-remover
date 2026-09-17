/**
 * app-presets.ts — the style presets shown in each AI app's control panel.
 *
 * Presets are derived from the app's own base prompt plus a framing modifier,
 * so all 42 apps get a usable set without 250 hand-written prompts. Any app can
 * override its presets in PRESET_OVERRIDES when it deserves bespoke ones.
 *
 * Thumbnails come from the Supabase "App preset images" bucket and are matched
 * by name at runtime (same approach as the 80s prompt gallery), so images can
 * be added later without a code change.
 */

import type { CreativeApp } from "@/lib/creative-apps";

export type PresetTab = "solo" | "group" | "custom";

export type Preset = {
  id: string;
  label: string;
  /** Appended to the app's base prompt. */
  modifier: string;
};

export const TABS: { id: PresetTab; label: string; hint: string }[] = [
  { id: "solo",   label: "Solo",   hint: "One person in the photo." },
  { id: "group",  label: "Group",  hint: "Two or more people — every face is preserved." },
  { id: "custom", label: "Custom", hint: "Describe the look yourself." },
];

/** Framing/styling variants that read sensibly across every app. */
const BASE_PRESETS: Preset[] = [
  { id: "studio",    label: "Studio portrait", modifier: "Shot as a formal studio portrait: seated or standing square to camera, controlled key light, clean backdrop, shoulders-up framing." },
  { id: "street",    label: "Street-style",    modifier: "Shot candidly on a street: natural daylight, a real city background with depth, relaxed full-body or three-quarter framing." },
  { id: "cinema",    label: "Cinema-star",     modifier: "Shot like a film still: dramatic directional lighting, shallow depth of field, cinematic colour grade, confident posture." },
  { id: "closeup",   label: "Close-up",        modifier: "Tight head-and-shoulders close-up: soft flattering light, sharp focus on the eyes, background falling away." },
  { id: "fullbody",  label: "Full body",       modifier: "Full-body shot from head to feet, the whole outfit visible, natural stance, environment readable behind." },
  { id: "golden",    label: "Golden hour",     modifier: "Shot at golden hour: warm low sun, long soft shadows, gentle backlight rimming the hair." },
  { id: "moody",     label: "Moody low-key",   modifier: "Low-key lighting: deep shadows, a single soft source, rich contrast, restrained colour." },
  { id: "editorial", label: "Editorial",       modifier: "Styled like a magazine editorial: deliberate posing, strong styling, generous negative space, crisp commercial finish." },
];

/** Presets by catalogue category — the generic framing set rarely suits these. */
const CATEGORY_PRESETS: Partial<Record<string, Preset[]>> = {
  headshot: [
    { id: "corporate", label: "Corporate",  modifier: "Business suit, neutral grey or office background, even professional lighting, confident neutral expression." },
    { id: "linkedin",  label: "LinkedIn",   modifier: "Smart-casual dress, softly blurred office or outdoor background, approachable natural expression." },
    { id: "exec",      label: "Executive",  modifier: "Dark tailored suit, dark low-key background, sculpted dramatic lighting, authoritative posture." },
    { id: "creative",  label: "Creative",   modifier: "Relaxed styling, textured or coloured backdrop, characterful directional light." },
    { id: "outdoor",   label: "Outdoor",    modifier: "Natural daylight, softly blurred greenery behind, warm approachable tone." },
    { id: "plain",     label: "Plain white", modifier: "Plain white background, flat even lighting with no shadow on the face, neutral expression — ID and application safe." },
  ],
  product: [
    { id: "white",     label: "White sweep", modifier: "Pure white seamless background with a soft natural contact shadow, product centred with even margins." },
    { id: "studio",    label: "Studio",      modifier: "Dark gradient studio backdrop, controlled softbox lighting, a crisp specular highlight describing the material." },
    { id: "lifestyle", label: "Lifestyle",   modifier: "A styled real-world surface with props kept well out of focus behind, warm natural window light." },
    { id: "marble",    label: "Marble",      modifier: "Polished stone surface, bright diffuse light, a clean reflection beneath the product." },
    { id: "outdoor",   label: "Natural",     modifier: "Outdoor natural light on a wood or stone surface, soft dappled shade, believable ambient bounce." },
    { id: "gradient",  label: "Gradient",    modifier: "A bold single-colour gradient background, punchy commercial lighting, strong product separation." },
  ],
  background: [
    { id: "transparent", label: "Cut out",   modifier: "Fully transparent background with a precise edge through hair and fine detail." },
    { id: "studio",      label: "Studio",    modifier: "A clean seamless studio backdrop with a soft gradient falloff behind the subject." },
    { id: "office",      label: "Office",    modifier: "A modern office interior, softly out of focus, lit to match the subject." },
    { id: "outdoor",     label: "Outdoor",   modifier: "An outdoor setting in natural daylight with believable depth behind the subject." },
    { id: "gradient",    label: "Gradient",  modifier: "A smooth two-tone colour gradient sized to the subject." },
    { id: "bokeh",       label: "Bokeh",     modifier: "Warm out-of-focus light orbs at a believable distance behind the subject." },
  ],
  portrait: [
    { id: "studio",    label: "Studio",      modifier: "Controlled studio light on a clean backdrop, deliberate posing, shoulders-up or three-quarter framing." },
    { id: "golden",    label: "Golden hour", modifier: "Warm low sun, long soft shadows, gentle backlight rimming the hair, outdoors." },
    { id: "candid",    label: "Candid",      modifier: "Shot as if unposed: natural daylight, relaxed stance, a real setting with depth behind." },
    { id: "editorial", label: "Editorial",   modifier: "Styled like a magazine spread: strong styling, deliberate pose, generous negative space, crisp commercial finish." },
    { id: "moody",     label: "Moody",       modifier: "Low-key lighting, deep shadow, a single soft source, restrained colour." },
    { id: "fullbody",  label: "Full body",   modifier: "Head-to-feet framing with the whole outfit visible and the environment readable behind." },
  ],
  style: [
    { id: "portrait",  label: "Portrait",    modifier: "Head-and-shoulders bust composition, subject centred, background simplified to suit the medium." },
    { id: "fullbody",  label: "Full figure", modifier: "The whole figure in frame, posed, with a stylised setting behind." },
    { id: "flat",      label: "Flat colour", modifier: "Flat blocked colour with clean outlines and minimal shading — reads well small and prints well." },
    { id: "textured",  label: "Textured",    modifier: "Visible medium texture — brush, grain, paper tooth — carried across the whole frame." },
    { id: "avatar",    label: "Avatar",      modifier: "Square, plain single-colour background, head centred and legible at very small sizes." },
    { id: "poster",    label: "Poster",      modifier: "Poster composition with strong graphic shapes and clear empty space left for a title." },
  ],
  retouch: [
    { id: "natural",   label: "Natural",     modifier: "A conservative pass: blemishes and distractions only, skin texture and pores fully preserved." },
    { id: "colour",    label: "Colour fix",  modifier: "Correct white balance and any colour cast, restore neutral skin tones, leave everything else alone." },
    { id: "light",     label: "Light fix",   modifier: "Even out exposure, lift blocked shadow and recover washed highlight without flattening the image." },
    { id: "denoise",   label: "Clean up",    modifier: "Reduce grain, noise and compression artefacts while keeping fine detail in hair and fabric." },
    { id: "shine",     label: "De-shine",    modifier: "Reduce specular shine on skin and remove flash hotspots, keeping natural texture." },
    { id: "polish",    label: "Polished",    modifier: "A commercial-standard finish: clean skin, tidy hair edges, corrected colour — still unmistakably a photograph." },
  ],
  restore: [
    { id: "repair",    label: "Repair",      modifier: "Repair cracks, tears, creases, scratches and missing areas, reconstructing conservatively from the surrounding image." },
    { id: "fade",      label: "Fix fading",  modifier: "Reverse the magenta and yellow shift of faded colour film and restore neutral tones and contrast." },
    { id: "colourise", label: "Colourise",   modifier: "Colourise the monochrome original with natural, period-plausible tones and restrained saturation." },
    { id: "mono",      label: "Keep mono",   modifier: "Stay black and white: restore contrast, remove dust and scratches, leave the tonality of the original." },
    { id: "sharpen",   label: "Recover detail", modifier: "Recover buried detail and sharpen softly, without inventing texture that was never in the print." },
    { id: "faces",     label: "Faces first", modifier: "Prioritise the faces: reconstruct them conservatively and keep every identifying feature unchanged." },
  ],
  remove: [
    { id: "people",    label: "People",      modifier: "Remove the unwanted people and their shadows, reconstructing the background that continues behind them." },
    { id: "objects",   label: "Objects",     modifier: "Remove the named objects and their shadows, continuing the surrounding surface and its texture." },
    { id: "text",      label: "Text / stamps", modifier: "Remove overlaid text, timestamps and stamps, rebuilding the image detail that sat underneath." },
    { id: "clutter",   label: "Clutter",     modifier: "Clear background clutter — bins, cables, signage, stray items — leaving the subject untouched." },
    { id: "glare",     label: "Reflections", modifier: "Remove reflections and flash glare from glass and shiny surfaces, keeping what is behind them." },
    { id: "clean",     label: "Clean plate", modifier: "Produce a clean background plate: everything transient removed, the permanent scene intact." },
  ],
  enhance: [
    { id: "upscale2",  label: "Upscale 2×",  modifier: "Enlarge 2× with reconstructed detail, keeping skin texture and fabric weave believable." },
    { id: "upscale4",  label: "Upscale 4×",  modifier: "Enlarge 4× with reconstructed detail — more invention, so judge the result at full size." },
    { id: "sharpen",   label: "Sharpen",     modifier: "Increase acuity without edge halos, keeping grain structure natural." },
    { id: "denoise",   label: "Denoise",     modifier: "Reduce sensor noise and grain while preserving fine detail in hair, fabric and foliage." },
    { id: "artefact",  label: "Fix JPEG",    modifier: "Remove compression blocking and colour banding and rebuild clean edges." },
    { id: "print",     label: "For print",   modifier: "Prepare for print: maximum honest resolution, neutral colour, no stylisation or added contrast." },
  ],
  fun: [
    { id: "product",   label: "In the box",  modifier: "Presented as a boxed collectible in retail packaging, photographed as a product shot." },
    { id: "desk",      label: "On a desk",   modifier: "Sitting on a real desk beside everyday objects, so the scale reads immediately." },
    { id: "plain",     label: "Plain",       modifier: "Centred on a plain background with a soft contact shadow — the cleanest version to cut out." },
    { id: "scene",     label: "In a scene",  modifier: "Placed in a full scene with a believable setting and lighting behind." },
    { id: "group",     label: "Group",       modifier: "Several subjects together, each one separately recognisable and consistently styled." },
    { id: "closeup",   label: "Close-up",    modifier: "Tight close-up showing the material and surface detail of the transformation." },
  ],
  social: [
    { id: "square",   label: "Square 1:1",  modifier: "Composed for a square crop with the subject centred and safe margins." },
    { id: "portrait", label: "Portrait 4:5", modifier: "Composed for a tall 4:5 feed crop with headroom above the subject." },
    { id: "wide",     label: "Wide 16:9",   modifier: "Composed for a wide crop with the subject offset and space reserved for text." },
    { id: "circle",   label: "Circle-safe", modifier: "Composed so nothing important is lost to a tight circular crop." },
    { id: "bold",     label: "High contrast", modifier: "Punchy saturated colour and strong subject separation for small-size legibility." },
    { id: "minimal",  label: "Minimal",     modifier: "A restrained palette with generous negative space and one clear focal point." },
  ],
};

/** Apps whose presets should differ from the generic set. */
const PRESET_OVERRIDES: Record<string, Preset[]> = {
  "passport-photo": [
    { id: "us",    label: "US 2×2in",    modifier: "Formatted as a US passport photo: 2×2 inches, plain white background, neutral expression, head centred and fully visible." },
    { id: "uk",    label: "UK / EU",     modifier: "Formatted as a UK/EU passport photo: 35×45mm, light grey plain background, neutral expression, no shadows on the face." },
    { id: "india", label: "India",       modifier: "Formatted as an Indian passport photo: 2×2 inches, plain white background, face covering most of the frame, neutral expression." },
    { id: "visa",  label: "Visa / ID",   modifier: "Formatted as a general visa or ID photo: plain light background, even frontal lighting, neutral expression, shoulders square." },
  ],
  "professional-headshot": [
    { id: "corporate", label: "Corporate",   modifier: "Corporate headshot: business suit, neutral grey or office background, even professional lighting, confident neutral expression." },
    { id: "linkedin",  label: "LinkedIn",    modifier: "LinkedIn-style headshot: smart-casual dress, soft blurred office or outdoor background, approachable natural smile." },
    { id: "creative",  label: "Creative",    modifier: "Creative-industry headshot: relaxed styling, textured or coloured backdrop, characterful directional light." },
    { id: "exec",      label: "Executive",   modifier: "Executive portrait: dark tailored suit, dark low-key background, sculpted dramatic lighting, authoritative posture." },
    { id: "outdoor",   label: "Outdoor",     modifier: "Outdoor headshot: natural daylight, softly blurred greenery behind, warm approachable tone." },
  ],
};

export function presetsFor(app: CreativeApp, tab: PresetTab): Preset[] {
  if (tab === "custom") return [];
  // Slug override wins, then the app's catalogue category, then the generic set.
  return PRESET_OVERRIDES[app.slug] ?? (app.cat ? CATEGORY_PRESETS[app.cat] : undefined) ?? BASE_PRESETS;
}

/**
 * The full prompt sent to the model for a given selection.
 *
 * `extras` are the sentences the app's own options contribute — the target age
 * on an ageing app, the beard style on the beard filter. They go in directly
 * after the base prompt and before the identity and realism instructions,
 * because several base prompts say "the specified age" or "the specified
 * style" and the answer needs to arrive while the model is still reading about
 * the thing it qualifies. See lib/app-options.ts.
 */
export function buildPrompt(
  app: CreativeApp,
  tab: PresetTab,
  preset: Preset | null,
  customText: string,
  extras: string[] = []
): string {
  const parts: string[] = [];

  if (tab === "custom" && customText.trim()) {
    parts.push(customText.trim());
  } else {
    parts.push(app.prompt);
    if (preset) parts.push(preset.modifier);
  }

  parts.push(...extras);

  parts.push(
    tab === "group"
      ? "There are multiple people in the photo. Preserve every person's own face, facial structure, identity and natural skin tone, and keep them in their existing positions relative to each other."
      : "Preserve the person's face, facial structure, identity and natural skin tone exactly."
  );

  parts.push(
    "The result must look like a real photograph — natural skin texture, realistic lighting and shadows, believable anatomy and hands — not an illustration, painting or cartoon."
  );

  return parts.join(" ");
}

export const ASPECT_RATIOS = ["1:1", "4:5", "3:4", "16:9", "9:16", "3:2"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/**
 * The models offered in the picker.
 *
 * Two, because that is the choice people actually have an opinion about: the
 * fast one that is best at holding a face, and OpenAI's. "ChatGPT" is the name
 * to put in front of a visitor — "GPT Image 2.5 Sunburst" is a fal endpoint id,
 * and nobody chose their photo tool on the strength of knowing one.
 *
 * ChatGPT is a family rather than a single endpoint: picking it walks the
 * cascade in src/lib/ai-image.ts, so it gets the best of OpenAI's models the
 * account can actually reach rather than dead-ending on one path. Both run on
 * fal credit.
 *
 * If one is unavailable the request is served by the other rather than
 * failing, and the substitution is logged with the endpoint that refused it —
 * so a model here can never dead-end a visitor.
 */
export const MODELS = [
  { id: "nano-banana", label: "Nano Banana", hint: "Fast and cheap — best at keeping your face exactly as it is" },
  { id: "gpt-image",   label: "ChatGPT",     hint: "OpenAI's image model — richer light and texture, slower" },
] as const;

/** Supabase bucket holding preset thumbnails, matched by name at runtime. */
export const PRESET_IMAGE_BUCKET = "App preset images";

/** e.g. "saree-photoshoot__studio" — the filename stem to look for. */
export function presetImageStem(appSlug: string, presetId: string): string {
  return `${appSlug}__${presetId}`;
}
