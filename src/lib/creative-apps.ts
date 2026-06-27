import { PageFAQ } from "@/lib/page-config";

/**
 * creative-apps.ts — JPT AI Creative Apps.
 *
 * Each Creative App is an indexed SEO landing page with an ON-PAGE generator:
 * the user uploads a reference photo and gets the result right there (no redirect
 * to the editor). Each app has a fixed `prompt` that is sent to /api/ai-edit.
 *
 * Titles are CTR-optimised: power word + primary keyword front-loaded, "Free" +
 * "Online" qualifiers, brand at the end.
 */

export interface CreativeApp {
  slug: string;
  emoji: string;
  gradient: [string, string]; // thumbnail gradient
  title: string;              // <title>
  metaDescription: string;
  keywords: string;
  h1: string;
  tagline: string;            // hero subtitle
  intro: string;              // hub-card description
  prompt: string;             // preset transformation prompt sent to the AI
  badge: string;              // short result label shown on the "after" image
  faq: PageFAQ[];
}

export const CREATIVE_BASE = "/creative";

export const CREATIVE_APPS: CreativeApp[] = [
  {
    slug: "saree-photoshoot",
    emoji: "🥻",
    gradient: ["#7C3AED", "#DB2777"],
    title: "AI Saree Photoshoot — Vintage Saree Portrait Maker Free | JPT AI",
    metaDescription:
      "Create a viral vintage saree photoshoot free online. Upload a selfie and AI turns it into a cinematic saree portrait on the page — no app, no watermark.",
    keywords: "ai saree photoshoot, vintage saree portrait ai, saree photo editor free, cinematic saree photoshoot online, ai saree photo maker",
    h1: "AI Saree Photoshoot Maker",
    tagline: "Upload a selfie and get a cinematic vintage saree portrait — right here, in seconds. Free, no watermark.",
    intro: "Turn a selfie into a cinematic vintage saree portrait.",
    prompt: "Transform this person into an elegant 90s vintage Bollywood saree portrait. Dress them in a richly detailed traditional silk saree with gold jewellery, warm cinematic lighting, soft film grain, and a tasteful studio backdrop. Keep the face and identity exactly the same.",
    badge: "✨ Saree Portrait",
    faq: [
      { q: "How do I create an AI saree photoshoot?", a: "Upload a clear, front-facing selfie on this page and click Generate. The AI dresses you in a cinematic vintage saree look in seconds — no editing skills needed." },
      { q: "Is the saree photoshoot free?", a: "You get free daily credits when you sign in. There is no watermark on your result." },
      { q: "What photo works best?", a: "A clear, well-lit, front-facing selfie gives the most realistic saree portrait. Avoid heavy shadows or extreme angles." },
    ],
  },
  {
    slug: "3d-figurine",
    emoji: "🧍",
    gradient: ["#2563EB", "#06B6D4"],
    title: "3D Figurine Maker — Turn Your Photo Into a Figure Free | JPT AI",
    metaDescription:
      "Turn your photo into a collectible 3D figurine free online. Upload a photo and AI renders an action-figure version on the page — no app, no watermark.",
    keywords: "3d figurine maker, photo to 3d figure ai, ai action figure maker free, collectible figurine ai, turn photo into figurine",
    h1: "3D Figurine Maker",
    tagline: "Upload your photo and AI turns you into a collectible 3D figurine — right on this page. Free and instant.",
    intro: "Turn your photo into a collectible 3D action figure.",
    prompt: "Turn this person into a highly detailed 1/7 scale collectible figurine displayed on a round base, with a printed product packaging box behind it. Glossy PVC material, studio product photography, soft lighting. Keep the face and likeness accurate.",
    badge: "✨ 3D Figurine",
    faq: [
      { q: "How do I turn my photo into a 3D figurine?", a: "Upload a full or half-body photo on this page and click Generate. The AI renders a realistic collectible-figure version of you in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits when you sign in, with no watermark on your download." },
      { q: "What photo works best?", a: "A clear photo showing your full body or upper body works best so the figure captures your pose and outfit." },
    ],
  },
  {
    slug: "retro-bollywood",
    emoji: "🎬",
    gradient: ["#B45309", "#DC2626"],
    title: "Retro 90s Bollywood Photo Editor — Free Cinematic AI | JPT AI",
    metaDescription:
      "Make viral retro 90s Bollywood photos free online. Upload a selfie and AI applies a cinematic vintage film look on the page — no app, no watermark.",
    keywords: "retro bollywood photo editor, 90s bollywood photo ai, vintage cinematic ai photo, retro film photo maker free, bollywood ai photoshoot",
    h1: "Retro 90s Bollywood Photo Editor",
    tagline: "Give any selfie the viral 90s Bollywood film look — warm tones, grain and drama. Generated right here, free.",
    intro: "Give any selfie the viral 90s Bollywood film look.",
    prompt: "Restyle this photo as a 90s Bollywood film still with a warm cinematic colour grade, soft film grain, dramatic nostalgic lighting and a vintage poster feel. Keep the person's face and identity the same.",
    badge: "✨ Retro Film",
    faq: [
      { q: "How do I get the retro Bollywood look?", a: "Upload your photo on this page and click Generate. The AI restyles it with warm vintage tones, film grain and cinematic drama in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Can I use my own photo?", a: "Yes. Any clear photo of a person works; portraits give the most cinematic results." },
    ],
  },
  {
    slug: "polaroid-photo",
    emoji: "📸",
    gradient: ["#0F766E", "#65A30D"],
    title: "AI Polaroid Photo Maker — Retro Polaroid Selfie Free | JPT AI",
    metaDescription:
      "Create the viral retro polaroid selfie free online. Upload your photo and AI makes a realistic polaroid-style shot on the page — no app, no watermark.",
    keywords: "ai polaroid photo maker, retro polaroid selfie ai, polaroid photo editor free, vintage polaroid maker online, ai polaroid generator",
    h1: "AI Polaroid Photo Maker",
    tagline: "Upload a photo and get a realistic retro polaroid-style shot — generated right here. Free and instant.",
    intro: "Create the viral retro polaroid selfie look.",
    prompt: "Convert this photo into a realistic vintage polaroid: slight flash photography look, gentle blur, warm indoor tones, and a classic white polaroid border. Keep the person's face and identity the same.",
    badge: "✨ Polaroid",
    faq: [
      { q: "How do I make an AI polaroid photo?", a: "Upload your photo on this page and click Generate. The AI produces a realistic retro polaroid-style shot with a white border in seconds." },
      { q: "Is it free to use?", a: "Yes — free daily credits with no watermark." },
      { q: "What makes a good polaroid result?", a: "Clear, front-facing photos with simple backgrounds produce the most realistic polaroid style." },
    ],
  },
  {
    slug: "restore-old-photos",
    emoji: "🖼️",
    gradient: ["#475569", "#0EA5E9"],
    title: "Restore Old Photos Free — AI Photo Restoration Online | JPT AI",
    metaDescription:
      "Restore old, blurry and damaged photos free online. Upload a vintage photo and AI recovers detail and clarity on the page — no app, no watermark.",
    keywords: "restore old photos free, ai photo restoration online, fix old blurry photo ai, repair damaged photo free, enhance vintage photo ai",
    h1: "AI Old Photo Restoration",
    tagline: "Upload an old or blurry photo and AI restores detail and clarity — right here on the page. Free and instant.",
    intro: "Bring faded, blurry family photos back to life.",
    prompt: "Restore this old photograph: repair scratches and damage, sharpen and recover facial detail, reduce noise and fading, and gently enhance clarity while keeping it natural and true to the original people.",
    badge: "✨ Restored",
    faq: [
      { q: "Can AI restore my old photos?", a: "Yes. Upload a scanned or photographed old print on this page and click Generate — the AI recovers detail, sharpens faces and reduces damage in seconds." },
      { q: "Is photo restoration free?", a: "Yes — free daily credits with no watermark." },
      { q: "How should I scan an old photo?", a: "A flat, well-lit scan or a straight overhead photo on a plain surface gives the AI the most detail to work with." },
    ],
  },
  {
    slug: "couple-photoshoot",
    emoji: "💑",
    gradient: ["#BE123C", "#9333EA"],
    title: "AI Couple Photoshoot — Cinematic Pre-Wedding Portraits Free | JPT AI",
    metaDescription:
      "Create cinematic couple photoshoots free online. Upload your photo and AI makes a pre-wedding or traditional couple portrait on the page — no watermark.",
    keywords: "ai couple photoshoot, pre wedding photo ai free, cinematic couple portrait ai, couple photo editor online, ai couple photo maker",
    h1: "AI Couple Photoshoot Maker",
    tagline: "Upload a couple photo and AI creates a cinematic pre-wedding portrait — right here, in seconds. Free.",
    intro: "Cinematic pre-wedding & couple portraits from a photo.",
    prompt: "Transform this couple photo into a cinematic pre-wedding portrait: elegant coordinated outfits, golden-hour lighting, soft bokeh background and a romantic mood. Keep both faces and identities exactly the same.",
    badge: "✨ Couple Portrait",
    faq: [
      { q: "How do I make a couple photoshoot with AI?", a: "Upload a clear photo of the couple on this page and click Generate. The AI creates a cinematic styled portrait in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear photo where both faces are well-lit and visible gives the most realistic results." },
    ],
  },
  {
    slug: "professional-headshot",
    emoji: "💼",
    gradient: ["#1E40AF", "#0891B2"],
    title: "AI Professional Headshot — LinkedIn Photo From Selfie Free | JPT AI",
    metaDescription:
      "Create a professional headshot free online. Upload a selfie and AI makes a LinkedIn-ready corporate portrait on the page — no photographer, no watermark.",
    keywords: "ai professional headshot, linkedin headshot from selfie free, corporate portrait ai, ai headshot generator online, professional photo ai free",
    h1: "AI Professional Headshot Maker",
    tagline: "Upload a selfie and AI turns it into a polished, LinkedIn-ready headshot — right here. Free and instant.",
    intro: "Turn a selfie into a LinkedIn-ready headshot.",
    prompt: "Turn this selfie into a polished professional corporate headshot: formal business attire, neutral grey studio background, soft flattering lighting and a confident, natural expression. Keep the face and identity exactly the same.",
    badge: "✨ Pro Headshot",
    faq: [
      { q: "How do I make a professional headshot from a selfie?", a: "Upload a clear selfie on this page and click Generate. The AI produces a polished, professional portrait with studio lighting in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Will it look natural?", a: "Yes. The AI uses realistic enhancement designed to look like professional photography, not an obvious filter." },
    ],
  },
  {
    slug: "festival-photoshoot",
    emoji: "🪔",
    gradient: ["#C2410C", "#CA8A04"],
    title: "AI Festival Photoshoot — Diwali & Navratri Portraits Free | JPT AI",
    metaDescription:
      "Create festive Diwali, Navratri and Eid photoshoots free online. Upload a selfie and AI makes a festive portrait on the page — no app, no watermark.",
    keywords: "ai festival photoshoot, diwali photo editor ai, navratri photoshoot ai free, festive portrait ai, ai diwali photo maker",
    h1: "AI Festival Photoshoot Maker",
    tagline: "Upload a selfie and AI creates a festive Diwali, Navratri or Eid portrait — right here, in seconds. Free.",
    intro: "Festive Diwali, Navratri & Eid portraits from a selfie.",
    prompt: "Transform this person into a festive Diwali portrait: elegant traditional Indian attire, warm glow of diyas and fairy lights, rich festive backdrop and a celebratory mood. Keep the face and identity exactly the same.",
    badge: "✨ Festive",
    faq: [
      { q: "How do I make a festival photoshoot with AI?", a: "Upload your selfie on this page and click Generate. The AI styles you with festive outfits and backdrops in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I try different festivals?", a: "Yes — we offer Diwali, Navratri and other festive looks across our Creative apps." },
    ],
  },
  {
    slug: "pet-portrait",
    emoji: "🐶",
    gradient: ["#7C2D12", "#16A34A"],
    title: "AI Pet Portrait Maker — Royal & Cartoon Pet Photos Free | JPT AI",
    metaDescription:
      "Create fun AI pet portraits free online. Upload your pet's photo and AI makes royal or cartoon art on the page — no app needed, no watermark.",
    keywords: "ai pet portrait maker, royal pet portrait ai, cartoon pet photo ai free, pet photo editor online, ai dog cat portrait",
    h1: "AI Pet Portrait Maker",
    tagline: "Upload your pet's photo and AI turns it into a royal masterpiece — right here on the page. Free and instant.",
    intro: "Turn your pet into royal or cartoon art.",
    prompt: "Transform this pet into a regal renaissance royal portrait: dressed in a crown and ornate royal robe, oil-painting style, dramatic classical lighting and a palace backdrop. Keep the pet's face and features accurate.",
    badge: "✨ Royal Pet",
    faq: [
      { q: "How do I make an AI pet portrait?", a: "Upload a clear photo of your pet on this page and click Generate. The AI restyles your pet into shareable royal art in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What pet photo works best?", a: "A clear, well-lit photo where your pet's face is visible gives the best results." },
    ],
  },
  {
    slug: "anime-style",
    emoji: "🎨",
    gradient: ["#7C3AED", "#2563EB"],
    title: "AI Anime Style Photo Converter — Turn Photo Into Anime Free | JPT AI",
    metaDescription:
      "Turn photos into anime-style art free online. Upload a selfie and AI converts it to hand-drawn animation style on the page — no app, no watermark.",
    keywords: "ai anime style converter, photo to anime ai free, anime photo maker online, turn photo into anime, ai cartoon avatar maker",
    h1: "AI Anime Style Photo Converter",
    tagline: "Upload a photo and AI converts it into dreamy hand-drawn anime art — right here, in seconds. Free.",
    intro: "Convert any photo into hand-drawn anime art.",
    prompt: "Convert this photo into a beautiful hand-drawn anime illustration: soft pastel colours, expressive features, gentle cinematic lighting and a dreamy watercolour-style background. Keep the person's likeness recognisable.",
    badge: "✨ Anime",
    faq: [
      { q: "How do I convert a photo to anime style?", a: "Upload your photo on this page and click Generate. The AI redraws it as hand-drawn anime art in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Can I print the result?", a: "Yes. You can download the artwork and use our free upscaler to enlarge it for printing or wallpapers." },
    ],
  },
  {
    slug: "passport-photo",
    emoji: "🛂",
    gradient: ["#0369A1", "#64748B"],
    title: "AI Passport Photo Maker — White Background ID Photo Free | JPT AI",
    metaDescription:
      "Make a passport / ID photo free online. Upload a selfie and AI creates a clean white-background headshot on the page — no app, no watermark.",
    keywords: "ai passport photo maker, white background id photo ai, passport size photo online free, visa photo maker ai, id photo generator free",
    h1: "AI Passport Photo Maker",
    tagline: "Upload a selfie and AI creates a clean, regulation white-background ID photo — right here. Free and instant.",
    intro: "Selfie to a clean white-background ID photo.",
    prompt: "Convert this selfie into a regulation passport / ID photo: plain pure-white background, even neutral lighting, front-facing with a neutral expression and shoulders visible. Keep the face and identity exactly the same.",
    badge: "✨ ID Photo",
    faq: [
      { q: "How do I make a passport photo with AI?", a: "Upload a front-facing selfie on this page and click Generate. The AI removes the background and produces a clean white-background ID-style photo in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Does it meet official requirements?", a: "It produces a clean solid-background headshot. Always check your country's exact size and head-position rules before submitting." },
    ],
  },
  {
    slug: "background-changer",
    emoji: "🌅",
    gradient: ["#0891B2", "#7C3AED"],
    title: "AI Background Changer — Replace Photo Background Free | JPT AI",
    metaDescription:
      "Change any photo background free online. Upload your photo and AI replaces the background with a studio scene on the page — no app, no watermark.",
    keywords: "ai background changer, replace photo background ai free, change background online, ai background generator, photo background editor free",
    h1: "AI Background Changer",
    tagline: "Upload your photo and AI swaps the background for a clean professional scene — right here, in seconds. Free.",
    intro: "Replace any photo background with a new scene.",
    prompt: "Replace the background of this image with a clean, professional studio gradient backdrop with soft, flattering lighting. Keep the person or subject exactly as they are — same pose, appearance and clothing — only change the background behind them.",
    badge: "✨ New Background",
    faq: [
      { q: "How do I change a photo background with AI?", a: "Upload your photo on this page and click Generate. The AI removes the old background and blends in a clean new scene in seconds." },
      { q: "Is the background changer free?", a: "Yes — free daily credits with no watermark." },
      { q: "Will my subject stay sharp?", a: "Yes. The AI preserves the subject and fine edges like hair while replacing only the background." },
    ],
  },
];

export const getCreativeApp = (slug: string) => CREATIVE_APPS.find((a) => a.slug === slug);

export interface CreativeContent {
  paragraphs: string[];
  tipsTitle: string;
  tips: string[];
}

// Human-written, unique long-form content per app (for SEO + genuinely useful reading).
export const CREATIVE_CONTENT: Record<string, CreativeContent> = {
  "saree-photoshoot": {
    paragraphs: [
      "There's a reason the vintage saree look keeps showing up on everyone's feed — it's dramatic, a little nostalgic, and it makes an ordinary selfie feel like a film poster. The catch is that getting that look normally means a stylist, a borrowed silk saree, good lighting and an actual photographer. This does it from a photo you already have on your phone.",
      "Upload a clear selfie and the AI dresses you in a draped silk saree, adds the gold jewellery, and lights the whole thing with that warm, slightly faded cinematic glow people associate with 90s Bollywood. Your face stays yours — it's the wardrobe, lighting and mood that change. Try a few photos; a straight-on shot with soft light almost always wins.",
    ],
    tipsTitle: "Tips for the best saree portrait",
    tips: [
      "Use a front-facing photo where your whole face is visible — no sunglasses or heavy shadows.",
      "Natural window light or a plain indoor background gives the AI the cleanest base to work from.",
      "If the first result feels off, re-run it — small differences in the source photo change the drape and lighting a lot.",
    ],
  },
  "3d-figurine": {
    paragraphs: [
      "The collectible-figurine trend blew up because it's weirdly satisfying to see yourself as a boxed action figure, base and all. Doing it by hand in 3D software is hours of work. Here it's one upload.",
      "Give it a photo where your pose and outfit are visible — full body or waist-up both work — and the AI renders a glossy 1/7-scale figure standing on a round base, with a printed packaging box behind it like something off a shelf. The more your original photo reads as a clear, single subject, the cleaner the figure comes out.",
    ],
    tipsTitle: "Tips for a sharper figurine",
    tips: [
      "Full-body or upper-body photos work better than tight face crops — the figure needs your pose.",
      "A plain background helps the AI separate you from the scene.",
      "Bold, distinct outfits translate into a more convincing collectible.",
    ],
  },
  "retro-bollywood": {
    paragraphs: [
      "Some photos just want to be a film still. The retro 90s Bollywood look — warm grade, soft grain, a little drama in the shadows — turns a normal picture into something that feels pulled from an old movie poster.",
      "Drop in any portrait and the AI handles the colour grade, the grain and the lighting mood for you. It keeps you looking like you; it just changes the era. It works on solo shots, couples, even group photos, though close portraits get the most cinematic result.",
    ],
    tipsTitle: "Tips for the retro film look",
    tips: [
      "Portraits with a clear face and simple background grade the best.",
      "Slightly warm or neutral lighting in the original helps the vintage tones land.",
      "Re-run it a couple of times — each pass varies the grain and colour slightly.",
    ],
  },
  "polaroid-photo": {
    paragraphs: [
      "Polaroids feel personal in a way phone photos don't — the white border, the flash, that slightly imperfect look. This recreates that feeling from a regular digital photo, no instant camera required.",
      "Upload a photo and you get back a polaroid-style shot: soft flash, gentle blur, warm tones and the classic white frame. It's great for couple pics, friends, or a single portrait you want to feel a bit more candid and nostalgic.",
    ],
    tipsTitle: "Tips for a realistic polaroid",
    tips: [
      "Front-facing photos with a simple background look the most authentic.",
      "Indoor or evening shots suit the flash-photography vibe best.",
      "Keep the subject close — polaroids are at their best up close, not zoomed out.",
    ],
  },
  "restore-old-photos": {
    paragraphs: [
      "Old family photos fade, scratch and blur — and the people in them are exactly who you don't want to lose. Restoring them by hand in Photoshop is fiddly and slow. This brings them back in seconds.",
      "Scan or photograph the old print, upload it, and the AI repairs the damage, sharpens faces and recovers detail that the years wore away — while keeping everyone looking like themselves. Once it's restored you can run it through the upscaler too, so a tiny faded print becomes something you can actually print and frame.",
    ],
    tipsTitle: "Tips for the best restoration",
    tips: [
      "Lay the print flat and shoot it straight-on in good light, or use a flatbed scan.",
      "Avoid glare — angle the photo away from direct lamps or windows.",
      "Crop out the background so the AI focuses on the photo itself.",
    ],
  },
  "couple-photoshoot": {
    paragraphs: [
      "Not every couple has the time (or budget) for a pre-wedding shoot, but everyone has a phone full of photos together. This turns one of those into a proper cinematic portrait.",
      "Upload a clear photo of the two of you and the AI styles it like a pre-wedding shoot — coordinated outfits, golden-hour light, soft background blur. Both faces stay recognisably you. It's a fun way to make a save-the-date, an anniversary post, or just a frame for the wall.",
    ],
    tipsTitle: "Tips for couple portraits",
    tips: [
      "Pick a photo where both faces are clearly visible and well lit.",
      "Avoid heavy shadows across either face.",
      "Standing close together gives the AI the most natural composition to build on.",
    ],
  },
  "professional-headshot": {
    paragraphs: [
      "A good headshot opens doors — recruiters, clients and connections all judge a profile photo in about a second. But booking a studio is expensive and slow, and most people end up using a cropped holiday photo instead.",
      "Upload a clear selfie and the AI gives you a polished, studio-style headshot: business attire, clean neutral background, soft flattering light. It's designed to look like real photography, not an obvious filter — the kind of photo that fits straight onto LinkedIn, a resume, or a team page.",
    ],
    tipsTitle: "Tips for a headshot that lands",
    tips: [
      "Use a sharp, front-facing selfie taken at eye level.",
      "Soft, even light (a window works great) beats harsh overhead light.",
      "A neutral expression or a natural smile reads as the most professional.",
    ],
  },
  "festival-photoshoot": {
    paragraphs: [
      "Festivals are when everyone wants a great photo — and when everyone's too busy celebrating to set one up. This lets you create a festive portrait after the fact, or even when you didn't dress up at all.",
      "Upload a selfie and the AI adds the traditional outfit, the warm glow of diyas and lights, and a festive backdrop — Diwali, Navratri, or any occasion. Your face stays the same; the celebration gets added around you. Perfect for greetings, status updates and posts.",
    ],
    tipsTitle: "Tips for festive portraits",
    tips: [
      "A clear, well-lit selfie gives the most realistic styling.",
      "Front-facing shots work better than profile angles.",
      "Try a couple of runs to get the lighting and outfit you like most.",
    ],
  },
  "pet-portrait": {
    paragraphs: [
      "Our pets deserve to be immortalised, and a royal oil-painting portrait of your dog in a crown is exactly as great as it sounds. It also makes a brilliant gift.",
      "Upload a clear photo of your pet and the AI turns it into a regal renaissance-style portrait — crown, robe, dramatic lighting, the works — while keeping their actual face and features. Cats, dogs, whoever rules your house; it works on all of them.",
    ],
    tipsTitle: "Tips for the best pet portrait",
    tips: [
      "Use a photo where your pet is looking towards the camera.",
      "Good light on the face matters more than anything else.",
      "Avoid blurry action shots — a calm, still photo gives the cleanest result.",
    ],
  },
  "anime-style": {
    paragraphs: [
      "Turning yourself into anime art used to mean commissioning an illustrator and waiting days. This does it instantly, and the results are genuinely lovely — soft colours, expressive features, that hand-drawn feel.",
      "Upload a photo and the AI redraws it as an anime illustration while keeping you recognisable. It makes a great profile picture or wallpaper, and because you can download it full quality, you can upscale it for prints too.",
    ],
    tipsTitle: "Tips for the best anime art",
    tips: [
      "A clear portrait with a visible face converts the cleanest.",
      "Simple backgrounds let the AI focus on you.",
      "Re-run for different moods — lighting and colour shift each time.",
    ],
  },
  "passport-photo": {
    paragraphs: [
      "Passport and ID photos are annoying: you need a plain background, even lighting and the right framing, and the photo booth never quite gets it. This makes a clean ID-style photo from a normal selfie.",
      "Upload a front-facing photo and the AI swaps in a plain white background, evens out the lighting and frames you head-and-shoulders with a neutral expression. It's quick and free to try — just remember to check your specific country's size and head-position rules before you submit anything official.",
    ],
    tipsTitle: "Tips for a usable ID photo",
    tips: [
      "Face the camera straight-on with a neutral expression.",
      "Make sure your whole head and the top of your shoulders are in frame.",
      "Avoid hats, sunglasses and heavy shadows on the face.",
    ],
  },
  "background-changer": {
    paragraphs: [
      "A distracting background can ruin an otherwise great photo — a messy room behind a product shot, a cluttered wall behind a portrait. Swapping it cleanly usually means careful masking. This does it in one step.",
      "Upload your photo and the AI cuts you (or your product) out, keeps the fine edges like hair intact, and drops in a clean professional backdrop. Your subject, pose and outfit stay exactly the same — only what's behind them changes.",
    ],
    tipsTitle: "Tips for a clean background swap",
    tips: [
      "Good contrast between subject and original background helps the cutout.",
      "Avoid motion blur on the edges of your subject.",
      "Well-lit photos keep hair and fine details sharp after the swap.",
    ],
  },
};

export const getCreativeContent = (slug: string): CreativeContent | undefined => CREATIVE_CONTENT[slug];

// Real AI-generated before/after previews served from Supabase Storage (the
// "landing" public bucket). Populated once via scripts/migrate-previews-to-supabase.mjs.
const SUPABASE_PUBLIC = "https://lwworujvfttxkrjfrgav.supabase.co/storage/v1/object/public/landing";

/** Public Supabase URL for an app's before/after preview image. */
export function previewUrl(slug: string): string {
  return `${SUPABASE_PUBLIC}/creative/${slug}.png`;
}
