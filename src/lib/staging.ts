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
 *   restyle  the content stays — same person, pose, clothes, setting — and
 *            the whole picture is re-made in a new look. Anime, oil paint,
 *            pixel art, a glitch or a Polaroid of the photo they took.
 *   product  the object is exactly as photographed, label and all; the shot
 *            around it is rebuilt. Packshots, ads, a dish on a new table.
 *   space    the room or building is exactly as built; the light, the sky,
 *            the tidiness — or, for a redesign, the furnishing — change.
 *
 * Which one an app gets was checked against the example each app page shows:
 * the result someone gets should look like the "after" they were shown. That
 * is why the ageing apps keep the outfit and the room — their examples do —
 * and why an anime app keeps the café the person was sitting in.
 *
 * The editor's own prompt bar is `minimal` by definition: someone typing
 * "make the sky bluer" has not asked for new clothes.
 */

export type StagingMode = "restage" | "restyle" | "subject" | "scene" | "minimal" | "product" | "space";

const IDENTITY =
  "Preserve the same real person's identity as the reference photo. Keep their " +
  "recognizable facial geometry: face shape, forehead, cheekbones, jaw and chin, " +
  "eye shape and spacing, eyebrows, nose, lips, ears, natural asymmetry, skin tone, " +
  "age appearance and distinctive features. Do not substitute a generic attractive " +
  "face, beautify or idealize the person, enlarge their eyes, reshape their nose or " +
  "jaw, or apply plastic skin smoothing. Keep natural skin texture and realistic " +
  "pores wherever the output is photographic. Change only features that the app's " +
  "requested transformation explicitly requires. Match the face's lighting, colour " +
  "and sharpness to the new scene instead of making it look pasted on.";

/*
  Only for the modes that rebuild the pose.

  Told to keep "the same face" and nothing about the head, a model keeps the
  face region as photographed — the selfie's tilt, its high phone angle, its
  close-lens distortion, its office light — and grafts it onto a new body
  standing on a sunlit terrace. Every feature is right and it still reads as
  a face swap. Where the pose is kept (scene, subject, restyle) the head is
  part of what is kept, so this is not said there.
*/
const REPOSE =
  "Re-pose the head together with the body. In the new picture the head sits " +
  "naturally on the neck, upright and turned to suit the new pose, seen from the " +
  "new camera's height and distance — not with the tilt, the high or low phone " +
  "angle, or the close wide-angle distortion of the original photo. Re-light the " +
  "face with the new scene's light, so that face, neck and hands share one skin " +
  "tone, one light direction, one colour grade and one level of sharpness, and keep " +
  "the head in true proportion to the body.";

/** IDENTITY for a drawing, a painting or a 3D character: recognisable, not photographic. */
const LIKENESS =
  "Keep the person recognisable as themselves in the new style: their face shape, " +
  "features, skin tone, hair colour and hairstyle carry into it — except where the " +
  "description above changes them — so someone who knows them would know at once " +
  "that it is them.";

/*
  What shape the answer takes.

  The one that prompted this: "age her to 73" came back as a collectible doll
  in a blister pack, on a shop shelf, with a before-and-after inset and the
  words "73 YEARS LATER" printed on the box. Every instruction had been
  followed — it was photoreal, it was her, it was re-staged. Nothing had said
  the answer is *a photograph of a person*, and "rebuild the whole picture"
  is an invitation to invent a concept if the output format is left open.

  So it is stated. Separately from the transformation, because it is true of
  every transformation.
*/
const OUTPUT_ONE_IMAGE =
  "Return exactly one finished image. Not a collage, grid, panel layout, diptych, " +
  "triptych, before-and-after comparison, contact sheet or set of variations — the " +
  "person appears once and once only, and no earlier or younger version of them " +
  "appears anywhere in the frame. The image fills the whole canvas edge to edge.";

/** True of every photograph, including a product shot. */
const OUTPUT_NO_LAYOUT =
  "Do not present it as a printed or displayed thing: no border, mount, frame, " +
  "album page, screen, poster or magazine layout around the image. Add no text, " +
  "caption, label, date, number, watermark, logo or signature anywhere in it.";

const OUTPUT_PHOTOGRAPH =
  OUTPUT_ONE_IMAGE +
  " The subject is a real person photographed directly — not a doll, figurine, " +
  "toy, statue or model of them, and not a photograph of a photograph. " +
  OUTPUT_NO_LAYOUT;

const PHOTOREAL =
  "For photographic results, preserve authentic camera realism: natural skin texture " +
  "and pores, fine facial detail, realistic eyes and teeth, believable hair strands, " +
  "correct anatomy and hands, coherent perspective, physically plausible light and " +
  "shadows, and a consistent level of sharpness across the face, neck and body. " +
  "Avoid waxy or airbrushed skin, over-sharpened facial edges, artificial symmetry, " +
  "oversized eyes, invented beauty marks, face-morphing, or the generic AI portrait " +
  "look. The face must belong naturally to the scene rather than look pasted in.";

/*
  PHOTOREAL's counterpart, for the apps whose whole point is that the result is
  not a photograph. They used to get PHOTOREAL too, so an anime app was asked
  for anime and then told "not an illustration" — and a model handed two
  contradictory instructions splits the difference: a photo with a filter.
*/
const ARTWORK =
  "Render it as finished artwork in the style described above, consistently across " +
  "the whole image — every figure, every surface and the background drawn, painted " +
  "or modelled in that one style. It must not look like a photograph with a filter " +
  "laid over it.";

const DIRECTIVE: Record<StagingMode, string> = {
  /*
    The long one, because this is the instruction that was missing.

    "Change the clothes" on its own gets a different shirt in the same room.
    Every element is named, and the failure is named too: a model that is told
    only what to keep will keep everything.
  */
  restage:
    "This is a complete re-staging of the photograph, not a retouch — but the result " +
    "is still one ordinary photograph of this person, the kind someone would actually " +
    "have taken of them. Rebuild the " +
    "whole picture around the transformation described above: the clothing and " +
    "accessories, the hairstyle, the background and location, the pose and body " +
    "language, the framing, and the lighting and colour grade must all belong to " +
    "that new scene. Do not keep the original outfit, background, pose or lighting " +
    "unless the description above specifically calls for them — a result that " +
    "leaves the person in their original clothes and surroundings with only the " +
    "face altered has failed. " + REPOSE + " The person must look photographed in " +
    "this scene, not like a face pasted onto another body. " + IDENTITY,

  subject:
    "Keep the subject exactly as photographed — for a person the same clothing, pose, " +
    "expression, hair and body position, for an object the same shape, colour and " +
    "detail — cut out cleanly at the edges including individual strands of hair. " +
    "Change only the surroundings, as described above, and relight the subject so it " +
    "sits believably in the new setting rather than looking pasted onto it. Where the " +
    "subject is a person: " + IDENTITY,

  scene:
    "Keep the setting exactly as photographed — the same background, framing, " +
    "camera angle, lighting and colour. Change only what the description above " +
    "calls for, and leave everything else in the frame untouched. " + IDENTITY,

  restyle:
    "Keep what is in the photograph: the same person in the same pose with the same " +
    "expression, wearing the same clothes, in the same framing and the same setting " +
    "with its main objects in place. Re-create all of it in the look described " +
    "above — every part of the picture takes on that look, not just the person — and " +
    "change or add only what the description above names. " + IDENTITY,

  product:
    "Keep the product — or the dish, or whatever object the photo is of — exactly as " +
    "photographed: the same shape and proportions, colours, materials and finish, and " +
    "every word, logo and mark on it spelled and placed the same. Rebuild everything " +
    "around it as described above: the surface, background, props, lighting and camera " +
    "angle can all change to suit the shot, so that the result is a professional " +
    "photograph of this exact item. Add no people and no hands unless the description " +
    "above asks for them.",

  space:
    "Keep the place itself exactly as photographed: the same architecture — walls, " +
    "windows, doors, ceiling, floor and built-in fittings — the same layout, and the " +
    "same camera position, angle and lens. Keep the furniture and decor too, unless the " +
    "description above asks for the room to be redesigned or restyled. Change only what " +
    "the description above calls for — the light, the sky and the view, the colour, " +
    "the tidiness. Add no people.",

  minimal:
    "Change only what the description above asks for. Everything else in the " +
    "photograph — the clothing, the background, the pose, the framing, the " +
    "lighting, the colour and every object in the frame — must come through " +
    "unchanged. Do not restyle, recompose, beautify or 'improve' anything that " +
    "was not asked about. " + IDENTITY,
};

/*
  The restage directive's art counterpart. "The result is still one ordinary
  photograph" is the line that keeps a photo app from inventing a concept, and
  exactly the line an oil-painting or mermaid-illustration app must not get.
*/
const ART_RESTAGE =
  "Re-create the reference image as cohesive artwork in the requested style. Follow " +
  "the app's own preview/example for its defining visual language, subject styling, " +
  "palette, scene and composition; the result should feel like that app's promised " +
  "transformation, not a generic style filter. Rebuild clothing, accessories, hair, " +
  "background, pose, framing and light only as required by the app prompt and selected " +
  "options. Carry the same person's recognizable face shape, eye spacing, nose, mouth, " +
  "skin tone, hairstyle and distinctive features into the art style, but render all " +
  "parts consistently in that medium rather than pasting a photo-real face onto it. " +
  "Honor selected framing and transformation strength. " + LIKENESS;

/*
  The restage directive for the designed objects. "The result is still one
  ordinary photograph of this person" is what stops a photo app inventing a
  toy, and exactly what a figurine, a comic cover or a thumbnail must not be
  told.
*/
const ARTEFACT_RESTAGE = DIRECTIVE.restage.replace(
  " — but the result is still one ordinary photograph of this person, the kind someone would actually have taken of them.",
  "."
);

/*
  For the one app that makes a creature, not a portrait. Told to keep a face
  "exactly", it either refuses the brief or puts a human face on an animal.
*/
const INSPIRED =
  "Use the photograph as inspiration only — the person's colouring, hair and mood " +
  "carry into the design — but the result is the creature described above, not a " +
  "portrait of the person and not a person in costume.";

const BY_CATEGORY: Record<string, StagingMode> = {
  headshot:   "restage",
  portrait:   "restage",
  style:      "restage",
  fun:        "restage",
  product:    "product",
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
  // One change, in the photo they took: the example keeps the room, the
  // clothes and the pose, and only the face and hair age — or the suit goes on.
  "age-progression": "scene",
  "age-progression-tool": "scene",
  "old-filter": "scene",
  "add-suit-to-photo": "scene",
  // Tattoos go onto the person in their own photo, not onto a white sheet.
  "ai-tattoo-generator": "scene",
  "birth-flower-tattoo": "scene",
  // The example moves them into a gym in training kit; the pose stays.
  "gym-transformation": "restage",
  // The rider stays exactly as photographed; the world behind changes.
  "aura-farm-horse": "subject",
  // Colourising and repairing. New clothes would be a different photograph.
  "restore-old-photos": "minimal",
  "colorize-photo": "minimal",
  "background-changer": "subject",
  // The same photo, re-made in a new look: a regrade, a glitch, a print.
  "instagram-photo-editor": "restyle",
  "glitch-effect": "restyle",
  "polaroid-photo": "restyle",
  "glow-up-editor": "restyle",
  // Rooms and buildings. Their category says "background" or "product", and
  // both of those directives are about something standing in front of a scene.
  "ai-interior-design": "space",
  "room-design": "space",
  "interior-photo-editor": "space",
  "architecture-photo-editor": "space",
  "house-photo-editor": "space",
  "image-editor-for-real-estate": "space",
  "image-editor-for-hotels": "space",
};

/**
 * Apps whose result is a drawing, painting, 3D character or other artwork.
 *
 * Chosen from each app's example rather than its category: "style" holds an
 * anime converter and a photoreal vampire portrait side by side. These get
 * LIKENESS for IDENTITY and ARTWORK for PHOTOREAL; everything else is a
 * photograph.
 */
const ARTWORK_SLUGS = new Set([
  "ai-art-generator", "ai-avatar-generator", "ai-mermaid-filter", "ai-painter",
  "ai-pokemon-generator", "ai-vtuber-maker", "ai-webtoon-generator", "anime-style",
  "caricature-maker", "cartoon-generator", "claymation-portrait", "coloring-page-generator",
  "comic-book-cover", "comic-generator", "discord-pfp-maker", "gaming-logo-maker",
  "ghibli-style", "ghibli-style-generator", "icon-generator", "image-to-emoji",
  "logo-maker", "photo-to-anime", "photo-to-illustration", "photo-to-oil-painting",
  "pixar-avatar", "pixar-filter", "pixel-art-avatar", "pixel-art-generator",
  "renaissance-portrait", "roblox-pfp-maker", "silhouette-maker", "south-park-style",
  "stardew-profile-maker", "stencil-maker", "tarot-card-portrait", "text-to-emoji",
]);

/** Re-made in the new style with the content kept, as their examples are. */
const ARTWORK_RESTYLE = new Set([
  "ai-art-generator", "anime-style", "caricature-maker", "claymation-portrait",
  "coloring-page-generator", "comic-generator", "ghibli-style", "ghibli-style-generator",
  "photo-to-anime", "photo-to-illustration", "photo-to-oil-painting", "pixar-avatar",
  "pixar-filter", "pixel-art-generator", "silhouette-maker", "south-park-style",
  "stencil-maker", "ai-vtuber-maker",
]);

/** A creature or object made from the photo, not a portrait of the person in it. */
const INSPIRED_SLUGS = new Set(["ai-pokemon-generator"]);

/*
  The baby predictor makes someone new. Told to keep "the same face" it
  shrinks a parent; told what to blend, it makes a child who looks like family.
*/
const BLENDED =
  "The baby is a new person who blends the features of the people in the photo — " +
  "their skin tone, eye shape, hair colour and smile — not a copy of either face and " +
  "not a shrunken adult.";

export function isArtworkApp(slug: string): boolean {
  return ARTWORK_SLUGS.has(slug);
}

export function stagingModeFor(app: { slug: string; cat?: string }, curatedCat?: string): StagingMode {
  const bySlug = BY_SLUG[app.slug];
  if (bySlug) return bySlug;
  if (ARTWORK_RESTYLE.has(app.slug)) return "restyle";
  const cat = app.cat ?? curatedCat;
  // Unknown categories restage. Most apps here are transformations, and the
  // failure this file exists to fix is the one that comes from doing too
  // little, not too much.
  return (cat && BY_CATEGORY[cat]) || "restage";
}

/**
 * The directive for a mode, for this app.
 *
 * `slug` matters only to the artwork apps: they keep the person recognisable
 * rather than photographically identical, and a restage for them is a new
 * picture rather than "one ordinary photograph".
 */
export function stagingDirective(mode: StagingMode, slug?: string): string {
  if (slug && INSPIRED_SLUGS.has(slug)) return INSPIRED;
  if (slug && ARTWORK_SLUGS.has(slug)) {
    if (mode === "restage") return ART_RESTAGE;
    return DIRECTIVE[mode].replace(IDENTITY, LIKENESS);
  }
  if (slug && mode === "restage" && ARTEFACT_SLUGS.has(slug)) return ARTEFACT_RESTAGE;
  if (slug === "ai-baby-predictor") return DIRECTIVE[mode].replace(IDENTITY, BLENDED);
  return DIRECTIVE[mode];
}

/** The closing sentence every prompt gets: photographic, or artwork for the art apps. */
export function photorealDirective(slug?: string): string {
  return slug && ARTWORK_SLUGS.has(slug) ? ARTWORK : PHOTOREAL;
}

/**
 * Apps whose deliverable really is a designed object.
 *
 * A Polaroid app must be allowed its white border, a comic-cover app its title
 * type, a figurine app its box. Forbidding those would break the apps that
 * work.
 *
 * This was inferred from each app's own prompt at first, which read better and
 * was wrong: "a magazine cover shoot" and "comic-movie lighting" describe
 * lighting, "remove the watermark, logo or stamp" describes a removal, and all
 * three were being read as permission to produce the thing. Five of
 * twenty-five were wrong that way — and a wrong exemption silently reopens the
 * exact failure this contract exists to close. A list can go stale; an
 * inference that confidently says yes to a watermark remover cannot be
 * trusted at all.
 */
const ARTEFACT_SLUGS = new Set([
  "3d-figurine",
  "90s-yearbook-photo",
  "action-figure-generator",
  "ai-yearbook-generator",
  "album-cover-generator",
  "barbie-box",
  "book-cover-generator",
  "comic-book-cover",
  "comic-generator",
  "discord-pfp-maker",
  "funko-figure-maker",
  "funko-pop-figure",
  "gaming-logo-maker",
  "instagram-pfp-maker",
  "lego-minifigure",
  "linkedin-banner",
  "linkedin-banner-maker",
  "logo-maker",
  "movie-poster-generator",
  "pixel-art-avatar",
  "polaroid-photo",
  "tarot-card-portrait",
  "thumbnail-maker",
  "wedding-invite-photo",
  "youtube-pfp-maker",
  "youtube-thumbnail-generator",
]);

export type OutputForm = "photograph" | "product" | "artefact" | "artwork";

export function outputFormFor(app: { slug: string; cat?: string }): OutputForm {
  if (ARTEFACT_SLUGS.has(app.slug)) return "artefact";
  // A drawing is not "a real person photographed directly", but it is still
  // one picture with nothing printed around it.
  if (ARTWORK_SLUGS.has(app.slug)) return "artwork";
  // A product shot is a photograph *of an object*, so "no packaging, no box"
  // is exactly backwards for it — the packaging is the subject.
  if (app.cat === "product") return "product";
  return "photograph";
}

export function outputDirective(form: OutputForm): string {
  if (form === "artefact") return OUTPUT_ONE_IMAGE;
  if (form === "product" || form === "artwork") return OUTPUT_ONE_IMAGE + " " + OUTPUT_NO_LAYOUT;
  return OUTPUT_PHOTOGRAPH;
}

/** The strict form, for surfaces that are always editing someone's photo. */
export function photographOutputDirective(): string {
  return OUTPUT_PHOTOGRAPH;
}

/**
 * How the photo is introduced to OpenAI's models, on the apps that rebuild the pose.
 *
 * GPT's edit endpoints treat the upload as a picture to modify and hold on to
 * whatever they are told to keep — so "keep the same face" kept the face as
 * photographed, selfie tilt and phone angle included, on an upright body. fal
 * exposes no fidelity setting for these endpoints, so the only lever is what
 * the photo is said to be: a reference for who the person is. Nano Banana
 * re-poses the head without it, and does not get it.
 */
const REFERENCE =
  "The attached photo is a reference for who this person is — their face, features, " +
  "skin tone, hair and build — not a picture to edit. Do not reuse any part of it as " +
  "it is, the face included: create a new image of the same person from scratch, with " +
  "their head, neck and body posed, angled and lit together for the new scene, so the " +
  "face is redrawn at the new angle rather than carried over from the photo.";

export function referenceDirective(): string {
  return REFERENCE;
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
    DIRECTIVE.minimal + " " + PHOTOREAL + " " + OUTPUT_PHOTOGRAPH
  );
}
