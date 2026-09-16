/**
 * prompt-library.ts — the Pixel Shine prompt library.
 *
 * Every prompt here is written for this product: they assume a photo you
 * uploaded and they are phrased the way the image models we actually run
 * respond to — identity first, then wardrobe and set, then camera and light,
 * then the finish. Nothing is lifted from another prompt site: copied prompt
 * text would be someone else's work, and duplicate content besides, which
 * defeats the point of having the page at all.
 *
 * The platform tags are about output, not source. A "4:5, Instagram" prompt is
 * composed for a portrait feed crop; a YouTube one leaves room for a title and
 * keeps the face large enough to read at thumbnail size.
 */

export type CategoryId =
  | "portrait" | "aesthetic" | "social" | "product"
  | "brand" | "fun" | "restore" | "scene";

export type PlatformId =
  | "instagram" | "tiktok" | "x" | "facebook" | "linkedin" | "youtube" | "pinterest";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  blurb: string;
}

export interface Platform {
  id: PlatformId;
  name: string;
  /** What that platform's crop actually is, so the badge teaches something. */
  note: string;
}

export interface LibraryPrompt {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  platforms: PlatformId[];
  /** The aspect ratio this is composed for. */
  ratio: string;
  /** False for the handful that invent an image rather than edit yours. */
  needsPhoto: boolean;
  /** The prompt itself — what gets copied. */
  text: string;
  /** One line of advice that is not in the prompt. */
  tip: string;
  /** The AI app this pairs with, when one exists. Links to /creative/<slug>. */
  app?: string;
  tags: string[];
}

export const CATEGORIES: Category[] = [
  { id: "portrait",  name: "Portraits & headshots", emoji: "📸", blurb: "Profile photos, studio portraits and the shots a job application asks for." },
  { id: "aesthetic", name: "Aesthetics & trends",   emoji: "✨", blurb: "The looks that go around — film stocks, eras, editorial moods." },
  { id: "social",    name: "Social templates",      emoji: "📱", blurb: "Thumbnails, covers, banners and pins, composed for the crop each one gets." },
  { id: "product",   name: "Product & business",    emoji: "🛍️", blurb: "Catalogue shots, flat lays and the photos a listing needs." },
  { id: "brand",     name: "Ads & brand creative",  emoji: "📣", blurb: "Campaign frames, promos and the creative around a launch." },
  { id: "fun",       name: "Fun & novelty",         emoji: "🎉", blurb: "Figurines, alter egos and the ones people send to a group chat." },
  { id: "restore",   name: "Restore & retouch",     emoji: "🖼️", blurb: "Damaged prints, bad light, and the things a camera got wrong." },
  { id: "scene",     name: "Backgrounds & scenes",  emoji: "🌅", blurb: "Put the subject somewhere else and make the light agree." },
];

export const PLATFORMS: Platform[] = [
  { id: "instagram", name: "Instagram", note: "4:5 feed, 1:1 grid, 9:16 stories" },
  { id: "tiktok",    name: "TikTok",    note: "9:16, with the caption safe area kept clear" },
  { id: "x",         name: "X",         note: "16:9 posts, 3:1 header" },
  { id: "facebook",  name: "Facebook",  note: "1.91:1 link previews, 16:9 covers" },
  { id: "linkedin",  name: "LinkedIn",  note: "1:1 profile, 4:1 banner" },
  { id: "youtube",   name: "YouTube",   note: "16:9 thumbnails, legible at 210px wide" },
  { id: "pinterest", name: "Pinterest", note: "2:3 pins, text in the top third" },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, Platform>;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

let seq = 0;
function P(
  title: string,
  category: CategoryId,
  platforms: PlatformId[],
  ratio: string,
  text: string,
  tip: string,
  tags: string[],
  app?: string,
  needsPhoto = true
): LibraryPrompt {
  seq += 1;
  return {
    id: `pl${String(seq).padStart(3, "0")}`,
    slug: slugify(title),
    title,
    category,
    platforms,
    ratio,
    needsPhoto,
    text,
    tip,
    app,
    tags,
  };
}

/**
 * The sentence that does the most work in every prompt that involves a person.
 *
 * Kept as one constant rather than retyped: it is the instruction that decides
 * whether a result is usable, and a weaker paraphrase in one prompt is the
 * difference between a photo of you and a photo of someone who looks a bit
 * like you.
 */
const KEEP_ME =
  "Keep my face, bone structure, natural skin tone and identity exactly as they are in my photo — change the styling around me, never who I am.";

const PHOTOREAL =
  "The result must read as a real photograph: natural skin texture with visible pores, believable light direction and shadow falloff, correct anatomy and hands.";

export const PROMPTS: LibraryPrompt[] = [
  // ── Portraits & headshots ────────────────────────────────────────────────
  P(
    "Corporate headshot on grey",
    "portrait", ["linkedin", "facebook"], "1:1",
    `Turn my photo into a professional corporate headshot. Dress me in a well-fitted charcoal suit with a crisp white shirt. Put me against a seamless mid-grey studio backdrop with a soft gradient falling off behind my shoulders. Light me with a large softbox slightly above and to one side, a gentle fill on the shadow side, and a subtle hair light separating me from the background. Frame head-and-shoulders with a little space above my head, eyes on the upper third. Composed expression, mouth relaxed, shoulders square but not stiff. ${KEEP_ME} ${PHOTOREAL}`,
    "Shoot your source photo near a window, facing it. A well-lit original gives the model far more of your real face to preserve.",
    ["headshot", "corporate", "linkedin", "suit"],
    "professional-headshot"
  ),
  P(
    "Approachable LinkedIn profile photo",
    "portrait", ["linkedin"], "1:1",
    `Restyle my photo as a LinkedIn profile picture that reads as approachable rather than formal. Smart-casual dress — a blazer over an open-collar shirt, or fine knitwear. Background: a modern office interior thrown well out of focus, warm and bright rather than grey. Natural window light as the key, soft and flattering, with clean catchlights in my eyes. A genuine, easy smile that creases the eyes. Frame head-and-shoulders, centred, with even margins so it survives a circular crop. ${KEEP_ME} ${PHOTOREAL}`,
    "LinkedIn crops to a circle. Anything within about 10% of the edge will be cut, so keep shoulders inside the frame.",
    ["linkedin", "profile picture", "headshot", "office"],
    "linkedin-headshot"
  ),
  P(
    "Executive portrait, low key",
    "portrait", ["linkedin", "x"], "4:5",
    `Restage my photo as an executive leadership portrait. Dark tailored suit, dark tie, no visible branding. Background: near-black, with a soft pool of light falling off behind one shoulder. Sculpted low-key lighting — a hard key from one side shaped with a grid, a whisper of fill, and a rim light along the jaw and shoulder. Settled, authoritative posture, chin level, hands out of frame. Slight three-quarter turn with the eyes to camera. ${KEEP_ME} ${PHOTOREAL}`,
    "Low-key portraits live on the rim light. If your result looks flat, ask again for 'a stronger rim light separating the shoulder from the background'.",
    ["executive", "ceo", "portrait", "low key"],
    "ceo-headshot"
  ),
  P(
    "Passport and visa photo",
    "portrait", [], "1:1",
    `Reformat my photo as a compliant identity photograph. Plain pure white background with no shadow behind the head at all. Flat, even frontal lighting — no modelling, no highlight on one cheek, no catchlight asymmetry. Neutral expression, mouth closed, eyes open and looking directly at the camera. Both ears and the full hairline visible, head centred and upright, filling roughly 70% of the frame from chin to crown. Plain dark clothing with a visible collar. No glasses, no head covering unless religious, no retouching of the face. ${KEEP_ME} ${PHOTOREAL}`,
    "Check your country's exact head-height rule before you print. The app's Passport Photo has the formats built in as a dropdown.",
    ["passport", "visa", "id photo", "official"],
    "passport-photo"
  ),
  P(
    "Actor casting headshot",
    "portrait", ["instagram"], "4:5",
    `Restage my photo as a theatrical casting headshot. Minimal styling — a plain crew-neck or simple shirt in a muted colour, no pattern, no jewellery. Honest natural light, open shade or a large window, no heavy modelling. Plain mid-tone background, slightly out of focus. Direct eye contact, neutral readable expression that a casting director can project onto. Tight head-and-shoulders, eyes on the upper third, a touch of headroom. No glamour retouching: keep freckles, lines and skin texture exactly as they are. ${KEEP_ME} ${PHOTOREAL}`,
    "Casting people want to see the real face. Ask for less retouching, not more.",
    ["actor", "casting", "headshot", "theatre"],
    "actor-headshot"
  ),
  P(
    "Doctor or clinician portrait",
    "portrait", ["linkedin", "facebook"], "1:1",
    `Restyle my photo as a medical professional's portrait. Clean, well-pressed white clinical coat over business dress, no lanyard, no visible branding. Background: a healthcare interior — a corridor or consulting room — thrown softly out of focus, bright and clean rather than clinical-cold. Even, bright lighting with no harsh shadow under the chin. Calm, reassuring expression; a small closed-mouth smile. Head-and-shoulders framing. ${KEEP_ME} ${PHOTOREAL}`,
    "Keep the background generic. Recognisable hospital signage in a generated image is a problem you don't need.",
    ["doctor", "medical", "clinic", "headshot"],
    "doctor-headshot"
  ),
  P(
    "Outdoor golden-hour portrait",
    "portrait", ["instagram", "facebook"], "4:5",
    `Restage my photo as an outdoor portrait at golden hour. Put me in an open park or tree-lined street half an hour before sunset. Warm low sun behind me and slightly to one side, rimming my hair and shoulder; a soft bounce filling my face so it is not in silhouette. Long soft shadows on the ground behind. Relaxed stance, weight on one leg, hands natural. Background compressed and thrown out of focus as an 85mm lens at f/2 would. Warm colour grade, gentle highlight roll-off. ${KEEP_ME} ${PHOTOREAL}`,
    "Golden hour reads as warm *and* low-contrast. If the result looks like harsh midday with an orange filter, ask for 'longer shadows and lower sun'.",
    ["portrait", "golden hour", "outdoor", "natural light"],
    "outdoor-headshot"
  ),
  P(
    "Black and white editorial portrait",
    "portrait", ["instagram", "x"], "4:5",
    `Convert my photo into a black-and-white editorial portrait. Single hard key light from the side, deep shadow on the opposite cheek, no fill — full Rembrandt modelling with a clear triangle of light under the eye. Plain dark background. Rich tonal range: true blacks, protected highlights, all the mid-tone detail in the skin held. Deliberate, still expression, eyes to camera. Fine 400-speed film grain throughout. Square-on framing, head-and-shoulders. ${KEEP_ME} ${PHOTOREAL}`,
    "Ask for a specific film if you want a specific look — 'Tri-X grain' behaves differently from 'HP5'.",
    ["black and white", "editorial", "portrait", "film"],
    "celebrity-headshot"
  ),
  P(
    "Founder portrait for a press kit",
    "portrait", ["linkedin", "x"], "3:2",
    `Restage my photo as a founder portrait for a press kit. Smart but unshowy dress — a good shirt, no tie. Setting: a real working space, a desk or a workshop behind me, softly out of focus but readable enough to say what I do. Natural light from a large window as the key, a practical lamp warming the background. Half-body framing with space to one side for a publication to run text. Confident, unposed expression, arms relaxed. ${KEEP_ME} ${PHOTOREAL}`,
    "Leave the negative space on the side your logo usually sits. Editors will thank you.",
    ["founder", "press", "portrait", "startup"],
    "business-headshot"
  ),
  P(
    "Graduation portrait",
    "portrait", ["instagram", "facebook"], "4:5",
    `Restage my photo as a formal graduation portrait. Dress me in a black academic gown with a matching mortarboard sitting level, and a coloured hood over the shoulders. Setting: university architecture — stone steps or a colonnade — thrown gently out of focus behind. Soft overcast daylight, no squinting, no hard shadow across the face. Half-body framing, a rolled certificate held naturally in one hand. Proud, warm expression. ${KEEP_ME} ${PHOTOREAL}`,
    "Mortarboards sit flat, not tilted back. If the cap looks wrong, say 'the mortarboard sits level on the head'.",
    ["graduation", "portrait", "university", "gown"],
    "graduation-photo"
  ),
  P(
    "Family portrait, studio",
    "portrait", ["facebook", "instagram"], "3:2",
    `Restage my uploaded photo as a formal family studio portrait. Keep every person in the photo and preserve each of their faces, bone structure and skin tone exactly, in their existing positions relative to each other. Co-ordinated but not matching wardrobe in a muted palette. Seamless warm-grey backdrop. Big soft key light with an even fill so nobody is in shadow, and a gentle floor gradient. Everyone's eyes to camera, relaxed and close together, natural contact between shoulders and hands. ${PHOTOREAL}`,
    "Group photos drift the most. Generate a couple of times and pick — the faces at the edge of the frame are the ones to check.",
    ["family", "group", "studio", "portrait"]
  ),
  P(
    "Couple portrait at blue hour",
    "portrait", ["instagram"], "4:5",
    `Restage the two people in my photo as a couple portrait at blue hour. Preserve both faces and identities exactly and keep them positioned as they are. Setting: a city rooftop or bridge twenty minutes after sunset, deep blue sky, city lights coming on and rendering as soft bokeh behind. Warm practical light on their faces against the cool ambient, which is what makes blue hour work. Close, quiet, unposed composition — foreheads near, hands held. Shallow depth of field. ${PHOTOREAL}`,
    "The whole trick is warm faces against a cool sky. If it looks flat blue, ask for 'a warm practical light on the faces'.",
    ["couple", "blue hour", "portrait", "romantic"],
    "couple-photoshoot"
  ),
  P(
    "Maternity portrait, window light",
    "portrait", ["instagram", "pinterest"], "4:5",
    `Restage my photo as a gentle maternity portrait. Flowing fabric in a plain, pale tone — a simple dress or draped cloth. Setting: a quiet interior with one large window to the side, everything else falling into soft shadow. Directional window light wrapping around the form, with the background a full stop darker. Hands resting naturally, calm expression, eyes down or softly to camera. Warm, restrained colour, almost monochrome. Half-body framing. ${KEEP_ME} ${PHOTOREAL}`,
    "One light source and a dark background is the whole look. Adding a second light flattens it.",
    ["maternity", "portrait", "window light", "soft"],
    "maternity-photoshoot"
  ),
  P(
    "Pet and owner portrait",
    "portrait", ["instagram", "facebook"], "1:1",
    `Restage my photo as a portrait of me with my pet. Preserve my face and identity exactly, and keep my pet's markings, coat colour and face exactly as they are — the pet is as recognisable as I am. Setting: a clean studio backdrop in a warm neutral tone. Soft, even light on both of us with catchlights in both sets of eyes. Natural contact — the pet held comfortably or leaning in. Both faces sharp and at the same depth. ${PHOTOREAL}`,
    "Say what your pet actually looks like in the prompt. 'A tabby with a white chest' preserves far better than 'my cat'.",
    ["pet", "portrait", "dog", "cat"],
    "pet-portrait"
  ),
  P(
    "Team headshots that match",
    "portrait", ["linkedin"], "1:1",
    `Restyle my photo into a team headshot that will sit in a grid beside others. Neutral mid-grey seamless background. Even, soft frontal lighting with a single gentle shadow on the far side of the nose. Business-casual dress, no jacket. Head-and-shoulders, head centred, eyes exactly on the upper third, the same crop every time. Neutral-friendly expression. Keep the colour temperature neutral at 5500K so this matches anyone else's photo processed the same way. ${KEEP_ME} ${PHOTOREAL}`,
    "Run every team member through this same prompt with the same ratio. Consistency across the grid is the point.",
    ["team", "about page", "headshot", "consistent"],
    "ai-headshot-generator"
  ),
  P(
    "Author photo for a book jacket",
    "portrait", ["x", "linkedin"], "3:4",
    `Restage my photo as an author portrait for a book jacket. Quiet, timeless wardrobe — dark knitwear or a plain shirt, nothing that dates. Setting: a bookshelf or a plain wall, softly out of focus, never a distraction. Soft directional light from one side, a little shadow for shape. Thoughtful, settled expression, no broad smile. Three-quarter turn, eyes to camera. Muted, almost desaturated colour. Black-and-white variant is welcome. ${KEEP_ME} ${PHOTOREAL}`,
    "Jacket photos are usually printed small and in mono. Check yours at 3cm wide before you commit.",
    ["author", "book", "portrait", "press"]
  ),
  P(
    "Fitness portrait, gym light",
    "portrait", ["instagram"], "4:5",
    `Restage my photo as a fitness portrait. Keep my build as it is in the photo — do not change my body. Setting: a real gym with equipment out of focus behind. Hard directional light from one side with deep shadow for contrast and definition, a cool rim from behind. Athletic wear that fits. Mid-action or settled between sets, not posed for the camera. Slight desaturation, strong contrast, a touch of grain. Half-body framing. ${KEEP_ME} ${PHOTOREAL}`,
    "If you do want a build change, the Muscle Generator app has a Build control rather than leaving it to the wording.",
    ["fitness", "gym", "portrait", "athletic"],
    "muscle-generator"
  ),
  P(
    "Kids' school portrait",
    "portrait", ["facebook"], "4:5",
    `Restage the child in my photo as a classic school portrait. Preserve their face, identity and skin tone exactly. Simple background: a plain mottled blue-grey painted backdrop. Soft frontal light with a gentle shadow to one side, catchlights in both eyes. Neat, simple clothing with a collar. Natural, happy expression — a real smile, not a held one. Head-and-shoulders, centred, a little headroom. Warm, slightly nostalgic colour. ${PHOTOREAL}`,
    "Children's faces drift more than adults'. Use a sharp, recent, front-facing photo and check the eyes carefully.",
    ["school", "child", "portrait", "yearbook"]
  ),

  // ── Aesthetics & trends ──────────────────────────────────────────────────
  P(
    "90s film photograph",
    "aesthetic", ["instagram", "tiktok"], "3:2",
    `Restyle my photo as a 1990s point-and-shoot film photograph. Direct on-camera flash: bright falloff on the subject, a hard shadow thrown onto the wall behind, deep unlit corners. Colour: slightly green-shifted shadows, warm blown highlights, the saturation of consumer 400-speed film. Visible grain, soft corners, a little chromatic aberration. Period-plausible wardrobe and hair. A date stamp in orange in the bottom right corner. Candid framing, slightly off-level. ${KEEP_ME} ${PHOTOREAL}`,
    "The flash shadow on the wall behind is what sells it. Ask for it explicitly if it's missing.",
    ["90s", "film", "flash", "retro"],
    "1980s-photo-trend"
  ),
  P(
    "Kodak Portra colour grade",
    "aesthetic", ["instagram", "pinterest"], "4:5",
    `Regrade my photo to look like it was shot on Kodak Portra 400 and scanned well. Warm, creamy skin tones that stay natural rather than orange. Highlights that roll off gently instead of clipping. Shadows lifted slightly with a touch of green-blue, never crushed to black. Restrained saturation, with reds pulled back. Fine, tight grain. Keep every detail in the image intact — this is a grade, not a re-render. ${KEEP_ME}`,
    "A grade prompt should not change the scene. If your composition shifted, say 'keep the composition identical, change only the colour'.",
    ["film", "portra", "colour grade", "warm"],
    "aesthetic-photo-editor"
  ),
  P(
    "Cinematic teal and orange",
    "aesthetic", ["youtube", "instagram"], "16:9",
    `Regrade my photo as a cinematic frame. Push the shadows and mid-tone background toward teal while keeping the skin warm and separated. Add a subtle anamorphic feel: slightly squeezed bokeh, a gentle horizontal flare from the brightest source, mild vignetting. Widen the contrast with a filmic S-curve, protect the highlights, and add a fine layer of digital-cinema grain. Letterbox the frame to 2.39:1 with clean black bars. ${KEEP_ME}`,
    "Teal and orange fails when skin goes teal too. Tell it to 'keep skin tones warm and unaffected'.",
    ["cinematic", "colour grade", "film", "teal orange"]
  ),
  P(
    "Old money aesthetic",
    "aesthetic", ["instagram", "pinterest"], "4:5",
    `Restage my photo in the old-money aesthetic. Wardrobe: quiet, expensive, unbranded — cable knit over a collared shirt, tailored wool, a camel coat, no logos anywhere. Setting: a panelled library, a stone terrace, or a stable yard, all softly out of focus. Overcast northern daylight, no hard sun. Palette restricted to cream, navy, camel, forest green. Composed, unhurried posture. Grade it slightly cool and desaturated with deep but open shadows. ${KEEP_ME} ${PHOTOREAL}`,
    "The whole look is the absence of logos. If a brand mark appears anywhere, ask again with 'no visible branding of any kind'.",
    ["old money", "quiet luxury", "aesthetic", "editorial"],
    "old-money-aesthetic"
  ),
  P(
    "Y2K digicam night out",
    "aesthetic", ["instagram", "tiktok"], "4:5",
    `Restyle my photo as an early-2000s digital camera snapshot on a night out. Harsh on-camera flash, overexposed face, background dropping to black two feet away. Low resolution and heavy sharpening halos around edges, visible JPEG artefacts, slight purple fringing on high-contrast lines. Y2K styling — low-rise, butterfly clips, frosted lips, tiny sunglasses on the head, a flip phone in hand. Slightly tilted, badly framed, gloriously unposed. ${KEEP_ME}`,
    "The bad quality is the aesthetic. Don't ask for it in 4K — ask for 'low resolution with visible compression'.",
    ["y2k", "2000s", "digicam", "flash"],
    "y2k-aesthetic"
  ),
  P(
    "Studio Ghibli storybook",
    "aesthetic", ["instagram", "pinterest"], "16:9",
    `Redraw my photo in a hand-painted Japanese animation style. Soft watercolour backgrounds with visible brush texture and hand-painted clouds. Clean, thin character linework with flat colour fills and gentle cel shading. Warm, saturated greens and skies. Keep my recognisable features — hair colour and shape, face shape, glasses if I wear them — in a way that is clearly me, drawn. A wide establishing composition with the figure small against a generous landscape. Not photorealistic: this is a painted frame.`,
    "Illustration styles lose likeness fastest. A close-up source photo preserves far more than a full-body one.",
    ["ghibli", "anime", "illustration", "painted"],
    "ghibli-style-generator"
  ),
  P(
    "Vintage Bollywood film still",
    "aesthetic", ["instagram", "facebook"], "3:2",
    `Restage my photo as a 1970s Hindi film still. Warm, slightly faded Eastmancolor grade with magenta-leaning shadows. Period wardrobe and hair with real fabric weight. Setting: a painted studio backdrop or a real location shot in hard afternoon sun with a big bounce for fill. Dramatic, theatrical posture and expression. Visible 35mm grain, a soft halation glow around the highlights, and the slight softness of a vintage lens wide open. ${KEEP_ME} ${PHOTOREAL}`,
    "Halation — the glow bleeding out of bright areas — is the detail most people forget. Name it.",
    ["bollywood", "retro", "film still", "70s"],
    "retro-bollywood"
  ),
  P(
    "Cyberpunk neon street",
    "aesthetic", ["instagram", "tiktok"], "9:16",
    `Restage my photo on a rain-soaked cyberpunk street at night. Setting: a dense alley of signage in a language mix, steam from vents, wet asphalt throwing long coloured reflections. Lighting: magenta key from one side, cyan rim from the other, no neutral light anywhere. Wardrobe: technical outerwear with reflective detailing. Shallow depth of field with the signage collapsing into bokeh behind. Deep blacks, saturated neon, a fine layer of grain and mild lens flare. ${KEEP_ME} ${PHOTOREAL}`,
    "Two complementary colours, one from each side, is what makes this look right. More colours make it mud.",
    ["cyberpunk", "neon", "night", "sci-fi"],
    "cyberpunk-avatar"
  ),
  P(
    "Renaissance oil painting",
    "aesthetic", ["instagram", "facebook"], "3:4",
    `Repaint my photo as a Renaissance oil portrait. Chiaroscuro lighting: a single source from high and to the left, the rest of the frame falling into warm darkness. Period dress — velvet, brocade, a linen collar — painted with real fabric weight. Background: a dark interior with a hint of landscape through an arch. Visible brushwork, canvas texture, aged varnish with fine craquelure. Three-quarter turn, hands composed. Keep my likeness clearly recognisable inside the painted style.`,
    "Ask for 'visible brushwork and canvas texture' or you get a photo with a brown filter on it.",
    ["renaissance", "oil painting", "classical", "art"],
    "renaissance-portrait"
  ),
  P(
    "Coastal summer editorial",
    "aesthetic", ["instagram", "pinterest"], "4:5",
    `Restage my photo as a coastal summer editorial. Setting: a beach or a cliff path in late afternoon, sea haze softening the horizon. Wardrobe: linen and cotton in cream, white and faded denim, moving in the wind. Backlit by low sun with a strong bounce off the sand filling the face; hair rimmed and lifting. Bleached, airy grade: lifted blacks, low saturation, warm highlights. Loose, walking, mid-movement composition rather than a pose. ${KEEP_ME} ${PHOTOREAL}`,
    "Movement is what makes it editorial. Ask for 'mid-stride, hair moving' rather than a static pose.",
    ["coastal", "summer", "editorial", "beach"],
    "coastal-cowgirl"
  ),
  P(
    "Old Hollywood glamour",
    "aesthetic", ["instagram", "pinterest"], "4:5",
    `Restage my photo as a 1940s Hollywood glamour portrait in black and white. Lighting: a hard butterfly key high and straight on, a deep shadow directly under the nose, a strong hair light, and a background separation light making a halo on the backdrop. Finger waves or a set curl, satin wardrobe, defined brows. Deep blacks, luminous highlights, silky mid-tones. Soft focus filter over the whole frame with the eyes still sharp. Head-and-shoulders, chin slightly down, eyes up. ${KEEP_ME} ${PHOTOREAL}`,
    "That single shadow under the nose — the 'butterfly' — is the signature. Ask for it by name.",
    ["hollywood", "glamour", "black and white", "vintage"],
    "old-hollywood-glamour"
  ),
  P(
    "Double exposure portrait",
    "aesthetic", ["instagram", "x"], "4:5",
    `Turn my photo into a double-exposure portrait. My silhouette in profile against a plain light background, with a dense forest at dusk exposed inside the shape of my head and shoulders. The trees should be brightest where my silhouette is darkest, so the two images trade places the way real double exposures do. Keep my profile outline and features clearly readable. Monochrome with a cool tint, plus a hint of warm in the trees. Clean empty space around the silhouette. ${KEEP_ME}`,
    "Double exposures need a clean edge. Start with a photo against a plain background.",
    ["double exposure", "creative", "silhouette", "artistic"]
  ),
  P(
    "Polaroid on a fridge door",
    "aesthetic", ["instagram", "tiktok"], "1:1",
    `Restyle my photo as an instant-film print photographed in place. The image sits inside a real white instant frame with the wide border at the bottom, slightly warm and faded with the colour shift of an expired pack. Show the print stuck to a fridge door with a magnet, at a slight angle, photographed straight on in ordinary kitchen light, with a soft reflection on the print's surface and a real shadow under one corner. A short handwritten caption in ballpoint on the bottom border. ${KEEP_ME}`,
    "Asking for the print to be photographed *in a place* is what makes these feel real rather than like a frame filter.",
    ["polaroid", "instant film", "nostalgic", "scrapbook"],
    "polaroid-photo"
  ),
  P(
    "Overcast street style",
    "aesthetic", ["instagram", "pinterest"], "4:5",
    `Restage my photo as a street-style photograph outside a fashion show. Setting: a European city pavement, cars and other people blurred well behind. Flat overcast light — the whole sky is the softbox, no hard shadow anywhere. Wardrobe: one strong statement piece and the rest quiet. Shot on a long lens from across the street: compressed background, shallow focus, caught mid-stride looking away from camera. Cool, slightly desaturated grade with rich blacks. Full-body framing with headroom. ${KEEP_ME} ${PHOTOREAL}`,
    "Long-lens compression is the street-style signature. Ask for '135mm, shot from across the street'.",
    ["street style", "fashion", "editorial", "candid"],
    "fashion-photo-editor"
  ),
  P(
    "Dark academia interior",
    "aesthetic", ["pinterest", "instagram"], "4:5",
    `Restage my photo in a dark academia setting. A university library after dark: oak shelves, brass lamps, stacked books, a long table. Wardrobe: tweed, a knitted vest, a collared shirt, wool in oxblood and moss. Lighting: warm tungsten practicals in frame doing the work, everything beyond two metres falling into shadow. Dust in the light beams. Absorbed rather than posed — reading, writing, mid-thought. Warm, low-saturation grade with deep shadows. ${KEEP_ME} ${PHOTOREAL}`,
    "Lamps that are actually visible in the frame make interior light believable. Ask for 'practical lamps in shot'.",
    ["dark academia", "library", "moody", "autumn"]
  ),
  P(
    "Golden Indian wedding portrait",
    "aesthetic", ["instagram", "facebook"], "4:5",
    `Restage my photo as a wedding portrait during an Indian ceremony. Wardrobe: a heavily worked lehenga or sherwani with real embroidery detail and believable fabric weight, layered gold jewellery. Setting: a decorated mandap or venue with marigold garlands, softly out of focus. Lighting: warm practicals and candle-light as the key, a gentle fill, the background falling off into warm bokeh. Rich gold and red palette, luminous skin, full detail held in the embroidery. Half-body framing. ${KEEP_ME} ${PHOTOREAL}`,
    "Embroidery is where these fall apart. Ask for 'real, consistent embroidery detail' and check it at full size.",
    ["wedding", "indian", "traditional", "gold"],
    "festival-photoshoot"
  ),
  P(
    "Diwali lamplight portrait",
    "aesthetic", ["instagram", "facebook"], "4:5",
    `Restage my photo as a Diwali portrait. Setting: a doorway or courtyard lined with lit diyas, a rangoli on the floor, marigold strings above. Lighting: the diyas are the key light — warm, low, coming from below and in front, with the background falling away into darkness and points of flame as bokeh. Festive traditional dress with detailed fabric. Warm gold grade, deep shadows, no cool light anywhere in frame. Half-body or three-quarter framing. ${KEEP_ME} ${PHOTOREAL}`,
    "Light from below is unusual and it's what makes lamplight read. Don't let it add a normal key light on top.",
    ["diwali", "festival", "lamplight", "india"],
    "festival-photoshoot"
  ),
  P(
    "Holi colour portrait",
    "aesthetic", ["instagram", "tiktok"], "4:5",
    `Restage my photo as a Holi portrait. Clouds of dry coloured powder suspended in the air around me, caught mid-throw, with individual grains visible where the light hits them. White cotton clothing already stained with pink, yellow and blue. Bright open daylight with a backlight making the powder glow. Powder on my skin and in my hair, but my face still clearly recognisable underneath. Joyful, laughing, moving. Fast shutter freezing the particles. ${KEEP_ME} ${PHOTOREAL}`,
    "Backlight is what makes the powder glow instead of looking like a sticker. Ask for it.",
    ["holi", "colour", "festival", "action"],
    "festival-photoshoot"
  ),
  P(
    "Claymation character",
    "aesthetic", ["tiktok", "instagram"], "1:1",
    `Remake me as a stop-motion clay character. Visible fingerprints and tool marks in the clay surface, slightly uneven proportions, a wire armature implied by the pose. Photographed as a real miniature set: shallow depth of field, practical set lighting with warm and cool sources, a handmade backdrop with visible material texture. Keep my recognisable traits — hair shape and colour, glasses, a distinctive feature — sculpted into the clay. Not smooth CGI: this is a physical object photographed under lights.`,
    "'Visible fingerprints in the clay' is the single detail that separates claymation from 3D render.",
    ["claymation", "stop motion", "clay", "character"],
    "claymation-portrait"
  ),
  P(
    "Pixel art avatar",
    "aesthetic", ["x", "tiktok"], "1:1",
    `Turn my photo into a 16-bit pixel art avatar. A fixed pixel grid with every pixel sharp-edged — no anti-aliasing, no soft gradients. A limited palette of about 24 colours with deliberate dithering for shading. Keep my recognisable features readable at this resolution: hair shape and colour, skin tone, glasses, facial hair. Head and shoulders, centred, on a flat single-colour background. Crisp and legible when displayed small.`,
    "Pixel art must not be upscaled smoothly. Ask for 'hard pixel edges, no anti-aliasing'.",
    ["pixel art", "avatar", "retro", "gaming"],
    "pixel-art-generator"
  ),
  P(
    "Infrared summer landscape portrait",
    "aesthetic", ["instagram", "pinterest"], "3:2",
    `Restage my photo as a false-colour infrared photograph. All foliage renders as bright candy pink and white while the sky goes deep cyan and the clouds stay brilliant white. Skin renders pale and waxy with dark eyes, the way infrared handles people. Setting: a meadow with trees, shot at midday. High contrast, slight glow around the highlights, fine grain. Keep my features clearly recognisable despite the tonal inversion. ${KEEP_ME}`,
    "Say what each element should become — foliage pink, sky cyan — or you get a pink filter over everything.",
    ["infrared", "surreal", "landscape", "colour"]
  ),
  P(
    "Vaporwave poster portrait",
    "aesthetic", ["x", "instagram"], "1:1",
    `Restage my photo as a vaporwave poster. A magenta-to-cyan gradient sky with a wireframe grid floor running to the horizon and a large low sun with horizontal bands cut through it. Roman bust statuary and a palm tree as set dressing. My portrait composited in with a hard edge and a slight chromatic split. Deep purples, hot pink and cyan only. VHS artefacts: scan lines, tracking noise, a little bleed on the saturated edges. ${KEEP_ME}`,
    "VHS artefacts are the difference between vaporwave and a purple gradient. Name the scan lines.",
    ["vaporwave", "retro", "poster", "80s"]
  ),

  // ── Social templates ─────────────────────────────────────────────────────
  P(
    "YouTube thumbnail with a reaction",
    "social", ["youtube"], "16:9",
    `Turn my photo into a YouTube thumbnail. Cut me out and place me on the right third, from the chest up, big enough that my face fills about 40% of the frame height. Exaggerated but genuine surprised expression — raised brows, wide eyes, open mouth. Add a thick contrasting outline and a soft drop shadow so I separate from the background. Background: a strong two-colour gradient with a subtle radial burst behind my head. Leave the left two-thirds clear for a headline. Punchy saturation, high contrast, everything legible at 210 pixels wide. ${KEEP_ME}`,
    "Open the thumbnail at 210px wide before you use it. If the expression stops reading, make the face bigger.",
    ["youtube", "thumbnail", "reaction", "clickable"],
    "youtube-thumbnail-generator"
  ),
  P(
    "YouTube thumbnail with big text",
    "social", ["youtube"], "16:9",
    `Turn my photo into a YouTube thumbnail with a headline rendered in the image. Set the text "I TRIED IT FOR 30 DAYS" in a heavy condensed sans-serif across the left half, in white with a thick black outline, filling that half edge to edge in two or three lines. Spell it exactly as written. Place me on the right, cut out, with a coloured outline separating me from a dark gradient background. One accent colour only, used in the text and repeated behind me. High contrast, no small details. ${KEEP_ME}`,
    "Swap the headline for your own before copying. Text renders more reliably on the GPT Image model than on Nano Banana.",
    ["youtube", "thumbnail", "text", "headline"],
    "thumbnail-maker"
  ),
  P(
    "Instagram carousel cover",
    "social", ["instagram"], "4:5",
    `Turn my photo into the cover slide of an Instagram carousel. Place me on the lower right, cut out cleanly, from the waist up, looking toward the empty space. Background: a flat brand-coloured panel with a subtle paper texture. Leave the upper left two-thirds completely clear for a headline and a swipe indicator. Add a thin outlined arrow in the bottom right corner. Consistent, restrained palette — two colours plus a neutral. Sharp edges, no gradients, no clutter. Composed for a 4:5 feed crop with safe margins. ${KEEP_ME}`,
    "Carousels live or die on slide one. Keep two-thirds of it empty and the headline short.",
    ["instagram", "carousel", "cover", "template"],
    "instagram-photo-editor"
  ),
  P(
    "Instagram profile picture",
    "social", ["instagram"], "1:1",
    `Turn my photo into an Instagram profile picture. Crop tight to my head and shoulders, centred, with generous even margins so nothing important is lost to the circular crop. Background: a single flat colour chosen to contrast with my hair and clothing, no pattern. Bright, even light on my face with clean catchlights. Warm, open expression. Sharpen slightly so it still reads at 32 pixels wide. ${KEEP_ME} ${PHOTOREAL}`,
    "Preview it as a 32px circle. If you can't tell it's you, crop tighter.",
    ["instagram", "profile picture", "avatar", "pfp"],
    "instagram-pfp-maker"
  ),
  P(
    "Instagram story with text room",
    "social", ["instagram", "tiktok"], "9:16",
    `Restage my photo as a full-bleed Instagram story frame. Place me in the lower half of the tall frame with the setting filling the rest. Keep the top 250 pixels and the bottom 250 pixels visually quiet — no faces, no text, no critical detail — because the app's own interface sits there. Add a soft dark gradient from the bottom edge so white text will read over it. Vertical composition with real depth: something close, me in the middle, a background falling away. ${KEEP_ME} ${PHOTOREAL}`,
    "Stories get eaten at the top and bottom by the app UI. That's what the quiet bands are for.",
    ["instagram", "story", "vertical", "9:16"]
  ),
  P(
    "TikTok cover frame",
    "social", ["tiktok"], "9:16",
    `Turn my photo into a TikTok cover frame. Vertical composition, me from the chest up in the upper-middle third, expressive and looking straight to camera. Bright, punchy, high-contrast colour that stands out in a fast scroll. Keep the bottom third clear of anything important — the caption, handle and buttons sit there. Add a bold accent shape behind my head for separation. No fine detail anywhere; everything must read on a phone at arm's length in half a second. ${KEEP_ME}`,
    "The bottom third of a TikTok is covered by the caption and buttons. Never put your face there.",
    ["tiktok", "cover", "vertical", "reels"]
  ),
  P(
    "X header banner",
    "social", ["x"], "3:1",
    `Turn my photo into an X header banner, 1500×500. Place me on the right third, from the chest up, cut out with a clean edge. Fill the left two-thirds with a calm abstract background — a soft gradient or an out-of-focus texture — that a short tagline could sit over. Keep everything important away from the bottom-left corner, where the profile picture overlaps, and away from the outer 60 pixels on each side. Restrained palette of two colours. ${KEEP_ME}`,
    "The profile picture punches a hole in the bottom-left of every X header. Design around it.",
    ["x", "twitter", "header", "banner"]
  ),
  P(
    "LinkedIn banner with a workspace",
    "social", ["linkedin"], "4:1",
    `Turn my photo into a LinkedIn banner, 1584×396. Setting: my working environment — a desk, a workshop, a studio — shot wide and thrown gently out of focus, warm and bright. Place me small on the right, in focus, half-body. Keep the left 40% and the entire lower-left corner clear: the profile photo and my name sit there. Muted, professional palette that will not fight a headshot placed over it. Subtle, not busy. ${KEEP_ME} ${PHOTOREAL}`,
    "LinkedIn crops banners differently on mobile. Keep everything important in the middle horizontal band.",
    ["linkedin", "banner", "cover", "professional"],
    "linkedin-banner-maker"
  ),
  P(
    "Facebook cover photo",
    "social", ["facebook"], "16:9",
    `Turn my photo into a Facebook cover photo. Wide composition with me offset to the right and the setting opening out to the left. Keep the lower-left quadrant clear — the profile picture and name overlay it on desktop, and the crop is tighter on mobile, so keep everything important inside the central 60% horizontally. Warm, inviting light. Clean and uncluttered, no text. ${KEEP_ME} ${PHOTOREAL}`,
    "Facebook shows a narrower slice on phones. Anything near the left or right edge will be cut.",
    ["facebook", "cover", "banner", "profile"],
    "facebook-pfp-maker"
  ),
  P(
    "Link preview card",
    "social", ["facebook", "x", "linkedin"], "1.91:1",
    `Turn my photo into a link-preview card at 1200×630. Me on one side at half-body, a solid or softly textured panel on the other with clear space for a title. Strong single accent colour. High contrast between subject and background so the card stands out in a feed of white cards. Keep a 60-pixel margin of quiet space on every edge, since different platforms crop this differently. No small text, no fine detail. ${KEEP_ME}`,
    "Every platform crops 1200×630 slightly differently. The margin is insurance.",
    ["og image", "link preview", "social card", "meta"]
  ),
  P(
    "Pinterest pin with headline room",
    "social", ["pinterest"], "2:3",
    `Turn my photo into a Pinterest pin. Tall 2:3 composition. Put the subject in the lower two-thirds and leave the top third as a clean, lighter area for a headline. Bright, airy, high-key light. Warm, inviting palette. A subtle white border inset around the whole pin. Add a soft shadow beneath the subject so it lifts off the background. Sharp, clean and calm — Pinterest rewards images that are easy to read, not busy. ${KEEP_ME} ${PHOTOREAL}`,
    "Pins are browsed at about 236px wide. Anything smaller than a thumbnail-sized detail is wasted.",
    ["pinterest", "pin", "vertical", "blog graphic"]
  ),
  P(
    "Podcast episode artwork",
    "social", ["instagram", "x"], "1:1",
    `Turn my photo into podcast episode artwork. Me in black and white, high contrast, cut out and placed on a bold flat colour field. A thick geometric frame or half-circle behind my head as a graphic anchor. Leave a clean band across the bottom for an episode title. Two colours only plus black and white. Grainy texture over the whole frame. Confident, direct expression, looking at the camera. ${KEEP_ME}`,
    "Episode art is browsed as a tiny square. Two colours and one shape beats any amount of detail.",
    ["podcast", "artwork", "cover", "square"]
  ),
  P(
    "Event announcement graphic",
    "social", ["instagram", "facebook", "linkedin"], "1:1",
    `Turn my photo into an event announcement graphic. Me on the right, cut out, half-body, looking into the frame. Left half reserved for the event name, date and venue — leave it as a clean flat panel. Add a thin border and a small corner accent shape. Bold, confident palette of two colours plus white. A subtle pattern in the background panel for texture. Everything readable at a glance in a scroll. ${KEEP_ME}`,
    "Leave the text area genuinely empty. Text the model renders is hard to edit later; text you add yourself isn't.",
    ["event", "announcement", "webinar", "graphic"]
  ),
  P(
    "Before and after split",
    "social", ["instagram", "facebook"], "1:1",
    `Build a before-and-after split from my photo. Left half: the image exactly as it is now, untouched. Right half: the same frame, same composition, same crop, fully edited — corrected colour, balanced exposure, clean background, polished finish. A clean vertical divider line down the centre with a small circular handle at the middle. Small "Before" and "After" labels in the top corners of each half. The two halves must line up exactly so the comparison is honest. ${KEEP_ME}`,
    "The two sides must be the same crop or the comparison is meaningless. Say 'same composition on both sides'.",
    ["before after", "comparison", "split", "showcase"]
  ),
  P(
    "Quote card with a portrait",
    "social", ["instagram", "linkedin"], "1:1",
    `Turn my photo into a quote card. Me on the left third, in black and white, faded softly into a flat background colour rather than cut out with a hard edge. The right two-thirds left clean for a quotation. A large decorative quotation mark in a low-contrast tint behind where the text will go. Restrained: one accent colour, generous margins, plenty of empty space. Calm and editorial rather than loud. ${KEEP_ME}`,
    "Leave more empty space than feels comfortable. Quote cards fail from being too full.",
    ["quote", "card", "typography", "instagram"]
  ),
  P(
    "Discord and gaming avatar",
    "social", ["tiktok", "x"], "1:1",
    `Turn my photo into a gaming avatar. Stylised illustration rather than a photograph: bold clean linework, saturated colour, dramatic rim lighting in two colours from opposite sides. Keep my recognisable traits — hair, glasses, facial hair — clearly readable. Headset on, slight upward angle, confident expression. Dark background with a subtle radial glow. Composed for a circular crop with the head centred and clear margins. Sharp and legible at 64 pixels.`,
    "Avatars are shown tiny. One strong silhouette beats any amount of rendered detail.",
    ["discord", "avatar", "gaming", "pfp"],
    "discord-pfp-maker"
  ),
  P(
    "Album cover from a portrait",
    "social", ["instagram", "x"], "1:1",
    `Turn my photo into an album cover. Me centred, shot from slightly below, grainy and high contrast. A single bold colour wash over the whole frame with the blacks left true. A heavy horizontal band across the lower third where a title would sit — leave it clean. Visible film grain and a subtle print misregistration on the coloured edges. Restrained: one colour, one shape, one subject. Square, and strong enough to read as a 60-pixel tile in a streaming app. ${KEEP_ME}`,
    "Test it at 60px. Album art is mostly consumed at the size of a fingernail.",
    ["album", "cover", "music", "artwork"],
    "album-cover-generator"
  ),
  P(
    "Movie poster treatment",
    "social", ["instagram", "x"], "2:3",
    `Turn my photo into a film poster. Me large in the lower half, shot from a low hero angle, lit from behind with atmospheric haze. The upper half opens into a dramatic sky or a suggestion of the setting. Teal and orange grade with deep shadows. Leave a clean band at the very bottom for a billing block and a clear area at the top for a title. Cinematic 2:3 proportions, heavy vignette, a fine grain over everything. ${KEEP_ME} ${PHOTOREAL}`,
    "Posters work because of the empty top and bottom. Resist filling them.",
    ["movie poster", "cinematic", "poster", "dramatic"],
    "movie-poster-generator"
  ),
  P(
    "Testimonial graphic",
    "social", ["linkedin", "facebook"], "1:1",
    `Turn my photo into a customer testimonial graphic. A small circular crop of my face in the lower left, with a thin ring around it. The rest is a clean flat card with generous margins, left empty for the quotation and my name and title. A row of five filled stars above the empty text area. Calm, trustworthy palette — one brand colour, white, and a soft grey. Sharp edges, subtle shadow under the card. ${KEEP_ME}`,
    "Only use a real testimonial with the person's permission. A fabricated one is worse than none.",
    ["testimonial", "review", "social proof", "graphic"]
  ),
  P(
    "Profile picture for every platform",
    "social", ["instagram", "linkedin", "facebook", "x"], "1:1",
    `Turn my photo into a profile picture that works everywhere. Tight head-and-shoulders crop, head centred, with margins wide enough to survive a circular mask. Plain, softly graduated background in a single colour that contrasts with my hair. Even, flattering light with visible catchlights. Neutral-warm expression — friendly enough for social, composed enough for work. Neutral colour temperature and no stylisation, so it suits any platform. ${KEEP_ME} ${PHOTOREAL}`,
    "One photo everywhere makes you recognisable across platforms. It's worth getting one good one.",
    ["profile picture", "avatar", "everywhere", "consistent"],
    "profile-picture-maker"
  ),

  // ── Product & business ───────────────────────────────────────────────────
  P(
    "White-background product shot",
    "product", ["instagram", "facebook"], "1:1",
    `Turn my photo into a marketplace-ready product shot. Isolate the product and place it on a pure white seamless background with a soft, natural contact shadow directly beneath it — not a drop shadow, a real one. Centre it with even margins and about 10% clear space on all sides. Even, soft lighting from two large sources with one crisp specular highlight describing the material. Correct the colour so the product's real colour is accurate. Every edge clean and sharp, no halo or fringing from the cut-out.`,
    "Marketplaces reject grey-white backgrounds. Ask explicitly for 'pure white, RGB 255'.",
    ["product", "ecommerce", "white background", "listing"],
    "product-photoshoot",
    true
  ),
  P(
    "Lifestyle product scene",
    "product", ["instagram", "pinterest"], "4:5",
    `Restage my product photo as a lifestyle scene. Place the product on a real surface — oak, linen or stone — with two or three props that suggest how it's used, kept well out of focus behind. Warm natural window light from the side with a soft bounce on the shadow side. Shallow depth of field with the product's label sharp. Keep the product's shape, colour, material and any text on it exactly as it is in my photo. Warm, inviting colour. Leave clear space in the upper third for a caption.`,
    "Props sell the use, not the product. Keep them out of focus and keep them few.",
    ["product", "lifestyle", "styled", "instagram"],
    "ai-product-photography"
  ),
  P(
    "Jewellery on a dark field",
    "product", ["instagram", "pinterest"], "1:1",
    `Restage my jewellery photo as a luxury product shot. Place the piece on a deep matte background — near-black or a dark stone — with a soft pool of light isolating it. Lighting: a large soft source giving long clean gradients across the metal, plus one small hard source making a sharp sparkle in the stones. Real reflections and refraction in the gems. Macro sharpness on the setting and the stone, the background falling fully out of focus. Keep the metal colour, stone colour and setting exactly as they are.`,
    "Metal needs gradients, stones need a hard light. That's why this asks for two sources.",
    ["jewellery", "luxury", "macro", "product"],
    "image-editor-for-jewelry"
  ),
  P(
    "Food photography, overhead",
    "product", ["instagram", "pinterest"], "1:1",
    `Restage my food photo as an overhead shot. Camera directly above, everything flat to the frame. Surface: a marble or dark slate board. Arrange a few supporting elements — ingredients, a napkin, cutlery — around the dish, with real space between them. Soft diffuse light from one side with a subtle shadow giving the food dimension, never flat frontal light. Keep the dish exactly as it is — same food, same plating, same colour. Rich, appetising colour with the highlights protected.`,
    "Food dies under flat light. Side light with a bit of shadow is what makes it look edible.",
    ["food", "overhead", "flat lay", "restaurant"],
    "food-photo-editor"
  ),
  P(
    "Restaurant dish, moody",
    "product", ["instagram"], "4:5",
    `Restage my food photo as a moody restaurant shot. One raking light from behind and to the side, catching steam and the texture of the food, with the rest of the frame falling into deep shadow. Dark wood or slate surface, minimal props, everything else black. Shot at a 45-degree angle at plate height. Rich saturated colour in the food against a desaturated dark background. Keep the dish exactly as plated in my photo.`,
    "Backlight plus steam is the restaurant look. If there's no steam, ask for it.",
    ["food", "moody", "restaurant", "dark"],
    "food-photo-editor"
  ),
  P(
    "Car on a mountain road",
    "product", ["instagram", "youtube"], "16:9",
    `Restage my car photo on an empty mountain road at golden hour. Keep the car's exact model, body shape, colour, wheels and any visible badging unchanged. Low sun raking along the bodywork, picking out every crease and the shoulder line. Landscape falling away behind, atmospheric haze in the distance. Shot low, from the front three-quarter, on a long lens. Clean reflections in the paint that make sense with the sky. Warm grade, deep shadows, no blown highlights on the panels.`,
    "Reflections are what make car photos look real. Ask for 'reflections that match the surroundings'.",
    ["car", "automotive", "golden hour", "product"],
    "car-photo-editor"
  ),
  P(
    "Cosmetics on a colour field",
    "product", ["instagram", "tiktok"], "4:5",
    `Restage my beauty product photo. Place the product upright on a raised plinth of the same colour as the background — a single saturated colour, edge to edge. Hard directional light making a crisp, deliberate shadow at an angle across the background. Keep the packaging, label text and colours exactly as they are. Sharp focus across the whole product, clean specular highlights on any glossy surface. Centred with generous space above for a headline.`,
    "One saturated colour and one hard shadow. Beauty shots fail from having too much going on.",
    ["cosmetics", "beauty", "product", "colour"],
    "image-editor-for-beauty"
  ),
  P(
    "Flat lay for a small business",
    "product", ["instagram", "pinterest"], "1:1",
    `Build a flat lay around my product. Shot directly overhead on a plain light surface. The product centred and dominant, with a few related items arranged around it on an invisible grid with real breathing room between them. Soft even daylight with a gentle shadow to one side. Restrained palette — everything in the frame in two or three colours that suit the product. Keep the product exactly as it is. Leave one clear quadrant empty for text.`,
    "Flat lays need an empty quadrant. It's where the caption goes and it's what stops the image feeling cluttered.",
    ["flat lay", "small business", "overhead", "styled"],
    "ecommerce-product-editor"
  ),
  P(
    "Model wearing the product",
    "product", ["instagram"], "4:5",
    `Restage my product photo as an on-body shot. Keep the product's exact shape, colour, material and any logo unchanged; show it being worn naturally, with correct drape and fit and believable contact with the body. Neutral background — a plain studio wall in a warm grey. Soft directional light modelling both the product and the body. Frame so the product is the clear subject and the person supports it, cropped so no face is needed. ${PHOTOREAL}`,
    "Crop out the face and you avoid the identity problem entirely — the product is the subject anyway.",
    ["apparel", "on body", "fashion", "product"],
    "outfit-generator"
  ),
  P(
    "Packaging mockup on a shelf",
    "product", ["instagram", "linkedin"], "4:5",
    `Place my product into a retail shelf mockup. The product sits on a shop shelf at eye level, front-facing, with out-of-focus product rows either side and behind so the context reads without competing. Keep my product's packaging, colour and label text exactly as they are and in sharp focus. Overhead retail lighting with a believable shadow under the pack and a soft reflection on the shelf edge. Shot straight on at shelf height with a slight depth-of-field falloff.`,
    "Shelf mockups sell the idea to stockists. Keep the neighbouring products vague so nothing real is implied.",
    ["packaging", "mockup", "retail", "shelf"]
  ),
  P(
    "Property interior, bright",
    "product", ["facebook", "pinterest"], "3:2",
    `Restage my interior photo as a property listing shot. Correct the verticals so walls are perfectly straight and parallel. Bright, even daylight through the windows with the view outside still visible rather than blown out. Lift the shadows so every corner is readable, keeping the contrast natural. Neutral white balance — no orange cast from the bulbs. Tidy and declutter: remove cables, bins and personal items, leaving the furniture and layout exactly as they are. Wide composition from corner height.`,
    "Straight verticals are the single biggest tell of a professional property photo.",
    ["real estate", "interior", "property", "listing"],
    "image-editor-for-real-estate"
  ),
  P(
    "Hotel room at twilight",
    "product", ["facebook", "pinterest"], "3:2",
    `Restage my room photo as a hotel listing image at twilight. The windows show a deep blue evening sky while every lamp inside is lit and warm, which is the balance that makes these images work. Straight verticals, wide composition, bed and seating arranged neatly. Warm pools of light from the practicals, a soft ambient fill so nothing is black. Rich but believable colour. Keep the room's actual layout, furniture and finishes unchanged.`,
    "Twilight exteriors and interiors are the standard in hospitality for a reason: warm inside, cool outside.",
    ["hotel", "interior", "twilight", "hospitality"],
    "image-editor-for-hotels"
  ),
  P(
    "Electronics on a dark gradient",
    "product", ["instagram", "youtube"], "16:9",
    `Restage my electronics photo as a launch-style product shot. Dark background with a soft radial gradient behind the product. Long, controlled specular highlights running down the edges of the device describing its metal and glass. Screen on, showing a simple clean interface, with a believable glow onto the surface below. Keep the device's exact shape, ports, buttons and branding. Shot slightly off-axis so the form reads in three dimensions. Sharp throughout, deep blacks.`,
    "Long edge highlights are what make metal look like metal. Ask for them explicitly.",
    ["electronics", "tech", "product", "launch"],
    "image-editor-for-electronics"
  ),
  P(
    "Home decor in a styled room",
    "product", ["pinterest", "instagram"], "4:5",
    `Place my decor product into a styled room scene. Keep the product's exact shape, colour, material and scale, and position it as the clear focal point. Surround it with a calm, well-designed interior in a warm neutral palette, softly out of focus. Natural light from a window to one side, warm late-afternoon quality. Shallow depth of field, the product sharp. Everything else restrained so the eye goes straight to it.`,
    "Scale is what goes wrong in room scenes. Say how big the product actually is.",
    ["home decor", "interior", "styled", "product"],
    "image-editor-for-home-decor"
  ),
  P(
    "Two-up product comparison",
    "product", ["instagram", "facebook"], "1:1",
    `Build a side-by-side product comparison from my photo. The same product shown twice on a split background — left half one colour, right half another. Both shots identical in angle, scale, lighting and position so only the intended difference is visible. A thin dividing line down the centre. Leave a clean strip at the bottom for labels. Even, shadowless lighting on both sides. Keep the product exactly as it is.`,
    "Identical angle and scale on both halves, or the comparison misleads.",
    ["comparison", "product", "variants", "grid"]
  ),
  P(
    "Ingredient hero shot",
    "product", ["instagram", "pinterest"], "1:1",
    `Restage my product photo as an ingredient hero. The product centred and sharp, with its raw ingredients arranged around and slightly behind it — botanicals, fruit, grains, whatever it is made from — some in focus, some falling away. A splash or a scatter caught mid-air adds movement. Clean, bright light from above and behind with a strong fill. Keep the product's packaging and label exactly as they are. Fresh, saturated colour against a simple background.`,
    "Name the actual ingredients. 'Botanicals' generates something generic; 'rosemary and lemon peel' doesn't.",
    ["ingredients", "product", "hero", "food"]
  ),

  // ── Ads & brand creative ─────────────────────────────────────────────────
  P(
    "Single-product ad creative",
    "brand", ["instagram", "facebook"], "1:1",
    `Build a paid-social ad creative around my product. The product large and centred on a bold flat colour field, lit cleanly with a real contact shadow. A simple geometric shape behind it — a circle or an arch — in a second colour for depth. Leave the top quarter and bottom quarter clear for a headline and a call to action. Nothing else in the frame. High contrast so it stops a scroll. Keep the product exactly as it is in my photo.`,
    "Ad creative competes with everything else in the feed. One product, one colour, one idea.",
    ["ad", "paid social", "creative", "product"],
    "ai-ads-generator"
  ),
  P(
    "Lifestyle ad with a person",
    "brand", ["instagram", "facebook"], "4:5",
    `Build a lifestyle ad frame from my photo. Me using the product naturally in a real setting — mid-action, looking at the product rather than the camera. Warm, natural light. The product clearly visible and sharp, at the optical centre of the frame. Background real but simplified, thrown out of focus. Leave the lower third dimmer for a caption overlay. Warm, optimistic grade. ${KEEP_ME} ${PHOTOREAL}`,
    "Looking at the product, not the camera, is what makes lifestyle ads feel unstaged.",
    ["ad", "lifestyle", "campaign", "creative"],
    "marketing-creative-editor"
  ),
  P(
    "Seasonal sale creative",
    "brand", ["instagram", "facebook"], "1:1",
    `Build a seasonal sale creative around my product. Keep the product exactly as it is, centred and sharp. Surround it with restrained seasonal set dressing — a few props, soft depth, nothing crowding the product. A bold accent colour in a band across the top for the offer, left clean for text. Warm festive light with a gentle glow. High contrast, clean edges, no clutter. Composed so the product still dominates.`,
    "The offer text is the point. Leave it a real space rather than laying it over the product.",
    ["sale", "seasonal", "promotion", "ad"]
  ),
  P(
    "Testimonial ad frame",
    "brand", ["facebook", "instagram"], "1:1",
    `Build an ad frame around a customer quote. A soft, slightly faded photograph as the background, dimmed with a dark overlay so white text will read anywhere over it. A small circular portrait crop in the lower left with a thin ring. Clean, generous margins. One accent colour used sparingly. Leave the whole centre clear for the quotation. Calm and credible rather than loud. ${KEEP_ME}`,
    "Real quotes only, with permission. An invented testimonial is a legal problem, not a creative one.",
    ["testimonial", "ad", "social proof", "quote"]
  ),
  P(
    "Brand pattern background",
    "brand", ["instagram", "linkedin"], "1:1",
    `Generate a seamless brand background pattern. Simple geometric motifs — circles, arcs and lines — repeating on a regular grid, in three colours on a light ground. Flat vector shapes, no gradients, no shadows. The pattern should tile seamlessly and stay calm enough to sit behind text or a product. Even visual weight across the whole frame with no obvious focal point.`,
    "Patterns are for behind things. If it draws the eye on its own, it's too strong.",
    ["pattern", "brand", "background", "vector"],
    undefined,
    false
  ),
  P(
    "Logo concept from a name",
    "brand", ["linkedin", "x"], "1:1",
    `Design a simple logo mark for a business called "Northwind Coffee", spelled exactly that way. A clean geometric icon paired with the name set beside it in a confident sans-serif. One colour on a plain background. Balanced spacing, even weight, no gradients, no fine detail. It must stay legible at 24 pixels and work in a single flat colour. Centred, with generous clear space around it.`,
    "Replace the name before you copy. Text renders more reliably on the GPT Image model.",
    ["logo", "brand", "identity", "mark"],
    "logo-maker",
    false
  ),
  P(
    "Email header banner",
    "brand", ["linkedin"], "3:1",
    `Build a wide email header banner. A calm gradient or soft abstract texture across the whole frame in two brand colours. Space left clear in the centre for a logo and a short line of text. Subtle depth — a soft shape or blur, nothing busy. Light enough that dark text will read over it. No fine detail: this is viewed small and often with images half-loaded.`,
    "Email clients render images unpredictably. Keep it simple and make sure it works without the images too.",
    ["email", "banner", "newsletter", "header"],
    undefined,
    false
  ),
  P(
    "App store screenshot frame",
    "brand", ["instagram"], "9:16",
    `Build an app-store screenshot frame. A phone mockup at a slight angle, floating with a soft shadow, on a bold gradient background. The screen shows my uploaded image cleanly, undistorted and sharp, fitted to the phone's screen with correct perspective. Leave the top third clear for a short headline. One accent colour repeated in the gradient and the shadow tint. Clean and modern, nothing fussy.`,
    "Perspective is what breaks mockups. Ask for 'correct perspective, no distortion on the screen content'.",
    ["app store", "mockup", "screenshot", "phone"]
  ),
  P(
    "Conference speaker graphic",
    "brand", ["linkedin", "x"], "1:1",
    `Build a speaker announcement graphic. My photo cut out and placed on the right in a circular or arched frame with a thin accent ring. The left half a clean flat panel for my name, title and talk. A small band at the bottom for the event name and date. Professional palette — one brand colour, a deep neutral, white. Even, flattering light on my face. ${KEEP_ME}`,
    "These get reposted by the event and by you. Make sure the crop works as both a square and a 16:9.",
    ["conference", "speaker", "event", "announcement"]
  ),
  P(
    "Course or webinar thumbnail",
    "brand", ["youtube", "linkedin"], "16:9",
    `Build a course thumbnail. Me on the right, cut out, half-body, gesturing toward the empty left side. A clean dark background with a subtle grid or gradient. Leave the left 60% clear for the course title. A small accent bar under where the title will go. Bright, even light on my face, strong separation from the background. High contrast, legible at small sizes. ${KEEP_ME}`,
    "Gesturing toward the text area pulls the eye there. It's a small trick that works.",
    ["course", "webinar", "thumbnail", "education"]
  ),
  P(
    "Job posting graphic",
    "brand", ["linkedin"], "1:1",
    `Build a "we're hiring" graphic. A warm photograph of a workspace as the background, dimmed with a colour overlay. A clean card shape in the centre with generous margins, left empty for the role title and location. A small accent shape in one corner. Friendly, open palette. Nothing crowded — this is read in a scroll, in two seconds.`,
    "One role per graphic. A list of five roles in one image gets ignored.",
    ["hiring", "recruitment", "linkedin", "graphic"]
  ),
  P(
    "Milestone announcement",
    "brand", ["linkedin", "x"], "1:1",
    `Build a milestone announcement graphic. A large number as the focal point, rendered as a clean bold shape in the centre with plenty of space around it. A calm gradient background in brand colours. A small line of space below the number for a short caption. Subtle confetti or geometric accents at the edges, restrained enough to stay professional. Clean, confident, uncluttered.`,
    "The number is the whole graphic. Anything competing with it weakens the post.",
    ["milestone", "announcement", "celebration", "brand"],
    undefined,
    false
  ),

  // ── Fun & novelty ────────────────────────────────────────────────────────
  P(
    "Collectible figurine in a box",
    "fun", ["instagram", "tiktok"], "4:5",
    `Turn me into a collectible figurine still in its packaging. A 1/7 scale figure of me in a printed retail box with a clear plastic window, the box art showing a stylised version of the same character. Glossy PVC with realistic material sheen and a visible seam line. Keep my face, hair and outfit recognisable, sculpted rather than photographed. Shot as a product photograph: studio lighting, soft shadow, plain surface, shallow depth of field on the box edge.`,
    "The box art is the detail that makes these shareable. Ask for it.",
    ["figurine", "collectible", "toy", "3d"],
    "3d-figurine"
  ),
  P(
    "Vinyl figure version of me",
    "fun", ["instagram", "tiktok"], "1:1",
    `Turn me into a stylised vinyl collectible figure. Oversized round head, small body, simplified features, matte vinyl with a soft sheen. Keep my recognisable traits — hair colour and style, glasses, facial hair, my outfit's colours — simplified but clearly mine. Standing on a round display base against a plain studio background. Photographed as a real object: soft key light, gentle shadow, shallow depth of field.`,
    "Simplified features preserve identity better than detailed ones at this scale. Fewer, stronger traits.",
    ["vinyl figure", "collectible", "toy", "cute"],
    "funko-figure-maker"
  ),
  P(
    "Action figure on a blister card",
    "fun", ["instagram", "facebook"], "4:5",
    `Turn me into an action figure sealed on a blister card. A moulded plastic bubble over a printed cardback with my name in a bold logo treatment at the top and a small accessory or two beside the figure. The figure has visible joints at shoulders, hips and knees, and a slightly glossy plastic finish. Keep my face, hair and clothing recognisable in sculpted form. Photograph the card flat under even light with a soft reflection on the plastic bubble.`,
    "Accessories are the joke. Pick two that say something about you.",
    ["action figure", "toy", "packaging", "novelty"],
    "action-figure-generator"
  ),
  P(
    "Brick minifigure version",
    "fun", ["instagram", "tiktok"], "1:1",
    `Turn me into a small plastic brick-style minifigure. The standard blocky proportions: cylindrical head, printed simple face, claw hands, a moulded hair piece. Keep my recognisable traits as printed and moulded details — hair colour and shape, glasses, facial hair, my outfit's colours. Standing on a baseplate against a plain background. Photographed as a real toy: macro lens, soft studio light, a visible plastic sheen and a fine moulding seam.`,
    "Toy photography needs macro sharpness and a real shadow, or it reads as a render.",
    ["minifigure", "brick", "toy", "lego"],
    "lego-minifigure"
  ),
  P(
    "Superhero alter ego",
    "fun", ["instagram", "tiktok"], "4:5",
    `Restage me as a superhero. A fitted armoured suit in navy and gold with panelled detail, a chest emblem, and a cape catching the wind. Setting: a rooftop at dusk with a city below, atmospheric haze. Lighting: a strong warm rim from behind, a cool fill from the city, low camera angle looking up. Confident stance, cape and hair moving. Cinematic grade, dust and embers in the air. ${KEEP_ME} ${PHOTOREAL}`,
    "A low camera angle is what makes a hero shot heroic. Say 'low angle looking up'.",
    ["superhero", "costume", "cinematic", "fun"],
    "superhero-generator"
  ),
  P(
    "Astronaut portrait",
    "fun", ["instagram", "x"], "1:1",
    `Restage me as an astronaut. A detailed white EVA suit with visible stitching, tubing, patches and a chest control panel. Helmet on, visor up so my face is fully visible and lit from inside by a soft panel light. Setting: a space station interior, or Earth reflected softly in the raised visor's glass. Cool, clean light with a warm fill on my face. Sharp mechanical detail throughout. ${KEEP_ME} ${PHOTOREAL}`,
    "Visor up, or nobody can tell it's you. Say it explicitly.",
    ["astronaut", "space", "costume", "portrait"],
    "astronaut-photoshoot"
  ),
  P(
    "Tarot card portrait",
    "fun", ["instagram", "pinterest"], "2:3",
    `Turn my photo into a tarot card. Me at the centre in a stylised symmetrical pose, flanked by symbolic elements — a moon, columns, stars, botanicals. An ornate border frame around the whole card with fine linework. A title band at the bottom left clean for a card name. Limited palette: deep blue, gold and cream. Flat illustrative rendering with visible line detail and a slightly aged paper texture. Keep my face recognisable inside the illustrated style.`,
    "Symmetry is what makes tarot cards read as tarot cards.",
    ["tarot", "illustration", "mystical", "card"],
    "tarot-card-portrait"
  ),
  P(
    "90s yearbook portrait",
    "fun", ["instagram", "facebook"], "4:5",
    `Restage my photo as a 1990s school yearbook portrait. Mottled blue-grey painted studio backdrop. Direct on-camera flash with a soft-focus filter giving a gentle glow around the highlights. Period styling: feathered or gelled hair, a patterned knit or a collared shirt under a jumper. The classic three-quarter turn with the head tipped slightly toward the camera. Slightly faded colour with a warm cast and visible portrait-film grain. ${KEEP_ME} ${PHOTOREAL}`,
    "The soft-focus glow is the era's signature. Without it you just get a photo on a blue background.",
    ["yearbook", "90s", "school", "retro"],
    "ai-yearbook-generator"
  ),
  P(
    "Time-travel portrait",
    "fun", ["instagram", "tiktok"], "4:5",
    `Restage me in the 1950s. Period-accurate wardrobe, hair and grooming with nothing anachronistic in the frame. Setting and props of the decade, shot on the film stock and lens of the time: slightly soft corners, gentle contrast, the particular colour palette of that era's colour film. Composition and posing as a photographer of that decade would have done it — formal, centred, a little stiff. ${KEEP_ME} ${PHOTOREAL}`,
    "Swap the decade for any other. The prompt works the same for the 20s, 60s or 80s.",
    ["time machine", "vintage", "decade", "retro"],
    "ai-time-machine"
  ),
  P(
    "See yourself at 70",
    "fun", ["instagram", "facebook"], "1:1",
    `Age me so I look to be in my seventies. Pronounced lines around the eyes and mouth, thinner and mostly white hair, reduced facial volume, age spots and the thinner skin texture of that age. Keep my bone structure, eye colour, expression and identity absolutely unchanged — this should be clearly me, older. Soft natural light, plain background, head-and-shoulders. A warm, kind expression. ${PHOTOREAL}`,
    "This is a fun guess, not a prediction. The app's Age Progression has the target age as a dropdown.",
    ["age progression", "older", "fun", "future"],
    "age-progression-tool"
  ),
  P(
    "Pet as a royal portrait",
    "fun", ["instagram", "facebook"], "3:4",
    `Paint my pet as an aristocratic oil portrait. Keep their markings, coat colour, eye colour and face exactly as they are — this must be recognisably my pet. Dress them in period finery: a velvet coat with gold braid, a lace collar, a small medal. Dark panelled background with a heavy gilt frame edge visible. Chiaroscuro lighting from the upper left. Visible brushwork and canvas texture, aged varnish. Composed, dignified, facing three-quarters.`,
    "Describe the markings in words. 'A black and white cat with a white blaze' survives the style change; 'my cat' doesn't.",
    ["pet", "royal", "oil painting", "funny"],
    "pet-portrait"
  ),
  P(
    "Caricature portrait",
    "fun", ["instagram", "x"], "1:1",
    `Draw me as a friendly caricature. Exaggerate my most distinctive features — the ones that make me recognisable — while keeping the proportions affectionate rather than unkind. Large head, small body, expressive posture. Clean ink linework with flat colour fills and light cel shading. A simple background in one flat colour. Warm, good-humoured expression. Clearly me, drawn.`,
    "Caricature works by exaggerating what's distinctive. A neutral photo gives it less to work with.",
    ["caricature", "cartoon", "funny", "illustration"],
    "caricature-maker"
  ),
  P(
    "Miniature world diorama",
    "fun", ["instagram", "pinterest"], "1:1",
    `Place a miniature version of me inside a tiny handmade diorama. The scene sits on a desk beside ordinary objects — a coffee cup, a pen — so the scale reads instantly. Handmade materials with visible texture: card, clay, painted foam. Shot with a macro lens and a very shallow depth of field, with practical set lighting from inside the diorama. Keep my recognisable traits in the tiny figure.`,
    "The everyday object beside it is what sells the scale. Don't leave it out.",
    ["miniature", "diorama", "tiny", "macro"]
  ),
  P(
    "Your face on a magazine cover",
    "fun", ["instagram", "x"], "2:3",
    `Put me on a magazine cover. Me in a strong editorial portrait filling most of the frame, shot on a plain saturated backdrop, looking straight to camera. A masthead area left clean across the top and a clear column down one side for cover lines. My shoulders overlapping the masthead area slightly, the way real covers do. Bold, high-contrast styling and lighting. Glossy print finish. ${KEEP_ME} ${PHOTOREAL}`,
    "The subject overlapping the masthead is the detail that makes a cover look like a cover.",
    ["magazine", "cover", "editorial", "fun"]
  ),
  P(
    "Sticker pack of expressions",
    "fun", ["tiktok", "instagram"], "1:1",
    `Turn me into a sheet of chat stickers. Six versions of the same stylised character in a grid, each with a different expression — happy, shocked, laughing, thinking, thumbs up, sleeping. Bold clean outlines, flat saturated colour, a thick white die-cut border around each sticker and a soft shadow beneath. Keep my recognisable traits consistent across all six. Transparent-friendly background, each sticker legible at 100 pixels.`,
    "Consistency across the six is what makes it a pack. Say 'the same character in all six'.",
    ["stickers", "whatsapp", "emoji", "pack"],
    "image-to-emoji"
  ),
  P(
    "Glow-up before and after",
    "fun", ["tiktok", "instagram"], "9:16",
    `Build a vertical glow-up comparison from my photo. Top half: my photo as it is, unchanged. Bottom half: the same framing with a polished finish — corrected colour and exposure, clean well-lit skin with texture intact, tidy hair, a flattering key light and a clean background. Same face, same features, same person: improve the photograph, not the anatomy. A thin divider between the halves with small labels. ${KEEP_ME} ${PHOTOREAL}`,
    "Ask it to improve the photograph, not your face. That's the difference between a glow-up and a different person.",
    ["glow up", "before after", "transformation", "tiktok"],
    "glow-up-editor"
  ),

  // ── Restore & retouch ────────────────────────────────────────────────────
  P(
    "Restore a damaged family photo",
    "restore", ["facebook"], "4:5",
    `Restore this damaged photograph. Repair the tears, creases, scratches and spotting, and rebuild any missing areas by continuing the pattern and texture around them — conservatively, inventing nothing that changes what the picture shows. Correct the fading and the colour cast, restore black and white points and recover detail in the shadows. Prioritise the faces: reconstruct them carefully and keep every identifying feature exactly as it is. Keep the original grain rather than smoothing the image flat.`,
    "Scan the print at 600dpi or higher first. Restoration can only use the detail that's actually there.",
    ["restore", "old photo", "damaged", "family"],
    "old-photo-restoration"
  ),
  P(
    "Colourise a black and white photo",
    "restore", ["facebook", "instagram"], "4:5",
    `Add colour to this black-and-white photograph. Use restrained, period-plausible tones: believable skin with real undertones, clothing in colours that existed and were worn at the time, and a naturally muted overall palette rather than modern saturation. Keep the tonal structure of the original exactly — the colour sits on top of the existing light and shade. Preserve the grain and the contrast. Faces first: get the skin right before anything else.`,
    "Under-saturate deliberately. Over-saturated colourisation is the tell that it was done by a machine.",
    ["colourise", "black and white", "restore", "vintage"],
    "colorize-photo"
  ),
  P(
    "Natural portrait retouch",
    "restore", ["instagram", "linkedin"], "4:5",
    `Retouch this portrait conservatively. Remove temporary blemishes and stray hairs only. Even out blotchy skin tone while keeping every pore, fine line and bit of texture exactly as it is. Reduce shine and flash hotspots without flattening the skin. Brighten the eyes slightly and clean up the whites without making them glow. Balance the exposure across the face. Leave permanent features — moles, freckles, scars, laugh lines — completely untouched. ${PHOTOREAL}`,
    "Name what you want kept. 'Keep the freckles' works; assuming it will is how you lose them.",
    ["retouch", "skin", "natural", "portrait"],
    "photo-retouching"
  ),
  P(
    "Rescue an underexposed photo",
    "restore", [], "3:2",
    `Rescue this underexposed photograph. Lift the shadows and mid-tones substantially while protecting whatever highlights survive. Control the colour noise that lifting reveals, keeping real detail in hair, fabric and foliage rather than smearing it. Correct the colour cast that comes with a dark exposure. Restore contrast with a gentle S-curve so it does not look flat and grey. Keep the grain structure natural rather than plastic.`,
    "Lifting shadows always reveals noise. Expect to trade a little detail for a usable picture.",
    ["underexposed", "dark", "rescue", "exposure"],
    "brighten-image"
  ),
  P(
    "Fix a blurry photo",
    "restore", [], "3:2",
    `Sharpen and deblur this photograph. Recover edge definition and fine detail, counteracting motion or focus blur. No halos, no ringing, no over-sharpened crunch on high-contrast edges. Leave flat areas — sky, walls, skin — free of amplified noise. Reconstruct plausible texture in hair and fabric rather than inventing detail that was never in the frame. If the eyes are recoverable, prioritise them.`,
    "Deblurring invents detail. Check faces carefully — that's where invention is most obvious.",
    ["blurry", "sharpen", "unblur", "fix"],
    "unblur-image"
  ),
  P(
    "Remove an object from a photo",
    "restore", [], "3:2",
    `Remove the bin and the traffic cone on the left of this photograph, along with their shadows, and reconstruct what was behind them. Continue the surrounding texture, perspective lines and lighting exactly, leaving no smear, ghost, blur patch or repeated pattern. The repaired area must be indistinguishable from the rest of the image at full size. Leave everything else in the frame completely untouched.`,
    "Name the objects and their position. 'The bin on the left' works far better than 'the clutter'.",
    ["remove object", "clean up", "retouch", "edit"],
    "object-remover"
  ),
  P(
    "Colour-correct a mixed-light photo",
    "restore", [], "3:2",
    `Colour-correct this photograph, which was shot under mixed lighting. Neutralise the dominant cast and reconcile the warm tungsten and cool daylight so skin reads as a single believable tone. Set the black and white points properly. Recover clipped highlights and blocked shadows where the data allows. Keep saturation natural — this is a correction, not a grade. Change nothing about the composition or the content.`,
    "Mixed light is the hardest correction. Tell it which light source should win.",
    ["colour correction", "white balance", "cast", "fix"],
    "photo-color-correction"
  ),
  P(
    "Upscale for print",
    "restore", [], "3:2",
    `Upscale this image to roughly four times its dimensions for print. Reconstruct genuine detail in hair, fabric weave, skin texture and edges rather than interpolating a blur. Suppress the compression artefacts from the source before enlarging so they are not magnified. Keep noise controlled but leave grain structure natural. No added contrast, no stylisation, no sharpening halos — this needs to be honest at 100%.`,
    "Judge an upscale at 100%, not fit-to-screen. Everything looks good zoomed out.",
    ["upscale", "print", "resolution", "enlarge"],
    "4k-image-upscaler"
  ),

  // ── Backgrounds & scenes ─────────────────────────────────────────────────
  P(
    "Cut out onto transparency",
    "scene", [], "1:1",
    `Isolate the main subject and place it on a fully transparent background. A precise edge all the way round, including individual strands of hair, fine detail and any semi-transparent areas, which should keep their partial transparency rather than being cut hard. No residual fringing or colour halo from the original background. Do not alter, relight or recolour the subject in any way — only remove what is behind it.`,
    "Hair edges are where cut-outs fail. Check them at 200% before you use the file.",
    ["transparent", "cut out", "png", "background"],
    "png-maker"
  ),
  P(
    "Replace the background with an office",
    "scene", ["linkedin"], "1:1",
    `Replace the background of my photo with a modern office interior, thrown well out of focus behind me. Match the new background's light to the light already on me: same direction, same colour temperature, same softness. Add a believable contact shadow and a little ambient bounce so I am sitting in the scene rather than pasted onto it. Clean edge through my hair. Do not change my face, clothing or pose. ${PHOTOREAL}`,
    "Matching the light is what makes a composite work. Mismatched light is why most look fake.",
    ["background", "office", "replace", "composite"],
    "background-changer"
  ),
  P(
    "Blur the background properly",
    "scene", ["instagram", "linkedin"], "4:5",
    `Blur the background of my photo the way a fast lens would. Progressive blur that increases with distance, not a single flat blur over everything. Keep the subject completely sharp with a clean, natural edge — including hair, where the transition should be gradual rather than cut. Render out-of-focus highlights as soft round bokeh. Leave the subject's colour, exposure and detail untouched.`,
    "Real depth of field increases with distance. A flat blur is the giveaway.",
    ["blur", "bokeh", "depth of field", "background"],
    "blur-background"
  ),
  P(
    "Studio backdrop from any photo",
    "scene", ["linkedin", "instagram"], "1:1",
    `Put my subject on a seamless studio backdrop. A single colour with a soft gradient falling off behind and below, and a gentle floor sweep with no visible corner. Relight the subject to match: a soft key from one side, a fill on the other, and a subtle separation light at the back. A believable soft shadow on the floor beneath. Keep the subject's own colour, texture and detail exactly.`,
    "The floor sweep is what turns a colour fill into a studio. Ask for it.",
    ["studio", "backdrop", "seamless", "background"]
  ),
  P(
    "Move the subject outdoors",
    "scene", ["instagram"], "4:5",
    `Move the subject of my photo outdoors into open shade under trees. Dappled light through leaves, a cool ambient fill from the sky, green bounce from the foliage on the shadow side. The background falls away with real depth — near branches, mid-ground trees, a bright gap behind. Relight the subject to match that environment completely, including the colour of the light. Add a soft contact shadow on the ground. ${PHOTOREAL}`,
    "Open shade under trees is the most forgiving outdoor light there is. It's a good default.",
    ["outdoor", "background", "nature", "composite"]
  ),
  P(
    "Sunset sky replacement",
    "scene", ["instagram", "facebook"], "3:2",
    `Replace the sky in my photograph with a dramatic sunset — layered cloud catching warm light from below, a gradient from deep orange at the horizon to blue overhead. Match the scene beneath it to that sky: warm low light on everything facing the sun, cool shadow elsewhere, and reflections in any water or glass. Keep the horizon line and every edge along the skyline exact, including fine detail like branches and aerials.`,
    "A replaced sky with unchanged ground light is the most common composite mistake. The relight is the work.",
    ["sky", "sunset", "landscape", "replace"]
  ),
  P(
    "Seasonal scene change",
    "scene", ["instagram", "pinterest"], "3:2",
    `Change the season in this photograph to deep autumn. Foliage turns to copper, amber and rust; some leaves have fallen and lie on the ground. Lower, warmer sunlight at a shallower angle with longer shadows. A slight atmospheric haze. Keep the composition, architecture, subject and every structural element exactly as they are — only the season changes.`,
    "Say what stays as well as what changes, or the buildings drift too.",
    ["season", "autumn", "landscape", "change"]
  ),
  P(
    "Product on a plain colour field",
    "scene", ["instagram"], "1:1",
    `Place my subject on a plain, saturated single-colour background, edge to edge, with no gradient. Relight it with a hard directional source so a crisp, deliberate shadow falls across the background at an angle. Keep the subject's shape, colour and material exactly. Centre it with generous even margins. Clean, graphic, modern — one colour, one shadow, nothing else.`,
    "One hard shadow across a flat colour is a whole art direction. It costs nothing and always looks intentional.",
    ["background", "colour", "graphic", "product"]
  ),
  P(
    "Golden hour window light indoors",
    "scene", ["instagram", "pinterest"], "4:5",
    `Relight my photo as if the subject were sitting beside a large window at golden hour. Warm low sun coming in from one side in a defined shaft, catching dust in the air. Deep falloff into the room so the opposite side of the frame is nearly dark. A warm bounce filling the shadow side of the subject's face. Keep everything about the subject and the room unchanged — this is a relight, not a rebuild. ${PHOTOREAL}`,
    "Dust in the light beam is a small thing that makes indoor sun believable.",
    ["window light", "golden hour", "indoor", "relight"]
  ),
  P(
    "Weather change — add rain",
    "scene", ["instagram", "tiktok"], "9:16",
    `Add heavy rain to this photograph. Streaks of falling rain at a consistent angle throughout the frame, catching the light where it is brightest. Wet surfaces everywhere: reflective pavement, darkened fabric, droplets on any glass. The light goes flat, cool and diffused as it does under rain cloud, with any practical lights blooming and reflecting on the wet ground. Keep the subject, composition and setting unchanged.`,
    "Rain needs wet surfaces to be believable. Falling streaks over a dry street looks like a filter.",
    ["rain", "weather", "atmosphere", "moody"]
  ),
];

export const PROMPT_COUNT = PROMPTS.length;

export const PROMPT_BY_SLUG: Record<string, LibraryPrompt> =
  Object.fromEntries(PROMPTS.map((p) => [p.slug, p]));

/** Prompts in a category, in library order. */
export function promptsInCategory(id: CategoryId): LibraryPrompt[] {
  return PROMPTS.filter((p) => p.category === id);
}

/**
 * Related prompts for a detail page: same category first, then anything
 * sharing a platform, never the prompt itself.
 */
export function relatedPrompts(p: LibraryPrompt, limit = 6): LibraryPrompt[] {
  const sameCat = PROMPTS.filter((x) => x.slug !== p.slug && x.category === p.category);
  const samePlatform = PROMPTS.filter(
    (x) => x.slug !== p.slug && x.category !== p.category && x.platforms.some((pl) => p.platforms.includes(pl))
  );
  return [...sameCat, ...samePlatform].slice(0, limit);
}

/** Free-text search across everything a person might type. */
export function searchPrompts(query: string): LibraryPrompt[] {
  const q = query.trim().toLowerCase();
  if (!q) return PROMPTS;
  const terms = q.split(/\s+/).filter(Boolean);
  return PROMPTS.filter((p) => {
    const hay = [
      p.title, p.text, p.tip, p.category, p.tags.join(" "), p.platforms.join(" "), p.ratio,
    ].join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
