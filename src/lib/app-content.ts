/**
 * app-content.ts — the long-form copy every AI app page renders.
 *
 * Each of the 200 app pages needs a full page of real content: why the tool
 * exists, what it is good for, how to prompt it, and what to watch out for.
 * Writing 200 pages by hand is not realistic, and repeating one template with
 * the tool name swapped is worse than useless — near-identical pages are thin
 * content and rank as such.
 *
 * So the copy is composed from two halves:
 *
 *   1. A bank per category (headshot, portrait, style, …). The prose is written
 *      about what that category of tool actually does, so a restore page talks
 *      about emulsion damage and a product page talks about marketplace rules.
 *   2. The app's own name, description and category, interpolated in.
 *
 * Every bank holds more items than a page shows, and the selection is rotated
 * by a hash of the slug. Two apps in the same category therefore render
 * different bullets in a different order, deterministically — deterministic
 * because these pages are statically generated and a fresh shuffle per build
 * would move the content under anyone who had linked to it.
 *
 * Placeholders: {n} the app's display name, {nl} the same lower-cased.
 */

import type { CreativeApp } from "@/lib/creative-apps";
import type { PageFAQ } from "@/lib/page-config";
import { CREDIT_COST } from "@/lib/plans";

export interface Item { t: string; d: string }

export interface AppLongContent {
  intro: string[];
  /** Plain-language description of the transformation this app actually sends. */
  transform: string;
  howTo: Item[];
  why: { heading: string; items: Item[] };
  built: { heading: string; sub: string; items: Item[] };
  benefits: Item[];
  useCases: Item[];
  promptIdeas: { intro: string; items: Item[] };
  bestResults: { heading: string; items: string[] };
  faq: PageFAQ[];
}

interface Bank {
  /** Intro prose. `lead` and `leadAlt` are pooled and three are chosen. */
  lead: string[];
  /** More intro paragraphs, so two apps in a category do not open identically. */
  leadAlt: string[];
  /** Three steps. */
  howTo: Item[];
  whyHeading: string;
  why: Item[];
  builtHeading: string;
  builtSub: string;
  built: Item[];
  benefits: Item[];
  useCases: Item[];
  promptIntro: string;
  prompts: Item[];
  tipsHeading: string;
  tips: string[];
  faq: PageFAQ[];
}

/* ── selection ──────────────────────────────────────────────────────────── */

/** FNV-1a. Stable across builds, unlike anything seeded by time or order. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Take `count` items starting at a slug-derived offset, wrapping around. The
 * rotation is what stops every app in a category reading identically.
 */
function pick<T>(items: T[], count: number, seed: number): T[] {
  if (items.length <= count) return items;
  const start = seed % items.length;
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(items[(start + i) % items.length]);
  return out;
}

const fill = (s: string, name: string) =>
  s
    .replace(/\{n\}/g, name)
    .replace(/\{nl\}/g, name.toLowerCase())
    .replace(/\{cost\}/g, String(CREDIT_COST));

const fillItem = (i: Item, name: string): Item => ({ t: fill(i.t, name), d: fill(i.d, name) });


/**
 * The app's own transformation prompt, made readable.
 *
 * Every person-editing prompt carries two shared clauses appended to it — the
 * identity-preservation instruction and the photorealism instruction — which
 * are identical across the catalogue and would be pure duplication on the
 * page. They are dropped here, leaving the part that is unique to this app.
 */
function transformText(prompt: string): string {
  return prompt
    .replace(/Preserve the person's face[^.]*\./g, "")
    .replace(/The result must read as a real photograph[^]*?unless the style explicitly calls for one\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── categories for the hand-written apps ───────────────────────────────── */

/**
 * The 42 original apps predate the catalogue and carry no category, so they are
 * mapped here. Without this they would all fall through to the generic bank.
 */
const CURATED_CAT: Record<string, string> = {
  "saree-photoshoot": "portrait", "3d-figurine": "fun", "retro-bollywood": "portrait",
  "polaroid-photo": "style", "restore-old-photos": "restore", "couple-photoshoot": "portrait",
  "professional-headshot": "headshot", "festival-photoshoot": "portrait", "pet-portrait": "portrait",
  "anime-style": "style", "passport-photo": "headshot", "background-changer": "background",
  "linkedin-banner": "social", "christmas-photo": "portrait", "baby-photoshoot": "portrait",
  "graduation-photo": "portrait", "gym-transformation": "retouch", "ghibli-style": "style",
  "y2k-aesthetic": "style", "wedding-invite-photo": "social", "corporate-avatar": "headshot",
  "old-money-aesthetic": "portrait", "barbie-box": "fun", "ai-baby-predictor": "fun",
  "lego-minifigure": "fun", "pixar-avatar": "style", "renaissance-portrait": "style",
  "age-progression": "fun", "superhero-costume": "fun", "tarot-card-portrait": "style",
  "90s-yearbook-photo": "portrait", "cyberpunk-avatar": "style", "funko-pop-figure": "fun",
  "claymation-portrait": "style", "comic-book-cover": "style", "coastal-cowgirl": "portrait",
  "old-hollywood-glamour": "portrait", "prom-photoshoot": "portrait",
  "thanksgiving-photoshoot": "portrait", "glow-up-filter": "retouch",
  "astronaut-photoshoot": "fun", "pixel-art-avatar": "style",
};

export function categoryOf(app: CreativeApp): string {
  return app.cat || CURATED_CAT[app.slug] || "portrait";
}


/* ── shared pools ───────────────────────────────────────────────────────── */

/*
 * Every category bank holds 7-11 items per section, and a page shows 5-8 of
 * them. Sampling that much of a bank means two pages in the same category
 * necessarily share most of it, however the rotation is seeded. These pools
 * are mixed into the category banks to roughly triple the space each section
 * is drawn from — they are written to be true of any tool here, so nothing
 * lands on a page it does not apply to.
 */

const SHARED_BENEFITS: Item[] = [
  { t: "Nothing to install", d: "It works on a phone or a laptop. No desktop app, no plugin, no account needed to look around." },
  { t: "No subscription", d: "Credits are a one-time purchase, they never expire, and nothing renews on its own. Buy once and use them whenever." },
  { t: "Two models to choose from", d: "Nano Banana and GPT Image handle the same job differently. If one result is not right, the other model often is." },
  { t: "Every aspect ratio", d: "Square, 4:5, 9:16, 16:9 and more, chosen before generating so nothing important gets cropped away afterwards." },
  { t: "Full resolution, no watermark", d: "The download is the full generated image with nothing overlaid — usable in print, in a listing or commercially." },
  { t: "The free tools stay free", d: "Compress, convert, crop, resize, rotate and the rest are unlimited, with no account and no credit cost." },
  { t: "Your original is never modified", d: "Every result is a new image. The file you uploaded stays exactly as it was on your device." },
  { t: "Cheap enough to iterate", d: "Packs start at $2. Generating the same image three ways and keeping the best is the intended workflow, not an expensive mistake." },
];

const SHARED_PROMPTS: Item[] = [
  { t: "Be concrete, not complimentary", d: "\"Soft light from the left, plain grey background\" gives the model something to act on. \"Beautiful, high quality, 8k\" gives it nothing at all." },
  { t: "Change one thing at a time", d: "If a result is close, edit a single detail and run it again. Rewriting the whole prompt gives you an unrelated image and no information about what the change did." },
  { t: "Say what must not change", d: "A short exclusion — \"do not change the face\", \"keep the label text\" — is often more effective than any amount of positive description." },
  { t: "Keep it short", d: "Three or four specific clauses beat a paragraph. Long prompts dilute every instruction in them, including the one you cared about." },
  { t: "Name the framing", d: "Close-up, head and shoulders, full body, centred, offset. Framing decides what the image is actually of." },
  { t: "Avoid asking for text in the image", d: "Generated lettering is still unreliable. Ask for empty space where the text should go and add real type afterwards." },
  { t: "Pick the ratio first", d: "Generating square and cropping to vertical throws away part of the frame. Choose the shape before you generate." },
  { t: "Try the other model", d: "If a prompt is being ignored, switching between Nano Banana and GPT Image often resolves it faster than rewording." },
  { t: "Describe the light", d: "Direction, softness and colour temperature. Light does more to how a photograph feels than any other single thing you can specify." },
  { t: "Re-run before rewriting", d: "Generation is not deterministic. The same prompt twice gives two different results, and the second is sometimes simply better." },
];

const SHARED_TIPS: string[] = [
  "Start from the largest, least compressed original you have — a screenshot of a photo has already lost detail that cannot be recovered.",
  "Soft, even light in the source photo gives the best result almost regardless of what you are generating.",
  "Judge every result at full size, not zoomed out. Problems hide at small sizes.",
  "Generate two or three times before deciding. Results vary between runs, and the first is not reliably the best.",
  "Check hands, text, jewellery and glasses in any result before sharing it — those are still where image models most often slip.",
  "Choose the aspect ratio before generating rather than cropping afterwards.",
  "If one model ignores part of your instruction, switch to the other and run it again.",
  "Keep the original file. It is a better base for the next attempt than a generated image is.",
  "For a matching set, keep the same source photo and style and change only one variable.",
  "Nothing you upload is published, shared or added to a gallery — but do not upload anything you would not want to leave your device at all.",
  "The free on-device tools — compress, convert, crop, resize, rotate — cost no credits, so use them for mechanical work.",
  "If a result is nearly right, say what is wrong with it in the next run rather than starting over.",
];

/* ── banks ──────────────────────────────────────────────────────────────── */

const headshot: Bank = {
  lead: [
    "A studio headshot session costs between $150 and $500 in most cities, takes half a day once you count travel and wardrobe, and hands you a gallery three weeks later. For a photo that lives at 200 pixels wide next to your name, that is a strange amount of money and time. {n} produces the same kind of image from a photo already on your phone.",
    "What matters in a professional headshot is boring and specific: even light on the face with no hard shadow across one eye, a background that does not compete, clothing that reads as appropriate for your field, and an expression that looks like you on a good day rather than you being told to smile. Those are the things this tool controls. Your face, bone structure and skin tone are held exactly as they are — the wardrobe, the light and the backdrop are what change.",
    "Upload a clear selfie, choose the style that matches where the photo will be used, and generate. Each generation costs {cost} credits from a one-time pack, so trying four or five variations to find the one you actually like is the expected way to use it, not an expensive mistake.",
  ],
  leadAlt: [
    "The unglamorous truth about profile photos is that most people are using one they do not like. It is a cropped wedding photo, or a selfie taken in a car, or a portrait from a job two roles ago — kept because replacing it meant organising something. {n} removes the organising.",
    "There is a reason recruiters and clients form an impression from a portrait before reading a word: it is the only part of a profile that is processed instantly. An evenly lit photo against a neutral background reads as competent, and a dim phone snap reads as indifferent, regardless of what the text underneath says.",
    "Teams get more out of this than individuals do. A directory where every portrait was taken in a different room on a different phone looks disorganised in a way nobody comments on but everybody notices. Running one style across all of them fixes the page more than improving any single photo would.",
  ],
  howTo: [
    { t: "Upload a clear photo of your face", d: "A front-facing JPG, PNG or WEBP where both eyes are visible and the light is even. A plain phone selfie taken near a window is genuinely better source material than a dim photo from a good camera." },
    { t: "Pick the style you need", d: "Corporate, LinkedIn, executive, creative, outdoor or plain white. The choice sets the wardrobe, the background and how hard the lighting is — or write your own brief if you have something specific in mind." },
    { t: "Generate and download", d: "Compare the original against the result, regenerate if the tie or the crop is not right, then download at full resolution. No watermark, and nothing is added to the image." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Your face stays your face", d: "Identity preservation is the whole job. Bone structure, eye shape, skin tone and the details that make you recognisable are held fixed; only clothing, lighting and background are generated." },
    { t: "Even, professional lighting", d: "A soft key with a fill on the shadow side — the standard portrait setup. No hard nose shadow, no blown-out forehead, no colour cast from an office ceiling light." },
    { t: "Backgrounds that stay out of the way", d: "Neutral grey, softly defocused office, dark low-key or plain white. Each one is chosen because it makes the face read first, which is the only thing a headshot has to do." },
    { t: "Wardrobe appropriate to the field", d: "A suit reads differently from an open collar, and both read differently from a lab coat. The styling is matched to where the photo is going rather than applied as one generic look." },
    { t: "ID and application safe", d: "The plain-white style gives flat even light with no shadow behind the head, which is what passport, visa and application photos are usually rejected for." },
    { t: "Consistent across a team", d: "Run the same style over everyone's photos and the About page stops looking like a collage of holiday snaps. Consistency in a team grid is more noticeable than the quality of any single portrait." },
    { t: "Full resolution, no watermark", d: "Downloads are the full generated resolution with nothing overlaid, so the same file works for a 200px avatar and a printed conference badge." },
    { t: "Retake it whenever you change", d: "New haircut, new role, new glasses. Regenerating costs {cost} credits instead of booking another session, so the photo can stay current." },
  ],
  builtHeading: "{n} for every kind of profile",
  builtSub: "The same face, styled for where the photo is actually going. A leadership page, a hiring portal and a conference badge all want different things from a portrait.",
  built: [
    { t: "LinkedIn and hiring profiles", d: "Smart-casual dress, a softly blurred background with depth, approachable expression. The look recruiters skim past thousands of and register as competent." },
    { t: "Company About and leadership pages", d: "Dark tailored suit, low-key sculpted lighting, settled posture. Reads as authority without tipping into stock-photo stiffness." },
    { t: "Applications and official documents", d: "Plain white backdrop, flat shadowless light, neutral expression, head square to camera — the specification most ID photos are checked against." },
    { t: "Creative and agency profiles", d: "A textured or coloured backdrop and characterful directional light, for fields where looking identical to a bank's website is the wrong signal." },
    { t: "Speaker and press kits", d: "Higher-contrast lighting and generous negative space around the head, so an event page can crop it square or wide without cutting into your face." },
    { t: "Team directories at scale", d: "One style applied across dozens of photos taken on different phones in different rooms, which is the usual state of an internal directory." },
  ],
  benefits: [
    { t: "Ready in about a minute", d: "Upload, choose, generate. The slow parts of a headshot — scheduling, travel, wardrobe, waiting on the retoucher — are removed entirely." },
    { t: "Costs a fraction of a session", d: "A pack of credits starts at $2 and covers several attempts. A studio sitting starts in the low hundreds and covers one." },
    { t: "No photoshoot nerves", d: "Being photographed makes most people tense, and tension shows in the jaw and eyes. Working from a photo you already like sidesteps that completely." },
    { t: "Print-ready output", d: "The resolution holds up on a badge, a business card or a printed programme, not only on screen." },
    { t: "Try several directions", d: "Generate corporate, creative and outdoor versions of the same photo and pick per platform, instead of using one portrait everywhere because it is the only one you have." },
    { t: "Nothing to install", d: "It works on a phone or a laptop. No Lightroom, no plugins, no desktop app." },
    { t: "Your photo is not published anywhere", d: "The image is sent for generation and returned to you. It is not posted, shared or added to a gallery." },
  ],
  useCases: [
    { t: "A LinkedIn photo that is not a cropped wedding shot", d: "The most common professional headshot on the internet is someone cut out of a group photo. This replaces it in a minute." },
    { t: "A new starter who joined remotely", d: "Nobody is flying someone in for a photographer. One selfie matched to the company style closes the gap in the team grid." },
    { t: "Consultants and freelancers", d: "When the proposal is the product, the portrait at the top of it does real work. A studio-grade photo raises the floor on a cold pitch." },
    { t: "Conference and panel submissions", d: "Speaker forms almost always demand a high-resolution headshot at short notice, usually the week the deadline lands." },
    { t: "Medical, legal and finance profiles", d: "Fields where clients read the portrait as a signal of seriousness before they read a word of the biography." },
    { t: "Real-estate and sales collateral", d: "Agent photos appear on listings, signage and cards, at every size from a thumbnail to a poster." },
    { t: "Academic and research pages", d: "Faculty directories are usually an assortment of decades-old photos. A current one, consistently lit, stands out immediately." },
    { t: "Refreshing a photo that has aged", d: "If the portrait predates a haircut, glasses or a decade, the mismatch is the first thing anyone who meets you notices." },
  ],
  promptIntro: "You do not need to write a prompt at all — the style presets cover most cases. If you want something specific, keep the brief short and name only what you care about: the clothing, the background, the light and the expression.",
  prompts: [
    { t: "Name the clothing precisely", d: "\"Charcoal suit, white shirt, no tie\" gives a far more predictable result than \"business clothes\", which could mean almost anything." },
    { t: "Say what the background should be", d: "\"Plain mid-grey seamless backdrop\" or \"softly blurred modern office\". Naming it stops the model choosing something distracting for you." },
    { t: "Describe the light, not the mood", d: "\"Soft key light from the left with a gentle fill\" is actionable. \"Professional lighting\" is not — every lighting setup claims to be that." },
    { t: "Set the crop", d: "\"Head and shoulders, centred, a little space above the hair\" avoids a result cropped too tight to use as an avatar." },
    { t: "Ask for a specific expression", d: "\"Relaxed closed-mouth smile, eyes to camera\" reads warmer than a broad grin in most professional contexts." },
    { t: "Add the industry if it matters", d: "\"Healthcare professional, clinical setting behind\" or \"architect, studio behind\" shifts the whole styling in one short phrase." },
    { t: "Keep the glasses", d: "If you wear them daily, say \"keep the glasses, no reflections in the lenses\" — otherwise a portrait without them can look like someone else." },
    { t: "Say what to leave alone", d: "\"Do not change the hairstyle or hair length\" is worth adding when the current cut is part of how you look." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Start with a front-facing photo where both eyes are clearly visible — a slight angle is fine, a strong three-quarter turn is not.",
    "Soft, even light beats bright light. Facing a window on an overcast day is close to ideal.",
    "Avoid direct overhead light: it drops shadows into the eye sockets and under the nose, which the model then has to guess its way out of.",
    "Skip photos already run through a beauty filter — smoothed skin gives the model less structure to work from and the result looks waxy.",
    "Sunglasses, hats and hands near the face all obscure the features that identity preservation depends on.",
    "A plain wall behind you is not required, but a very busy background makes a clean separation harder.",
    "Generate two or three times. Small differences in the source photo change the tie, the collar and the light noticeably.",
    "Check the hands, collar and glasses in the result before using it — those are the details generative models are still most likely to get subtly wrong.",
    "If the expression looks stiff, try a source photo where you were mid-sentence rather than posing.",
    "For a team, run the same style across everyone rather than letting each person choose — the grid matters more than each portrait.",
    "Keep the original file. It is the best starting point for a different style later, and a generated image is not.",
  ],
  faq: [
    { q: "Will it still look like me?", a: "Yes — that is the constraint the tool is built around. Bone structure, eye shape, skin tone and the features that make you recognisable are held fixed. What changes is the clothing, the lighting and the background. If a result does not look like you, the source photo is usually the cause: heavy filtering, a steep angle or deep shadow all reduce how much the model has to work from." },
    { q: "Can I use the result on LinkedIn, a CV or a company website?", a: "Yes. The download is full resolution with no watermark and no usage restriction from us, so it can go on a profile, a CV, a website, a business card or a printed badge." },
    { q: "Is it acceptable for a passport or visa photo?", a: "The plain-white style is built to the usual specification — flat even light, no shadow behind the head, neutral expression, head square to camera. Requirements differ by country and by document, and some authorities do not accept AI-generated portraits at all, so check the rules for your specific application before relying on it." },
    { q: "Do I need several photos of myself, like a trained model?", a: "No. This works from a single photo. There is no training step, no upload of twenty selfies and no waiting — a result comes back in seconds." },
  ],
};

const portrait: Bank = {
  lead: [
    "A real photoshoot is mostly logistics. Finding a photographer, agreeing a date, borrowing or buying the outfit, hoping the weather holds, then waiting for edits. {n} collapses that into a photo you already have and about a minute of waiting.",
    "The interesting part is what actually changes. The wardrobe, the setting, the lighting and the mood are generated; your face is not. That is the difference between a portrait of you in a different setting and a picture of a stranger who vaguely resembles you. A clear, well-lit source photo is what makes it hold.",
    "It is most used before the moments that make people want a good photo of themselves — festivals, weddings, birthdays, a new job, a profile that has gone stale. Each generation costs {cost} credits from a one-time pack that never expires, so running a look three different ways and keeping the best is normal.",
  ],
  leadAlt: [
    "The gap between a snapshot and a portrait is not the camera. It is the light, the clothing, the background, and the fact that somebody thought about all three before the shutter opened. {n} applies that thinking to a photo where nobody did.",
    "Most people have exactly one photo of themselves they actually like, and it is years old. The reason is not vanity — it is that good photos of people are a by-product of events, and events are rare. Generating one on an ordinary Tuesday changes that arithmetic entirely.",
    "What surprises people first is the wardrobe. Fabric that hangs and creases correctly, jewellery that catches light in the right place, a collar that sits on shoulders rather than floating near them. That physical plausibility is the difference between a costume and clothes.",
  ],
  howTo: [
    { t: "Upload your photo", d: "A clear selfie or portrait in JPG, PNG or WEBP. Face visible, reasonable light. Group photos work too — say how many people are in the frame." },
    { t: "Choose a look or describe one", d: "Pick a ready-made style, or write a short brief naming the outfit, the setting and the mood you want. Both routes go to the same engine." },
    { t: "Generate, then download", d: "Look at the before and after side by side, regenerate if the styling is not right, then download at full resolution with no watermark." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Your face is preserved", d: "Features, bone structure and skin tone are held; the outfit, backdrop and light are what the model generates. A portrait of you, not of someone who looks a bit like you." },
    { t: "Complete wardrobe changes", d: "Fabric that drapes, jewellery that catches light, clothing that fits the body in the photo rather than being pasted on top of it." },
    { t: "Real backgrounds with depth", d: "The existing background is replaced with a setting that has genuine distance in it, so the subject is separated rather than cut out and stuck down." },
    { t: "Lighting matched to the mood", d: "Warm low sun, soft window light, hard studio key or moody low-key — the light is what makes a photo feel expensive, far more than the clothes." },
    { t: "Group photos supported", d: "Couples, families and friends are handled together, with each face preserved individually instead of averaged into one generic look." },
    { t: "Any aspect ratio", d: "Square for a grid, 4:5 for a feed, 9:16 for a story, wide for a banner. Chosen before generating so nothing important gets cropped away." },
    { t: "Shareable straight away", d: "Full resolution, no watermark, no logo. It goes straight to a feed, a print or an invitation." },
    { t: "Cheaper than the outfit alone", d: "A pack starts at $2. The saree, the suit or the dress in the result would cost considerably more than the photo of you wearing it." },
  ],
  builtHeading: "{n} built for every kind of occasion",
  builtSub: "Change the clothes, the setting, the colours and the mood. The same photo can become a festival portrait, a studio sitting or a candid outdoor shot.",
  built: [
    { t: "Festivals and celebrations", d: "Traditional dress, warm light, decorated settings — the photos people actually want on the day and rarely have time to take." },
    { t: "Couples and family portraits", d: "Two or more people styled together, with everyone's face kept, which is the part most tools quietly get wrong." },
    { t: "Studio-style sittings", d: "Controlled light, a clean backdrop and deliberate posing, without hiring the studio or the photographer." },
    { t: "Outdoor and candid looks", d: "Golden hour, real streets, natural stances. Less formal, and usually the version people actually use as a profile photo." },
    { t: "Themed and seasonal sets", d: "Christmas, graduation, prom, Diwali, Thanksgiving. Generated the week they are relevant rather than planned a month out." },
    { t: "Pets in the frame", d: "Animals are handled as subjects in their own right rather than treated as part of the background." },
  ],
  benefits: [
    { t: "Minutes instead of a weekend", d: "No booking, no travel, no wardrobe hunt. The whole thing happens between opening the page and downloading the file." },
    { t: "No wardrobe to buy or borrow", d: "The outfit exists only in the photo, which is where you wanted it anyway." },
    { t: "Works from an ordinary phone photo", d: "A good selfie in soft light is enough. It does not need a camera, a lens or a lighting kit." },
    { t: "Several looks from one photo", d: "Generate three styles from the same upload and choose per platform rather than reusing one picture everywhere." },
    { t: "Ready for print", d: "Resolution holds for an invitation, a framed print or a gift, not only for a screen." },
    { t: "Nothing recurring", d: "Credits are bought once and never expire. There is no subscription to cancel and nothing renews on its own." },
    { t: "Easy for anyone", d: "No editing skill, no layers, no prompt engineering. Upload, pick, generate." },
  ],
  useCases: [
    { t: "A profile photo that is not three years old", d: "The quickest way to refresh a profile without organising anything or asking anyone to take a photo of you." },
    { t: "Festival and wedding season posts", d: "The traditional portrait everyone wants and almost nobody finds time to shoot properly during the actual event." },
    { t: "Save-the-dates and invitations", d: "A styled couple portrait that suits the card, generated before the real shoot happens — or instead of it." },
    { t: "Milestone photos", d: "Graduations, new jobs, birthdays, anniversaries. The moment passes faster than a photoshoot can be arranged." },
    { t: "Gifts for family", d: "A parent or grandparent styled into a portrait they would never sit for, printed and framed." },
    { t: "Long-distance group photos", d: "People who were never in the same room can end up in one frame, styled consistently." },
    { t: "Trying a look before committing", d: "See the outfit, the colour or the setting in a photo of yourself before buying or booking anything." },
    { t: "Creative and dating profiles", d: "Several genuinely different portraits rather than four crops of the same picture, which is what most profiles are." },
  ],
  promptIntro: "The presets handle most of it. When you do write a prompt, name four things — the outfit, the setting, the light and the mood — and stop there. Longer prompts usually get you further from what you wanted, not closer.",
  prompts: [
    { t: "Name the outfit and its fabric", d: "\"Deep red silk saree with gold border\" gives the model something specific to render, where \"nice traditional clothes\" leaves it guessing." },
    { t: "Place the scene", d: "\"Old courtyard at dusk\", \"marble staircase\", \"quiet beach at low tide\". The setting sets the light as well as the background." },
    { t: "Describe the light", d: "\"Warm low sun from behind, rimming the hair\" or \"soft overcast daylight\". This single line changes the feel of the photo more than anything else." },
    { t: "Give a mood word", d: "Calm, celebratory, cinematic, nostalgic. One word is enough; a list of five just cancels itself out." },
    { t: "Say how many people are in the frame", d: "\"Two people, both facing camera\" is worth stating for any group photo — it stops the model adding or dropping someone." },
    { t: "Choose the framing", d: "\"Full body\" versus \"head and shoulders\" decides whether the outfit is the subject or the face is." },
    { t: "Rule out what you do not want", d: "\"No sunglasses, no hat, no text in the image\" is more effective than hoping the model omits them." },
    { t: "Change one thing at a time", d: "If a result is close, alter a single detail and regenerate. Rewriting the whole prompt gives you an unrelated image and no information." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Use a clear, front-facing photo with soft light — window light on an overcast day is close to ideal.",
    "Make sure the whole face is visible. Sunglasses, a low cap or a hand at the chin remove the features the result depends on.",
    "For a group photo, everyone should be facing roughly the same way and not overlapping much.",
    "Skip photos that already have a heavy filter on them. Smoothed skin gives the model less to hold on to.",
    "If you want the outfit to be the subject, upload a photo that includes more than your head and shoulders.",
    "Pick the aspect ratio before generating, not after — cropping a square down to a story loses the top of the frame.",
    "Regenerate two or three times. Fabric drape and lighting vary noticeably between runs.",
    "Check hands, jewellery and any text in the background before sharing — these are still the weak spots of image models.",
    "For a set that looks like one shoot, keep the same source photo and the same style and vary only the pose or framing.",
    "Very small or heavily compressed source images limit the final resolution. Use the largest original you have.",
    "Keep the original file. It is a better base for the next look than a generated image is.",
  ],
  faq: [
    { q: "Will my face still look like me?", a: "Yes. Your features, bone structure and skin tone are preserved and only the wardrobe, background and lighting are generated. A clear, well-lit, front-facing source photo gives the most faithful result; heavy filters, steep angles and deep shadow all make the face harder to hold." },
    { q: "Does it work with group photos?", a: "Yes — couples, families and small groups are supported, and each face is preserved individually. Results are best when everyone is facing roughly the same direction and nobody is heavily overlapped or turned away." },
    { q: "Can I print the result?", a: "Yes. Downloads are full resolution with no watermark, which is enough for an invitation, a framed print or a gift. The one limit is the source: a tiny, heavily compressed original caps how large the result can usefully go." },
    { q: "How many credits does one photo cost?", a: `Each generation costs ${CREDIT_COST} credits. Packs are a one-time purchase from $2 and the credits never expire, so generating a look three or four ways to find the right one is the intended way to use it.` },
  ],
};

const style: Bank = {
  lead: [
    "Turning a photograph into another medium used to be a commission. You found an illustrator, described what you wanted, waited a week and paid for it. {n} does the same conversion from a photo you already have, in about a minute.",
    "The difficult part is not applying a filter — it is keeping the person recognisable while genuinely changing the medium. A good stylised portrait still reads as you: the proportions of the face, the set of the eyes, the hairline. A bad one is a generic character with your colour palette. This tool is tuned for the first outcome, which is why a clear source photo matters more than the style you pick.",
    "Each generation costs {cost} credits from a one-time pack. That is cheap enough to try the same photo in three styles and keep whichever one your friends actually recognise you in.",
  ],
  leadAlt: [
    "Every few months a visual style goes around, and the people who get the most out of it are the ones who post while it is still moving. A commission takes a week. {n} takes a minute, which is the difference between joining a trend and documenting it afterwards.",
    "A stylised portrait does something a photograph cannot: it survives being shrunk. At forty pixels in a comment thread a photograph becomes a smudge, while flat colour and a strong outline stay legible. That is why illustrated avatars outlast the trend that produced them.",
    "The failure mode worth knowing about is the generic character. Plenty of tools will produce a competent illustration that is recognisably nobody. Keeping the proportions of a specific face inside a new medium is the harder problem, and the only one worth solving.",
  ],
  howTo: [
    { t: "Upload the photo", d: "A clear JPG, PNG or WEBP. Portraits work best when the face fills a reasonable part of the frame — a distant full-body shot gives the model very little face to work from." },
    { t: "Pick the style or write your own", d: "Choose a preset, or describe the medium you want: line weight, palette, texture, era. Naming the medium precisely is what separates a good result from a vague one." },
    { t: "Generate and download", d: "Full resolution, no watermark. Good enough to print, use as an avatar, or send to someone as a gift." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Recognisable after the conversion", d: "Facial proportions and the details that identify a person are carried into the new medium rather than replaced by a generic character face." },
    { t: "A real change of medium", d: "Brush texture, ink weight, cel shading, moulded plastic, woven canvas. The material of the image changes, not just its colours." },
    { t: "Consistent across a set", d: "Run several photos through the same style and they look like one commission rather than a pile of unrelated experiments." },
    { t: "Backgrounds restyled to match", d: "A stylised subject on a photographic background looks pasted in. The whole frame is converted together." },
    { t: "Print-quality output", d: "Resolution holds up as a framed print or a card, which is what most people end up doing with a portrait they like." },
    { t: "No drawing skill needed", d: "No tablet, no brushes, no layers. The skill required is choosing a good source photo." },
    { t: "Any ratio you need", d: "Square for an avatar, portrait for a print, wide for a banner or a cover. Set before generating." },
    { t: "Cheaper than a commission by orders of magnitude", d: "An illustrated portrait typically runs from $40 to several hundred. A pack of credits starts at $2." },
  ],
  builtHeading: "{n} for prints, avatars and gifts",
  builtSub: "The same conversion serves very different ends — a profile picture, a framed print, a card, a set of matching avatars for a group.",
  built: [
    { t: "Profile pictures and avatars", d: "A stylised portrait stands out in a feed of photographs, and it stays readable when a platform shrinks it to 40 pixels." },
    { t: "Prints and framed gifts", d: "A converted portrait of a person, a couple or a pet is the kind of gift people keep, and it costs the price of the frame." },
    { t: "Cards and invitations", d: "An illustrated portrait sits on a card in a way a photograph usually does not, without needing a designer." },
    { t: "Matching sets for a group", d: "A team, a family or a friend group converted in one style, which looks deliberate in a way individual photos never do." },
    { t: "Covers and thumbnails", d: "A stylised image survives text overlaid on it far better than a photograph does — the flat areas give the type somewhere to sit." },
    { t: "Creative reference", d: "A quick look at a concept in a given medium before committing to commissioning it properly." },
  ],
  benefits: [
    { t: "Done in under a minute", d: "No brief, no back and forth, no revision round. Upload and generate." },
    { t: "Try several styles for the price of one commission", d: "Compare mediums on the same photo instead of committing to the first description that sounded good." },
    { t: "Nothing to learn", d: "No illustration software, no tablet, no understanding of layers or masks." },
    { t: "Keeps the likeness", d: "The point of a portrait is that it is of someone. Identity preservation is applied to every person-editing prompt." },
    { t: "Full resolution and no watermark", d: "Print it, frame it, use it commercially. Nothing is stamped on the result." },
    { t: "No subscription", d: "Credits are a one-time purchase and never expire. Nothing renews." },
    { t: "Works on a phone", d: "The whole flow runs in a mobile browser, which is where the source photo already is." },
  ],
  useCases: [
    { t: "An avatar that is not another selfie", d: "Stylised portraits read as a deliberate choice in a grid of photographs, and they stay legible at tiny sizes." },
    { t: "A gift that took no planning", d: "A parent, a partner or a pet converted into a print, ordered the same evening." },
    { t: "Group and team sets", d: "Everyone in one style — for an About page, a group chat, a wedding party or a D&D table." },
    { t: "Pet portraits", d: "The single most requested illustrated portrait, and the one people are most reliably delighted by." },
    { t: "Merch and sticker art", d: "Flat, high-contrast styles are what actually survive being printed small on a sticker or a shirt." },
    { t: "Book, album and playlist covers", d: "A stylised portrait as cover art, with room for a title to sit over it." },
    { t: "Party and event invitations", d: "The host, illustrated, on the invitation. Faster than finding clip art that is not terrible." },
    { t: "Social content and trends", d: "Style trends move in days. Generating the look while it is current beats commissioning it for after it has passed." },
  ],
  promptIntro: "Presets cover the common styles. If you write your own, describe the medium as a maker would: line, colour, texture, era. Vague adjectives like \"beautiful\" or \"high quality\" do nothing; \"thick ink outlines, flat colour, halftone shading\" does a great deal.",
  prompts: [
    { t: "Name the medium explicitly", d: "\"Oil on canvas with visible brush texture\" or \"cel-shaded animation still\". The medium does more work than any other part of the prompt." },
    { t: "Describe the line", d: "\"Thick uniform ink outline\" reads completely differently from \"soft pencil with no outline\", even in the same palette." },
    { t: "Constrain the palette", d: "\"Muted earth tones, four colours only\" produces a coherent image. Left open, most models reach for saturated everything." },
    { t: "Give an era or school", d: "\"1970s screen print\", \"Renaissance oil\", \"90s anime cel\". Era carries a whole set of conventions in two words." },
    { t: "Say what happens to the background", d: "\"Flat single-colour background\" for an avatar, \"stylised landscape behind\" for a print." },
    { t: "Keep the likeness explicitly", d: "Adding \"keep the face recognisable\" helps on the more abstract styles where the medium starts to dominate." },
    { t: "Set the framing", d: "\"Bust, shoulders up\" for an avatar, \"full figure\" for a poster. This decides how much of the style you actually see." },
    { t: "Ask for clean space if text is going on it", d: "\"Leave the upper third uncluttered\" gives a title somewhere to go, which is the usual reason a good cover fails." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Use a source photo where the face is large in the frame — stylisation loses detail, so start with more of it.",
    "Even, soft lighting converts best. Harsh shadow becomes a solid black shape in most stylised mediums.",
    "One subject converts more reliably than a crowd. For groups, keep everyone facing forward and close together.",
    "Avoid photos that are already filtered — stacking a style on a style gives muddy results.",
    "Simple backgrounds convert better. A cluttered room becomes visual noise in the styled version.",
    "For avatars, generate square and ask for a plain background, or the crop will cut into the head.",
    "Regenerate a few times: stylised output varies more between runs than photographic output does.",
    "Check hands, glasses and any lettering — these are where stylised results most often break down.",
    "If you want a matching set, keep the style and the prompt identical and change only the source photo.",
    "For printing, generate at the largest ratio you can and crop afterwards rather than upscaling later.",
    "Keep the original photo. A generated image is a poor starting point for a different style.",
  ],
  faq: [
    { q: "Will the portrait still look like the person?", a: "Yes — keeping the likeness is treated as the point rather than a side effect. Facial proportions and identifying details are carried into the new medium. The heavier and more abstract the style, the more the medium dominates, so a clear photo with the face large in the frame matters more for stylised output than for photographic output." },
    { q: "Can I use the result commercially or print it?", a: "Yes. Downloads are full resolution with no watermark and no usage restriction from us — prints, merchandise, covers and client work are all fine." },
    { q: "Does it work on pets and objects, or only people?", a: "Both. Pets are the single most popular subject for stylised portraits. Objects, buildings and landscapes convert too, though the results vary more because there is no face anchoring the composition." },
    { q: "Why does the same photo give different results each time?", a: "Image generation is not deterministic — each run samples differently, and stylised output varies more than photographic output. That is useful: generate two or three times and keep the best. Each run costs " + `${CREDIT_COST} credits.` },
  ],
};

const retouch: Bank = {
  lead: [
    "Retouching is the part of photography nobody outside it can see and everybody notices. A distracting blemish, a shine across the forehead, a colour cast from a fluorescent tube — individually small, collectively the difference between a photo you post and a photo you delete. {n} handles that pass without opening an editor.",
    "The line a good retouch walks is restraint. Removing a temporary spot is invisible; smoothing skin until it has no pores is obvious to everyone and flattering to nobody. This tool is tuned to keep skin texture, real pores and the asymmetry that makes a face look like a face, and to fix only what was genuinely wrong in the frame.",
    "Upload the photo, pick what needs fixing, and download. Each pass costs {cost} credits from a one-time pack, which means fixing a set of photos one at a time is affordable rather than a project.",
  ],
  leadAlt: [
    "Retouching has a reputation problem, and it is deserved — most automatic tools smooth skin into plastic and call it enhancement. {n} is built on the opposite assumption: the best retouch is the one nobody can point at.",
    "Almost every photo that gets deleted is technically fixable. A colour cast from office lighting, a shine across the forehead from a flash, one temporary blemish the eye goes straight to. None of those are problems with the subject; they are problems with the room, and rooms are fixable.",
    "The professional version of this work is called a beauty pass, it takes a skilled retoucher ten to thirty minutes an image, and it consists almost entirely of restraint. Knowing what to leave alone is the craft, and it is what the conservative defaults here are trying to encode.",
  ],
  howTo: [
    { t: "Upload the photo", d: "Any JPG, PNG or WEBP. The more resolution the original has, the more the retouch has to work with — detail cannot be invented from a heavily compressed file." },
    { t: "Choose the fix", d: "Pick the correction you need, or describe it in a sentence. Being specific about what to change, and what to leave alone, is most of the skill." },
    { t: "Compare, then download", d: "Check the original against the result at full size before you commit. Download is full resolution, no watermark." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Skin texture survives", d: "Pores, fine lines and natural variation are kept. The plastic look comes from tools that treat skin as a surface to blur; this one treats it as skin." },
    { t: "Identity untouched", d: "Nothing about bone structure, eye shape, nose or jawline is reshaped. The photo is corrected, not the person in it." },
    { t: "Fixes what the camera got wrong", d: "Colour casts, uneven exposure, flash shine, red eye, harsh shadow — the failures of the room and the lens rather than of the subject." },
    { t: "Restrained by default", d: "Over-retouching is the most common mistake in the category. The defaults are deliberately conservative." },
    { t: "Consistent across a set", d: "Apply the same correction to every photo from one event so the whole set matches rather than each frame looking individually processed." },
    { t: "No editor to learn", d: "No frequency separation, no dodge and burn, no masks. The pass that takes an experienced retoucher ten minutes takes a sentence." },
    { t: "Full resolution out", d: "The download is not a downscaled preview. It goes straight into a print, a listing or a profile." },
    { t: "Reversible, because you keep the original", d: "Nothing is overwritten. If a correction goes too far, the original is still on your device." },
  ],
  builtHeading: "{n} for the fixes that actually come up",
  builtSub: "Most retouching is a handful of recurring problems. Each one has a specific fix rather than a general \"enhance\" slider.",
  built: [
    { t: "Portraits and profile photos", d: "Temporary blemishes, shine, stray hair and flash red-eye — the four things that stop an otherwise good photo of a person being usable." },
    { t: "Colour and exposure correction", d: "Fluorescent green, tungsten orange, a flat grey day. Getting the white balance right fixes photos people assume are unfixable." },
    { t: "Event and group photos", d: "One consistent pass across a whole set, so the album reads as a single shoot." },
    { t: "Product and listing photos", d: "Dust, fingerprints, glare and colour accuracy, which is what marketplace returns are usually argued over." },
    { t: "Old scans and phone photos", d: "Grain, noise and compression artefacts reduced without smearing away the detail that was actually captured." },
    { t: "Before-and-after documentation", d: "Fitness, dental, cosmetic and renovation photos, where matching the lighting between two frames is the whole job." },
  ],
  benefits: [
    { t: "Seconds instead of a session in an editor", d: "The routine pass that makes a photo presentable, without the software or the hour." },
    { t: "No plastic-skin look", d: "The most common complaint about automatic retouching, and the specific thing the defaults are tuned against." },
    { t: "Cheap enough for a whole set", d: "A pack starts at $2, so fixing every photo from an event is realistic rather than something you do to one and give up on." },
    { t: "Nothing to install", d: "Works on a phone as readily as a laptop." },
    { t: "Predictable results", d: "A named fix does the named thing. There is no single mystery \"enhance\" button doing five things at once." },
    { t: "Print and marketplace ready", d: "Full resolution with no watermark, which is what a listing or a printer actually needs." },
    { t: "Credits never expire", d: "Buy once, use them whenever the next batch of photos turns up." },
  ],
  useCases: [
    { t: "A profile photo with one distracting spot", d: "The single most common reason a good photo of someone goes unused." },
    { t: "Indoor photos with a colour cast", d: "Office and restaurant lighting turns skin green or orange. Correcting the white balance rescues photos people had written off." },
    { t: "Flash portraits", d: "Direct flash produces shine, harsh shadow behind the head and red eye, all at once." },
    { t: "Marketplace listings", d: "Clean, colour-accurate product photos convert better and get disputed less." },
    { t: "Event albums", d: "Hundreds of frames from one room, all needing the same correction rather than individual attention." },
    { t: "Dating profiles", d: "Corrected colour and exposure, without the smoothing that reads instantly as filtered." },
    { t: "Documentation and comparison photos", d: "Two photos matched for light and colour so the difference between them is the actual subject." },
    { t: "Older phone photos", d: "Noise and compression from an earlier phone, cleaned up enough to print." },
  ],
  promptIntro: "Name the specific problem and, just as importantly, say what to leave alone. Retouching prompts fail by being too broad — \"make it better\" invites the model to change things you were happy with.",
  prompts: [
    { t: "Name the flaw, not the mood", d: "\"Remove the spot on the left cheek\" beats \"clean up the face\", which is an invitation to smooth everything." },
    { t: "Say what to preserve", d: "\"Keep skin texture and pores\" is the single most useful phrase in a retouching prompt." },
    { t: "Fix light and colour separately", d: "\"Correct the green fluorescent cast\" and \"lift the shadow on the right side\" are two different jobs; asking for both at once gives you a compromise." },
    { t: "Be explicit about limits", d: "\"Do not change face shape, do not slim anything, do not whiten teeth\" prevents the drift towards a generic beauty look." },
    { t: "Point at the area", d: "Left, right, background, foreground, upper third. A location narrows the edit enormously." },
    { t: "Ask for realism", d: "\"Keep it looking like an unretouched photograph\" pulls the result back when a style is creeping in." },
    { t: "Handle noise carefully", d: "\"Reduce noise but keep fine detail in the hair and fabric\" avoids the smeared look of aggressive denoising." },
    { t: "One change per run", d: "Fix one thing, look at it, then fix the next. Stacked instructions are where retouching goes wrong." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Start from the largest, least compressed version of the photo you have — a screenshot of a photo has already lost what the retouch needs.",
    "Fix one thing per run and check it at full size before moving on.",
    "Always add \"keep skin texture\" for anything involving a face.",
    "Correct colour before anything else. A cast makes every other judgement unreliable.",
    "Resist stacking: two conservative passes look better than one aggressive one.",
    "For a set of photos, use the same instruction on every frame so the album stays consistent.",
    "Zoom in on eyes, teeth, hair edges and hands — the first places over-processing shows.",
    "If the result looks smoothed, say so explicitly in the next run and ask for less.",
    "Keep the original. Retouching from an already-retouched file compounds the artefacts.",
    "Do not expect detail to appear that the camera never recorded; a blurred photo can be sharpened, not reconstructed.",
    "For documentation photos, match the light between frames rather than perfecting either one alone.",
  ],
  faq: [
    { q: "Will my skin end up looking artificial?", a: "That is the specific failure this is tuned against. Pores, fine lines and natural variation are preserved, and the defaults are deliberately conservative. If a result still looks smoothed, say \"keep skin texture and pores, apply less smoothing\" and run it again — the second pass usually lands where you wanted." },
    { q: "Does it change my face shape or body?", a: "No. Bone structure, face shape and body proportions are left alone. It corrects the photograph — lighting, colour, blemishes, noise — rather than editing the person in it." },
    { q: "Can it rescue a blurred or very dark photo?", a: "Partly. Sharpening, denoising and exposure correction all work on detail that is present but obscured. Detail the sensor never recorded cannot be recovered — a genuinely out-of-focus photo can be improved but not made sharp." },
    { q: "Can I use it on a whole set of photos?", a: `Yes, one at a time, using the same instruction on each so the set stays consistent. Each pass costs ${CREDIT_COST} credits, and packs start at $2 with credits that never expire. For bulk mechanical work — resize, compress, convert, watermark — the free batch editor handles many files at once.` },
  ],
};

const restore: Bank = {
  lead: [
    "Photographic prints fail in predictable ways. The emulsion cracks along a fold, silver-based blacks fade to brown, colour dyes from the 1970s shift magenta, and anything stored in a loft gains water stains and a curl that cannot be flattened. {n} addresses that damage from a phone photo or a flatbed scan of the print.",
    "Restoration is not enhancement. The goal is to return the photograph to what it looked like when it was made — repairing physical damage, correcting the shift in the dyes, recovering detail the fading has buried — without inventing a new photograph. Where damage has destroyed information completely, plausible reconstruction is the honest description of what happens, and it is worth knowing which parts of a result are recovery and which are inference.",
    "Each restoration costs {cost} credits from a one-time pack. Working through a box of family prints one at a time is affordable, and the originals stay exactly as they are — nothing is overwritten.",
  ],
  leadAlt: [
    "Photographic prints are chemistry, and chemistry has a shelf life. Dyes shift, silver tarnishes, gelatine cracks, and damp does the rest. Most family boxes hold photographs that are twenty years from being unreadable. {n} is for the ones still legible enough to work from.",
    "There is an important distinction between restoration and improvement, and it is worth holding onto. Restoration returns a photograph to what it looked like when it was made; improvement makes a nicer picture. Where damage destroyed information entirely, what fills the gap is inference, and it should be recognised as such.",
    "The practical bottleneck is almost never the model — it is the scan. A 600 dpi flatbed scan of a print, taken out from behind glass, gives a result that a phone photo shot at an angle in a lit room cannot approach, however good the restoration is.",
  ],
  howTo: [
    { t: "Scan or photograph the print", d: "A flatbed scan at 600 dpi is ideal. A phone photo works: lay the print flat, use indirect daylight, avoid your own shadow and any glare from the surface." },
    { t: "Choose the repair", d: "Repair damage, correct faded colour, colourise a black-and-white original, or describe what the photo needs in a sentence." },
    { t: "Compare and download", d: "Check the result against the scan at full size, then download at full resolution. Keep both — the scan is the document, the restoration is the reading of it." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Physical damage repaired", d: "Cracks, tears, creases, scratches and missing corners reconstructed from the surrounding image rather than blurred over." },
    { t: "Faded colour corrected", d: "The characteristic magenta and yellow shifts of ageing colour film are reversed, which recovers photos that look beyond saving." },
    { t: "Detail brought back out", d: "Contrast that has flattened over decades is restored, and detail buried in dense shadow or a washed highlight is recovered." },
    { t: "Faces treated with care", d: "The face is the reason the photo is being restored. Features are reconstructed conservatively rather than replaced with a generic plausible face." },
    { t: "Grain and noise handled properly", d: "Film grain is reduced without smearing away the fine detail that sits at the same scale — the usual failure of automatic denoising." },
    { t: "Colourisation available", d: "Black-and-white originals can be colourised with period-plausible tones, and the monochrome version is still there afterwards." },
    { t: "Print-ready resolution", d: "Enough resolution to reprint and frame, which is what most people restoring a photo intend to do with it." },
    { t: "The original is never altered", d: "Your scan stays on your device untouched. The restoration is a separate file." },
  ],
  builtHeading: "{n} for the damage prints actually have",
  builtSub: "Different decades fail differently. A 1940s silver print, a 1975 colour snapshot and a 1998 disposable-camera photo each need a different repair.",
  built: [
    { t: "Torn and creased prints", d: "Fold lines, corner losses and surface scratches from decades in an envelope or an album." },
    { t: "Faded colour from the 60s to the 80s", d: "Dye layers fade at different rates, which is why these photos go magenta. Reversing the shift is the single biggest improvement available." },
    { t: "Black-and-white originals", d: "Contrast restored, dust and scratches removed, and colourisation offered as an option rather than forced on you." },
    { t: "Water and mould damage", d: "Staining and bloom from damp storage, which is what loft and basement boxes almost always produce." },
    { t: "Very small or low-resolution scans", d: "Photos that exist now only as a small digital copy, sharpened and enlarged as far as the data honestly allows." },
    { t: "Damaged group and wedding photos", d: "Often the only surviving image of several people, which makes conservative face reconstruction the priority." },
  ],
  benefits: [
    { t: "No specialist to find or pay", d: "Professional photo restoration runs from $20 to well over $100 per image and takes days. This is a minute and a couple of credits." },
    { t: "Work through a whole box", d: "Because the per-photo cost is small, restoring forty prints is a realistic weekend rather than a commission." },
    { t: "Nothing is risked", d: "The print is never handled beyond being scanned, and the digital original is not modified." },
    { t: "Reprintable output", d: "Resolution sufficient to reprint at a useful size and frame it." },
    { t: "Shareable with family immediately", d: "The usual reason for restoring a photo is to send it to relatives who have never seen it clearly." },
    { t: "Colour and monochrome versions", d: "Colourise for impact, keep the monochrome for accuracy. There is no need to choose one." },
    { t: "No subscription", d: "A one-time credit pack, credits that never expire, and no renewal." },
  ],
  useCases: [
    { t: "Family photos from a loft box", d: "The most common case by a wide margin: a shoebox of prints nobody has looked at in twenty years." },
    { t: "A single surviving photo of a relative", d: "Where the photograph is the only image that exists of someone, restoration is worth doing carefully." },
    { t: "Funeral and memorial displays", d: "Usually needed at short notice, from whatever print the family can find." },
    { t: "Anniversary and birthday gifts", d: "A restored and reprinted wedding photo is a better gift than almost anything bought new." },
    { t: "Genealogy and family archives", d: "Restored images attached to a family tree, alongside the unaltered scans." },
    { t: "Local history and archive projects", d: "Faded documentary photographs made legible for display or publication." },
    { t: "Damaged wedding albums", d: "Albums from the 70s and 80s where the adhesive pages have discoloured the prints themselves." },
    { t: "Reprinting for a frame", d: "A restored file at print resolution, sent to any printing service." },
  ],
  promptIntro: "Describe the damage you can see and say what must not change. Restoration prompts fail when they are ambitious — asking for a photo to be \"improved\" invites the model to make a new one.",
  prompts: [
    { t: "Name the damage", d: "\"Repair the vertical crease through the left side\" is far more effective than \"fix this old photo\"." },
    { t: "Describe the colour shift", d: "\"Remove the magenta cast from faded colour film and restore neutral skin tones\" names the actual chemistry of the problem." },
    { t: "Protect the faces", d: "\"Reconstruct conservatively and keep the faces exactly as they are\" is the most important line in any family restoration." },
    { t: "Say whether to colourise", d: "\"Keep it black and white\" or \"colourise with natural period-appropriate tones\" — leaving it unsaid means the model decides." },
    { t: "Ask for era-plausible colour", d: "\"1950s colour palette, muted, no modern saturation\" avoids a restoration that looks like a photo taken last year." },
    { t: "Address grain deliberately", d: "\"Reduce grain but keep detail in the fabric and hair\" gets a better result than asking for it to be removed." },
    { t: "Mention the background separately", d: "\"Repair the water stain in the upper right of the background\" isolates a fix that would otherwise affect the whole frame." },
    { t: "One area at a time", d: "Repair the worst damage first, look at the result, then address the next. Compound requests compound the errors." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Scan at 600 dpi if you can. A good scan is the single biggest factor in the result, ahead of anything in the prompt.",
    "Photographing a print works: lay it flat, use indirect daylight, and keep your shadow and any glare out of the frame.",
    "Remove the print from behind glass before scanning — reflections are read as part of the image.",
    "Crop to the photograph itself, not the album page or the mount around it.",
    "Do one repair at a time and check each result at full size.",
    "Always say \"keep the faces as they are\" for family photos. Faces are where invention is least welcome.",
    "For faded colour, correct the cast before attempting anything else.",
    "Keep the unaltered scan permanently. It is the actual document; the restoration is an interpretation.",
    "Expect plausible reconstruction where damage destroyed detail, and look closely before treating those areas as recovered fact.",
    "For badly damaged photos, two conservative passes beat one aggressive one.",
    "If a face comes back wrong, re-run rather than accept it — variation between runs is significant on damaged sources.",
  ],
  faq: [
    { q: "Can it repair a photo that is torn or has a missing corner?", a: "Yes. Tears, creases, scratches and missing areas are reconstructed from the surrounding image. Where the damage removed information entirely, the fill is plausible reconstruction rather than recovery — so look closely at those areas before treating them as a record of what was there." },
    { q: "Will it change the faces?", a: "It is tuned to reconstruct faces conservatively, and adding \"keep the faces exactly as they are\" to the prompt reinforces that. On heavily damaged faces some interpretation is unavoidable; if a result does not look like the person, run it again, because variation between runs on damaged sources is significant." },
    { q: "Should I colourise, or keep it black and white?", a: "Both — they are separate runs and nothing is overwritten. Colourisation makes an old photo feel immediate and is what most people share. The monochrome version is the accurate one. Keeping both is the usual answer." },
    { q: "How should I scan the print?", a: "A flatbed scan at 600 dpi, print taken out from behind any glass, cropped to the photograph itself. A phone photo is a perfectly good substitute if the print is flat, the light is indirect daylight and there is no glare or shadow across it." },
  ],
};

const background: Bank = {
  lead: [
    "The background is usually the reason a photo cannot be used. The subject is fine; behind it is a cluttered room, a car park, or a wall in the wrong colour. {n} replaces what is behind the subject without touching the subject itself.",
    "The part that decides whether this looks real is the edge. Hair, fur, fabric, glass and anything semi-transparent are where cheap cutouts fail — a halo of the old background, or a jaw line that has been shaved flat. Matching the light is the second half: a subject lit from the left, dropped onto a background lit from the right, reads as wrong even to someone who cannot say why.",
    "Upload, choose a background or describe one, and download. Transparent PNG is available for anything that needs to be composited later. Each generation costs {cost} credits from a one-time pack.",
  ],
  leadAlt: [
    "Ask a small seller what stops them listing and a surprising number will say the background. The product is fine, the photo is sharp, and behind it is a kitchen. {n} is the two-second version of a job that otherwise needs an editor and an hour.",
    "The tell in a bad cutout is always the same: a faint halo of the old background around the hair, or an outline where fine detail has been simplified into a curve. Edge quality is the entire discipline, and it is where careless tools and careful ones diverge.",
    "The second half of the job is light. A subject lit from the left, placed on a background lit from the right, looks wrong to everyone and almost nobody can say why. Matching direction and colour temperature is what makes a replacement read as a photograph rather than a composite.",
  ],
  howTo: [
    { t: "Upload the image", d: "JPG, PNG or WEBP. A subject that is reasonably separated from what is behind it gives the cleanest edge — a dark jacket against a dark wall is the hardest case." },
    { t: "Pick a background", d: "Transparent, plain white, studio, office, outdoor, gradient or a described scene. Transparent is the right answer whenever the image is going into another layout." },
    { t: "Download", d: "PNG with real alpha for transparent results, or a flattened image for a replaced scene. Full resolution, no watermark." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Edges that hold up", d: "Hair, fur, fabric weave and glass are the test of a cutout. Fine detail is kept instead of being simplified into a smooth outline." },
    { t: "Real transparency", d: "A genuine alpha channel, not white pixels pretending to be transparent — which is what breaks a logo placed on a coloured page." },
    { t: "Lighting matched to the new scene", d: "Light direction and colour temperature on the subject are adapted to the replacement background, which is what stops a composite looking pasted." },
    { t: "Contact shadows", d: "A subject with no shadow floats. A soft contact shadow is what makes a product look like it is sitting on a surface." },
    { t: "Marketplace-ready white", d: "Pure #FFFFFF with the subject centred and evenly margined, which is what Amazon and most marketplaces actually require of a main image." },
    { t: "Described scenes, not a stock list", d: "Ask for a specific setting and get it, rather than choosing from twelve preset backdrops that nearly fit." },
    { t: "Any subject", d: "People, products, pets, vehicles, furniture, documents. The approach is the same; only the edge difficulty changes." },
    { t: "Full resolution", d: "The download is not a downscaled preview, so it works in print as well as on a listing." },
  ],
  builtHeading: "{n} for every background problem",
  builtSub: "Removing a background and replacing one are different jobs with different failure modes. Both are here, along with the awkward cases in between.",
  built: [
    { t: "Transparent PNGs", d: "For logos, signatures, product cutouts and anything being placed into a design where the page colour has to show through." },
    { t: "Plain white for listings", d: "Marketplace compliance, with even margins and a soft contact shadow so the product does not look cut out." },
    { t: "Studio backdrops", d: "Seamless grey, dark gradient or a coloured sweep, with lighting to match — a studio look without the studio." },
    { t: "Office and professional settings", d: "A softly defocused workplace behind a portrait, for headshots and team pages." },
    { t: "Outdoor and lifestyle scenes", d: "Real environments with depth behind the subject, for product and lifestyle photography." },
    { t: "Described custom scenes", d: "Anything you can specify in a sentence, matched for light and perspective to the subject you uploaded." },
  ],
  benefits: [
    { t: "Seconds, not a manual selection", d: "Hand-masking hair in an editor is a slow, skilled job. This is an upload and a click." },
    { t: "No editor and no skill required", d: "No pen tool, no refine edge, no channel masks." },
    { t: "One subject, many backgrounds", d: "Generate the same product on white, on marble and in a lifestyle scene for the price of three credits' worth." },
    { t: "Consistent across a catalogue", d: "The same background applied to every product so a listing page looks like one shoot." },
    { t: "Real alpha, so it composites properly", d: "The output drops into a design tool or a web page without a white box around it." },
    { t: "Works on hard edges", d: "Hair, fur, foliage and transparency are the cases most tools quietly fail at." },
    { t: "Credits never expire", d: "Buy a pack once and use it whenever the next batch of photos needs it." },
  ],
  useCases: [
    { t: "Product photos for a marketplace", d: "Amazon, Shopify, Etsy and Flipkart all specify a plain white main image, and rejections for background are common." },
    { t: "Headshots taken in the wrong room", d: "A good portrait ruined by a kitchen behind it, fixed in one pass." },
    { t: "Logos and signatures", d: "A scanned signature or a logo on white, converted into a transparent PNG that works on any page colour." },
    { t: "Team and About pages", d: "Photos taken in a dozen different rooms unified onto one background." },
    { t: "Property and interior listings", d: "Cleaner, less distracting backgrounds behind the detail being sold." },
    { t: "Social and ad creative", d: "The same subject dropped into several scenes for A/B testing without reshooting anything." },
    { t: "Passport and ID photos", d: "The plain background with no shadow behind the head that ID photos are most often rejected for." },
    { t: "Second-hand and resale listings", d: "A clean background makes a used item look cared for, which is most of what a resale photo is doing." },
  ],
  promptIntro: "For a described background, specify the scene, the light and the perspective. The light is the part people forget, and it is the part that makes a composite convincing.",
  prompts: [
    { t: "Name the surface and the setting", d: "\"White marble surface, soft grey wall behind\" is specific. \"Nice background\" is not." },
    { t: "Say where the light comes from", d: "\"Soft light from the upper left\" — and match it to the subject, or the composite will read as wrong." },
    { t: "Ask for the contact shadow", d: "\"Soft contact shadow under the product\" is the difference between sitting on a surface and floating above one." },
    { t: "Set the depth", d: "\"Background blurred, shallow depth of field\" separates the subject; \"everything in focus\" suits catalogue work." },
    { t: "Specify pure white when it is required", d: "\"Pure white #FFFFFF, no gradient\" for marketplace images — \"white\" alone often comes back very slightly grey." },
    { t: "Protect the edges", d: "\"Preserve fine hair detail and any transparency\" helps on the genuinely hard subjects." },
    { t: "Keep the subject untouched", d: "\"Do not change the subject, only the background\" prevents drift in the thing you were happy with." },
    { t: "Leave room for text", d: "\"Empty space on the right third\" if the image is going into an ad or a banner with a headline on it." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Good separation in the original helps most — a subject that contrasts with what is behind it gives a cleaner edge.",
    "Even lighting on the subject produces a better cutout than harsh directional light.",
    "For transparency, download PNG. JPG cannot carry an alpha channel at all.",
    "State \"pure white #FFFFFF\" for marketplace images; a near-white background is a common rejection.",
    "Ask for the contact shadow on any product shot — without it the product looks stuck on.",
    "Match the light direction between subject and background, or the result will look wrong for reasons viewers cannot articulate.",
    "Check hair, fur and glass edges at full size before using the result.",
    "For a catalogue, use one background description across every product.",
    "Start from the highest-resolution original you have; edge quality depends directly on it.",
    "If an edge is halo-ing, say \"remove any fringe of the original background from the edges\" and run again.",
    "Keep the transparent PNG as your master — you can place it on any background later without redoing the cutout.",
  ],
  faq: [
    { q: "Do I get a real transparent PNG?", a: "Yes — a genuine alpha channel, so the image can sit on any page colour without a white box around it. Download as PNG; JPG cannot store transparency, which is the usual cause of a \"transparent\" file that turns out not to be." },
    { q: "How well does it handle hair and fur?", a: "Fine detail is preserved rather than simplified into a smooth outline, which is the main difference from a quick automatic cutout. The hardest case is low contrast — dark hair against a dark background — so a source photo with reasonable separation gives a noticeably cleaner edge." },
    { q: "Will the result meet Amazon's white-background requirement?", a: "Ask for pure white #FFFFFF with the product centred and evenly margined, and it will match the specification. Say \"pure white\" explicitly: a generic \"white background\" often comes back very slightly grey, which is a common rejection." },
    { q: "Can it replace the background instead of just removing it?", a: `Yes, and that is the more useful mode. Choose a preset scene or describe one, and the subject's lighting is adapted to the new background so the composite holds together. Each run costs ${CREDIT_COST} credits.` },
  ],
};

const remove: Bank = {
  lead: [
    "Every photo has something in it that should not be there. A stranger walking through the frame, a bin at the edge, a watermark across the middle, a date stamp burned in by a camera in 2004. {n} takes it out and fills what was behind it.",
    "Filling is the hard part. Erasing an object is trivial; reconstructing the wall, the pavement or the sky that was behind it so that nobody can tell is not. The reconstruction has to continue the lines, textures and lighting of the surroundings, which is why a repeating background like a wall is easy and a busy foreground is not.",
    "Each removal costs {cost} credits from a one-time pack, and the original is never modified. Removing three separate objects one at a time is usually better than asking for all three at once.",
  ],
  leadAlt: [
    "Somewhere in every camera roll is a photo that would be the best one of the trip if a stranger had not walked into it. {n} exists for that photo, and for the bin at the edge of the frame, and for the date stamp a 2003 camera burned into the corner.",
    "Erasing is easy; filling is not. The difficulty of a removal is decided almost entirely by what was behind the thing being removed. A wall, a sky, grass or pavement fills invisibly because the pattern continues. A face, a sign or a unique object does not, and the fill becomes an educated guess.",
    "Property photography is where this pays for itself fastest. Bins, cables, cars and clutter are what make a room read as lived-in rather than for sale, and removing them is most of what a property retoucher is actually paid to do.",
  ],
  howTo: [
    { t: "Upload the photo", d: "JPG, PNG or WEBP at the highest resolution you have. The fill is built from surrounding detail, so there needs to be surrounding detail to build from." },
    { t: "Say what to remove", d: "Name the object and where it is: \"the person on the right\", \"the watermark across the centre\", \"the bin in the bottom left\". Location does most of the work." },
    { t: "Check the fill, then download", d: "Look at the filled area at full size before using it. Full resolution out, no watermark added." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "The fill continues the scene", d: "Walls keep their texture, pavements keep their lines, skies keep their gradient. The area is reconstructed rather than smudged." },
    { t: "Anything can go", d: "People, vehicles, bins, signs, poles, reflections, text, watermarks, timestamps, logos and stickers." },
    { t: "Text and watermarks handled properly", d: "Overlaid text sits on top of real detail, so removing it means rebuilding what was underneath rather than painting over it." },
    { t: "Edges and shadows go too", d: "An object's shadow is part of the object. Leaving the shadow behind is the most common giveaway of a bad removal." },
    { t: "No manual selection", d: "No lasso, no clone stamp, no patch tool. Name the thing and where it is." },
    { t: "Precise targeting", d: "Because the instruction names a location, you can remove one person from a group of four without touching the other three." },
    { t: "Full resolution output", d: "The removal is applied at the original size, not to a downscaled preview that then gets enlarged." },
    { t: "Non-destructive", d: "The original file stays on your device. Every removal is a new image." },
  ],
  builtHeading: "{n} for the things that ruin otherwise good photos",
  builtSub: "Most unwanted objects fall into a few recurring categories, and each has its own difficulty.",
  built: [
    { t: "People in the background", d: "Tourists, passers-by and anyone who walked into the shot at the wrong moment — the single most common request." },
    { t: "Watermarks and stamps", d: "Logos, signatures and semi-transparent overlays that sit across real image detail." },
    { t: "Date and time stamps", d: "Burned-in camera text, usually orange, usually in a corner, usually on the photos you most want to keep." },
    { t: "Street clutter", d: "Bins, cones, signs, poles, cables and parked cars, which is what property and travel photos are mostly cluttered by." },
    { t: "Objects and clutter indoors", d: "Cables, chargers, laundry and anything on a surface that should be clear — the staple of property photography." },
    { t: "Reflections and glare", d: "A flash bouncing off glass or a window reflecting the photographer, the hardest case because there are two images overlapped." },
  ],
  benefits: [
    { t: "Faster than any manual method", d: "A clone-stamp repair on a complex background is slow and skilled work. This is a sentence." },
    { t: "No editing skill needed", d: "The skill in manual removal is entirely in the selection and the patching. Both are handled." },
    { t: "Cheap enough to iterate", d: "A pack starts at $2, so removing one object, checking, and removing the next is a sensible workflow." },
    { t: "Works on any subject", d: "Portraits, property, product, landscape and document photos all behave the same way." },
    { t: "Print-ready result", d: "Full resolution with no watermark, ready for a listing or a print." },
    { t: "Nothing installed", d: "It works on a phone or a laptop." },
    { t: "Credits do not expire", d: "One purchase, used whenever a photo needs it." },
  ],
  useCases: [
    { t: "Holiday photos full of strangers", d: "The landmark shot with six people in it, which is every landmark shot." },
    { t: "Property listings", d: "Bins, cars, cables and clutter removed so the room or the building is what the photo is about." },
    { t: "Old photos with date stamps", d: "Burned-in camera text removed from prints from the 90s and 2000s." },
    { t: "Product photos with distractions", d: "Reflections, stray cables, price stickers and anything else that ended up in frame." },
    { t: "Group photos with one person to remove", d: "Common after a change in circumstances, and usually the only copy of that photo." },
    { t: "Documents and screenshots", d: "Removing a stamp, a label or an overlay from an image of a document you have the rights to." },
    { t: "Event photos with signage", d: "Sponsor boards, exit signs and temporary notices taken out of the background." },
    { t: "Vehicle listings", d: "Licence plates and street clutter removed before a car or bike is listed publicly." },
  ],
  promptIntro: "Name the object and its position, and remove one thing per run. A list of five removals in one instruction produces one mediocre result instead of five good ones.",
  prompts: [
    { t: "Name the object and where it is", d: "\"Remove the person standing on the right edge\" gives the model an unambiguous target." },
    { t: "Say what should be there instead", d: "\"Fill with the brick wall that continues behind\" is far more reliable than leaving the fill open to interpretation." },
    { t: "Remember the shadow", d: "\"Remove the object and its shadow on the floor\" — a leftover shadow is what makes a removal obvious." },
    { t: "One object per run", d: "Remove, look, repeat. Batched removals degrade every fill in the instruction." },
    { t: "Protect the subject", d: "\"Do not change the person in the foreground\" keeps the edit confined to the background." },
    { t: "Be specific about text", d: "\"Remove the orange date stamp in the bottom right corner\" leaves nothing to guess at." },
    { t: "Describe the texture to rebuild", d: "\"Continue the wood grain\" or \"continue the sky gradient\" tells the fill what pattern it is completing." },
    { t: "Say if something must stay", d: "\"Keep the reflection in the window\" prevents the model tidying away something you wanted." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Remove one object at a time and check each fill at full size before the next.",
    "Objects on a simple, repeating background — wall, sky, grass, pavement — fill almost perfectly.",
    "An object overlapping the main subject is the hardest case, because the fill has to rebuild part of the subject too.",
    "Always ask for the shadow as well as the object.",
    "Say what should be behind it. The fill is much more accurate when it is told what it is completing.",
    "Start from the largest version of the photo you have; the fill is built from surrounding pixels.",
    "For watermarks over faces or fine detail, expect reconstruction rather than exact recovery, and inspect it closely.",
    "If a fill comes back smeared, name the texture explicitly and run it again.",
    "Only remove watermarks from images you have the rights to use — removing one does not grant a licence.",
    "For repeated clutter, work outside in: largest object first, then the smaller ones.",
    "Keep the original. Each removal should start from the cleanest available file.",
  ],
  faq: [
    { q: "How does it know what was behind the object?", a: "It reconstructs the area from the surrounding image — continuing the wall, pavement, sky or fabric that runs behind it. On a simple repeating background the result is effectively invisible. Where the object covered something unique, the fill is a plausible reconstruction rather than a recovery of what was actually there, so inspect it at full size." },
    { q: "Can it remove a watermark, and is that allowed?", a: "Technically yes, including semi-transparent overlays and burned-in text, because it rebuilds the detail underneath rather than painting over it. Legally, removing a watermark does not give you a licence to use the image — do it on photos you own or have the rights to, not on stock images you have not paid for." },
    { q: "Can I remove one person from a group without affecting the others?", a: "Yes. Name the position — \"the person on the far right\" — and the edit stays confined to that area. The hardest case is someone overlapping another person, because the fill then has to rebuild part of the person staying in the photo." },
    { q: "Why is my fill blurry or smeared?", a: `Usually one of three things: the source image is small or heavily compressed, several removals were asked for at once, or the fill was not told what texture to continue. Start from the largest original, remove one object per run, and name the surface — "continue the brick wall". Each run costs ${CREDIT_COST} credits.` },
  ],
};

const enhance: Bank = {
  lead: [
    "Resolution is not a setting you can turn up. An image contains whatever detail the sensor recorded, and no more. What {n} does is different and more interesting: it reconstructs plausible detail at a larger size, informed by what images of that kind normally look like.",
    "That distinction matters because it sets expectations correctly. A slightly soft photo of a face at 800 pixels can become a convincing 3200-pixel photo, because the model has a strong prior for what skin, hair and eyes look like. A photo of text or a number plate cannot be recovered the same way — the model will produce confident, plausible, wrong characters. Enlarge photographs; do not enlarge evidence.",
    "Each enhancement costs {cost} credits from a one-time pack. For simple, honest enlargement with no reconstruction, the free upscaler is still available and costs nothing.",
  ],
  leadAlt: [
    "The word enhance has been ruined by television, where a technician types on a keyboard and a blurred reflection resolves into a face. {n} does something real but different: it reconstructs plausible detail at a larger size, using a strong sense of what images of that kind normally look like.",
    "The most useful thing to understand is where the technique is reliable and where it is not. Faces, skin, hair and fabric reconstruct convincingly, because there is a strong prior for how those look. Text, numbers and licence plates do not — the output is legible, confident and frequently wrong.",
    "The common case is mundane and worth solving: one good photo that only exists at the size a website served it, now wanted as a print. Interpolation just makes that softer as it grows, and reconstruction is what makes the larger size usable.",
  ],
  howTo: [
    { t: "Upload the image", d: "JPG, PNG or WEBP. Start from the largest, least compressed copy you have — a screenshot of a photo has already thrown away detail that cannot be brought back." },
    { t: "Choose the enhancement", d: "Upscale, sharpen, denoise or unblur. They are different operations with different failure modes, so pick the one that matches the actual problem." },
    { t: "Compare at full size, then download", d: "Judge the result at 100%, not zoomed out. Full resolution, no watermark." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Detail reconstructed, not interpolated", d: "Ordinary enlargement averages between existing pixels and gets softer. This generates plausible detail at the larger size." },
    { t: "Faces handled with a strong prior", d: "Skin texture, hair strands, eyelashes and iris detail are the areas where reconstruction is most convincing." },
    { t: "Noise reduced without smearing", d: "Grain and sensor noise sit at the same scale as fine detail, which is why aggressive denoising destroys texture. This separates the two." },
    { t: "Compression artefacts cleaned", d: "The blocky edges and colour banding of a heavily saved-and-resaved JPG are recognised as artefacts and removed." },
    { t: "Sharpening without halos", d: "Naive sharpening produces bright fringes along every edge. Reconstruction avoids the halo because it is not just raising local contrast." },
    { t: "Print sizes become possible", d: "A web-sized image enlarged enough to print at a useful size, which is the most common reason people need this." },
    { t: "Honest about limits", d: "Text, numbers and fine patterns are reconstructed as plausible rather than accurate. Knowing that is part of using the tool properly." },
    { t: "A free tier still exists", d: "The free upscaler handles straightforward enlargement and costs nothing." },
  ],
  builtHeading: "{n} for the images you actually need bigger",
  builtSub: "Softness, noise, compression and small size are four different problems. Treating them as one is why generic \"enhance\" buttons disappoint.",
  built: [
    { t: "Small web images", d: "Photos that only exist at the size a website served them, now needed larger." },
    { t: "Old phone photos", d: "A 2010 phone camera at 3 megapixels, enlarged for a print." },
    { t: "Scans and archive images", d: "Low-resolution scans made before anyone expected them to be used at size." },
    { t: "Noisy low-light photos", d: "High-ISO grain reduced without turning fabric and hair into a smooth blur." },
    { t: "Over-compressed files", d: "Images that have been sent through messaging apps repeatedly and carry the artefacts of every round trip." },
    { t: "Product images for print", d: "Listing photos taken at web resolution that a catalogue or a banner now needs." },
  ],
  benefits: [
    { t: "Rescues images you would otherwise abandon", d: "The common alternative is not using the photo at all." },
    { t: "Print becomes possible", d: "A file that was too small for anything but a thumbnail becomes usable at poster size." },
    { t: "Faster than any manual approach", d: "There is no manual approach that meaningfully adds detail — this is a different operation, not a faster one." },
    { t: "No software", d: "No desktop upscaler, no plugin, no queue." },
    { t: "Free option for the simple case", d: "If all you need is a clean 2× enlargement, the on-device tool does it at no cost." },
    { t: "No watermark", d: "Full resolution out, nothing overlaid." },
    { t: "Credits never expire", d: "Buy once; use them the next time an image is too small." },
  ],
  useCases: [
    { t: "Printing a photo that only exists small", d: "The most common case: one good photo, saved from a website or a chat, now wanted on a wall." },
    { t: "Enlarging old family photos", d: "Low-resolution scans made years ago, brought up to a printable size." },
    { t: "Product photos for print collateral", d: "Web-resolution listing images needed for a catalogue, a banner or packaging." },
    { t: "Restoring compressed images", d: "Photos degraded by repeated sharing, cleaned of the accumulated artefacts." },
    { t: "Low-light and event photos", d: "Grainy indoor shots denoised enough to be usable." },
    { t: "Profile photos that look soft", d: "A slightly blurred avatar sharpened without the halo edge that gives cheap sharpening away." },
    { t: "Art and design assets", d: "Small source images enlarged for use in a layout at print scale." },
    { t: "Screenshots for documentation", d: "Small UI captures enlarged enough to be legible in a document — with the caveat that any text in them is reconstructed, not recovered." },
  ],
  promptIntro: "Most of the work is choosing the right operation rather than writing a prompt. Where you can describe the intent, say what kind of image it is and what to protect.",
  prompts: [
    { t: "Say what kind of image it is", d: "\"Portrait photograph\" and \"product photograph on white\" pull very different reconstruction priors." },
    { t: "Name what to protect", d: "\"Keep skin texture and pores\" or \"keep fabric weave visible\" prevents the smoothed, plastic result." },
    { t: "Separate noise from detail", d: "\"Reduce noise but keep hair detail\" states the trade-off explicitly instead of letting the model choose." },
    { t: "Ask for no sharpening halos", d: "\"Sharpen without edge halos\" is worth saying, because halos are the default failure of sharpening." },
    { t: "Set the target use", d: "\"For printing at A3\" or \"for a web banner\" changes how much reconstruction is appropriate." },
    { t: "Flag any text", d: "\"There is text in the image — do not alter the characters\" limits confident invention, though text remains the weakest case." },
    { t: "Do not ask for style", d: "Enhancement should not restyle. If the result looks more saturated or contrasty than the original, say \"no stylisation, keep the original colour\"." },
    { t: "Go in one step", d: "Enhance once from the best original rather than enhancing an already-enhanced file, which compounds invented detail." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Always start from the largest, least compressed original available. Nothing else matters as much.",
    "Judge the result at 100% zoom. Everything looks better zoomed out.",
    "Pick the operation that matches the problem: upscaling will not fix noise, and denoising will not fix softness.",
    "Do not enhance an enhanced file. Go back to the original each time.",
    "Do not trust reconstructed text, numbers or licence plates — they are plausible, not accurate.",
    "For faces, ask explicitly for skin texture to be kept or the result can look waxy.",
    "A genuinely out-of-focus photo can be improved but not made sharp; motion blur is even harder.",
    "If the result looks over-processed, ask for a more conservative pass rather than accepting it.",
    "For simple 2× enlargement with no reconstruction, use the free on-device upscaler instead.",
    "Check hair, fabric and foliage: these are where reconstruction artefacts show first.",
    "Save the enhanced file separately. Keeping the original is what makes a second attempt possible.",
  ],
  faq: [
    { q: "Does it really add detail, or just make the file bigger?", a: "It reconstructs plausible detail at the larger size, which is genuinely different from interpolation — ordinary enlargement averages existing pixels and gets softer as it grows. The detail is inferred from what images of that kind normally look like, not recovered from the original, which is the right way to think about every result." },
    { q: "Can it recover text, a number plate or a small sign?", a: "No — and this is the one hard limit worth knowing. The model will produce confident, legible, plausible characters that are frequently wrong. Enhance photographs; never treat reconstructed text or numbers as a record of what was there." },
    { q: "How much larger can I go?", a: "It depends entirely on the original. A reasonably sharp image enlarges convincingly by 2× to 4×. A small, heavily compressed one starts inventing texture well before that. Judge it at 100% zoom rather than choosing a multiplier and trusting it." },
    { q: "Is there a free option?", a: `Yes. The free upscaler costs nothing and never stores your image, which is the right choice for straightforward enlargement. The credit-based version is for the harder cases — heavy noise, compression damage, or reconstruction at larger factors — and costs ${CREDIT_COST} credits a run.` },
  ],
};

const product: Bank = {
  lead: [
    "A product photoshoot is the cost most small sellers underestimate. A studio day runs into the hundreds before you count the samples couriered there and back, and it produces one set of images — which is a problem the first time a marketplace changes its requirements or a campaign needs a different background. {n} produces catalogue-ready images from a photo taken on a table.",
    "Commercial product photography is unglamorous and rule-bound. The main image usually has to be on pure white with the product filling most of the frame. The material has to read correctly, which means a specular highlight that describes whether something is matte, brushed or glossy. There has to be a contact shadow, or the product floats. Colour has to be accurate, because colour is what returns get argued about. Those constraints are the tool's actual brief.",
    "Upload the product shot, pick the background and lighting, and download. Each generation costs {cost} credits from a one-time pack, so producing a white version, a studio version and a lifestyle version of one product is a few cents' worth of credits rather than a second shoot.",
  ],
  leadAlt: [
    "Marketplace photography is a compliance exercise before it is a creative one. The main image has to be on pure white, the product has to fill most of the frame, and a rejection costs days. {n} is built to those rules rather than to a general idea of a nice photo.",
    "The detail that separates a real product shot from an obvious composite is the contact shadow — the small dark area where the object meets the surface. Without it the product hovers. It is the cheapest possible fix and the one most often missing.",
    "Material is the other half. A specular highlight is how a viewer knows whether something is matte plastic, brushed aluminium or glazed ceramic, all of which photograph completely differently. Naming the material is what makes the highlight correct, and the highlight is what sells the object.",
  ],
  howTo: [
    { t: "Photograph the product", d: "On a plain surface in soft daylight, shot square-on or at a consistent angle. Even a phone photo is enough — what matters is that the product is sharp and the whole of it is in frame." },
    { t: "Choose the setting", d: "White sweep, studio, lifestyle, marble, natural or gradient. White for the main listing image, the others for gallery shots and ads." },
    { t: "Generate and download", d: "Full resolution with no watermark, ready to upload to a listing or drop into a layout." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Marketplace-compliant main images", d: "Pure #FFFFFF, product centred with even margins, soft contact shadow — the specification Amazon, Flipkart and most marketplaces check against." },
    { t: "The material reads correctly", d: "A specular highlight is what tells a viewer whether something is matte plastic, brushed metal or glazed ceramic. Getting it wrong makes a product look fake." },
    { t: "Contact shadows", d: "The small dark area where the product meets the surface. Without it, the product appears to hover and the whole image looks composited." },
    { t: "Colour kept accurate", d: "Colour drift is the most expensive error in product photography, because it is what returns and complaints are about." },
    { t: "The product itself is not altered", d: "Shape, proportions, logos and labels are preserved. The lighting and the setting change; the thing you are selling does not." },
    { t: "Consistent across a catalogue", d: "One background and one lighting setup applied to every product, which is what makes a listing page look professional." },
    { t: "Lifestyle scenes without a location", d: "A styled surface with props defocused behind, generated rather than staged." },
    { t: "Any ratio a channel needs", d: "Square for listings, 4:5 for a feed, wide for a banner, all from the same source photo." },
  ],
  builtHeading: "{n} for every image a listing needs",
  builtSub: "A product needs more than one photo. The main image, the gallery, the ad creative and the banner all have different requirements.",
  built: [
    { t: "Main listing images", d: "Pure white, compliant margins, contact shadow. The image that has to pass validation before anything else matters." },
    { t: "Gallery and detail shots", d: "Studio backdrops and angles that show material, finish and scale." },
    { t: "Lifestyle and in-use scenes", d: "The product on a real surface in a real room, which is what converts once the listing has been opened." },
    { t: "Ad and social creative", d: "Backgrounds with deliberate empty space for a headline, in each platform's ratio." },
    { t: "Seasonal variants", d: "The same product restyled for a campaign without a reshoot." },
    { t: "Catalogue and print", d: "Full resolution for a printed catalogue, packaging insert or trade sheet." },
  ],
  benefits: [
    { t: "No studio and no courier", d: "The sample stays where it is. There is nothing to book and nothing to ship." },
    { t: "Cheap per image", d: "A pack starts at $2. A studio day starts in the hundreds and does not include revisions." },
    { t: "Same day, not next month", d: "New product photographed in the morning and listed in the afternoon." },
    { t: "Several backgrounds per product", d: "Test which background converts rather than committing to whatever the studio shot." },
    { t: "Consistent catalogue", d: "Every product on the same background, which no sequence of separate shoots ever quite achieves." },
    { t: "Works for one-off and second-hand items", d: "Resale listings get the same treatment as new stock, which is where the difference shows most." },
    { t: "No subscription", d: "Credits bought once, no renewal, nothing expiring." },
  ],
  useCases: [
    { t: "Amazon and marketplace listings", d: "The white main image, generated to specification rather than argued with after a rejection." },
    { t: "Shopify and Etsy stores", d: "A consistent catalogue look across products photographed weeks apart." },
    { t: "New product launches", d: "Photos ready before the sample has finished being unpacked." },
    { t: "Second-hand and resale", d: "A clean, well-lit image is most of what makes a used item look worth the asking price." },
    { t: "Jewellery and small items", d: "Where the specular highlight is the product — metal and stones live or die on the lighting." },
    { t: "Clothing and accessories", d: "Fabric texture and drape rendered so the material reads as what it is." },
    { t: "Food and drink", d: "Lighting that makes food look appetising rather than clinical, which is a genuinely different setup." },
    { t: "Wholesale and trade sheets", d: "Print-resolution product images for a catalogue or a line sheet." },
  ],
  promptIntro: "Describe the surface, the light and the shadow. Product prompts fail by being aspirational — \"premium look\" means nothing, while \"white marble, soft light from the upper left, soft contact shadow\" means exactly one thing.",
  prompts: [
    { t: "Name the surface", d: "\"White marble\", \"pale oak\", \"brushed concrete\", \"seamless white sweep\". The surface sets the whole character of the shot." },
    { t: "Specify pure white when required", d: "\"Pure white #FFFFFF background, no gradient\" for main listing images. Plain \"white\" often returns slightly grey." },
    { t: "Describe the light direction", d: "\"Soft light from the upper left with gentle fill on the right\" gives predictable, repeatable results across a catalogue." },
    { t: "Ask for the contact shadow", d: "\"Soft contact shadow beneath the product\" — the single most effective line in a product prompt." },
    { t: "Name the material", d: "\"Matte plastic\", \"brushed aluminium\", \"glossy ceramic\". This is what governs the highlight, and the highlight is what sells the material." },
    { t: "Keep labels readable", d: "\"Keep the label text and logo exactly as they are\" protects the part of the packaging that carries the brand." },
    { t: "Handle props explicitly", d: "\"One or two props, well out of focus behind\" for lifestyle shots; \"no props at all\" for the main image." },
    { t: "Leave room for a headline", d: "\"Empty space in the upper third\" when the image is going into an ad." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Photograph the product sharp, in soft daylight, on a plain surface. Everything downstream depends on this.",
    "Include the entire product in frame — a cropped edge cannot be reconstructed reliably.",
    "Shoot every product in a range from the same angle so the catalogue stays consistent.",
    "Say \"pure white #FFFFFF\" for any marketplace main image.",
    "Always request the contact shadow.",
    "Name the material so the highlight is right; this is what separates a real-looking product shot from a render.",
    "Check colour against the physical product before publishing — colour accuracy is what returns are about.",
    "Verify that label and logo text is unchanged and still legible.",
    "Generate the same product on two or three backgrounds and test which converts.",
    "Use the largest original you have; print collateral needs the resolution.",
    "Keep the original photograph as the master for every future variant.",
  ],
  faq: [
    { q: "Will the images meet Amazon's requirements?", a: "Ask for pure white #FFFFFF with the product centred and evenly margined and the result matches the main-image specification. Say \"pure white\" explicitly — a generic white background often comes back slightly grey, which is one of the most common rejection reasons. Marketplace rules change, so check the current requirements for your category." },
    { q: "Does it change the product itself?", a: "No. Shape, proportions, colour, logos and label text are preserved — what changes is the background, the lighting and the surface it sits on. Adding \"keep the label text and logo exactly as they are\" reinforces this on packaging with a lot of small print." },
    { q: "Can I get a consistent look across a whole catalogue?", a: "Yes, and it is the strongest reason to use this. Photograph everything from the same angle, then use one identical background and lighting description for every product. That consistency is what separate photoshoots never quite manage." },
    { q: "What about lifestyle shots, not just plain backgrounds?", a: `Supported — describe the surface and setting, and ask for one or two props well out of focus behind the product. Lifestyle images are what convert once a shopper has opened the listing, where the white image is what gets it accepted. Each generation costs ${CREDIT_COST} credits.` },
  ],
};

const social: Bank = {
  lead: [
    "Every platform wants a different shape, and getting it wrong is expensive in a way that is easy to miss. A square image on a vertical feed wastes half the screen. A banner sized for one platform gets its subject cropped out by another. A profile picture composed as a rectangle loses the top of someone's head the moment it is masked into a circle. {n} produces the right shape with the subject where it needs to be.",
    "The work is composition rather than decoration. Knowing that a circular avatar crops the corners, that a cover image is overlaid by a profile photo in the lower left, that a story has interface elements across the top and bottom — those constraints decide where the subject and any text can actually go. Producing the right pixel dimensions is the easy half.",
    "Upload, pick the platform and the shape, and download. Each generation costs {cost} credits from a one-time pack, so producing the same asset in four ratios is a few cents rather than an afternoon in a design tool.",
  ],
  leadAlt: [
    "Every platform crops differently, and each one crops in a way that is easy to forget until it has already happened. A rectangular avatar masked into a circle loses the top of someone's head. A cover photo has a profile picture sitting over one corner. {n} composes for the shape the image will actually appear in.",
    "The size that matters is the smallest one. Most feed images are seen first at a couple of hundred pixels, and many at forty. Anything depending on fine detail or low contrast simply disappears at that scale, which is why the strongest social images are almost always the simplest.",
    "The most common mistake is generating a beautiful full-bleed image and then discovering there is nowhere to put the headline. Reserving the empty space before generating, rather than hunting for it afterwards, is the whole trick.",
  ],
  howTo: [
    { t: "Upload your image", d: "JPG, PNG or WEBP. If the asset is going to be cropped several ways, start from the widest, highest-resolution version you have." },
    { t: "Choose the platform and shape", d: "Square, portrait, wide, circle-safe, bold or minimal. The choice sets the ratio and where the subject sits inside it." },
    { t: "Download and post", d: "Correct dimensions, full resolution, no watermark. It uploads without the platform re-cropping it for you." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Correct dimensions per platform", d: "The right ratio and pixel size, so the platform does not recompress and re-crop the image on upload." },
    { t: "Circle-safe composition", d: "Avatars are masked to circles almost everywhere. Composing for that keeps the head centred and the corners expendable." },
    { t: "Safe areas respected", d: "Cover images have a profile photo over one corner and buttons over another. The subject is placed clear of both." },
    { t: "Legible at thumbnail size", d: "Most feed images are first seen very small. High contrast and a simple focal point are what survive that." },
    { t: "Room left for text", d: "Deliberate empty space where a headline or caption goes, rather than a full-bleed image with nowhere to put type." },
    { t: "Consistent across a profile", d: "Avatar, banner and post images that read as one identity instead of three unrelated pictures." },
    { t: "One source, every shape", d: "Generate square, portrait, wide and circular versions from a single upload." },
    { t: "Full resolution", d: "Enough resolution that the platform's own compression does not visibly degrade it." },
  ],
  builtHeading: "{n} for every slot a profile has",
  builtSub: "A profile is a set of images with different jobs. Each one is cropped, masked and overlaid differently.",
  built: [
    { t: "Profile pictures and avatars", d: "Circle-safe, legible at 40 pixels, recognisable as the same person or brand across platforms." },
    { t: "Banners and cover images", d: "Wide, composed around the elements the platform lays over them." },
    { t: "Feed posts", d: "Square and 4:5, which is the ratio that occupies the most vertical space in most feeds." },
    { t: "Stories and reels covers", d: "9:16 with the top and bottom left clear of interface chrome." },
    { t: "Thumbnails", d: "High contrast, one clear focal point, and space for a short piece of large text." },
    { t: "Link previews and OG cards", d: "The 1200×630 card that appears whenever a link is shared anywhere." },
  ],
  benefits: [
    { t: "No design tool needed", d: "No canvas presets, no guides, no export settings to get wrong." },
    { t: "Every shape from one image", d: "Four ratios from one upload rather than four manual crops." },
    { t: "Nothing gets cropped away", d: "Composed for the target shape, so the platform has no reason to re-crop it." },
    { t: "Consistent identity", d: "Avatar, banner and posts that visibly belong to the same account." },
    { t: "Fast enough to keep up", d: "Social content is time-sensitive; this is minutes, not an afternoon." },
    { t: "No watermark", d: "Nothing overlaid, at full resolution." },
    { t: "Credits never expire", d: "One purchase, used whenever the next post needs an image." },
  ],
  useCases: [
    { t: "A new profile photo across every platform", d: "One portrait, composed correctly for a circular avatar, a square post and a wide banner." },
    { t: "Channel and page branding", d: "Banner, avatar and thumbnail that read as one identity." },
    { t: "Video thumbnails", d: "The image that determines whether a video is clicked, with space for a few large words." },
    { t: "Event and launch announcements", d: "The same announcement in every ratio each platform needs." },
    { t: "Link preview cards", d: "The image that shows up when a page is shared, which is often the first thing anyone sees of a site." },
    { t: "Ad creative variants", d: "Several ratios and crops of one concept, for testing across placements." },
    { t: "Team and community profiles", d: "Consistent avatars across a group, which makes a community look organised." },
    { t: "Seasonal profile refreshes", d: "A quick restyle for a campaign or a holiday, without redesigning anything." },
  ],
  promptIntro: "Say where the subject should sit and where the text is going. Social composition is mostly about reserving space, and a prompt that does not mention the text is the reason the headline ends up over someone's face.",
  prompts: [
    { t: "Name the platform and slot", d: "\"YouTube thumbnail\" or \"LinkedIn banner\" carries a whole set of conventions in two words." },
    { t: "Say where the subject goes", d: "\"Subject on the left third, empty space on the right\" is the single most useful instruction for anything with text on it." },
    { t: "Mention the circular crop", d: "\"Composed for a circular avatar, head centred, nothing important in the corners\"." },
    { t: "Reserve the text area", d: "\"Leave the upper third clear for a headline\" — otherwise there is nowhere for the type to go." },
    { t: "Ask for thumbnail legibility", d: "\"High contrast, readable at 100 pixels wide\", because that is the size most people will first see it." },
    { t: "Set the ratio explicitly", d: "\"9:16 vertical\" or \"1200x630\". Pick it before generating; cropping afterwards loses part of the frame." },
    { t: "Keep the brand colours", d: "\"Use a deep orange and near-black palette\" keeps a set of assets looking related." },
    { t: "Avoid generated text", d: "Ask for space for text rather than for text itself — generated lettering is still unreliable, and real type will always look better." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Start from the widest, highest-resolution source you have if the asset will be cropped several ways.",
    "Choose the ratio before generating rather than cropping afterwards.",
    "For avatars, keep the head centred and treat the corners as expendable — they will be masked off.",
    "Check any cover image against where the platform overlays the profile photo and buttons.",
    "Look at the result at thumbnail size. If it does not read at 100 pixels, it does not work in a feed.",
    "Ask for space for text instead of asking for the text itself; add real type afterwards.",
    "Keep a consistent palette across avatar, banner and posts — consistency is what reads as a brand.",
    "Export at the platform's stated dimensions so its own compression has less to do.",
    "For stories, keep everything important out of the top and bottom sixth of the frame.",
    "Generate a few variants and look at them in the actual feed before choosing.",
    "Keep the source image; the next platform will want a different shape.",
  ],
  faq: [
    { q: "Will the image be the right size for the platform?", a: "Yes — choose the platform or the ratio before generating and the output matches those dimensions, so the platform has no reason to re-crop or heavily recompress it. Picking the ratio up front matters: cropping afterwards throws away part of the frame you may have needed." },
    { q: "Will my profile picture work as a circle?", a: "Choose the circle-safe option, or say \"composed for a circular avatar, head centred, nothing important in the corners\". Most platforms mask avatars to circles, which is why rectangular compositions so often lose the top of someone's head." },
    { q: "Can it put text on the image?", a: "It can leave room for text, which is the better approach. Generated lettering is still unreliable — misspellings and malformed characters are common — and real type added afterwards will always look sharper. Ask for \"empty space in the upper third\" and put the headline there yourself." },
    { q: "Can I make one image work everywhere?", a: `Better to generate each shape from the same source. One image stretched across every placement is the most common reason a subject ends up cropped out or a headline ends up over a face. Each generation costs ${CREDIT_COST} credits, so four ratios is a few cents.` },
  ],
};

const fun: Bank = {
  lead: [
    "Some of these exist for a good reason and some exist because they are funny, and that is a legitimate reason too. {n} belongs to the second group — the kind of image you generate, send to three people, and get an immediate reaction from.",
    "That does not mean the result should be sloppy. The thing that makes a novelty portrait land is that the person is still recognisable inside it. A figurine, an avatar or a costume that could be anyone is not funny; the same image where you can immediately tell who it is gets screenshotted. So identity preservation applies here exactly as it does to a professional headshot.",
    "Each generation costs {cost} credits from a one-time pack, which never expires. These are the tools people run four or five times to get the one that is genuinely good, and the pricing assumes that.",
  ],
  leadAlt: [
    "Not everything has to be useful. Some images exist to be sent to four people who will reply immediately, and {n} is unapologetically one of those. It is also, for what it is worth, the category people come back to most.",
    "The thing that makes a novelty image land is recognisability. A figurine, an avatar or a costume that could be anybody is mildly amusing; the same image where you immediately know who it is gets screenshotted and forwarded. Which is why identity preservation matters here as much as on a professional headshot.",
    "Pets outperform people in this category by a wide margin, consistently, and nobody should be surprised. A photo where the animal's face is clearly visible and pointed roughly at the camera is all it takes.",
  ],
  howTo: [
    { t: "Upload a photo", d: "A clear selfie or portrait works best — the more visible the face, the more recognisable the result, which is the entire point." },
    { t: "Pick the look", d: "Choose a preset or describe your own. Novelty styles respond well to specific, slightly absurd detail." },
    { t: "Generate and share", d: "Full resolution, no watermark. Regenerating is cheap, and with these it is usually worth it." },
  ],
  whyHeading: "Why use {n}",
  why: [
    { t: "Still recognisably you", d: "A novelty image only works if people can tell who it is. Features and proportions are preserved inside the new form." },
    { t: "Genuinely finished-looking", d: "Real texture, believable lighting and proper shading, rather than an obvious filter laid over a photo." },
    { t: "Ready in seconds", d: "The whole appeal is immediacy. By the time you have explained the idea, the image exists." },
    { t: "Cheap enough to iterate", d: "These are tools you run several times. At {cost} credits a go, that is expected rather than wasteful." },
    { t: "Works on groups and pets", d: "Friends, family and animals can all go through it, which is usually funnier than doing it alone." },
    { t: "Sized for sharing", d: "Choose the ratio so it lands correctly in a chat, a story or a feed." },
    { t: "No watermark", d: "Nothing stamped across it, which matters for something whose whole purpose is being sent to people." },
    { t: "Print it if it is good", d: "Full resolution, so the genuinely good ones can become a sticker, a mug or a framed joke." },
  ],
  builtHeading: "{n} for the ideas worth an hour of someone's attention",
  builtSub: "Novelty images have a short half-life and a high hit rate. Generating them while the idea is current is most of the value.",
  built: [
    { t: "Group chat material", d: "The primary use case, and the one nobody puts in a marketing deck." },
    { t: "Profile pictures with a joke in them", d: "An avatar that gets a reaction rather than one that just identifies you." },
    { t: "Birthdays and celebrations", d: "A personalised image is a better card than a bought one and takes less time to produce." },
    { t: "Trend participation", d: "Style trends run for days. Generating the look while it is live is the whole point." },
    { t: "Gifts and prints", d: "Stickers, mugs and framed prints of the ones that turn out unexpectedly well." },
    { t: "Pets as the subject", d: "Reliably the best-received category, for reasons nobody needs explained." },
  ],
  benefits: [
    { t: "Instant", d: "No planning, no props, no setup. Upload and generate." },
    { t: "Funnier because it is you", d: "Identity preservation is what turns a generic novelty image into a personal one." },
    { t: "Costs almost nothing", d: "A pack starts at $2 and covers several attempts." },
    { t: "No skill required", d: "No editing, no prompt craft, no software." },
    { t: "Works on a phone", d: "Which is where the photo and the group chat both already are." },
    { t: "No subscription", d: "Nothing renews. Credits sit there until the next idea." },
    { t: "Full resolution", d: "Good enough to print the ones that deserve it." },
  ],
  useCases: [
    { t: "Group chat reactions", d: "The honest primary use case for most of these tools." },
    { t: "Birthday and celebration cards", d: "A personalised image that took two minutes and lands better than a bought card." },
    { t: "Novelty profile pictures", d: "An avatar that makes someone stop scrolling." },
    { t: "Joining a trend while it is live", d: "Trends move in days, and being late to one is worse than skipping it." },
    { t: "Stickers and merch", d: "Print the good ones. Flat, high-contrast styles survive being printed small." },
    { t: "Pet portraits with a concept", d: "Costumes, figurines, historical portraits. Consistently the best-received output." },
    { t: "Office and team in-jokes", d: "A whole team put through the same look, which is funnier than any one of them alone." },
    { t: "Party and event invitations", d: "A personalised, slightly ridiculous invitation image." },
  ],
  promptIntro: "Novelty prompts reward specific and slightly absurd detail. Naming a material, a scale or a setting produces a much better joke than asking for something \"funny\".",
  prompts: [
    { t: "Name the material", d: "\"Moulded vinyl with a satin finish\" or \"glazed ceramic\" is what makes a figurine look like an object rather than a drawing." },
    { t: "Give it a scale and a setting", d: "\"Sitting on a desk next to a keyboard\" grounds the image and makes the size read." },
    { t: "Add one absurd detail", d: "One unexpected specific — a particular object, a particular hat — carries a novelty image further than five generic adjectives." },
    { t: "Keep the face explicitly", d: "\"Keep the face clearly recognisable\" matters most on the styles that transform the most." },
    { t: "Say how many subjects", d: "\"Three people, all as separate figurines\" prevents the model merging or dropping someone." },
    { t: "Pick the framing", d: "\"Full figure, centred\" for a figurine; \"head and shoulders\" for an avatar." },
    { t: "Choose the background", d: "\"Plain background\" for a sticker, \"in a retail box on a shelf\" for the joke." },
    { t: "Ask for no text", d: "\"No text or lettering in the image\" — generated type is where these images most often fall apart." },
  ],
  tipsHeading: "Getting the best result from {n}",
  tips: [
    "Use a clear photo where the face is large in the frame. Recognisability is the joke.",
    "Soft, even light gives the model the most to work with.",
    "Run it three or four times. Novelty styles vary a lot between runs, and the best one is usually not the first.",
    "For groups, keep everyone facing forward and not overlapping.",
    "Pets work brilliantly. Use a photo where the face is clearly visible.",
    "Ask for no text in the image, then add any lettering yourself if it needs it.",
    "Pick the ratio for where it is going — square for a chat, 9:16 for a story.",
    "Check hands and any small objects before sharing; these are still the weak spots.",
    "For stickers, ask for a plain background so it can be cut out cleanly.",
    "Keep the good ones at full resolution. The genuinely funny ones end up printed.",
    "Keep the original photo. It is the best base for the next idea.",
  ],
  faq: [
    { q: "Will it still look like me?", a: "Yes, and that is what makes it work. A novelty image where the subject could be anyone is not funny — the reaction comes from recognising the person inside it, so features and proportions are preserved even on the styles that transform the most. Use a photo where the face is clear and large in the frame." },
    { q: "Does it work on pets?", a: "Very well, and it is reliably the most popular subject in this category. Use a photo where the animal's face is clearly visible and facing roughly towards the camera." },
    { q: "Can I put several people in one image?", a: "Yes. Say how many — \"three people, each as a separate figurine\" — so nobody gets merged or dropped. Results are best when everyone is facing forward and not heavily overlapped." },
    { q: "Can I print it or sell it?", a: `Downloads are full resolution with no watermark and no usage restriction from us, so prints, stickers and merchandise are fine. Bear in mind separately that a style referencing a real brand or character has its own rights attached, which are nothing to do with us. Each generation costs ${CREDIT_COST} credits.` },
  ],
};


/**
 * Rotated selection that never repeats a title already used on the page.
 *
 * Sections draw from overlapping pools — a category bank and a shared one can
 * both carry "Full resolution, no watermark" — so without a page-wide record
 * the same card can appear under two different headings.
 */
function pickUnused(items: Item[], count: number, seed: number, used: Set<string>): Item[] {
  const avail = items.filter((i) => !used.has(i.t.toLowerCase()));
  const chosen = pick(avail.length >= count ? avail : items, count, seed);
  for (const i of chosen) used.add(i.t.toLowerCase());
  return chosen;
}

/** Pool a bank section with a shared one, dropping repeats of the same title. */
function pool(a: Item[], b: Item[]): Item[] {
  const seen = new Set(a.map((i) => i.t.toLowerCase()));
  return [...a, ...b.filter((i) => !seen.has(i.t.toLowerCase()))];
}

/** Same, for the plain-string tip lists. */
function poolText(a: string[], b: string[]): string[] {
  const key = (s: string) => s.slice(0, 45).toLowerCase();
  const seen = new Set(a.map(key));
  return [...a, ...b.filter((s) => !seen.has(key(s)))];
}

/* ── composition ────────────────────────────────────────────────────────── */

const BANKS: Record<string, Bank> = {
  headshot, portrait, style, retouch, restore, background, remove, enhance, product, social, fun,
};

/**
 * The long-form page content for one app.
 *
 * Section sizes are fixed (6 why, 4 built, 5 benefits, 5 use cases, 6 prompt
 * ideas, 8 tips) and the items are rotated out of a larger bank by a hash of
 * the slug, so two apps in the same category do not read as the same page.
 *
 * The app's own description leads the "why" and "use cases" lists, which is
 * what keeps a page about *this* tool rather than about its category.
 */
export function longContentFor(app: CreativeApp): AppLongContent {
  const bank = BANKS[categoryOf(app)] ?? portrait;
  const name = app.h1;
  // Each section gets its own hash of slug + section name. Offsetting one seed
  // instead would give two apps with nearby hash values nearly the same window
  // in every section at once, which is exactly the duplication to avoid.
  const seedFor = (section: string) => hash(`${app.slug}:${section}`);
  const seed = seedFor("intro");
  const f = (s: string) => fill(s, name);
  const fi = (i: Item) => fillItem(i, name);

  // The app's own one-liner, promoted to the head of the list so the section
  // opens with what this specific tool does.
  const ownWhy: Item = { t: `What ${name} does`, d: app.intro };
  const ownUse: Item = { t: "What it is mainly used for", d: app.tagline };

  // Titles already placed on this page, so no card is repeated under a second
  // heading. Populated in render order: why, built, benefits, use cases.
  const used = new Set<string>([ownWhy.t.toLowerCase(), ownUse.t.toLowerCase()]);

  return {
    intro: pick([...bank.lead, ...bank.leadAlt], 3, seed).map(f),
    transform: transformText(app.prompt),
    howTo: bank.howTo.map(fi),
    why: { heading: f(bank.whyHeading), items: [ownWhy, ...pickUnused(bank.why, 5, seedFor("why"), used).map(fi)] },
    built: { heading: f(bank.builtHeading), sub: f(bank.builtSub), items: pickUnused(bank.built, 4, seedFor("built"), used).map(fi) },
    benefits: pickUnused(pool(bank.benefits, SHARED_BENEFITS), 5, seedFor("benefits"), used).map(fi),
    useCases: [ownUse, ...pickUnused(bank.useCases, 4, seedFor("usecases"), used).map(fi)],
    promptIdeas: { intro: f(bank.promptIntro), items: pickUnused(pool(bank.prompts, SHARED_PROMPTS), 6, seedFor("prompts"), used).map(fi) },
    bestResults: { heading: f(bank.tipsHeading), items: pick(poolText(bank.tips, SHARED_TIPS), 8, seedFor("tips")).map(f) },
    // The app's own FAQs first — those are specific to it — then the category
    // ones, which answer the questions the specific list never gets to.
    faq: [...app.faq, ...bank.faq.filter((c) => !app.faq.some((a) => a.q === c.q))],
  };
}
