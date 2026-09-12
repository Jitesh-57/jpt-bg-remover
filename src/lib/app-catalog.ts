/**
 * app-catalog.ts — the AI app catalogue.
 *
 * Each row names a tool, the category it belongs to, a one-line description and
 * the prompt the model actually receives. Titles, meta descriptions, taglines
 * and FAQs are derived per category so a row stays one line and the wording
 * stays consistent across the whole catalogue.
 *
 * The tool *set* was chosen from a competitor crawl, but every string here is
 * written fresh — copying their page copy would be plagiarism and would also
 * make these pages duplicate content, which is the opposite of the point.
 *
 * Not included, deliberately:
 *   - video tools (no video backend)
 *   - storefront/CMS integrations and MCP (not applicable here)
 *   - synthetic-partner and "girl" generators, skin-tone changers, and
 *     weight-gain/loss filters
 */

import type { CreativeApp } from "@/lib/creative-apps";
import type { PageFAQ } from "@/lib/page-config";
import { CREDIT_COST } from "@/lib/plans";

export type AppCat =
  | "headshot" | "portrait" | "style" | "retouch" | "restore"
  | "background" | "remove" | "enhance" | "product" | "social" | "fun";

export const CAT_META: Record<AppCat, { label: string; emoji: string; gradient: [string, string]; blurb: string }> = {
  headshot:   { label: "Headshots",          emoji: "💼", gradient: ["#1D4ED8", "#0E7490"], blurb: "Profile-ready portraits for work." },
  portrait:   { label: "Portraits",          emoji: "📸", gradient: ["#BE185D", "#7C3AED"], blurb: "Photoshoot looks from one selfie." },
  style:      { label: "Art & styles",       emoji: "🎨", gradient: ["#7C3AED", "#DB2777"], blurb: "Turn a photo into another medium." },
  retouch:    { label: "Retouch",            emoji: "✨", gradient: ["#0891B2", "#2563EB"], blurb: "Fix what the camera got wrong." },
  restore:    { label: "Restore",            emoji: "🖼️", gradient: ["#B45309", "#92400E"], blurb: "Bring damaged photos back." },
  background: { label: "Backgrounds",        emoji: "🌅", gradient: ["#0D9488", "#0369A1"], blurb: "Change what's behind the subject." },
  remove:     { label: "Clean up",           emoji: "🧽", gradient: ["#DC2626", "#B91C1C"], blurb: "Erase what shouldn't be there." },
  enhance:    { label: "Enhance",            emoji: "🔬", gradient: ["#2563EB", "#4F46E5"], blurb: "More resolution, more detail." },
  product:    { label: "Product & business", emoji: "🛍️", gradient: ["#065F46", "#047857"], blurb: "Catalogue-ready shots." },
  social:      { label: "Social",            emoji: "📱", gradient: ["#DB2777", "#F97316"], blurb: "Sized and styled per platform." },
  fun:        { label: "For fun",            emoji: "🎉", gradient: ["#F59E0B", "#DC2626"], blurb: "Novelty looks worth sharing." },
};

/** slug, display name, emoji, category, one-line description, model prompt */
export type Row = [string, string, string, AppCat, string, string];

// Identity preservation is the single thing users notice most, so it is appended
// to every prompt that edits a photo of a person rather than trusted to each row.
const KEEP_FACE =
  "Preserve the person's face, bone structure, identity and natural skin tone exactly — change nothing about who they are.";
const PHOTOREAL =
  "The result must read as a real photograph: natural skin texture, believable lighting and shadows, correct anatomy and hands. Not an illustration or a render, unless the style explicitly calls for one.";

const NON_PERSON: AppCat[] = ["product", "enhance", "remove", "background"];

function faqsFor(name: string, cat: AppCat, desc: string): PageFAQ[] {
  const cost = `Each generation costs ${CREDIT_COST} credits. Packs start at $2, they are a one-time purchase and they never expire.`;
  const photo =
    NON_PERSON.includes(cat)
      ? "A sharp, well-lit photo works best. Avoid heavy compression artefacts — the model can only work with the detail that is actually there."
      : "A clear, front-facing, well-lit photo gives the most faithful result. Heavy sunglasses, extreme angles and deep shadows all make the face harder to preserve.";
  return [
    { q: `How does the ${name.toLowerCase()} work?`, a: `${desc} Upload your image, pick a style on the left, choose a model and aspect ratio, then hit Apply. You see the original and the result side by side, so you can always compare before downloading.` },
    { q: "What photo should I upload?", a: photo },
    { q: `Is the ${name.toLowerCase()} free?`, a: `The browser-based tools on this site are free and unlimited. This one runs on a server, so it uses credits. ${cost}` },
    ...(NON_PERSON.includes(cat) ? [] : [{ q: "Will it still look like me?", a: "That is the instruction the prompt leads with: keep the face, bone structure and skin tone exactly, and change only the styling. If a result drifts, run it again — generation is not deterministic, and a second pass usually lands." }]),
    { q: "Do you watermark the download?", a: "No. Every export is full resolution with nothing added, on any pack." },
  ];
}

export function expand(row: Row): CreativeApp {
  const [slug, name, emoji, cat, desc, prompt] = row;
  const meta = CAT_META[cat];
  const personal = !NON_PERSON.includes(cat);
  const fullPrompt = [prompt, personal ? KEEP_FACE : "", PHOTOREAL].filter(Boolean).join(" ");

  return {
    slug,
    emoji,
    gradient: meta.gradient,
    title: `${name} — Free Online AI Tool | Pixel Shine`,
    metaDescription: `${desc} Upload a photo, pick a style and download in full resolution — no watermark, no subscription.`,
    keywords: [name.toLowerCase(), `ai ${name.toLowerCase()}`, `${name.toLowerCase()} online`, `free ${name.toLowerCase()}`, slug.replace(/-/g, " ")].join(", "),
    h1: name,
    // These run server-side on credits — saying "in your browser" would be false;
    // that is only true of the free on-device tools.
    tagline: `${desc} Pick a style, choose a model, and download the result at full resolution with no watermark.`,
    intro: desc,
    prompt: fullPrompt,
    badge: `${meta.emoji} ${meta.label}`,
    faq: faqsFor(name, cat, desc),
    cat,
  };
}

export const CATALOG_ROWS: Row[] = [
  // ── Headshots ─────────────────────────────────────────────────────────────
  ["ai-headshot-generator", "AI Headshot Generator", "💼", "headshot", "Turn a plain selfie into a studio headshot.", "Turn this into a professional studio headshot: tailored business dress, even key lighting with a soft fill, a clean neutral backdrop, and a composed, confident expression."],
  ["linkedin-headshot", "LinkedIn Headshot Maker", "🔗", "headshot", "A profile photo that reads as hireable.", "Produce a LinkedIn-appropriate headshot: smart-casual business dress, a softly blurred office or outdoor background, natural approachable expression, framed head-and-shoulders."],
  ["ceo-headshot", "CEO Headshot Generator", "🏛️", "headshot", "Leadership-page portraits with weight to them.", "Produce an executive leadership portrait: dark tailored suit, sculpted low-key lighting, a dark or architectural background, and an authoritative, settled posture."],
  ["actor-headshot", "Actor Headshot Generator", "🎭", "headshot", "Casting-ready headshots, several looks from one photo.", "Produce a casting headshot in the theatrical style: minimal styling, honest natural light, a plain mid-tone background, direct eye contact and a neutral readable expression that a casting director can work from."],
  ["doctor-headshot", "Doctor Headshot Generator", "🩺", "headshot", "Clinical profile photos for medical directories.", "Produce a medical professional headshot: clean white coat over business dress, bright even clinical lighting, a softly blurred healthcare interior behind, and a calm, reassuring expression."],
  ["lawyer-headshot", "Lawyer Headshot Generator", "⚖️", "headshot", "Firm-page portraits for legal profiles.", "Produce a legal professional headshot: dark conservative suit, formal lighting, a law-library or panelled-office background softly out of focus, and a composed, credible expression."],
  ["real-estate-headshot", "Realtor Headshot Generator", "🏠", "headshot", "Approachable agent photos for listings.", "Produce a real-estate agent headshot: smart-casual blazer, warm natural light, a softly blurred residential or streetscape background, and a friendly, open expression."],
  ["business-headshot", "Business Headshot Generator", "📈", "headshot", "Corporate portraits without a studio booking.", "Produce a corporate business headshot: well-fitted suit or blazer, balanced three-point lighting, a neutral grey or soft office background, upright professional posture."],
  ["outdoor-headshot", "Outdoor Headshot Generator", "🌤️", "headshot", "Natural-light portraits that feel less stiff.", "Produce an outdoor headshot in natural daylight: soft open shade or golden-hour light, greenery or architecture blurred well behind the subject, relaxed and genuine expression."],
  ["eras-headshot", "ERAS Application Headshot", "🎓", "headshot", "Portraits that meet residency-application norms.", "Produce a conservative medical-residency application portrait: plain dark suit, plain light background, flat even lighting with no shadow on the face, neutral expression, head and shoulders centred."],
  ["add-suit-to-photo", "Add a Suit to Your Photo", "🤵", "headshot", "Put formal dress on a casual photo.", "Replace the clothing with a well-fitted formal suit, shirt and tie appropriate to the person, matching the collar and shoulder line naturally to their build and the photo's lighting. Change only the clothing."],
  ["celebrity-headshot", "Glamour Headshot Generator", "🌟", "headshot", "Red-carpet polish on an ordinary photo.", "Produce a glamour studio portrait in the style of a magazine cover shoot: dramatic beauty lighting, immaculate styling and grooming, a deep seamless backdrop, and a poised editorial expression."],

  // ── Portraits & photoshoots ───────────────────────────────────────────────
  ["ai-photoshoot", "AI Photoshoot Generator", "📸", "portrait", "A full photoshoot look from a single upload.", "Restage this as a professional photoshoot: deliberate posing, considered wardrobe, a designed set or location, and controlled photographic lighting with real depth of field."],
  ["ai-selfie-generator", "AI Selfie Generator", "🤳", "portrait", "Better selfies than the ones you actually take.", "Restage this as a flattering selfie: close phone-camera perspective, soft even light on the face, a natural candid expression, and an interesting but uncluttered background."],
  ["profile-picture-maker", "Profile Picture Maker", "🖼️", "portrait", "One photo, a profile picture for every platform.", "Turn this into a clean profile picture: tight centred crop on the face, flattering even lighting, a simple uncluttered background that reads well at small sizes, and a warm natural expression."],
  ["outfit-generator", "AI Outfit Changer", "👔", "portrait", "Try a different outfit without buying it.", "Replace the outfit with a different one appropriate to the setting, matching the drape, fit and fabric behaviour to the person's pose and the photo's lighting. Change only the clothing."],
  ["saree-photo-editor", "AI Saree Photo Editor", "🥻", "portrait", "Saree portraits with real fabric and drape.", "Dress the subject in an elegant silk saree with authentic drape and pleating, detailed gold jewellery, warm cinematic lighting and a tasteful studio or heritage backdrop. Keep the fabric physics believable."],
  ["dress-photo-editor", "AI Dress Photo Editor", "👗", "portrait", "Swap or upgrade the dress in a photo.", "Replace the dress with a well-fitted alternative suited to the occasion, matching fabric fall, seams and fit to the person's posture and to the light already in the photo."],
  ["maternity-photoshoot", "Maternity Photoshoot Editor", "🤰", "portrait", "Soft, styled maternity portraits.", "Restage this as a gentle maternity portrait: flowing fabric, soft directional window light, a warm neutral setting, and a calm, tender expression with hands placed naturally."],
  ["birthday-photo-editor", "Birthday Photo Editor", "🎂", "portrait", "Birthday shots that look arranged, not snapped.", "Restage this as a styled birthday portrait: warm party lighting, tasteful balloons and decor arranged behind rather than crowding the frame, and a candid celebratory expression."],
  ["anniversary-photo-editor", "Anniversary Photo Editor", "💞", "portrait", "Anniversary portraits worth printing.", "Restage this as a romantic anniversary portrait: warm intimate lighting, elegant wardrobe, soft florals or bokeh lights behind, and a relaxed affectionate composition."],
  ["fashion-photo-editor", "Fashion Photo Editor", "🕶️", "portrait", "Editorial polish on an outfit photo.", "Restage this as a fashion editorial frame: strong styling, confident posing, a considered location or seamless studio backdrop, and crisp commercial lighting with generous negative space."],
  ["aesthetic-photo-editor", "Aesthetic Photo Editor", "🌸", "portrait", "A considered colour mood, not a preset filter.", "Regrade this photo into a cohesive aesthetic: a deliberate colour palette, film-like tonality, gentle highlight roll-off and a consistent mood across the whole frame. Keep detail intact rather than crushing it."],
  ["travel-photo-editor", "Travel Photo Editor", "🧳", "portrait", "Holiday photos that look like the place felt.", "Enhance this travel photo: recover sky and shadow detail, deepen the natural colour of the location, add pleasing directional light, and keep the scene believable rather than oversaturated."],

  // ── Art & styles ──────────────────────────────────────────────────────────
  ["ghibli-style-generator", "Ghibli Style Generator", "🍃", "style", "Hand-painted animation warmth from a photo.", "Redraw this in the style of hand-painted Japanese animation: soft gouache-like skies, warm naturalistic palette, gentle linework, painterly foliage and a quiet nostalgic atmosphere."],
  ["pixar-filter", "3D Animation Filter", "🎬", "style", "A feature-animation character version of you.", "Restyle this as a modern 3D animated feature character: large expressive eyes, smooth stylised geometry, soft subsurface skin shading, and bright cinematic studio lighting."],
  ["photo-to-anime", "Photo to Anime Converter", "⛩️", "style", "Anime art that still resembles the subject.", "Redraw this as anime illustration: clean confident linework, cel shading with defined highlight and shadow blocks, expressive stylised eyes, and a graphic background treatment."],
  ["cartoon-generator", "Cartoon Generator", "🖍️", "style", "A clean cartoon version for avatars.", "Redraw this as a friendly cartoon: bold clean outlines, flat bright colour fills, simplified but recognisable features, and a simple graphic background."],
  ["caricature-maker", "Caricature Maker", "😄", "style", "Playful exaggeration that still reads as them.", "Draw this as a good-natured caricature: gently exaggerate the most characteristic features while keeping the person clearly recognisable, in a warm hand-illustrated style with a light background."],
  ["photo-to-oil-painting", "Photo to Oil Painting", "🖌️", "style", "Visible brushwork and canvas texture.", "Repaint this as an oil painting: visible directional brush strokes, built-up impasto in the highlights, a classical warm palette, and canvas tooth showing through the thinner passages."],
  ["photo-to-illustration", "Photo to Illustration", "✏️", "style", "Storybook and editorial illustration looks.", "Redraw this as an editorial illustration: confident inked contours, selective flat colour, deliberate negative space and a printed-page quality."],
  ["ai-webtoon-generator", "Webtoon Style Generator", "📖", "style", "Korean web-comic styling.", "Redraw this in webtoon style: clean vector-like lineart, soft airbrushed gradient shading, glossy hair highlights, pastel palette and a simple gradient background."],
  ["comic-generator", "Comic Panel Generator", "💥", "style", "Comic-book ink, dots and drama.", "Redraw this as a comic-book panel: heavy ink outlines, halftone dot shading, saturated primary colours, dramatic low-angle framing and hard rim light."],
  ["pixel-art-generator", "Pixel Art Generator", "👾", "style", "Deliberate low-resolution sprite art.", "Redraw this as pixel art: a strict limited palette, visible square pixels on a consistent grid, hard-edged dithering for gradients, and readable silhouettes at small size."],
  ["south-park-style", "Cut-Out Cartoon Maker", "🧒", "style", "Flat construction-paper cartoon styling.", "Redraw this in a flat cut-paper cartoon style: simple geometric shapes, thick uniform outlines, completely flat colour with no shading, and a plain simple background."],
  ["stardew-profile-maker", "Pixel Farm Avatar Maker", "🌾", "style", "Cosy 16-bit game portrait styling.", "Redraw this as a cosy 16-bit game portrait: chunky pixels, a warm limited palette, simple shading blocks and a soft pastoral background."],
  ["ai-vtuber-maker", "VTuber Avatar Maker", "🎙️", "style", "Streaming avatars in anime styling.", "Redraw this as a VTuber avatar: polished anime styling, bright saturated hair with layered highlights, large expressive eyes, clean rim lighting and a transparent-friendly simple background."],
  ["goth-generator", "Gothic Portrait Generator", "🦇", "style", "Dark romantic styling and mood.", "Restyle this in a dark romantic gothic register: deep blacks, lace and velvet textures, pale cool-toned lighting, dramatic shadow and an ornate moody setting."],
  ["ai-vampire", "Vampire Filter", "🧛", "style", "Gothic-horror transformation.", "Restyle this as a gothic vampire portrait: pallid cool skin tone, subtle fangs, dark period clothing, candlelit chiaroscuro and an old-world interior behind."],
  ["ai-fairy-filter", "Fairy Filter", "🧚", "style", "Ethereal woodland fantasy styling.", "Restyle this as an ethereal fairy portrait: delicate translucent wings, dew and floating light motes, flower-woven hair, and soft dappled forest light."],
  ["ai-mermaid-filter", "Mermaid Filter", "🧜", "style", "Underwater fantasy portraiture.", "Restyle this as an underwater mermaid portrait: iridescent scaled tail, hair floating in water, caustic light shafts from above, and a blue-green ocean depth behind."],
  ["superhero-generator", "Superhero Generator", "🦸", "style", "Comic-accurate costume and posture.", "Restyle this as a superhero: a fitted original costume with believable panelling and material, heroic posture, dramatic rim lighting and a city skyline behind."],
  ["renaissance-portrait", "Renaissance Portrait Maker", "🏺", "style", "Old-master oil portraiture.", "Repaint this as a Renaissance oil portrait: period dress, single-source chiaroscuro lighting, dark umber background, fine glazed skin rendering and an aged varnish quality."],
  ["glitch-effect", "Glitch Effect Generator", "📺", "style", "RGB shift, scanlines and datamosh.", "Apply a digital glitch treatment: horizontal datamosh tearing, RGB channel separation, scanlines and block corruption artefacts, over a high-contrast cyberpunk grade."],
  ["silhouette-maker", "Silhouette Maker", "🌓", "style", "Clean two-tone cutout silhouettes.", "Reduce this to a clean silhouette: the subject rendered as a solid single-colour shape with a crisp readable contour, against a plain contrasting background. No interior detail."],
  ["stencil-maker", "Stencil Maker", "🔳", "style", "Printable high-contrast stencils.", "Convert this to a two-tone stencil: pure black and white only, simplified connected shapes with no floating islands, and a contour clean enough to cut."],
  ["coloring-page-generator", "Coloring Page Maker", "🖨️", "style", "Line art ready to print and colour.", "Convert this to a printable colouring page: clean uniform black outlines on pure white, no shading or fills, simplified detail and closed shapes throughout."],
  ["ai-tattoo-generator", "Tattoo Design Generator", "🖤", "style", "Tattoo artwork from an idea.", "Render this as tattoo design artwork: bold confident linework that will hold as it ages, clear tonal separation, a composition that sits naturally on the body, on clean white."],
  ["birth-flower-tattoo", "Birth Flower Tattoo Designer", "🌷", "style", "Fine-line floral tattoo designs.", "Render a fine-line botanical tattoo design: delicate single-weight linework, accurate flower structure, elegant negative space and a balanced vertical composition on clean white."],
  ["ai-art-generator", "AI Art Generator", "🎨", "style", "Painterly reinterpretation of a photo.", "Reinterpret this as fine art: a chosen coherent medium and palette, expressive mark-making, strong compositional hierarchy, and gallery-quality finish."],
  ["ai-painter", "AI Painting Generator", "🖼️", "style", "Digital painting with real brush feel.", "Repaint this as a digital painting: layered brushwork with visible strokes, considered colour temperature shifts between light and shadow, and soft edge control on the focal point."],
  ["ai-pokemon-generator", "Creature Designer", "🐾", "style", "Original collectible-creature art.", "Design an original collectible creature inspired by this image: clean cel-shaded rendering, a coherent elemental theme, expressive face, and a simple radial background. Do not reproduce any existing franchise character."],
  ["image-to-emoji", "Image to Emoji Maker", "😀", "style", "Custom emoji for Slack and Discord.", "Convert this into a single emoji-style icon: bold simplified shapes readable at 32 pixels, flat saturated colour, a thick clean outline and a transparent-friendly flat background."],
  ["text-to-emoji", "Custom Emoji Maker", "🫠", "style", "Turn an idea into a usable emoji.", "Create a single emoji-style icon: one clear subject, flat saturated colour, bold outline, centred composition, and instant readability at very small sizes."],

  // ── Retouch ───────────────────────────────────────────────────────────────
  ["photo-retouching", "AI Photo Retouching", "✨", "retouch", "Portrait retouching that keeps skin looking real.", "Retouch this portrait: even out skin tone and remove temporary blemishes while keeping pores and natural texture, balance the exposure, brighten the eyes slightly and tidy stray hair. Do not smooth the skin into plastic."],
  ["blemish-remover", "Blemish Remover", "🫧", "retouch", "Clear spots without erasing skin texture.", "Remove temporary blemishes, spots and minor marks from the skin, matching surrounding tone and keeping pores, fine lines and natural texture fully intact."],
  ["red-eye-remover", "Red Eye Remover", "👁️", "retouch", "Fix flash glare in the pupils.", "Correct red-eye caused by flash: restore natural pupil darkness and iris colour, keep the catchlight, and leave the rest of the face untouched."],
  ["eye-color-changer", "Eye Color Changer", "🔵", "retouch", "Try a different eye colour realistically.", "Change the iris colour as specified, keeping the natural iris texture, limbal ring, pupil and catchlight intact so the eyes still read as real. Change nothing else."],
  ["face-expression-changer", "Face Expression Changer", "🙂", "retouch", "Adjust the expression in a photo.", "Adjust the facial expression as specified, moving the mouth, cheeks and eyes together the way real facial muscles do, so the change reads as genuine rather than pasted on."],
  ["smile-filter", "Smile Filter", "😊", "retouch", "Turn a flat expression into a real smile.", "Add a natural, genuine smile: raise the mouth corners, engage the cheeks and crease the eyes slightly the way a real smile does. Keep the teeth natural and unwhitened."],
  ["sad-face-filter", "Expression Filter — Sad", "😢", "retouch", "A convincing downcast expression.", "Change the expression to a subdued, downcast one: lower the mouth corners, soften the brow inward and slightly lower the eyelids, moving the whole face together."],
  ["hairstyle-changer", "AI Hairstyle Changer", "💇", "retouch", "Preview a haircut before you commit.", "Change the hairstyle as specified, matching the hairline to the person's own, keeping the hair's natural texture and thickness plausible, and relighting it to match the photo."],
  ["hair-color-changer", "Hair Color Changer", "🎨", "retouch", "See a new hair colour on yourself.", "Change the hair colour as specified: adjust root-to-tip variation, keep strand detail and specular highlights, and match the colour temperature to the photo's lighting."],
  ["blonde-hair-filter", "Blonde Hair Filter", "👱", "retouch", "Go blonde without the bleach.", "Change the hair to a natural blonde with believable root shadow, tonal variation between strands and warm specular highlights consistent with the photo's light."],
  ["long-hair-filter", "Long Hair Filter", "💁", "retouch", "Preview longer hair.", "Extend the hair to the specified length, keeping its own texture and wave pattern, with natural fall over the shoulders and lighting that matches the photo."],
  ["curly-hair-filter", "Curly Hair Filter", "🌀", "retouch", "See yourself with curls.", "Change the hair to defined natural curls: consistent curl pattern and volume, believable root lift, and highlights that follow the curl spirals."],
  ["bangs-filter", "Bangs Filter", "💫", "retouch", "Try a fringe risk-free.", "Add a fringe in the specified shape, sitting correctly on the forehead with natural density, a believable parting and shadow where it falls."],
  ["buzz-cut-filter", "Buzz Cut Filter", "✂️", "retouch", "Preview a very short crop.", "Change the hair to a short buzz cut at an even length, showing the real hairline and scalp tone through the stubble, with lighting consistent with the photo."],
  ["bald-filter", "Bald Filter", "🧑‍🦲", "retouch", "See yourself with a shaved head.", "Remove the hair to show a cleanly shaved head: correct skull shape, natural scalp tone and sheen, a believable residual hairline shadow, and matching light direction."],
  ["beard-filter", "Beard Filter", "🧔", "retouch", "Add facial hair that follows your face.", "Add a beard in the specified style, following the person's real jawline and natural growth pattern, with individual hair detail, believable density and matching lighting."],
  ["no-beard-filter", "Beard Remover", "🪒", "retouch", "See the clean-shaven version.", "Remove all facial hair to reveal a clean-shaven face: reconstruct the jaw, chin and upper-lip skin with tone and texture matching the surrounding face."],
  ["eyebrow-filter", "Eyebrow Shape Filter", "🪞", "retouch", "Try a different brow shape.", "Reshape the eyebrows as specified, keeping individual hair detail and natural density, with a shape that suits the person's face and matches the photo's light."],
  ["braces-filter", "Braces Filter", "🦷", "retouch", "Preview orthodontic braces.", "Add realistic orthodontic braces to the visible teeth: correct bracket placement and spacing, a believable archwire, and metal specular highlights matching the lighting."],
  ["add-glasses-to-photo", "Add Glasses to Photo", "👓", "retouch", "Try frames on before buying.", "Add spectacles in the specified style: correctly positioned on the nose bridge and ears, with believable lens refraction, frame shadow on the face and reflections matching the light."],
  ["piercing-filter", "Piercing Filter", "💎", "retouch", "Preview a piercing placement.", "Add the specified piercing at an anatomically correct placement, with metal specular highlights, a subtle contact shadow and scale appropriate to the face."],
  ["muscle-generator", "Muscle Generator", "💪", "retouch", "Novelty gym-transformation effect.", "Increase visible muscle definition in the arms, shoulders and chest, keeping proportions anatomically plausible and preserving the existing clothing fit and lighting."],
  ["abs-filter", "Six-Pack Filter", "🏋️", "retouch", "Add defined abs for a novelty shot.", "Add defined abdominal muscle definition with anatomically correct shading and highlight placement, consistent with the photo's existing light direction."],
  ["photo-color-correction", "Photo Color Correction", "🎚️", "retouch", "Fix white balance, contrast and cast.", "Colour-correct this image: neutralise the white balance, fix the black and white points, recover clipped highlight and shadow detail, and remove any colour cast. Keep the result natural."],
  ["brighten-image", "Image Brightener", "🔆", "retouch", "Rescue an underexposed photo.", "Brighten this underexposed image: lift shadows and midtones while protecting the highlights, control the noise that lifting reveals, and keep colour saturation natural."],
  ["darken-image", "Image Darkener", "🌙", "retouch", "Bring down a blown-out photo.", "Darken this image: recover overexposed highlights, deepen the shadows for a moodier tone, and hold detail in both ends of the range."],
  ["recolor-image", "Image Recolor Tool", "🌈", "retouch", "Change specific colours in a photo.", "Recolour the specified elements to the requested colours, keeping the original shading, texture and material behaviour so the change looks like it was always that colour."],
  ["invert-image-color", "Color Inverter", "🔄", "retouch", "Photographic negative inversion.", "Invert the colours of this image to produce a photographic negative, preserving full tonal range and detail throughout."],
  ["color-splash", "Color Splash Effect", "🎯", "retouch", "One subject in colour, the rest mono.", "Desaturate the entire image to neutral monochrome except the specified subject, which keeps its full natural colour with a clean, precise boundary."],

  // ── Restore ───────────────────────────────────────────────────────────────
  ["old-photo-restoration", "Old Photo Restoration", "🖼️", "restore", "Repair scratches, fading and creases.", "Restore this damaged photograph: repair scratches, tears, creases and spotting, rebuild missing areas consistently with their surroundings, correct the fading and recover contrast — without inventing new features that were never in the original."],
  ["colorize-photo", "Photo Colorizer", "🎨", "restore", "Natural colour for black-and-white photos.", "Colourise this black-and-white photograph with historically plausible, naturally desaturated colour: believable skin tones, period-appropriate clothing and material colours, and consistent light temperature throughout."],
  ["black-and-white-to-color", "B&W to Color Converter", "🌅", "restore", "Bring monochrome photos to life.", "Add natural colour to this monochrome image, keeping the tonal structure of the original intact and choosing restrained, believable colours rather than saturated guesses."],
  ["unblur-image", "Image Unblur Tool", "🔍", "restore", "Recover detail from a soft photo.", "Sharpen and deblur this image: recover edge definition and fine detail, counteract motion or focus blur, and avoid halos, ringing or over-sharpened texture."],
  ["unpixelate-image", "Unpixelate Image", "🧩", "restore", "Rebuild detail in a blocky image.", "Reconstruct this pixelated image at higher fidelity: rebuild smooth edges and plausible fine detail from the visible block structure, without inventing features that contradict the original."],
  ["denoise-image", "Image Denoiser", "🌫️", "restore", "Clean grain from low-light photos.", "Remove digital noise and grain from this image while preserving genuine fine detail, edge sharpness and texture. Do not smear the result flat."],
  ["image-sharpener", "Image Sharpener", "🔪", "restore", "Crisp up soft edges.", "Sharpen this image: increase acuity on genuine edges and detail, leave flat areas free of amplified noise, and avoid visible halos around high-contrast boundaries."],

  // ── Enhance ───────────────────────────────────────────────────────────────
  ["image-upscaler", "AI Image Upscaler", "🔬", "enhance", "Enlarge photos without the mush.", "Upscale this image substantially: reconstruct genuine fine detail in hair, fabric weave, skin texture and edges, suppress artefacts from the source compression, and keep the subject identical."],
  ["4k-image-upscaler", "4K Image Upscaler", "🖥️", "enhance", "Take an image up to 4K for print.", "Upscale this image to a high pixel count suitable for print: rebuild edge and texture detail cleanly, remove compression artefacts, and keep noise controlled across flat areas."],
  ["image-enlarger", "Image Enlarger", "📐", "enhance", "Make small images usable again.", "Enlarge this small image with reconstructed detail rather than interpolation blur: sharp edges, plausible texture, and no visible upscaling artefacts."],
  ["hd-photo-converter", "HD Photo Converter", "📺", "enhance", "Turn a low-quality file into an HD one.", "Convert this low-quality image to HD: increase resolution, recover detail and contrast, remove compression blocking and banding, and produce a clean modern-looking file."],
  ["png-maker", "Transparent PNG Maker", "🫥", "enhance", "Cut the subject out onto transparency.", "Isolate the main subject and place it on a fully transparent background: a precise edge including hair and fine detail, no residual fringing or halo from the old background."],

  // ── Backgrounds ───────────────────────────────────────────────────────────
  ["background-remover", "AI Background Remover", "✂️", "background", "Clean cutouts, hair and all.", "Remove the background completely and make it transparent, keeping a precise subject edge through hair, fur and thin detail, with no colour fringing left behind."],
  ["white-background-remover", "White Background Remover", "⬜", "background", "Strip a white studio backdrop.", "Remove the white or near-white background and make it fully transparent, keeping soft shadow edges and thin detail intact without eating into the subject."],
  ["background-generator", "AI Background Generator", "🌄", "background", "A new scene behind the subject.", "Replace the background with the described scene, matching its perspective, light direction, colour temperature and depth of field to the subject so the composite reads as one photograph."],
  ["blur-background", "Background Blur Tool", "🔵", "background", "Portrait-mode depth on any photo.", "Apply a believable shallow depth of field: keep the subject sharp, blur the background progressively with distance, and render the out-of-focus highlights as natural bokeh rather than a flat gaussian wash."],
  ["room-design", "AI Room Redesign", "🛋️", "background", "Restyle a room from a photo.", "Redesign this room in the described style: change furniture, finishes, lighting and decor while keeping the architecture, window positions and camera perspective exactly as they are."],
  ["ai-interior-design", "AI Interior Design", "🏡", "background", "Interior concepts from a real room.", "Produce an interior design visualisation of this space in the described style: cohesive materials and palette, realistic lighting with believable shadows, and the room's true geometry preserved."],
  ["interior-photo-editor", "Interior Photo Editor", "💡", "background", "Brighten and straighten interior shots.", "Enhance this interior photograph: correct vertical lines and lens distortion, balance the mixed window and lamp lighting, recover window highlights and shadow detail, and render wall colours accurately."],
  ["house-photo-editor", "House Photo Editor", "🏘️", "background", "Kerb appeal for property photos.", "Enhance this property exterior: balance the sky and building exposure, deepen lawn and foliage colour naturally, correct converging verticals, and clean up distracting clutter."],
  ["architecture-photo-editor", "Architecture Photo Editor", "🏛️", "background", "Straight lines and clean light.", "Enhance this architectural photograph: correct perspective so verticals are true, balance the exposure between sky and structure, and render materials crisply without over-sharpening."],

  // ── Clean up ──────────────────────────────────────────────────────────────
  ["object-remover", "AI Object Remover", "🧽", "remove", "Erase anything and rebuild behind it.", "Remove the specified object and reconstruct what was behind it consistently with the surrounding texture, perspective and lighting, leaving no smear, ghost or repeated pattern."],
  ["remove-people-from-photo", "Remove People from Photos", "🚶", "remove", "Clear the background crowd.", "Remove the unwanted people and rebuild the scene behind them: continue the architecture, ground and background texture correctly through the gap, matching perspective and light."],
  ["watermark-remover-ai", "AI Watermark Remover", "🪄", "remove", "Clear marks from photos you own.", "Remove the watermark, logo or stamp and reconstruct the image underneath it at the pixel level, matching texture, colour and light so no blur, smear or outline remains. For images you own or are licensed to edit."],
  ["remove-text-from-image", "Text Remover", "🔤", "remove", "Take text off an image cleanly.", "Remove the text from this image and rebuild the surface beneath it, continuing the underlying pattern, texture and gradient so there is no trace of where it was."],
  ["emoji-remover", "Emoji & Sticker Remover", "🙈", "remove", "Uncover what a sticker was hiding.", "Remove the emoji, sticker or overlay and reconstruct the covered area plausibly from the surrounding image, matching texture, tone and lighting."],
  ["remove-shadow-from-photo", "Shadow Remover", "🌤️", "remove", "Fix harsh or uneven shadows.", "Remove the unwanted shadow and even out the lighting across the surface, recovering the true colour and detail in the shadowed area without flattening the image's natural depth."],
  ["blur-face", "Face Blur Tool", "😶‍🌫️", "remove", "Anonymise faces before sharing.", "Blur the faces in this image sufficiently to prevent identification, with a clean boundary that follows the head shape, leaving the rest of the photograph sharp and unaltered."],
  ["license-plate-blur", "License Plate Blur", "🚗", "remove", "Obscure plates for privacy.", "Obscure the vehicle registration plates so the characters are unreadable, keeping the plate's shape and the rest of the vehicle sharp and unaltered."],
  ["mirror-image", "Mirror & Flip Image", "🪞", "remove", "Flip an image horizontally.", "Mirror this image horizontally, keeping all detail, sharpness and colour identical to the original."],

  // ── Product & business ────────────────────────────────────────────────────
  ["product-photoshoot", "AI Product Photoshoot", "📦", "product", "Studio product shots without a studio.", "Restage this product as a professional studio photograph: a clean seamless or styled surface, controlled softbox lighting with a believable contact shadow and reflection, and the product's real shape, colour, finish and labelling unchanged."],
  ["ai-product-photography", "AI Product Photography", "💡", "product", "Catalogue-quality lighting on any product.", "Relight this product photograph to commercial standard: even diffuse key light, a subtle specular highlight that describes the material, a natural grounding shadow, and completely accurate colour and detail on the product itself."],
  ["ecommerce-product-editor", "Ecommerce Photo Editor", "🛒", "product", "Marketplace-ready product images.", "Prepare this product image for an online store: pure white seamless background, the product centred with even margins, colour-accurate and sharp throughout, with a soft natural contact shadow."],
  ["amazon-product-editor", "Marketplace Photo Editor", "🏷️", "product", "Meet marketplace image requirements.", "Prepare this to marketplace listing standards: pure white background, the product filling most of the frame, no props or added text, accurate colour, and crisp edge detail."],
  ["image-editor-for-jewelry", "Jewelry Photo Editor", "💍", "product", "Make metal and stones read properly.", "Enhance this jewellery photograph: clean dust and fingerprints, render metal with accurate warm or cool tone and crisp specular highlights, bring out gemstone brilliance and facet definition, on a clean gradient backdrop."],
  ["image-editor-for-beauty", "Beauty Product Editor", "💄", "product", "Glossy cosmetics photography.", "Enhance this cosmetics product shot: remove glare and dust, render the packaging finish accurately whether matte or glossy, keep label text perfectly legible, and light it cleanly against a simple backdrop."],
  ["food-photo-editor", "Food Photo Editor", "🍽️", "product", "Make dishes look worth ordering.", "Enhance this food photograph: warm the light slightly, deepen natural food colour without turning it artificial, bring out texture and moisture on the surface, and tidy the plate edges and background."],
  ["car-photo-editor", "Car Photo Editor", "🚙", "product", "Dealership-grade vehicle photos.", "Enhance this vehicle photograph: deepen and even out the paint finish with clean reflection detail, sharpen trim and wheels, balance the sky, and remove distracting background clutter."],
  ["bike-photo-editor", "Bike Photo Editor", "🏍️", "product", "Clean, sharp motorcycle shots.", "Enhance this motorcycle photograph: crisp metal and paint detail with accurate reflections, well-defined tyres and spokes, balanced exposure and an uncluttered background."],
  ["truck-photo-editor", "Truck Photo Editor", "🚚", "product", "Commercial vehicle photography.", "Enhance this commercial vehicle photograph: even paint and panel rendering, legible livery and signage, balanced sky and body exposure, and a clean professional background."],
  ["image-editor-for-real-estate", "Real Estate Photo Editor", "🏢", "product", "Listing photos that get clicks.", "Enhance this property photograph to listing standard: correct verticals, balance window and interior exposure, warm the lighting to feel inviting, render wall and floor colour accurately, and remove clutter."],
  ["image-editor-for-hotels", "Hotel Photo Editor", "🛏️", "product", "Rooms that look worth booking.", "Enhance this hospitality photograph: inviting warm lighting, recovered window views, accurate textile and finish colour, corrected perspective and a tidy, well-composed frame."],
  ["image-editor-for-restaurants", "Restaurant Photo Editor", "🍴", "product", "Appetising interior and dish shots.", "Enhance this restaurant photograph: warm ambient lighting that feels inviting, accurate food and surface colour, recovered shadow detail, and a clean composition free of service clutter."],
  ["image-editor-for-electronics", "Electronics Photo Editor", "📱", "product", "Screens, metal and matte plastics.", "Enhance this electronics product shot: clean the surfaces of dust and fingerprints, render screens without moiré or glare, describe metal and matte plastic finishes accurately, on a clean neutral backdrop."],
  ["image-editor-for-home-decor", "Home Decor Photo Editor", "🕯️", "product", "Styled interior product shots.", "Enhance this home decor photograph: accurate material and textile rendering, warm considered lighting, a styled but uncluttered setting, and true-to-life colour."],
  ["ai-ads-generator", "Ad Creative Generator", "📣", "product", "Ad visuals from a product photo.", "Turn this product photo into an advertising creative: a striking composition with clear focal hierarchy, a bold complementary background treatment, generous space reserved for a headline, and the product rendered accurately."],
  ["marketing-creative-editor", "Marketing Creative Editor", "🎯", "product", "On-brand campaign visuals.", "Turn this into a marketing creative: a strong single focal point, a clean deliberate colour palette, room left for copy, and a polished finish suitable for paid placement."],

  // ── Social ────────────────────────────────────────────────────────────────
  ["thumbnail-maker", "Thumbnail Maker", "🖼️", "social", "Thumbnails built to be clicked.", "Turn this into a high-impact video thumbnail: an exaggerated clear expression, strong subject separation from the background, saturated high-contrast colour, and clear space left for large title text."],
  ["youtube-thumbnail-generator", "YouTube Thumbnail Maker", "▶️", "social", "16:9 thumbnails that read at small size.", "Create a YouTube thumbnail composition: the subject cut cleanly from a bold background, strong rim separation, punchy contrast, and an uncluttered area reserved for headline text. Must stay readable at thumbnail size."],
  ["instagram-photo-editor", "Instagram Photo Editor", "📷", "social", "Feed-ready colour and crop.", "Edit this for an Instagram feed: a cohesive colour grade, lifted shadows with controlled highlights, crisp but natural detail, and a composition that works in a square or 4:5 crop."],
  ["instagram-pfp-maker", "Instagram Profile Picture Maker", "🟣", "social", "A circle-crop-safe profile photo.", "Create a profile picture that survives a tight circular crop: the face centred with generous margin, even flattering light, a simple background, and clarity at very small sizes."],
  ["linkedin-pfp-maker", "LinkedIn Profile Picture Maker", "💠", "social", "Professional, friendly, on-platform.", "Create a LinkedIn profile picture: business-appropriate dress, clean even lighting, a simple neutral or softly blurred background, an approachable expression, framed head-and-shoulders."],
  ["discord-pfp-maker", "Discord Avatar Maker", "🎮", "social", "Avatars with personality at 128px.", "Create a Discord avatar: a bold stylised treatment that stays readable when small and circular, strong silhouette, saturated colour and a simple background."],
  ["youtube-pfp-maker", "YouTube Profile Picture Maker", "🔴", "social", "Channel art that scales down well.", "Create a YouTube channel profile picture: the subject centred for a circular crop, high contrast against a simple background, and instantly legible at small size."],
  ["facebook-pfp-maker", "Facebook Profile Picture Maker", "🔵", "social", "A clean, current profile photo.", "Create a Facebook profile picture: natural flattering light, a friendly genuine expression, a simple uncluttered background, framed safely for a circular crop."],
  ["roblox-pfp-maker", "Game Avatar Maker", "🧱", "social", "Blocky game-style avatars.", "Create a blocky voxel-style game avatar: simple geometric construction, bright saturated colour, a clean readable silhouette and a plain background."],
  ["fish-eye-pfp", "Fisheye PFP Maker", "🐠", "social", "The warped close-up look.", "Apply a strong fisheye lens effect: exaggerated barrel distortion pushing the centre of the face forward, curved edges, and the vignetting a real wide-angle lens produces."],
  ["linkedin-banner-maker", "LinkedIn Banner Maker", "🏞️", "social", "Wide cover art that isn't a stock photo.", "Create a wide professional banner composition: a calm abstract or architectural background, a clear focal area offset to one side, space left for text, and a palette that suits a business profile."],
  ["album-cover-generator", "Album Cover Generator", "💽", "social", "Square cover art with attitude.", "Create square album cover artwork: a striking central concept, bold graphic composition, a distinctive colour palette, and space that suits an artist and title treatment."],
  ["movie-poster-generator", "Movie Poster Generator", "🎞️", "social", "One-sheet film poster treatments.", "Create a cinematic film poster composition: a dramatic central figure, strong atmospheric lighting, a vertical one-sheet layout, and a clear band of space at the bottom for billing text."],
  ["book-cover-generator", "Book Cover Generator", "📚", "social", "Cover art that suits the genre.", "Create book cover artwork: a genre-appropriate central image, strong tonal composition, a clear area for title and author, and a finish that reads well as a small thumbnail."],
  ["logo-maker", "AI Logo Maker", "✒️", "social", "Simple marks that work small.", "Create a clean logo mark: simple geometry that stays legible at small size, a restrained two or three colour palette, balanced negative space, on a plain background."],
  ["gaming-logo-maker", "Gaming Logo Maker", "🕹️", "social", "Esports-style team marks.", "Create an esports-style logo: a bold aggressive mascot or emblem, heavy outlines, a strong two-tone accent palette, and a silhouette that reads on a stream overlay."],
  ["icon-generator", "Icon Generator", "🔷", "social", "App and UI icons from a prompt.", "Create an app icon: one clear central metaphor, a simple rounded-square composition, flat or subtly gradient colour, and full legibility at 48 pixels."],

  // ── For fun ───────────────────────────────────────────────────────────────
  ["age-progression-tool", "AI Age Progression", "⏳", "fun", "See yourself older, believably.", "Age this person to the specified age: add age-appropriate skin texture, fine lines, hair greying and thinning, and subtle changes to facial volume — while keeping them unmistakably the same person."],
  ["old-filter", "Old Age Filter", "👴", "fun", "The decades-older version of you.", "Age this person by several decades: deeper lines, softened jawline, thinner greyed hair, age spots and reduced skin elasticity, keeping their identity and bone structure clearly recognisable."],
  ["baby-face-filter", "Baby Face Filter", "👶", "fun", "A younger, rounder version.", "De-age this person to early childhood: rounder cheeks, larger eyes relative to the face, smoother skin and softer features, while keeping the characteristic traits that make them recognisable."],
  ["ai-time-machine", "AI Time Machine", "🕰️", "fun", "Drop yourself into another era.", "Restage this person in the specified historical period: period-accurate clothing, hair, grooming and accessories, an era-appropriate setting, and the photographic look of that decade's film and lenses."],
  ["ai-yearbook-generator", "AI Yearbook Generator", "🎓", "fun", "The 90s school-portrait treatment.", "Restage this as a 1990s school yearbook portrait: feathered period hair, a patterned knit or collared top, a mottled blue-grey studio backdrop, direct flash and the soft grain of 90s portrait film."],
  ["1980s-photo-trend", "1980s Photo Trend Maker", "📼", "fun", "The viral retro-portrait look.", "Restage this as an authentic 1980s photograph: voluminous period hair, era-accurate wardrobe, warm tungsten studio lighting with a soft-focus glow, and genuine 35mm film grain with slightly faded colour."],
  ["action-figure-generator", "Action Figure Generator", "🧸", "fun", "Yourself as boxed collectible.", "Render this person as a collectible action figure in retail blister packaging: visible moulded plastic with seam lines and joint articulation, a printed cardboard backing card, and product-shot lighting."],
  ["funko-figure-maker", "Vinyl Figure Maker", "🎁", "fun", "Big-head vinyl collectible styling.", "Render this person as a stylised vinyl collectible figure: oversized head with simplified features and black dot eyes, a small simplified body, matte moulded plastic finish, and clean product lighting."],
  ["aura-farm-horse", "Aura Photo Generator", "🐎", "fun", "The viral dramatic-aura trend.", "Restage this with a dramatic cinematic aura: heavy atmospheric haze, strong backlight rimming the subject, a sweeping epic landscape behind, and a high-contrast filmic grade."],
  ["ai-character-generator", "Character Generator", "🧝", "fun", "Original characters from a prompt.", "Design an original character: a coherent visual identity across clothing, silhouette and palette, expressive face, considered lighting and a simple background that keeps focus on the design."],
  ["ai-avatar-generator", "AI Avatar Generator", "🙂", "fun", "Stylised avatars in several registers.", "Create a stylised avatar of this person: a consistent art direction, simplified but recognisable features, clean rim lighting and a simple graphic background."],
  ["glow-up-editor", "Glow-Up Editor", "💫", "fun", "The polished, better-lit version.", "Give this photo a polished glow-up: flattering directional light, even natural skin, tidied hair and wardrobe, richer but believable colour, and a cleaner background — without changing the face."],
];

