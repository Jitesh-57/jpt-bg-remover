/**
 * staging.ts — how much of the picture a transformation is allowed to change.
 *
 * The bug this exists to fix: a one-click app would age someone by thirty
 * years and leave them in the same outfit, the same doorway, the same pose.
 * Technically an aged face; obviously not a photograph of a 63-year-old.
 *
 * Two causes, both of them ours. Every app prompt ended with "Preserve the
 * person's face, facial structure, identity and natural skin tone exactly"
 * and said nothing about anything else — and the whole thing was wrapped in
 * "You are a professional photo editor. Edit this image: …". Told to edit,
 * and told what to preserve, an edit model does the smallest thing that
 * satisfies the words. It was doing as it was asked.
 *
 * So intent is now explicit, and it is not the same intent for every app:
 *
 *   restage  the transformation owns the frame. Clothing, hair, setting,
 *            pose, lighting all move to suit it; only the person's identity
 *            is fixed. A birthday-party app that leaves someone in a suit in
 *            an office has failed, not partially succeeded.
 *   subject  the person is exactly as photographed; the world behind them
 *            changes. Background apps.
 *   scene    the world is exactly as photographed; something about the
 *            person changes. Retouching, physique, hair colour.
 *   minimal  one named defect changes and nothing else does. Restoration,
 *            object removal, upscaling — where "improving" the parts nobody
 *            asked about is the failure mode.
 *
 * The editor's own prompt bar is `minimal` by definition: someone typing
 * "make the sky bluer" has not asked for new clothes.
 */

export type StagingMode = "restage" | "subject" | "scene" | "minimal";

const IDENTITY =
  "Keep the person's identity exactly: the same face, bone structure, eye shape, " +
  "nose, mouth, natural skin tone and ethnicity. It must be obviously the same " +
  "person to someone who knows them.";

const PHOTOREAL =
  "The result must look like a real photograph — natural skin texture, realistic " +
  "lighting and shadows, believable anatomy and hands, correct perspective — not " +
  "an illustration, painting, render or cartoon.";

const DIRECTIVE: Record<StagingMode, string> = {
  /*
    The long one, because this is the instruction that was missing.

    "Change the clothes" on its own gets a different shirt in the same room.
    Every element is named, and the failure is named too: a model that is told
    only what to keep will keep everything.
  */
  restage:
    "This is a complete re-staging of the photograph, not a retouch. Rebuild the " +
    "whole picture around the transformation described above: the clothing and " +
    "accessories, the hairstyle, the background and location, the pose and body " +
    "language, the framing, and the lighting and colour grade must all belong to " +
    "that new scene. Do not keep the original outfit, background, pose or lighting " +
    "unless the description above specifically calls for them — a result that " +
    "leaves the person in their original clothes and surroundings with only the " +
    "face altered has failed. " + IDENTITY,

  subject:
    "Keep the person exactly as photographed — the same clothing, pose, expression, " +
    "hair and body position, cut out cleanly at the edges including individual " +
    "strands of hair. Change only the surroundings, as described above, and relight " +
    "the subject so they sit believably in the new setting rather than looking " +
    "pasted onto it. " + IDENTITY,

  scene:
    "Keep the setting exactly as photographed — the same background, framing, " +
    "camera angle, lighting and colour. Change only what the description above " +
    "calls for, and leave everything else in the frame untouched. " + IDENTITY,

  minimal:
    "Change only what the description above asks for. Everything else in the " +
    "photograph — the clothing, the background, the pose, the framing, the " +
    "lighting, the colour and every object in the frame — must come through " +
    "unchanged. Do not restyle, recompose, beautify or 'improve' anything that " +
    "was not asked about. " + IDENTITY,
};

const BY_CATEGORY: Record<string, StagingMode> = {
  headshot:   "restage",
  portrait:   "restage",
  style:      "restage",
  fun:        "restage",
  product:    "restage",
  social:     "restage",
  background: "subject",
  retouch:    "scene",
  restore:    "minimal",
  remove:     "minimal",
  enhance:    "minimal",
};

/**
 * Apps whose category is a poor guide to what they do.
 *
 * Kept small and explicit. Anything here is a case where the category was
 * chosen for the catalogue's navigation rather than for how much of the frame
 * the app is meant to touch.
 */
const BY_SLUG: Record<string, StagingMode> = {
  // Cropping and compliance, not styling: a passport photo that invents a
  // different shirt is a rejected passport photo.
  "passport-photo": "scene",
  "visa-photo": "scene",
  // The point is the physique, in the photo the person actually took.
  "gym-transformation": "scene",
  // Colourising and repairing. New clothes would be a different photograph.
  "restore-old-photos": "minimal",
  "colorize-photo": "minimal",
  // A banner is a composition around the person, not a new outfit.
  "linkedin-banner": "subject",
  "background-changer": "subject",
};

export function stagingModeFor(app: { slug: string; cat?: string }, curatedCat?: string): StagingMode {
  const bySlug = BY_SLUG[app.slug];
  if (bySlug) return bySlug;
  const cat = app.cat ?? curatedCat;
  // Unknown categories restage. Most apps here are transformations, and the
  // failure this file exists to fix is the one that comes from doing too
  // little, not too much.
  return (cat && BY_CATEGORY[cat]) || "restage";
}

export function stagingDirective(mode: StagingMode): string {
  return DIRECTIVE[mode];
}

/** The closing sentence every prompt gets, whatever its mode. */
export function photorealDirective(): string {
  return PHOTOREAL;
}

/**
 * Removes an app's own "must look like a real photograph" sentence.
 *
 * Nearly every one of the 200 app prompts ends with a variant of it, written
 * independently and worded slightly differently. Appending the canonical one
 * on top left each prompt closing with two near-identical paragraphs, which
 * is not twice as convincing — a repeated instruction in different words
 * reads as two instructions, and the second dilutes the first.
 *
 * Conservative on purpose: it only matches a sentence that both claims
 * photographic realism and rules out illustration, which is the shape of the
 * boilerplate and not of anything an app actually needs to say.
 */
const OWN_PHOTOREAL =
  /(?:[^.!?]*\b(?:look|looks|read|reads|be)\b[^.!?]*\breal(?:istic)?\b[^.!?]*\bphotograph[^.!?]*[.!?]\s*)(?:[^.!?]*\b(?:not an? (?:illustration|painting|render|cartoon)|unless the style explicitly)\b[^.!?]*[.!?]\s*)?/gi;

export function stripOwnPhotoreal(prompt: string): string {
  const cleaned = prompt.replace(OWN_PHOTOREAL, (m) =>
    /illustration|painting|render|cartoon/i.test(m) ? " " : m
  );
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

/**
 * What the editor's prompt bar sends.
 *
 * Someone typing an instruction into an existing photo wants that instruction
 * and nothing else — this is the one surface where "change as little as
 * possible" is right, and it is stated rather than left to the model's
 * default.
 */
export function editorDirective(instruction: string): string {
  return (
    `Apply this edit to the photograph: ${instruction.trim()}\n\n` +
    DIRECTIVE.minimal + " " + PHOTOREAL + " Return only the edited image."
  );
}
