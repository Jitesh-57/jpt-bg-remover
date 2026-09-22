import type { CreativeApp } from "@/lib/creative-apps";

/**
 * app-options.ts — the per-app choices that actually reach the prompt.
 *
 * Every AI app shipped with the same two controls, Model and Ratio, neither of
 * which changes what is generated. So the Age Progression app asked the model
 * to "age this person to the specified age" with no age anywhere in the
 * request, the Beard filter asked for "a beard in the specified style" with no
 * style, and the Object Remover asked it to remove "the specified object"
 * without ever naming one. Ten prompts referred to a parameter the interface
 * had no way to set; the model filled the gap with a guess, and the guess was
 * the result the user got.
 *
 * An option is a control whose selection is appended to the prompt as a
 * sentence. Resolution runs slug → category → nothing, the same order the
 * presets use, so a specific app can override the set its category gives it.
 *
 * Two rules the content follows:
 *
 *   1. The first choice is the default, and where the app already produced a
 *      sensible result on its own that default is "Auto" with an empty phrase
 *      — selecting nothing then generates exactly what it generates today.
 *   2. Where the base prompt says "the specified X", the default is a real
 *      value, because leaving that one unset is the bug.
 */

export type OptionKind = "select" | "text" | "number";

export interface AppChoice {
  value: string;
  label: string;
  /** Appended to the prompt verbatim. Empty means "add nothing". */
  phrase: string;
}

export interface AppOption {
  id: string;
  label: string;
  kind?: OptionKind;
  /**
   * Generate is blocked until this one has a value.
   *
   * Only for the handful where the app cannot guess: nobody can infer which
   * colour you wanted something recoloured to.
   */
  required?: boolean;
  /** select only. The first entry is the default. */
  choices?: AppChoice[];
  /** text only. */
  placeholder?: string;
  /** text only: `{value}` is replaced with what was typed. */
  template?: string;
  /** number only: the slider's range and starting point. */
  min?: number;
  max?: number;
  step?: number;
  initial?: number;
  /** number only: how the current value reads next to the slider. */
  format?: (n: number) => string;
  /**
   * number only: the sentence appended to the prompt.
   *
   * A function rather than a `{value}` template because a number on its own
   * is a weak instruction. "Make them 8 years old" and "make them 80 years
   * old" need different descriptions of what changes, and the difference is
   * what stops the model splitting the difference and returning a vaguely
   * middle-aged face.
   */
  phraseFor?: (n: number) => string;
  /** Shown under the control when it needs a word of explanation. */
  hint?: string;
}

/** A selection map: option id → chosen value (or typed text). */
export type OptionValues = Record<string, string>;

/**
 * A slider value we are willing to send, or null.
 *
 * The value arrives as a string from a form control and, on the API side,
 * from a request body — so it is not necessarily a number at all, and not
 * necessarily inside the range the slider offered.
 */
export function clampNumber(o: AppOption, raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const lo = o.min ?? Number.NEGATIVE_INFINITY;
  const hi = o.max ?? Number.POSITIVE_INFINITY;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const AUTO: AppChoice = { value: "auto", label: "Auto", phrase: "" };

/** `sel("id", "Label", ...choices)` with Auto already in front. */
function sel(id: string, label: string, choices: AppChoice[], hint?: string): AppOption {
  return { id, label, kind: "select", choices, hint };
}

/** `c("navy", "Navy", "…")` — a choice. */
function c(value: string, label: string, phrase: string): AppChoice {
  return { value, label, phrase };
}

function text(id: string, label: string, placeholder: string, template: string, hint?: string): AppOption {
  return { id, label, kind: "text", placeholder, template, hint };
}

/** `num("age", "Age", { min: 1, max: 100, … })` — a slider. */
function num(
  id: string,
  label: string,
  o: {
    min: number; max: number; step?: number; initial: number;
    format: (n: number) => string;
    phraseFor: (n: number) => string;
    hint?: string;
  }
): AppOption {
  return {
    id, label, kind: "number",
    min: o.min, max: o.max, step: o.step ?? 1, initial: o.initial,
    format: o.format, phraseFor: o.phraseFor, hint: o.hint,
  };
}

// ── Reusable option sets ────────────────────────────────────────────────────

/**
 * How far to push a transformation.
 *
 * The single most requested correction on a stylising app is "too much" or
 * "not enough", and neither is fixable by re-rolling the same prompt.
 */
const STRENGTH = sel("strength", "Strength", [
  AUTO,
  c("subtle", "Subtle", "Apply the transformation lightly: the photograph should still be clearly recognisable as the original, with the style as a finish rather than a replacement."),
  c("strong", "Strong", "Commit fully to the transformation — push the style as far as it goes while keeping the subject recognisable."),
]);

const FRAMING = sel("framing", "Framing", [
  AUTO,
  c("head", "Head & shoulders", "Frame as a head-and-shoulders composition."),
  c("half", "Half body", "Frame from the waist up."),
  c("full", "Full body", "Frame the full figure from head to feet."),
]);

const RETOUCH_STRENGTH = sel("strength", "Strength", [
  AUTO,
  c("subtle", "Subtle", "Keep the edit conservative — it should be hard to tell the photo was retouched at all."),
  c("clear", "Noticeable", "Make the correction clearly visible while keeping everything about it believable."),
  c("full", "Full", "Apply the correction fully, to a commercial-retouch standard, without crossing into plastic or airbrushed skin."),
]);

const BACKDROP = sel("backdrop", "Background", [
  AUTO,
  c("transparent", "Transparent", "Place the subject on a fully transparent background with a precise edge through hair and fine detail."),
  c("white", "Plain white", "Place the subject on a plain white background with a soft natural contact shadow."),
  c("grey", "Studio grey", "Place the subject on a seamless mid-grey studio backdrop with a gentle gradient falloff."),
  c("office", "Office", "Place the subject in a modern office interior, softly out of focus and lit to match the subject."),
  c("outdoor", "Outdoor", "Place the subject outdoors in natural daylight with believable depth behind them."),
  c("gradient", "Gradient", "Place the subject on a smooth two-tone colour gradient."),
  c("blur", "Blur the original", "Keep the original background but throw it convincingly out of focus, as a wide aperture would."),
]);

const PRODUCT_BACKDROP = sel("backdrop", "Background", [
  AUTO,
  c("white", "White sweep", "Pure white seamless background with a soft natural contact shadow, the product centred with even margins."),
  c("studio", "Studio", "Dark gradient studio backdrop with controlled softbox lighting and a crisp specular highlight describing the material."),
  c("lifestyle", "Lifestyle", "A styled real-world surface with props kept well out of focus behind, lit by warm natural window light."),
  c("marble", "Marble", "A polished stone surface, bright diffuse light, and a clean reflection beneath the product."),
  c("outdoor", "Outdoor", "Outdoor natural light on wood or stone, soft dappled shade, believable ambient bounce."),
  c("gradient", "Colour pop", "A bold single-colour gradient background with punchy commercial lighting and strong product separation."),
]);

const LIGHTING = sel("lighting", "Lighting", [
  AUTO,
  c("soft", "Soft daylight", "Light it with soft, even daylight and gentle shadows."),
  c("golden", "Golden hour", "Light it with warm low sun, long soft shadows and gentle backlight rimming the subject."),
  c("studio", "Studio", "Light it with controlled studio softboxes: a clear key, a soft fill and clean catchlights."),
  c("moody", "Moody", "Light it low-key: one soft source, deep shadow, rich contrast and restrained colour."),
  c("bright", "Bright & airy", "Light it high-key: bright, airy, minimal shadow and a light overall tone."),
]);

const SETTING = sel("setting", "Setting", [
  AUTO,
  c("studio", "Studio", "Set it in a photographic studio against a clean backdrop."),
  c("outdoor", "Outdoors", "Set it outdoors with a natural landscape behind, at a believable distance and depth."),
  c("street", "City street", "Set it on a real city street with architecture and depth behind the subject."),
  c("home", "Indoors", "Set it in a warm, tastefully furnished interior with natural window light."),
  c("garden", "Garden", "Set it in a garden with greenery and dappled natural light."),
  c("beach", "Beach", "Set it on a beach with soft sand, open sky and warm low light."),
]);

const ATTIRE = sel("attire", "Attire", [
  AUTO,
  c("suit", "Suit & tie", "Dress the subject in a well-fitted dark business suit with a shirt and tie."),
  c("blazer", "Blazer, no tie", "Dress the subject in a tailored blazer over an open-collar shirt."),
  c("smart", "Smart casual", "Dress the subject in smart-casual business dress — a shirt or knitwear, no jacket."),
  c("knit", "Shirt & sweater", "Dress the subject in a collared shirt under a fine-knit sweater."),
  c("own", "Keep my clothes", "Keep the clothing exactly as it is in the photo and change only the lighting, background and framing."),
]);

const CLINICAL_ATTIRE = sel("attire", "Attire", [
  AUTO,
  c("coat", "White coat", "Dress the subject in a clean white clinical coat over business dress."),
  c("coatscrubs", "Coat over scrubs", "Dress the subject in a white clinical coat over scrubs."),
  c("scrubs", "Scrubs", "Dress the subject in clean, well-fitted scrubs."),
  c("suit", "Suit, no coat", "Dress the subject in business dress with no clinical coat."),
  c("own", "Keep my clothes", "Keep the clothing exactly as it is and change only the lighting, background and framing."),
]);

const HEADSHOT_BACKDROP = sel("backdrop", "Background", [
  AUTO,
  c("grey", "Neutral grey", "Use a plain neutral grey studio background with a soft gradient falloff."),
  c("white", "Plain white", "Use a plain white background with flat even lighting and no shadow behind the head."),
  c("office", "Office, blurred", "Use a modern office interior thrown well out of focus behind the subject."),
  c("outdoor", "Outdoor", "Use softly blurred greenery or architecture in natural daylight behind the subject."),
  c("dark", "Dark", "Use a dark low-key background with the subject separated by rim light."),
]);

const SOCIAL_LOOK = sel("look", "Look", [
  AUTO,
  c("bold", "Bold", "Punchy saturated colour, strong contrast and clear subject separation so it reads at thumbnail size."),
  c("clean", "Clean", "A restrained palette, generous negative space and one clear focal point."),
  c("dark", "Dark mode", "A dark background with bright accent colour and strong subject separation."),
]);

const TEXT_SPACE = sel("textspace", "Text space", [
  AUTO,
  c("leave", "Leave room for text", "Compose with a large clear area of empty space for a headline to be added later."),
  c("fill", "Fill the frame", "Fill the frame with the subject and leave no reserved space for text."),
]);

const PFP_BACKDROP = sel("backdrop", "Background", [
  AUTO,
  c("solid", "Solid colour", "Put the subject on a single flat colour behind, chosen to contrast with them."),
  c("gradient", "Gradient", "Put the subject on a smooth two-tone gradient behind."),
  c("blur", "Blurred scene", "Keep a real setting behind the subject but thrown well out of focus."),
  c("transparent", "Transparent", "Put the subject on a fully transparent background with a precise edge."),
]);

/** A profile picture is a circle: nothing important may sit near the edge. */
const PFP_CROP = sel("crop", "Crop", [
  AUTO,
  c("circle", "Circle-safe", "Compose so nothing important is lost to a tight circular crop, with the head centred and clear margins."),
  c("tight", "Tight on the face", "Crop tightly to the face so it still reads at very small sizes."),
  c("shoulders", "Head & shoulders", "Frame head and shoulders with even margins."),
]);

const UPSCALE_AMOUNT = sel("amount", "Enlarge by", [
  AUTO,
  c("2x", "2×", "Enlarge to roughly twice the original dimensions."),
  c("4x", "4×", "Enlarge to roughly four times the original dimensions — more reconstruction, so judge the result at full size."),
]);

const ENHANCE_FINISH = sel("finish", "Finish", [
  AUTO,
  c("natural", "Natural", "Keep the finish honest: no added contrast, no stylisation, grain structure left natural."),
  c("crisp", "Crisp", "Favour acuity and micro-contrast, without edge halos."),
  c("print", "Print-ready", "Prepare for print: maximum honest resolution, neutral colour, nothing stylised."),
]);

const RESTORE_COLOUR = sel("colour", "Colour", [
  AUTO,
  c("mono", "Keep black & white", "Stay black and white: restore contrast and remove damage, but add no colour at all."),
  c("natural", "Colourise naturally", "Colourise with restrained, period-plausible tones and believable skin colour."),
  c("vivid", "Vivid colour", "Colourise with fuller, more saturated colour while keeping skin tones believable."),
]);

const REMOVE_FILL = sel("fill", "Fill the gap with", [
  AUTO,
  c("rebuild", "What was behind it", "Reconstruct whatever was behind the removed area, continuing the surrounding texture, perspective and lighting exactly."),
  c("plain", "A clean surface", "Fill the removed area with a clean continuation of the nearest plain surface rather than inventing new detail."),
]);

/**
 * What a face at a given age actually looks like.
 *
 * A bare number is a weak instruction — asked to make someone "62", the model
 * tends to produce the same non-specific middle-aged face it produces for 48.
 * Naming what changes at that age is what makes the slider worth having, and
 * it is the same information the six fixed choices used to carry, spread
 * across the whole range instead of six points on it.
 */
function ageAppearance(n: number): string {
  if (n <= 3) return "the rounded features, smooth skin and fine soft hair of a toddler";
  if (n <= 9) return "the softer proportions and unlined skin of a young child, with a child's larger eyes relative to the face";
  if (n <= 12) return "the lengthening face and unlined skin of a pre-teen, before adolescence changes the jaw";
  if (n <= 17) return "the sharper adolescent bone structure of a teenager, with clear skin and a fuller hairline";
  if (n <= 24) return "the taut skin, full facial volume and unlined features of a young adult in their early twenties";
  if (n <= 34) return "the firm skin and full volume of someone in their thirties, with at most the faintest expression lines";
  if (n <= 44) return "the first settled fine lines around the eyes and mouth, slightly softer facial volume, hair still largely its own colour";
  if (n <= 54) return "established lines around the eyes and mouth, greying at the temples and a softening jawline";
  if (n <= 64) return "deeper lines, substantially grey hair, thinner skin and a visible loss of facial volume";
  if (n <= 74) return "pronounced wrinkles, white or thinning hair, age spots and a clear loss of skin elasticity";
  if (n <= 84) return "deep-set wrinkles, sparse white hair, thin papery skin and a markedly changed facial structure";
  return "the deep folds, very sparse white hair, translucent skin and pronounced bone structure of great age";
}

/**
 * What a person of that age is wearing, and where they are.
 *
 * Ageing a face and leaving everything else alone produces a wrinkled adult
 * in the same outfit in the same doorway — recognisably a retouch rather than
 * a photograph of someone at that age. A one-year-old is not standing at a
 * wedding reception in a lehenga; a schoolchild is in school clothes
 * somewhere a schoolchild would be.
 *
 * Deliberately says "as someone of their culture would dress" rather than
 * naming garments: the right clothes for a 70-year-old depend entirely on who
 * she is, and a hard-coded answer would dress everyone the same way.
 */
function ageStaging(n: number): string {
  const setting =
    n <= 3 ? "held or seated as an infant is, in a home or nursery setting, in baby clothes"
    : n <= 12 ? "dressed and groomed as a child of that age, somewhere a child would be — a home, a garden, a school"
    : n <= 17 ? "dressed as a teenager of that age, in a setting that suits one"
    : n <= 24 ? "dressed as a young adult of that age, in a casual everyday setting"
    : n <= 44 ? "dressed as an adult of that age would dress day to day, in an ordinary everyday setting"
    : n <= 64 ? "dressed as someone of that age would dress, in a calm domestic or everyday setting"
    : "dressed as an older person of that age would dress, in a calm domestic setting";

  return (
    `Re-stage the whole photograph for that age: the person should be ${setting}, ` +
    `with a hairstyle, posture and expression that belong to someone of that age. ` +
    `Dress them as a person of their own culture and background would dress at that age — ` +
    `do not keep the outfit, hairstyle, pose or background from the original photograph. ` +
    `Light and frame it as an ordinary photograph taken of them at that age.`
  );
}

function years(n: number): string {
  return n === 1 ? "1 year old" : `${n} years old`;
}

/**
 * One sentence that works in both directions.
 *
 * The slider runs from 1, so it de-ages as readily as it ages, and the
 * instruction must not assume which. "Age this person to 8" is a contradiction
 * the model resolves by ignoring one half of it.
 */
function agePhrase(n: number): string {
  return (
    `Show this exact person at ${years(n)} — not older, not younger. ` +
    `At this age they have ${ageAppearance(n)}. ` +
    `${ageStaging(n)} ` +
    `Keep them unmistakably the same person: the same bone structure, eye shape, ` +
    `nose and mouth, changed only by age. Do not change their ethnicity, ` +
    `and do not substitute a different face.`
  );
}

const AGE_SLIDER = num("age", "Age them to", {
  min: 1, max: 100, initial: 65,
  format: years,
  phraseFor: agePhrase,
  hint: "Drag anywhere from 1 to 100 — below their current age it de-ages instead.",
});

/** The same control, for the apps that only ever age upward. */
const OLDER_SLIDER = num("age", "Age them to", {
  min: 40, max: 100, initial: 75,
  format: years,
  phraseFor: agePhrase,
});

// ── Per-category defaults ───────────────────────────────────────────────────

const BY_CATEGORY: Record<string, AppOption[]> = {
  headshot:   [ATTIRE, HEADSHOT_BACKDROP],
  portrait:   [SETTING, LIGHTING],
  style:      [FRAMING, STRENGTH],
  retouch:    [RETOUCH_STRENGTH],
  restore:    [RESTORE_COLOUR, RETOUCH_STRENGTH],
  background: [BACKDROP],
  remove:     [REMOVE_FILL],
  enhance:    [UPSCALE_AMOUNT, ENHANCE_FINISH],
  product:    [PRODUCT_BACKDROP, LIGHTING],
  social:     [SOCIAL_LOOK, TEXT_SPACE],
  fun:        [STRENGTH],
};

/**
 * The category each curated app belongs to.
 *
 * The 42 hand-written apps predate the catalogue and carry no `cat`, so
 * without this they would be the only apps on the site with no options at all
 * — and they are the ones on the front page.
 */
const CURATED_CAT: Record<string, string> = {
  "saree-photoshoot": "portrait",
  "3d-figurine": "fun",
  "retro-bollywood": "style",
  "polaroid-photo": "style",
  "restore-old-photos": "restore",
  "couple-photoshoot": "portrait",
  "professional-headshot": "headshot",
  "festival-photoshoot": "portrait",
  "pet-portrait": "style",
  "anime-style": "style",
  "passport-photo": "headshot",
  "background-changer": "background",
  "linkedin-banner": "social",
  "christmas-photo": "portrait",
  "baby-photoshoot": "portrait",
  "graduation-photo": "portrait",
  "gym-transformation": "retouch",
  "ghibli-style": "style",
  "y2k-aesthetic": "style",
  "wedding-invite-photo": "social",
  "corporate-avatar": "headshot",
  "old-money-aesthetic": "portrait",
  "barbie-box": "fun",
  "ai-baby-predictor": "fun",
  "lego-minifigure": "fun",
  "pixar-avatar": "style",
  "renaissance-portrait": "style",
  "age-progression": "fun",
  "superhero-costume": "style",
  "tarot-card-portrait": "style",
  "90s-yearbook-photo": "fun",
  "cyberpunk-avatar": "style",
  "funko-pop-figure": "fun",
  "claymation-portrait": "style",
  "comic-book-cover": "style",
  "coastal-cowgirl": "portrait",
  "old-hollywood-glamour": "portrait",
  "prom-photoshoot": "portrait",
  "thanksgiving-photoshoot": "portrait",
  "glow-up-filter": "retouch",
  "astronaut-photoshoot": "style",
  "pixel-art-avatar": "style",
};

// ── Per-app overrides ───────────────────────────────────────────────────────

const AGE = AGE_SLIDER;

const FIGURE_PACKAGING = sel("packaging", "Presentation", [
  c("box", "In its box", "Show the figure inside printed retail packaging with a clear window, photographed as a product shot."),
  c("base", "On a display base", "Show the figure standing on a round display base against a plain studio background, with no packaging."),
  c("desk", "On a desk", "Show the figure standing on a real desk beside everyday objects, so its scale reads immediately."),
  c("scene", "In a scene", "Show the figure in a full miniature scene with believable set dressing and lighting."),
]);

const BUILD = sel("build", "Build", [
  c("toned", "Lightly toned", "Add light, natural muscle tone — the build of someone who trains occasionally."),
  c("athletic", "Athletic", "Give an athletic build with clear but natural definition."),
  c("muscular", "Muscular", "Give a heavily muscular, gym-trained build with pronounced definition, keeping proportions anatomically possible."),
]);

const TATTOO_STYLE = sel("style", "Style", [
  c("fineline", "Fine line", "Draw it as a fine-line tattoo: thin single-weight black lines, no shading, delicate detail."),
  c("traditional", "Traditional", "Draw it as an American traditional tattoo: heavy black outlines, a limited flat palette, bold simple shapes."),
  c("blackwork", "Blackwork", "Draw it as blackwork: solid black fills, high contrast, strong negative space."),
  c("realism", "Realism", "Draw it as a realism tattoo: smooth greyscale shading and photographic detail."),
  c("watercolour", "Watercolour", "Draw it as a watercolour tattoo: soft colour washes and bleeding edges with minimal outline."),
]);

const TATTOO_PLACEMENT = sel("placement", "Placement", [
  c("forearm", "Forearm", "Place it on the inner forearm, wrapping believably with the curve of the arm."),
  c("shoulder", "Shoulder", "Place it on the outer shoulder and upper arm, following the deltoid curve."),
  c("back", "Upper back", "Place it across the upper back, centred on the spine."),
  c("ankle", "Ankle", "Place it just above the ankle, small and following the leg's curve."),
  c("collar", "Collarbone", "Place it along the collarbone, sized to sit between the shoulder and the sternum."),
]);

const MONTH_FLOWERS: AppChoice[] = [
  c("jan", "January — carnation", "Use the January birth flower: the carnation."),
  c("feb", "February — violet", "Use the February birth flower: the violet."),
  c("mar", "March — daffodil", "Use the March birth flower: the daffodil."),
  c("apr", "April — daisy", "Use the April birth flower: the daisy."),
  c("may", "May — lily of the valley", "Use the May birth flower: lily of the valley."),
  c("jun", "June — rose", "Use the June birth flower: the rose."),
  c("jul", "July — larkspur", "Use the July birth flower: the larkspur."),
  c("aug", "August — gladiolus", "Use the August birth flower: the gladiolus."),
  c("sep", "September — aster", "Use the September birth flower: the aster."),
  c("oct", "October — marigold", "Use the October birth flower: the marigold."),
  c("nov", "November — chrysanthemum", "Use the November birth flower: the chrysanthemum."),
  c("dec", "December — narcissus", "Use the December birth flower: the narcissus."),
];

/**
 * Only for the apps that are *about* travelling between eras.
 *
 * The yearbook and 80s apps name their decade in the page title and the base
 * prompt, so offering to change it there would contradict the page the visitor
 * arrived on. They get a period-accurate choice of their own instead.
 */
const DECADE = sel("decade", "Decade", [
  c("1990s", "1990s", "Set it in the 1990s: the clothing, hair, grooming and the film and lens look of that decade."),
  c("1980s", "1980s", "Set it in the 1980s: the clothing, hair, grooming and the film and lens look of that decade."),
  c("1970s", "1970s", "Set it in the 1970s: the clothing, hair, grooming and the warm faded film look of that decade."),
  c("1960s", "1960s", "Set it in the 1960s: the clothing, hair, grooming and the film look of that decade."),
  c("1950s", "1950s", "Set it in the 1950s: the clothing, hair, grooming and the film look of that decade."),
  c("1920s", "1920s", "Set it in the 1920s: the clothing, hair, grooming and the photographic look of that period."),
  c("2000s", "2000s", "Set it in the 2000s: the clothing, hair, grooming and the early-digital-camera look of that decade."),
]);

const YEARBOOK_BACKDROP = sel("backdrop", "Backdrop", [
  c("laser", "Laser grid", "Use the classic laser-grid studio backdrop of the period."),
  c("mottled", "Mottled blue", "Use a mottled blue-grey painted studio backdrop."),
  c("marble", "Marbled grey", "Use a marbled grey studio backdrop."),
  c("sunset", "Gradient sunset", "Use an airbrushed sunset gradient backdrop."),
  c("library", "Library", "Use a bookshelf backdrop, softly out of focus."),
]);

const EIGHTIES_LOOK = sel("look", "Look", [
  c("mall", "Mall studio portrait", "Stage it as a mall portrait-studio sitting: soft-focus glow, a painted backdrop and a posed three-quarter turn."),
  c("prom", "Prom night", "Stage it as a prom photograph: formalwear, a balloon arch or foil backdrop, and hard on-camera flash."),
  c("band", "Band promo", "Stage it as a band promo shot: moody coloured gels, a brick or alley setting and a deliberately cool expression."),
  c("family", "Family portrait", "Stage it as a formal family portrait of the period: matching knitwear, a neutral backdrop and even studio flash."),
  c("holiday", "Holiday snapshot", "Stage it as a holiday snapshot on 35mm: bright sun, slight overexposure and faded colour."),
]);

const HAIR_COLOUR = sel("colour", "Hair colour", [
  c("blonde", "Blonde", "Change the hair to a natural golden blonde."),
  c("platinum", "Platinum", "Change the hair to a cool platinum blonde, almost white."),
  c("lightbrown", "Light brown", "Change the hair to a light ash brown."),
  c("darkbrown", "Dark brown", "Change the hair to a deep chocolate brown."),
  c("black", "Black", "Change the hair to a natural jet black with blue-toned highlights."),
  c("auburn", "Auburn", "Change the hair to a warm auburn."),
  c("red", "Copper red", "Change the hair to a bright copper red."),
  c("silver", "Silver grey", "Change the hair to a silver grey."),
  c("pink", "Pastel pink", "Change the hair to a pastel pink."),
  c("blue", "Blue", "Change the hair to a deep vivid blue."),
]);

const BLONDE_SHADE = sel("shade", "Shade", [
  c("golden", "Golden", "Make it a warm golden blonde with believable root shadow."),
  c("platinum", "Platinum", "Make it a cool platinum blonde, almost white, with a faint grey undertone."),
  c("ash", "Ash", "Make it an ash blonde with cool, slightly muted tones."),
  c("honey", "Honey", "Make it a honey blonde with warm caramel depth through the mid-lengths."),
  c("strawberry", "Strawberry", "Make it a strawberry blonde with a soft copper warmth."),
  c("balayage", "Balayage", "Make it a blonde balayage: darker roots melting into lighter ends."),
]);

const CURL_TYPE = sel("curl", "Curl type", [
  c("waves", "Loose waves", "Give it loose, soft waves with plenty of movement."),
  c("curls", "Defined curls", "Give it well-defined spiral curls with believable volume and root lift."),
  c("coils", "Tight coils", "Give it tight natural coils with dense, even definition."),
  c("perm", "Beach curls", "Give it relaxed beach curls, looser at the roots and tighter toward the ends."),
]);

const BRACES_TYPE = sel("type", "Braces", [
  c("metal", "Metal", "Add traditional metal brackets with a silver archwire."),
  c("ceramic", "Ceramic / clear", "Add tooth-coloured ceramic brackets with a fine, barely visible wire."),
  c("coloured", "Coloured bands", "Add metal brackets with coloured elastic bands on each one."),
  c("aligner", "Clear aligner", "Add a clear aligner tray over the teeth, with a faint edge line and realistic reflections."),
]);

const EYE_COLOUR = sel("colour", "Eye colour", [
  c("blue", "Blue", "Change the iris colour to a natural blue."),
  c("green", "Green", "Change the iris colour to a natural green."),
  c("hazel", "Hazel", "Change the iris colour to hazel, with the usual green-to-amber variation."),
  c("lightbrown", "Light brown", "Change the iris colour to a light amber brown."),
  c("darkbrown", "Dark brown", "Change the iris colour to a deep brown."),
  c("grey", "Grey", "Change the iris colour to a cool grey."),
  c("amber", "Amber", "Change the iris colour to a golden amber."),
]);

const HAIRSTYLE = sel("style", "Hairstyle", [
  c("longstraight", "Long & straight", "Give them long straight hair falling past the shoulders."),
  c("longwavy", "Long & wavy", "Give them long, loosely waved hair past the shoulders."),
  c("bob", "Shoulder bob", "Give them a blunt bob cut level with the jaw."),
  c("pixie", "Pixie crop", "Give them a short pixie crop with textured layers."),
  c("curls", "Natural curls", "Give them defined natural curls with believable volume and root lift."),
  c("ponytail", "Ponytail", "Give them a high ponytail with a clean hairline and a few loose strands."),
  c("bun", "Bun", "Give them hair gathered into a neat bun."),
  c("quiff", "Side part & quiff", "Give them a side-parted quiff with tapered sides."),
  c("braids", "Braids", "Give them neat braids with a believable parting pattern."),
]);

const BEARD = sel("style", "Beard", [
  c("stubble", "Stubble", "Add short even stubble of a few days' growth."),
  c("short", "Short boxed", "Add a short boxed beard, neatly trimmed and following the jawline."),
  c("full", "Full beard", "Add a full beard with natural density and a tidy outline."),
  c("goatee", "Goatee", "Add a goatee on the chin with a connected moustache."),
  c("moustache", "Moustache only", "Add a moustache only, leaving the rest of the face clean-shaven."),
  c("vandyke", "Van Dyke", "Add a Van Dyke: a pointed chin beard with a detached moustache."),
]);

const GLASSES = sel("frames", "Frames", [
  c("round", "Round metal", "Add round thin metal-framed spectacles."),
  c("square", "Square acetate", "Add square black acetate-framed spectacles."),
  c("rimless", "Rimless", "Add rimless spectacles with thin temple arms."),
  c("cateye", "Cat-eye", "Add cat-eye framed spectacles."),
  c("aviator", "Aviator sunglasses", "Add aviator sunglasses with believable reflections in the lenses."),
  c("sport", "Sport", "Add wraparound sport sunglasses."),
]);

const SAREE_COLOUR = sel("colour", "Saree colour", [
  AUTO,
  c("red", "Deep red", "Dress her in a deep red silk saree with gold zari work."),
  c("blue", "Royal blue", "Dress her in a royal blue silk saree with silver detailing."),
  c("emerald", "Emerald green", "Dress her in an emerald green silk saree with gold border work."),
  c("black", "Black & gold", "Dress her in a black saree with heavy gold embroidery."),
  c("pastel", "Pastel pink", "Dress her in a soft pastel pink chiffon saree with delicate detailing."),
  c("ivory", "Ivory & gold", "Dress her in an ivory silk saree with a gold border."),
]);

const INTERIOR_STYLE = sel("style", "Interior style", [
  AUTO,
  c("modern", "Modern minimal", "Redesign it in a modern minimal style: clean lines, a restrained palette and uncluttered surfaces."),
  c("scandi", "Scandinavian", "Redesign it in a Scandinavian style: pale wood, white walls, soft textiles and abundant daylight."),
  c("industrial", "Industrial", "Redesign it in an industrial style: exposed brick, black metal, raw wood and utilitarian fittings."),
  c("midcentury", "Mid-century", "Redesign it in a mid-century modern style: warm walnut, tapered legs and muted period colour."),
  c("boho", "Boho", "Redesign it in a bohemian style: layered textiles, plants, rattan and warm earthy colour."),
  c("luxury", "Luxury", "Redesign it in a luxury style: marble, brass, deep upholstery and considered accent lighting."),
]);

const VEHICLE_SETTING = sel("setting", "Setting", [
  AUTO,
  c("studio", "Studio", "Place it in a professional vehicle studio: seamless backdrop, sculpted lighting along the bodywork, a clean floor reflection."),
  c("road", "Mountain road", "Place it on an empty mountain road with landscape behind and warm low sun on the bodywork."),
  c("city", "City at night", "Place it on a city street at night with wet asphalt and neon reflections along the bodywork."),
  c("showroom", "Showroom", "Place it in a bright showroom with even overhead lighting and a polished floor."),
]);

const FOOD_SETTING = sel("setting", "Setting", [
  AUTO,
  c("overhead", "Overhead on marble", "Shoot it flat overhead on a marble surface with soft diffuse light."),
  c("rustic", "Rustic wood", "Shoot it on rustic wood with warm directional window light and natural props."),
  c("restaurant", "Restaurant table", "Shoot it on a laid restaurant table with the room softly out of focus behind."),
  c("dark", "Dark & moody", "Shoot it dark and moody: a single raking light, deep shadow and rich colour."),
]);

const PROPERTY_TIME = sel("time", "Time of day", [
  AUTO,
  c("day", "Bright daylight", "Light it as bright midday: clear sky, even natural light, no blown windows."),
  c("golden", "Golden evening", "Light it at golden hour: warm low sun through the windows and long soft shadows."),
  c("twilight", "Twilight", "Light it at twilight: a deep blue sky with the interior lights warm and glowing."),
]);

const EXPRESSION = sel("expression", "Expression", [
  c("happy", "Happy", "Change the expression to a genuine happy one, with the eyes creasing the way they do in a real smile."),
  c("serious", "Serious", "Change the expression to a composed, serious one with a relaxed mouth and steady eyes."),
  c("surprised", "Surprised", "Change the expression to a surprised one: raised brows, widened eyes, a slightly open mouth."),
  c("calm", "Calm", "Change the expression to a calm, settled one."),
  c("confident", "Confident", "Change the expression to a confident one: level brows, a slight closed-mouth smile, direct gaze."),
]);

const SMILE = sel("smile", "Smile", [
  c("closed", "Subtle, closed-lip", "Add a subtle closed-lip smile with the cheeks slightly raised."),
  c("natural", "Natural", "Add a natural smile showing a little of the upper teeth, with the eyes creasing to match."),
  c("broad", "Broad", "Add a broad open smile showing the teeth, with the whole face engaged."),
]);

const HERO_PALETTE = sel("palette", "Costume colours", [
  AUTO,
  c("redgold", "Red & gold", "Give the costume a red and gold colour scheme with metallic detailing."),
  c("bluered", "Blue & red", "Give the costume a classic blue and red colour scheme."),
  c("black", "Black stealth", "Give the costume a matte black stealth colour scheme with minimal accents."),
  c("green", "Green", "Give the costume a deep green colour scheme with darker panelling."),
  c("white", "White & silver", "Give the costume a white and silver colour scheme with a cool metallic sheen."),
]);

const GOWN = sel("gown", "Gown colour", [
  AUTO,
  c("black", "Black", "Dress them in a black academic gown with a matching mortarboard."),
  c("navy", "Navy", "Dress them in a navy academic gown with a matching mortarboard."),
  c("red", "Red", "Dress them in a red academic gown with a matching mortarboard."),
  c("blue", "Royal blue", "Dress them in a royal blue academic gown with a matching mortarboard."),
  c("green", "Green", "Dress them in a green academic gown with a matching mortarboard."),
]);

const POLAROID_FRAME = sel("frame", "Frame", [
  AUTO,
  c("classic", "Classic white", "Present it in a classic white instant-film frame with the wide border at the bottom."),
  c("sepia", "Vintage", "Present it in an aged instant-film frame with yellowed borders and faded warm colour."),
  c("caption", "With a caption", "Present it in a white instant-film frame with a short handwritten caption in the bottom border."),
]);

const PIXEL_DEPTH = sel("depth", "Pixel size", [
  AUTO,
  c("8bit", "Chunky 8-bit", "Render it as chunky 8-bit pixel art on a coarse grid with a very limited palette."),
  c("16bit", "16-bit", "Render it as 16-bit pixel art with a finer grid, more colours and careful dithering."),
  c("32bit", "Detailed", "Render it as detailed pixel art with a fine grid, smooth shading ramps and a broad palette."),
]);

const BABY_STAGE = sel("stage", "Stage", [
  c("newborn", "Newborn", "Show the child as a newborn baby."),
  c("6m", "6 months", "Show the child at about six months old."),
  c("toddler", "Toddler", "Show the child as a toddler of about two years old."),
  c("child", "Young child", "Show the child at about five years old."),
]);

const YOUNGER_AGE = sel("age", "Make them look", [
  c("toddler", "A toddler", "De-age the person to a toddler of about three years old."),
  c("child", "A young child", "De-age the person to a child of about six years old."),
  c("preteen", "A pre-teen", "De-age the person to a pre-teen of about eleven years old."),
  c("teen", "A teenager", "De-age the person to a teenager of about sixteen years old."),
]);

const HAIR_LENGTH = sel("length", "Length", [
  c("shoulder", "Shoulder length", "Extend the hair to shoulder length."),
  c("midback", "Mid-back", "Extend the hair to mid-back length."),
  c("waist", "Waist length", "Extend the hair to waist length."),
]);

const BANGS = sel("shape", "Fringe shape", [
  c("blunt", "Blunt", "Add a blunt fringe cut straight across the brow."),
  c("curtain", "Curtain", "Add a curtain fringe parted in the centre and sweeping to both sides."),
  c("side", "Side-swept", "Add a side-swept fringe falling across one side of the forehead."),
  c("wispy", "Wispy", "Add a thin wispy fringe with visible separation between strands."),
  c("baby", "Micro", "Add a very short micro fringe sitting well above the brow."),
]);

const BROWS = sel("shape", "Brow shape", [
  c("natural", "Natural", "Reshape the eyebrows to a natural, lightly groomed shape."),
  c("arch", "Soft arch", "Reshape the eyebrows with a soft, even arch."),
  c("straight", "Straight", "Reshape the eyebrows to a straight, level line."),
  c("full", "Thick & full", "Reshape the eyebrows to be thick and full, with dense natural hair detail."),
  c("thin", "Thin & defined", "Reshape the eyebrows to a thin, sharply defined line."),
]);

const PIERCING = sel("placement", "Piercing", [
  c("lobe", "Ear lobe", "Add a small stud in the ear lobe."),
  c("helix", "Helix", "Add a small hoop in the upper ear helix."),
  c("nose", "Nose stud", "Add a small nose stud on one nostril."),
  c("septum", "Septum", "Add a septum ring."),
  c("eyebrow", "Eyebrow", "Add an eyebrow barbell."),
  c("lip", "Lip", "Add a small lip ring at one corner of the mouth."),
]);

const PASSPORT_COUNTRY = sel("country", "Format", [
  c("us", "US — 2×2in", "Format as a US passport photo: square 2×2 inches, plain white background, neutral expression, the head centred and fully visible."),
  c("uk", "UK / EU — 35×45mm", "Format as a UK or EU passport photo: 35×45mm, plain light grey background, neutral expression, no shadow on the face."),
  c("india", "India — 2×2in", "Format as an Indian passport photo: square 2×2 inches, plain white background, the face filling most of the frame, neutral expression."),
  c("schengen", "Schengen visa", "Format as a Schengen visa photo: 35×45mm, plain light background, the head 32–36mm from chin to crown, neutral expression."),
  c("canada", "Canada — 50×70mm", "Format as a Canadian passport photo: 50×70mm, plain white background, the head 31–36mm from chin to crown."),
  c("china", "China — 33×48mm", "Format as a Chinese visa photo: 33×48mm, plain white background, the head centred, ears visible, neutral expression."),
]);

const ID_BACKDROP = sel("backdrop", "Background", [
  c("white", "Plain white", "Use a plain pure white background with no shadow behind the head."),
  c("grey", "Light grey", "Use a plain light grey background with no shadow behind the head."),
  c("blue", "Light blue", "Use a plain light blue background with no shadow behind the head."),
]);

const SUIT_COLOUR = sel("suit", "Suit", [
  c("navy", "Navy, with tie", "Dress them in a well-fitted navy suit with a white shirt and a plain tie."),
  c("charcoal", "Charcoal, with tie", "Dress them in a well-fitted charcoal suit with a white shirt and a plain tie."),
  c("black", "Black, with tie", "Dress them in a well-fitted black suit with a white shirt and a plain tie."),
  c("navynotie", "Navy, no tie", "Dress them in a well-fitted navy suit with an open-collar white shirt and no tie."),
  c("grey", "Light grey", "Dress them in a well-fitted light grey suit with a white shirt."),
]);

const LOGO_STYLE = sel("style", "Logo style", [
  AUTO,
  c("wordmark", "Wordmark", "Design it as a clean typographic wordmark with careful letter spacing."),
  c("mark", "Icon & text", "Design it as a simple geometric icon with the name set beside it."),
  c("badge", "Badge", "Design it as a circular badge with the name running around the mark."),
  c("mascot", "Mascot", "Design it as a bold mascot logo with heavy outlines and a limited palette."),
  c("minimal", "Minimal", "Design it as a minimal monoline mark in a single colour."),
]);

const BOOK_GENRE = sel("genre", "Genre", [
  AUTO,
  c("thriller", "Thriller", "Use a thriller book-cover visual language: high contrast, cold colour, tense negative space."),
  c("romance", "Romance", "Use a romance book-cover visual language: warm light, soft focus, an elegant script-friendly layout."),
  c("scifi", "Sci-fi", "Use a science-fiction book-cover visual language: cool metallics, scale and atmospheric depth."),
  c("fantasy", "Fantasy", "Use a fantasy book-cover visual language: ornate detail, rich colour and a heroic sense of scale."),
  c("horror", "Horror", "Use a horror book-cover visual language: deep shadow, unsettling framing, a desaturated palette."),
  c("literary", "Literary", "Use a literary book-cover visual language: restrained typography-led design, muted colour, generous space."),
  c("nonfiction", "Non-fiction", "Use a non-fiction book-cover visual language: clear hierarchy, a confident single image and plain strong type."),
]);

const MUSIC_GENRE = sel("genre", "Genre", [
  AUTO,
  c("pop", "Pop", "Use a pop album visual language: bright saturated colour, a bold centred subject and clean modern type."),
  c("hiphop", "Hip-hop", "Use a hip-hop album visual language: strong contrast, confident posing, gold or chrome accents."),
  c("rock", "Rock", "Use a rock album visual language: grain, high contrast monochrome or muted colour, a raw unposed feel."),
  c("electronic", "Electronic", "Use an electronic album visual language: geometric abstraction, neon gradients and a synthetic finish."),
  c("indie", "Indie folk", "Use an indie folk album visual language: soft natural light, film texture and a quiet, understated composition."),
  c("jazz", "Jazz", "Use a classic jazz album visual language: duotone colour blocks, mid-century type and a smoky monochrome portrait."),
  c("metal", "Metal", "Use a metal album visual language: dark dense artwork, heavy ornament and a near-black palette."),
]);

const FILM_GENRE = sel("genre", "Genre", [
  AUTO,
  c("action", "Action", "Use an action film-poster visual language: teal and orange grade, a low hero angle and explosive scale."),
  c("thriller", "Thriller", "Use a thriller film-poster visual language: cold colour, deep shadow and a tense off-centre composition."),
  c("scifi", "Sci-fi", "Use a science-fiction film-poster visual language: vast scale, cool metallics and atmospheric haze."),
  c("horror", "Horror", "Use a horror film-poster visual language: near-black background, a single unsettling element and stark type."),
  c("romance", "Romance", "Use a romance film-poster visual language: warm light, soft focus and a close two-shot composition."),
  c("comedy", "Comedy", "Use a comedy film-poster visual language: bright flat colour, a playful pose and light-hearted type."),
  c("drama", "Drama", "Use a drama film-poster visual language: restrained colour, a contemplative portrait and quiet typography."),
]);

const COMIC_GENRE = sel("genre", "Comic style", [
  AUTO,
  c("superhero", "Superhero", "Use a mainstream superhero comic style: bold inks, dynamic foreshortening and saturated primaries."),
  c("noir", "Noir", "Use a noir comic style: heavy black spotting, rain and hard shadow, a near-monochrome palette."),
  c("manga", "Manga", "Use a manga style: screentone shading, expressive linework and speed lines."),
  c("retro", "Golden age", "Use a golden-age comic style: limited flat colour, visible halftone dots and period lettering."),
  c("indie", "Indie", "Use an indie comic style: looser linework, muted colour and an unshowy layout."),
]);

const THUMBNAIL_MOOD = sel("mood", "Reaction", [
  AUTO,
  c("excited", "Excited", "Give the subject an excited, high-energy expression."),
  c("shocked", "Shocked", "Give the subject a shocked, wide-eyed expression."),
  c("serious", "Serious", "Give the subject a serious, credible expression."),
  c("happy", "Happy", "Give the subject a warm, happy expression."),
]);

const FESTIVAL = sel("festival", "Festival", [
  AUTO,
  c("diwali", "Diwali", "Set it at Diwali: diyas and warm lamplight, rangoli, festive traditional dress and marigold decoration."),
  c("holi", "Holi", "Set it at Holi: clouds of coloured powder, white clothing stained with colour, bright daylight."),
  c("navratri", "Navratri", "Set it at Navratri: mirrored chaniya choli or kediyu, garba lighting and a decorated venue."),
  c("eid", "Eid", "Set it at Eid: elegant traditional dress, crescent and lantern decoration, warm evening light."),
  c("christmas", "Christmas", "Set it at Christmas: a decorated tree, warm string lights and festive knitwear."),
  c("onam", "Onam", "Set it at Onam: kasavu white-and-gold dress, a pookalam flower carpet and bright natural light."),
  c("pongal", "Pongal", "Set it at Pongal: traditional South Indian dress, sugarcane and kolam decoration in warm daylight."),
]);

const HOLIDAY_SCENE = sel("scene", "Scene", [
  AUTO,
  c("tree", "By the tree", "Set it beside a decorated tree with warm string lights and wrapped gifts."),
  c("fireplace", "By the fire", "Set it by a lit fireplace with stockings and warm low light."),
  c("table", "At the table", "Set it at a laid festive table with candles and the meal dressed."),
  c("snow", "Outside in the snow", "Set it outdoors in fresh snow with soft overcast winter light."),
  c("studio", "Studio", "Set it in a studio with a simple festive backdrop and clean lighting."),
]);

const PET_STYLE = sel("style", "Style", [
  AUTO,
  c("royal", "Royal portrait", "Paint the pet as a royal oil portrait in period dress, in a gilded setting."),
  c("studio", "Studio photo", "Photograph the pet as a studio portrait: clean backdrop, soft key light, sharp focus on the eyes."),
  c("watercolour", "Watercolour", "Render the pet as a loose watercolour with soft bleeding edges and paper texture."),
  c("cartoon", "Cartoon", "Render the pet as a friendly cartoon with clean outlines and flat colour."),
]);

/** Free-text controls, for the apps whose subject only the user knows. */
const WHAT_TO_REMOVE = text(
  "target", "What should go?",
  "e.g. the bin on the left, the person in the background",
  "Remove this specifically: {value}. Reconstruct what was behind it and leave everything else in the photo untouched.",
  "Leave empty and the AI picks what looks out of place."
);

const RECOLOUR_TARGET: AppOption = {
  ...text(
    "target", "What, and to what colour?",
    "e.g. the red car → matte black",
    "Recolour this specifically: {value}. Keep the original shading, texture and material behaviour so it reads as though it was always that colour."
  ),
  required: true,
};

const SPLASH_TARGET: AppOption = {
  ...text(
    "target", "What keeps its colour?",
    "e.g. the red umbrella",
    "Keep this in full colour: {value}. Everything else becomes neutral monochrome, with a clean precise boundary."
  ),
  required: true,
};

const OUTFIT_TEXT = text(
  "outfit", "Describe the outfit",
  "e.g. a cream linen suit, open collar",
  "Dress them in this specifically: {value}. Match the drape, fit and fabric behaviour to their pose and to the light already in the photo."
);

const HEADLINE_TEXT = text(
  "headline", "Text on the image",
  "e.g. I TRIED IT FOR 30 DAYS",
  "Render this text large and legible in the image, spelled exactly like this: \"{value}\".",
  "Spelling is more reliable on the GPT Image model."
);

const NAME_TEXT = text(
  "name", "Name to use",
  "e.g. Northwind Coffee",
  "Set this name in the design, spelled exactly like this: \"{value}\".",
  "Spelling is more reliable on the GPT Image model."
);

const SUBJECT_TEXT = text(
  "subject", "Describe what you want",
  "e.g. a fox knight in bronze armour",
  "The subject is: {value}."
);

/**
 * Apps that need something the category set cannot give them.
 *
 * The first block is the important one: each of these apps has a base prompt
 * that refers to a parameter — "the specified age", "the specified style" —
 * that nothing in the interface used to set.
 */
const BY_SLUG: Record<string, AppOption[]> = {
  // ── Prompts that referred to a setting the UI never had ──────────────────
  "age-progression":      [AGE],
  "age-progression-tool": [AGE],
  "old-filter":           [OLDER_SLIDER],
  "ai-time-machine":      [DECADE],
  "baby-face-filter":     [YOUNGER_AGE],
  "long-hair-filter":     [HAIR_LENGTH],
  "bangs-filter":         [BANGS],
  "beard-filter":         [BEARD],
  "eyebrow-filter":       [BROWS],
  "add-glasses-to-photo": [GLASSES],
  "piercing-filter":      [PIERCING],
  "hairstyle-changer":    [HAIRSTYLE],
  "hair-color-changer":   [HAIR_COLOUR],
  "eye-color-changer":    [EYE_COLOUR],
  "face-expression-changer": [EXPRESSION],
  "recolor-image":        [RECOLOUR_TARGET],
  "color-splash":         [SPLASH_TARGET],
  "object-remover":       [WHAT_TO_REMOVE, REMOVE_FILL],
  "remove-people-from-photo": [WHAT_TO_REMOVE, REMOVE_FILL],
  "remove-text-from-image":   [WHAT_TO_REMOVE],
  "emoji-remover":        [WHAT_TO_REMOVE],
  "watermark-remover-ai": [WHAT_TO_REMOVE],

  // ── Identity documents ───────────────────────────────────────────────────
  "passport-photo": [PASSPORT_COUNTRY, ID_BACKDROP],
  "eras-headshot":  [SUIT_COLOUR, ID_BACKDROP],

  // ── Wardrobe ────────────────────────────────────────────────────────────
  "add-suit-to-photo":  [SUIT_COLOUR],
  "outfit-generator":   [OUTFIT_TEXT, SETTING],
  "dress-photo-editor": [OUTFIT_TEXT, SETTING],
  "saree-photoshoot":   [SAREE_COLOUR, SETTING],
  "saree-photo-editor": [SAREE_COLOUR, SETTING],
  "graduation-photo":   [GOWN, SETTING],
  "superhero-costume":  [HERO_PALETTE, FRAMING],
  "superhero-generator": [HERO_PALETTE, FRAMING],

  // ── Body ────────────────────────────────────────────────────────────────
  "gym-transformation": [BUILD],
  "muscle-generator":   [BUILD],
  "abs-filter":         [BUILD],
  "smile-filter":       [SMILE],

  // ── Collectibles ────────────────────────────────────────────────────────
  "3d-figurine":             [FIGURE_PACKAGING],
  "lego-minifigure":         [FIGURE_PACKAGING],
  "funko-pop-figure":        [FIGURE_PACKAGING],
  "funko-figure-maker":      [FIGURE_PACKAGING],
  "action-figure-generator": [FIGURE_PACKAGING],
  "barbie-box":              [FIGURE_PACKAGING],

  // ── Eras ────────────────────────────────────────────────────────────────
  "90s-yearbook-photo":    [YEARBOOK_BACKDROP],
  "ai-yearbook-generator": [YEARBOOK_BACKDROP],
  "1980s-photo-trend":     [EIGHTIES_LOOK],
  "polaroid-photo":       [POLAROID_FRAME],

  // ── Tattoos ─────────────────────────────────────────────────────────────
  "ai-tattoo-generator":  [TATTOO_STYLE, TATTOO_PLACEMENT],
  "birth-flower-tattoo":  [sel("month", "Birth month", MONTH_FLOWERS), TATTOO_PLACEMENT],

  // ── Babies ──────────────────────────────────────────────────────────────
  "ai-baby-predictor": [BABY_STAGE],
  "baby-photoshoot":   [BABY_STAGE, LIGHTING],

  // ── Restoration ─────────────────────────────────────────────────────────
  "colorize-photo":           [RESTORE_COLOUR],
  "black-and-white-to-color": [RESTORE_COLOUR],

  // ── Interiors & property ────────────────────────────────────────────────
  "room-design":               [INTERIOR_STYLE, PROPERTY_TIME],
  "ai-interior-design":        [INTERIOR_STYLE, PROPERTY_TIME],
  "interior-photo-editor":     [INTERIOR_STYLE, PROPERTY_TIME],
  "house-photo-editor":        [PROPERTY_TIME],
  "architecture-photo-editor": [PROPERTY_TIME],
  "image-editor-for-real-estate": [INTERIOR_STYLE, PROPERTY_TIME],
  "image-editor-for-hotels":      [INTERIOR_STYLE, PROPERTY_TIME],
  "image-editor-for-restaurants": [INTERIOR_STYLE, PROPERTY_TIME],

  // ── Vehicles & food ─────────────────────────────────────────────────────
  "car-photo-editor":   [VEHICLE_SETTING],
  "bike-photo-editor":  [VEHICLE_SETTING],
  "truck-photo-editor": [VEHICLE_SETTING],
  "food-photo-editor":  [FOOD_SETTING],

  // ── Things with words in them ───────────────────────────────────────────
  "thumbnail-maker":             [HEADLINE_TEXT, THUMBNAIL_MOOD],
  "youtube-thumbnail-generator": [HEADLINE_TEXT, THUMBNAIL_MOOD],
  "logo-maker":                  [NAME_TEXT, LOGO_STYLE],
  "gaming-logo-maker":           [NAME_TEXT, LOGO_STYLE],
  "icon-generator":              [NAME_TEXT, LOGO_STYLE],
  "album-cover-generator":       [NAME_TEXT, MUSIC_GENRE],
  "movie-poster-generator":      [NAME_TEXT, FILM_GENRE],
  "book-cover-generator":        [NAME_TEXT, BOOK_GENRE],
  "comic-book-cover":            [HEADLINE_TEXT, COMIC_GENRE],
  "wedding-invite-photo":        [HEADLINE_TEXT],
  "linkedin-banner":             [HEADLINE_TEXT, SOCIAL_LOOK],
  "linkedin-banner-maker":       [HEADLINE_TEXT, SOCIAL_LOOK],

  // ── Open-ended generators ───────────────────────────────────────────────
  "ai-character-generator": [SUBJECT_TEXT, FRAMING],
  "ai-pokemon-generator":   [SUBJECT_TEXT],
  "text-to-emoji":          [SUBJECT_TEXT],
  "ai-art-generator":       [SUBJECT_TEXT, STRENGTH],
  "ai-painter":             [SUBJECT_TEXT, STRENGTH],

  // ── Profile pictures ────────────────────────────────────────────────────
  "profile-picture-maker":  [PFP_BACKDROP, PFP_CROP],
  "instagram-pfp-maker":    [PFP_BACKDROP, PFP_CROP],
  "linkedin-pfp-maker":     [PFP_BACKDROP, PFP_CROP],
  "discord-pfp-maker":      [PFP_BACKDROP, PFP_CROP],
  "youtube-pfp-maker":      [PFP_BACKDROP, PFP_CROP],
  "facebook-pfp-maker":     [PFP_BACKDROP, PFP_CROP],
  "roblox-pfp-maker":       [PFP_BACKDROP, PFP_CROP],
  "fish-eye-pfp":           [PFP_BACKDROP, PFP_CROP],
  "corporate-avatar":       [ATTIRE, PFP_BACKDROP],
  "ai-avatar-generator":    [PFP_BACKDROP, PFP_CROP],

  // ── Hair and teeth ──────────────────────────────────────────────────────
  "blonde-hair-filter": [BLONDE_SHADE],
  "curly-hair-filter":  [CURL_TYPE],
  "braces-filter":      [BRACES_TYPE],
  // An inversion is one operation with one outcome; a "strength" control over
  // it would be a lie.
  "invert-image-color": [],

  // ── Festivals and holidays ──────────────────────────────────────────────
  "festival-photoshoot":     [FESTIVAL, LIGHTING],
  "christmas-photo":         [HOLIDAY_SCENE],
  "thanksgiving-photoshoot": [HOLIDAY_SCENE],

  // ── Clinical ────────────────────────────────────────────────────────────
  "doctor-headshot": [CLINICAL_ATTIRE, HEADSHOT_BACKDROP],

  // ── Animals ─────────────────────────────────────────────────────────────
  "pet-portrait": [PET_STYLE, FRAMING],

  // ── Pixels ──────────────────────────────────────────────────────────────
  "pixel-art-avatar":     [PIXEL_DEPTH],
  "pixel-art-generator":  [PIXEL_DEPTH],
  "stardew-profile-maker": [PIXEL_DEPTH],
};

// ── Public API ──────────────────────────────────────────────────────────────

/** The options this app should show, most specific set first. */
/**
 * The category a curated app belongs to, for callers outside this file.
 *
 * The staging rules need it for the same reason the options do: the 42
 * hand-written apps carry no `cat`, and they are the ones on the front page.
 */
export function curatedCategory(slug: string): string | undefined {
  return CURATED_CAT[slug];
}

/**
 * Apps whose base prompt never refers to an existing photo — a logo, an
 * emoji, an icon, a banner, all built from a description alone. Everything
 * else in the catalogue edits a photo the visitor uploads, and cannot run
 * without one.
 *
 * Small and explicit rather than inferred from the prompt text at runtime:
 * a slug lands here only after its prompt was read in full and confirmed to
 * describe pure generated artwork, never "this photo" or an implied selfie.
 */
const TEXT_ONLY_SLUGS = new Set<string>([
  "text-to-emoji",
  "logo-maker",
  "gaming-logo-maker",
  "icon-generator",
  "linkedin-banner-maker",
]);

/** True when this app generates from a text description alone — no photo upload. */
export function isTextOnlyApp(slug: string): boolean {
  return TEXT_ONLY_SLUGS.has(slug);
}

/**
 * The one option a text-only app cannot run without — its `text()` control,
 * the same one `BY_SLUG` gives it (`SUBJECT_TEXT`, `NAME_TEXT`, …). Not
 * `required: true` on the shared const, because the same const is reused by
 * apps that edit a photo and can fall back to one when the field is empty.
 */
export function primaryTextOption(options: AppOption[]): AppOption | undefined {
  return options.find((o) => o.kind === "text");
}

export function optionsFor(app: CreativeApp): AppOption[] {
  const bySlug = BY_SLUG[app.slug];
  if (bySlug) return bySlug;
  const cat = app.cat ?? CURATED_CAT[app.slug];
  return (cat && BY_CATEGORY[cat]) || [];
}

/** Every option's default, for seeding the controls. */
export function defaultValues(options: AppOption[]): OptionValues {
  const out: OptionValues = {};
  for (const o of options) {
    out[o.id] =
      o.kind === "text" ? ""
      : o.kind === "number" ? String(o.initial ?? o.min ?? 0)
      : o.choices?.[0]?.value ?? "";
  }
  return out;
}

/**
 * The sentences these selections add to the prompt.
 *
 * Unknown ids and values are skipped rather than trusted: the selection comes
 * from the browser, and a stale one from a cached page must not be able to put
 * arbitrary text into a prompt. Free-text options are the exception by design —
 * that is what they are for — so their value is trimmed and length-capped.
 */
export function optionPhrases(options: AppOption[], values: OptionValues): string[] {
  const out: string[] = [];
  for (const o of options) {
    const v = values[o.id];
    if (!v) continue;
    if (o.kind === "text") {
      const clean = v.trim().slice(0, 200);
      if (clean && o.template) out.push(o.template.replace("{value}", clean));
      continue;
    }
    if (o.kind === "number") {
      const n = clampNumber(o, v);
      if (n !== null && o.phraseFor) out.push(o.phraseFor(n));
      continue;
    }
    const choice = o.choices?.find((x) => x.value === v);
    if (choice?.phrase) out.push(choice.phrase);
  }
  return out;
}

/** The label of the first required option left empty, or null when good to go. */
export function missingRequired(options: AppOption[], values: OptionValues): string | null {
  for (const o of options) {
    if (o.required && !(values[o.id] || "").trim()) return o.label;
  }
  return null;
}

/** A short "Age: 60s · Strength: subtle" summary, for the generation record. */
export function optionSummary(options: AppOption[], values: OptionValues): string {
  const parts: string[] = [];
  for (const o of options) {
    const v = values[o.id];
    if (!v) continue;
    const label =
      o.kind === "text" ? v.trim().slice(0, 40)
      : o.kind === "number" ? (() => { const n = clampNumber(o, v); return n === null ? null : o.format?.(n) ?? String(n); })()
      : o.choices?.find((x) => x.value === v)?.label;
    if (label && v !== "auto") parts.push(`${o.label}: ${label}`);
  }
  return parts.join(" · ");
}
