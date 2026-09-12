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

/** The full prompt sent to the model for a given selection. */
export function buildPrompt(
  app: CreativeApp,
  tab: PresetTab,
  preset: Preset | null,
  customText: string
): string {
  const parts: string[] = [];

  if (tab === "custom" && customText.trim()) {
    parts.push(customText.trim());
  } else {
    parts.push(app.prompt);
    if (preset) parts.push(preset.modifier);
  }

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

export const MODELS = [
  { id: "nano-banana", label: "Nano Banana", hint: "Fast, best at keeping your face" },
  { id: "gpt-image",   label: "GPT Image",   hint: "Slower, better at text in the image" },
] as const;

/** Supabase bucket holding preset thumbnails, matched by name at runtime. */
export const PRESET_IMAGE_BUCKET = "App preset images";

/** e.g. "saree-photoshoot__studio" — the filename stem to look for. */
export function presetImageStem(appSlug: string, presetId: string): string {
  return `${appSlug}__${presetId}`;
}
