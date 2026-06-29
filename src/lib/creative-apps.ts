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
  {
    slug: "linkedin-banner",
    emoji: "🖥️",
    gradient: ["#0A66C2", "#1E3A8A"],
    title: "AI LinkedIn Banner Maker — Free Profile Cover Photo Generator | JPT AI",
    metaDescription:
      "Create a professional LinkedIn banner free online. Upload a photo and AI generates a branded cover image on the page — no design skills, no watermark.",
    keywords: "ai linkedin banner maker, linkedin cover photo generator free, linkedin background image ai, professional linkedin banner free, linkedin header image maker",
    h1: "AI LinkedIn Banner Maker",
    tagline: "Upload a photo and AI generates a polished LinkedIn cover banner — right here, in seconds. Free.",
    intro: "Generate a professional LinkedIn banner from a photo.",
    prompt: "Create a professional LinkedIn banner background image inspired by this photo: clean corporate gradient in deep blue tones, subtle abstract geometric shapes, professional and modern, wide banner composition with negative space for text overlay. Keep it tasteful and brand-safe.",
    badge: "✨ LinkedIn Banner",
    faq: [
      { q: "How do I make a LinkedIn banner with AI?", a: "Upload any photo or just a colour reference on this page and click Generate. The AI creates a polished, professional banner sized for LinkedIn in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits when you sign in, with no watermark on your download." },
      { q: "What size is the banner?", a: "The output is generated to fit LinkedIn's wide banner format. You can crop slightly after download if needed for an exact fit." },
    ],
  },
  {
    slug: "christmas-photo",
    emoji: "🎄",
    gradient: ["#B91C1C", "#15803D"],
    title: "AI Christmas Photo Maker — Festive Holiday Portrait Free | JPT AI",
    metaDescription:
      "Create a festive AI Christmas photo free online. Upload a selfie and AI adds a cozy holiday scene on the page — no app, no watermark.",
    keywords: "ai christmas photo maker, holiday photo editor ai free, christmas portrait generator, festive ai photo free, ai xmas photo maker",
    h1: "AI Christmas Photo Maker",
    tagline: "Upload a selfie and AI creates a cozy festive Christmas portrait — right here, in seconds. Free.",
    intro: "Turn a selfie into a cozy Christmas portrait.",
    prompt: "Transform this photo into a warm festive Christmas portrait: soft string lights, a decorated tree in the background, a cozy red or green sweater, gentle golden bokeh and a joyful holiday mood. Keep the face and identity exactly the same.",
    badge: "✨ Christmas",
    faq: [
      { q: "How do I make a Christmas photo with AI?", a: "Upload your selfie on this page and click Generate. The AI adds festive lighting, decorations and a cozy holiday mood in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I use it for greeting cards?", a: "Yes, download the full-quality image and use it for cards, social posts or prints." },
    ],
  },
  {
    slug: "baby-photoshoot",
    emoji: "👶",
    gradient: ["#F472B6", "#FDE68A"],
    title: "AI Baby Photoshoot — Cute Studio Baby Portrait Free | JPT AI",
    metaDescription:
      "Create an adorable AI baby photoshoot free online. Upload a photo and AI makes a soft studio-style baby portrait on the page — no watermark.",
    keywords: "ai baby photoshoot, baby photo editor ai free, newborn portrait ai, cute baby photo maker online, ai baby portrait generator",
    h1: "AI Baby Photoshoot Maker",
    tagline: "Upload a photo and AI creates an adorable soft studio baby portrait — right here. Free and instant.",
    intro: "Turn a baby photo into a soft studio portrait.",
    prompt: "Transform this photo into a soft, dreamy studio baby portrait: warm pastel tones, gentle diffused lighting, a cozy knitted wrap or outfit, and a clean minimal backdrop. Keep the baby's face and features exactly the same.",
    badge: "✨ Baby Portrait",
    faq: [
      { q: "How do I make a baby photoshoot with AI?", a: "Upload a clear photo of your baby on this page and click Generate. The AI creates a soft, professional studio-style portrait in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "What photo works best?", a: "A clear, well-lit photo where the baby's face is visible gives the most charming result." },
    ],
  },
  {
    slug: "graduation-photo",
    emoji: "🎓",
    gradient: ["#1E3A8A", "#CA8A04"],
    title: "AI Graduation Photo Maker — Cap & Gown Portrait Free | JPT AI",
    metaDescription:
      "Create a proud AI graduation photo free online. Upload a selfie and AI adds a cap, gown and ceremony backdrop on the page — no watermark.",
    keywords: "ai graduation photo maker, cap and gown photo ai free, graduation portrait generator, ai convocation photo, graduation photoshoot online free",
    h1: "AI Graduation Photo Maker",
    tagline: "Upload a selfie and AI dresses you in a cap and gown for a proud graduation portrait — free, instant.",
    intro: "Turn a selfie into a graduation cap-and-gown portrait.",
    prompt: "Transform this person into a graduation portrait: wearing an academic cap and gown, holding a rolled diploma, with a celebratory campus or ceremony backdrop and warm proud lighting. Keep the face and identity exactly the same.",
    badge: "✨ Graduation",
    faq: [
      { q: "How do I make a graduation photo with AI?", a: "Upload a clear selfie on this page and click Generate. The AI adds a cap, gown and ceremony backdrop in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Can I use it even if I couldn't attend the ceremony?", a: "Yes — this is a popular way to get a graduation-style portrait without needing the official event photo." },
    ],
  },
  {
    slug: "gym-transformation",
    emoji: "💪",
    gradient: ["#0F172A", "#DC2626"],
    title: "AI Gym Transformation Photo — Fitness Physique Preview Free | JPT AI",
    metaDescription:
      "Visualize a fitter you with an AI gym transformation photo free online. Upload a photo and AI shows a toned physique preview — no watermark.",
    keywords: "ai gym transformation photo, fitness physique ai free, ai muscle photo generator, body transformation photo ai, ai fitness motivation photo",
    h1: "AI Gym Transformation Photo",
    tagline: "Upload a photo and AI shows a motivating, toned physique preview — right here. Free and instant.",
    intro: "Preview a leaner, more toned version of yourself for motivation.",
    prompt: "Subtly restyle this photo for a fitness-motivation portrait: athletic gym lighting, a toned and energised look, workout attire, and a dynamic gym backdrop. Keep the person's face and identity exactly the same — this is a motivational style edit, not a medical depiction.",
    badge: "✨ Fitness",
    faq: [
      { q: "How does the gym transformation photo work?", a: "Upload a clear photo on this page and click Generate. The AI creates a motivating, gym-styled version of your photo in seconds." },
      { q: "Is this a real transformation?", a: "No — it's a stylised motivational image, not a medical or fitness prediction. Think of it as inspiration art, not a guarantee." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
    ],
  },
  {
    slug: "ghibli-style",
    emoji: "🌿",
    gradient: ["#16A34A", "#0EA5E9"],
    title: "AI Ghibli Style Photo Converter — Studio Anime Art Free | JPT AI",
    metaDescription:
      "Turn photos into dreamy Ghibli-style anime art free online. Upload a selfie and AI redraws it in a hand-painted studio anime style — no watermark.",
    keywords: "ai ghibli style converter, studio ghibli ai filter free, ghibli anime art generator, photo to ghibli style ai, ghibli style photo maker free",
    h1: "AI Ghibli Style Photo Converter",
    tagline: "Upload a photo and AI redraws it in a dreamy, hand-painted studio anime style — free, instant.",
    intro: "Convert any photo into dreamy hand-painted anime art.",
    prompt: "Convert this photo into a dreamy hand-painted Japanese animated film style: soft watercolour backgrounds, warm nostalgic lighting, gentle painterly textures and expressive simplified features. Keep the person's likeness recognisable.",
    badge: "✨ Studio Anime",
    faq: [
      { q: "How do I convert a photo to Ghibli style?", a: "Upload your photo on this page and click Generate. The AI redraws it in a dreamy hand-painted animation style in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Can I use it as a wallpaper?", a: "Yes, download the full-quality image — pair it with our free upscaler for a sharper wallpaper-ready version." },
    ],
  },
  {
    slug: "y2k-aesthetic",
    emoji: "💿",
    gradient: ["#DB2777", "#7C3AED"],
    title: "AI Y2K Aesthetic Photo Filter — 2000s Style Photo Free | JPT AI",
    metaDescription:
      "Create a viral Y2K aesthetic photo free online. Upload a selfie and AI applies a 2000s-style filter on the page — no app, no watermark.",
    keywords: "ai y2k aesthetic filter, y2k photo editor free, 2000s style photo ai, y2k aesthetic generator online, ai y2k filter free",
    h1: "AI Y2K Aesthetic Photo Filter",
    tagline: "Upload a selfie and AI gives it that viral early-2000s Y2K look — right here, free.",
    intro: "Give any selfie the viral early-2000s Y2K look.",
    prompt: "Restyle this photo with a Y2K early-2000s aesthetic: flash-lit digital camera look, glossy highlights, low-rise fashion vibe, bold saturated colours and a slight grainy point-and-shoot quality. Keep the person's face and identity the same.",
    badge: "✨ Y2K",
    faq: [
      { q: "How do I get the Y2K look with AI?", a: "Upload your photo on this page and click Generate. The AI applies the flash-lit, saturated early-2000s look in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "Close-up selfies with simple backgrounds give the most authentic Y2K flash-photo look." },
    ],
  },
  {
    slug: "wedding-invite-photo",
    emoji: "💌",
    gradient: ["#BE185D", "#D97706"],
    title: "AI Wedding Invitation Photo Maker — Elegant Couple Portrait Free | JPT AI",
    metaDescription:
      "Create an elegant AI wedding invitation photo free online. Upload a couple photo and AI makes a refined portrait for your invite — no watermark.",
    keywords: "ai wedding invitation photo maker, wedding invite photo ai free, elegant couple portrait generator, save the date photo ai, wedding card photo maker free",
    h1: "AI Wedding Invitation Photo Maker",
    tagline: "Upload a couple photo and AI creates an elegant portrait ready for your wedding invite — free, instant.",
    intro: "An elegant couple portrait styled for wedding invitations.",
    prompt: "Transform this couple photo into an elegant wedding invitation portrait: refined formal attire, soft romantic lighting, a tasteful neutral or floral backdrop, and a timeless composition with space for text. Keep both faces and identities exactly the same.",
    badge: "✨ Invite Portrait",
    faq: [
      { q: "How do I make a wedding invite photo with AI?", a: "Upload a clear photo of the couple on this page and click Generate. The AI creates an elegant, invite-ready portrait in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I add text afterwards?", a: "Yes — the portrait is generated with clean space so you can add names and the date in any design tool." },
    ],
  },
  {
    slug: "corporate-avatar",
    emoji: "🧑‍💼",
    gradient: ["#0E7490", "#1E40AF"],
    title: "AI Corporate Avatar Maker — Professional Profile Icon Free | JPT AI",
    metaDescription:
      "Create a clean AI corporate avatar free online. Upload a selfie and AI makes a polished profile icon for Slack, Teams and email — no watermark.",
    keywords: "ai corporate avatar maker, professional profile picture ai free, ai work avatar generator, slack avatar maker ai, teams profile photo ai free",
    h1: "AI Corporate Avatar Maker",
    tagline: "Upload a selfie and AI creates a clean, professional profile icon — for Slack, Teams, email and more.",
    intro: "Turn a selfie into a clean professional profile icon.",
    prompt: "Turn this selfie into a clean, simplified professional avatar: smart business-casual attire, soft solid-colour background, friendly approachable expression, framed tightly like a profile icon. Keep the face and identity exactly the same.",
    badge: "✨ Corporate Avatar",
    faq: [
      { q: "How do I make a corporate avatar with AI?", a: "Upload a clear selfie on this page and click Generate. The AI produces a clean, professional profile icon in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Where can I use it?", a: "Great for Slack, Microsoft Teams, email signatures, and any work profile that needs a polished, simple headshot icon." },
    ],
  },
  {
    slug: "old-money-aesthetic",
    emoji: "🎻",
    gradient: ["#3F3F46", "#A16207"],
    title: "AI Old Money Aesthetic Photo — Quiet Luxury Portrait Free | JPT AI",
    metaDescription:
      "Create a viral old money aesthetic photo free online. Upload a photo and AI gives it a quiet-luxury, timeless styled look — no watermark.",
    keywords: "ai old money aesthetic photo, quiet luxury photo filter ai, old money style generator, ai old money outfit photo, timeless luxury photo ai free",
    h1: "AI Old Money Aesthetic Photo",
    tagline: "Upload a photo and AI gives it that viral quiet-luxury 'old money' look — right here, free.",
    intro: "Give any photo the viral quiet-luxury 'old money' look.",
    prompt: "Restyle this photo with an old-money quiet-luxury aesthetic: tailored neutral-toned classic clothing, soft natural light, an elegant estate or library-style backdrop, and a timeless understated mood. Keep the person's face and identity exactly the same.",
    badge: "✨ Old Money",
    faq: [
      { q: "How do I get the old money look with AI?", a: "Upload your photo on this page and click Generate. The AI restyles it with tailored neutral tones and an elegant timeless mood in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear portrait with simple lighting gives the AI the cleanest base to build the elegant styling on." },
    ],
  },
  {
    slug: "barbie-box",
    emoji: "📦",
    gradient: ["#EC4899", "#A21CAF"],
    title: "AI Barbie Box Photo Maker — Doll Box Trend Free | JPT AI",
    metaDescription:
      "Create the viral AI Barbie box photo free online. Upload a selfie and AI puts you in a collectible doll box on the page — no app, no watermark.",
    keywords: "ai barbie box photo, barbie box trend ai free, doll box photo maker, ai barbie doll photo generator, barbie box meme maker free",
    h1: "AI Barbie Box Photo Maker",
    tagline: "Upload a selfie and AI turns you into a collectible doll-box photo — the viral Barbie box trend, free.",
    intro: "Turn yourself into the viral collectible doll-box trend.",
    prompt: "Turn this person into a collectible doll in a pink Barbie-style retail box: glossy plastic packaging, bold pink branding elements, printed accessories around the figure, studio product-photography lighting. Keep the face and likeness accurate.",
    badge: "✨ Doll Box",
    faq: [
      { q: "How do I make a Barbie box photo with AI?", a: "Upload a clear photo on this page and click Generate. The AI places you in a collectible doll-box packaging style in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear, front-facing or half-body photo with a simple background gives the cleanest box-photo result." },
    ],
  },
  {
    slug: "ai-baby-predictor",
    emoji: "👶",
    gradient: ["#FB7185", "#60A5FA"],
    title: "AI Baby Predictor — Future Baby Face Generator Free | JPT AI",
    metaDescription:
      "See what your future baby might look like with the AI baby predictor free online. Upload both parents' photos and AI blends a baby face — no watermark.",
    keywords: "ai baby predictor, future baby face generator free, ai baby maker couple, what will my baby look like ai, ai baby face generator free",
    h1: "AI Baby Predictor",
    tagline: "Upload a couple's photo and AI imagines a future baby's face — just for fun, free and instant.",
    intro: "A fun AI guess at what your future baby might look like.",
    prompt: "Using the features of the people in this photo, imagine and generate a cute baby portrait that blends their facial features — soft studio baby-portrait lighting, warm pastel tones, a gentle smile. This is a playful, for-fun illustration, not a scientific prediction.",
    badge: "✨ Baby Predictor",
    faq: [
      { q: "How does the AI baby predictor work?", a: "Upload a clear photo of the couple on this page and click Generate. The AI blends facial features into a fun, illustrative baby portrait in seconds." },
      { q: "Is this scientifically accurate?", a: "No — it's a fun, playful illustration for entertainment, not a genetic or medical prediction of your actual future child." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
    ],
  },
  {
    slug: "lego-minifigure",
    emoji: "🧱",
    gradient: ["#DC2626", "#FACC15"],
    title: "AI Lego Minifigure Maker — Turn Photo Into a Lego Figure Free | JPT AI",
    metaDescription:
      "Turn your photo into a Lego minifigure free online. Upload a photo and AI renders a collectible brick-style figure on the page — no watermark.",
    keywords: "ai lego minifigure maker, photo to lego figure ai, lego avatar generator free, ai lego character maker, turn photo into lego free",
    h1: "AI Lego Minifigure Maker",
    tagline: "Upload your photo and AI turns you into a collectible Lego-style minifigure — free, instant.",
    intro: "Turn your photo into a collectible brick-style minifigure.",
    prompt: "Turn this person into a glossy plastic Lego-style minifigure: cylindrical head, simplified blocky body proportions, bright primary-colour outfit matching their real clothing, displayed in a printed toy packaging box, studio product photography lighting. Keep the likeness recognisable in a toy form.",
    badge: "✨ Lego Figure",
    faq: [
      { q: "How do I turn my photo into a Lego figure?", a: "Upload a clear photo on this page and click Generate. The AI renders a collectible brick-style minifigure version of you in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear photo showing your outfit and pose helps the AI build a more accurate toy version." },
    ],
  },
  {
    slug: "pixar-avatar",
    emoji: "🎬",
    gradient: ["#0EA5E9", "#F97316"],
    title: "AI Pixar Avatar Maker — 3D Cartoon Character Photo Free | JPT AI",
    metaDescription:
      "Turn your photo into a Pixar-style 3D cartoon avatar free online. Upload a selfie and AI renders an animated-movie character on the page — no watermark.",
    keywords: "ai pixar avatar maker, photo to pixar character ai, 3d cartoon avatar generator free, ai animated movie character maker, pixar style photo free",
    h1: "AI Pixar Avatar Maker",
    tagline: "Upload a selfie and AI turns you into a 3D animated-movie-style character — free and instant.",
    intro: "Turn a selfie into a 3D animated-movie-style character.",
    prompt: "Convert this photo into a 3D animated-movie-style character: large expressive eyes, smooth stylised features, warm cinematic studio lighting, soft rounded shading typical of modern 3D animated films. Keep the person's likeness recognisable in cartoon form.",
    badge: "✨ 3D Avatar",
    faq: [
      { q: "How do I make a Pixar-style avatar?", a: "Upload your photo on this page and click Generate. The AI redraws it as a 3D animated-movie-style character in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I use it as a profile picture?", a: "Yes, download the full-quality image and use it anywhere — profile pictures, avatars, prints." },
    ],
  },
  {
    slug: "renaissance-portrait",
    emoji: "🖼️",
    gradient: ["#7C2D12", "#CA8A04"],
    title: "AI Renaissance Portrait Maker — Classic Oil Painting Photo Free | JPT AI",
    metaDescription:
      "Turn your photo into a classic Renaissance oil painting free online. Upload a selfie and AI creates a museum-style portrait on the page — no watermark.",
    keywords: "ai renaissance portrait maker, photo to oil painting ai free, classic painting photo generator, ai museum portrait maker, renaissance art photo free",
    h1: "AI Renaissance Portrait Maker",
    tagline: "Upload a selfie and AI turns you into a classic Renaissance-style oil painting — free, instant.",
    intro: "Turn a selfie into a museum-style oil painting portrait.",
    prompt: "Transform this photo into a classic Renaissance oil painting portrait: rich dramatic chiaroscuro lighting, ornate period clothing, a dark museum-style background, visible brushwork texture and a gilded frame feel. Keep the person's face recognisable in painted form.",
    badge: "✨ Renaissance",
    faq: [
      { q: "How do I make a Renaissance-style portrait?", a: "Upload your photo on this page and click Generate. The AI repaints it as a classic oil-painting portrait in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I print it?", a: "Yes — download the full-quality image and pair it with our free upscaler for a sharper, print-ready version." },
    ],
  },
  {
    slug: "age-progression",
    emoji: "⏳",
    gradient: ["#475569", "#94A3B8"],
    title: "AI Age Progression Photo — See Yourself Older or Younger Free | JPT AI",
    metaDescription:
      "See yourself older or younger with the AI age progression photo tool free online. Upload a selfie and AI ages the photo on the page — no watermark.",
    keywords: "ai age progression photo, ai aging filter free, see myself older ai, ai younger photo generator, age my photo ai free",
    h1: "AI Age Progression Photo",
    tagline: "Upload a selfie and AI shows a realistic older (or younger) version of you — free, for fun.",
    intro: "A realistic, just-for-fun preview of an older you.",
    prompt: "Realistically age this person by about 30 years: natural greying hair, age-appropriate skin texture and wrinkles, the same facial structure and expression, soft natural lighting. Keep the identity clearly recognisable — this is a stylised illustration, not a medical prediction.",
    badge: "✨ Age Progression",
    faq: [
      { q: "How accurate is the AI age progression?", a: "It's a stylised, illustrative guess based on common ageing patterns — fun to look at, not a scientific or medical prediction." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can it make me look younger instead?", a: "The default preset ages you up; try re-running with your own description in the full AI Editor for a de-aged look." },
    ],
  },
  {
    slug: "superhero-costume",
    emoji: "🦸",
    gradient: ["#1D4ED8", "#DC2626"],
    title: "AI Superhero Costume Maker — Turn Photo Into a Hero Free | JPT AI",
    metaDescription:
      "Turn your photo into a superhero free online. Upload a selfie and AI dresses you in a heroic costume on the page — no app, no watermark.",
    keywords: "ai superhero costume maker, photo to superhero ai free, superhero avatar generator, ai hero costume photo, turn photo into superhero free",
    h1: "AI Superhero Costume Maker",
    tagline: "Upload a selfie and AI suits you up as a superhero — dramatic cape and all. Free, instant.",
    intro: "Turn a selfie into a dramatic superhero portrait.",
    prompt: "Transform this person into a superhero: a sleek detailed costume with a flowing cape, a heroic confident pose, dramatic comic-movie lighting and a city-skyline backdrop. Keep the person's face and identity exactly the same.",
    badge: "✨ Superhero",
    faq: [
      { q: "How do I make a superhero photo with AI?", a: "Upload a clear photo on this page and click Generate. The AI suits you up in a heroic costume with cinematic lighting in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear, front-facing photo with a visible pose gives the most dynamic superhero result." },
    ],
  },
  {
    slug: "tarot-card-portrait",
    emoji: "🔮",
    gradient: ["#581C87", "#B45309"],
    title: "AI Tarot Card Portrait Maker — Mystical Card Photo Free | JPT AI",
    metaDescription:
      "Turn your photo into a mystical tarot card free online. Upload a selfie and AI designs a custom tarot-style portrait on the page — no watermark.",
    keywords: "ai tarot card portrait maker, photo to tarot card ai free, mystical card photo generator, ai tarot avatar maker, tarot style photo free",
    h1: "AI Tarot Card Portrait Maker",
    tagline: "Upload a selfie and AI designs a mystical custom tarot card around your portrait — free, instant.",
    intro: "Turn a selfie into a custom mystical tarot card design.",
    prompt: "Design a mystical tarot card around this person's portrait: ornate gold border, celestial symbols (moon, stars, sun), rich jewel-toned colours, dramatic painterly lighting, and an elegant card-style composition. Keep the person's face recognisable within the artwork.",
    badge: "✨ Tarot Card",
    faq: [
      { q: "How do I make a tarot card portrait with AI?", a: "Upload your photo on this page and click Generate. The AI designs a mystical tarot-card composition around your portrait in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I print it?", a: "Yes — download the full-quality image and pair it with our free upscaler for a sharper print-ready version." },
    ],
  },
  {
    slug: "90s-yearbook-photo",
    emoji: "📒",
    gradient: ["#0D9488", "#D97706"],
    title: "AI 90s Yearbook Photo Maker — Retro School Portrait Free | JPT AI",
    metaDescription:
      "Create a viral 90s yearbook photo free online. Upload a selfie and AI applies a retro school-portrait look on the page — no app, no watermark.",
    keywords: "ai 90s yearbook photo maker, retro yearbook photo ai free, school portrait generator ai, 90s photo filter free, ai yearbook style photo",
    h1: "AI 90s Yearbook Photo Maker",
    tagline: "Upload a selfie and AI gives it that viral retro 90s school-yearbook look — free, instant.",
    intro: "Give any selfie the viral retro 90s yearbook look.",
    prompt: "Restyle this photo as a 90s school yearbook portrait: laser-grid or marbled studio backdrop, soft flash lighting, slightly retro hairstyle and clothing styling, a faint film-photo grain. Keep the person's face and identity exactly the same.",
    badge: "✨ 90s Yearbook",
    faq: [
      { q: "How do I make a 90s yearbook photo with AI?", a: "Upload your photo on this page and click Generate. The AI applies the retro school-portrait backdrop and styling in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear, front-facing photo with simple lighting gives the most authentic retro yearbook look." },
    ],
  },
  {
    slug: "cyberpunk-avatar",
    emoji: "🤖",
    gradient: ["#06B6D4", "#D946EF"],
    title: "AI Cyberpunk Avatar Maker — Neon Futuristic Photo Free | JPT AI",
    metaDescription:
      "Turn your photo into a cyberpunk avatar free online. Upload a selfie and AI adds neon futuristic styling on the page — no app, no watermark.",
    keywords: "ai cyberpunk avatar maker, neon futuristic photo ai free, cyberpunk photo filter, ai sci-fi avatar generator, cyberpunk style photo free",
    h1: "AI Cyberpunk Avatar Maker",
    tagline: "Upload a selfie and AI transforms it into a neon-lit cyberpunk avatar — free, instant.",
    intro: "Turn a selfie into a neon-lit futuristic cyberpunk avatar.",
    prompt: "Transform this photo into a cyberpunk-style portrait: neon pink and cyan lighting, futuristic city backdrop, subtle tech-inspired accessories, dramatic rim lighting and a high-contrast sci-fi mood. Keep the person's face and identity exactly the same.",
    badge: "✨ Cyberpunk",
    faq: [
      { q: "How do I make a cyberpunk avatar with AI?", a: "Upload your photo on this page and click Generate. The AI applies neon futuristic lighting and styling in seconds." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I use it as a profile picture?", a: "Yes — it's a popular gaming and social profile picture style." },
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
  "linkedin-banner": {
    paragraphs: [
      "Most LinkedIn profiles use the default banner, which is a missed chance — a good cover image is free real estate that makes a profile look intentional. Hiring a designer for one image rarely happens.",
      "Upload a photo or just a colour you like, and the AI generates a clean, corporate-toned banner with the negative space a real banner needs for your headline or branding. It's built to look professional, not like a stock-photo cliché.",
    ],
    tipsTitle: "Tips for a banner that looks intentional",
    tips: [
      "Leave the left or right third clear in your mind — that's where LinkedIn's profile photo overlaps the banner.",
      "Try a couple of generations and pick the one with the calmest, least busy composition.",
      "Stick to one or two brand colours across your profile photo and banner for a cohesive look.",
    ],
  },
  "christmas-photo": {
    paragraphs: [
      "Getting an actual festive photoshoot done before the holidays rarely happens — everyone's busy, and the good light is gone by 5pm. This gives you the cozy Christmas portrait without the scheduling.",
      "Upload a selfie and the AI adds the string lights, the tree, the warm sweater and that golden bokeh glow people associate with holiday cards. It's a fast way to get a genuinely warm-looking photo for cards or socials.",
    ],
    tipsTitle: "Tips for the coziest Christmas photo",
    tips: [
      "A front-facing photo with good lighting on the face works best.",
      "Indoor photos blend most naturally with the warm festive backdrop.",
      "Try it on a few different photos — the lighting and decor vary each generation.",
    ],
  },
  "baby-photoshoot": {
    paragraphs: [
      "Professional newborn and baby photography is expensive, and babies are famously uncooperative with schedules. This gets you the soft studio look from a photo you already took at home.",
      "Upload a clear photo and the AI applies the gentle pastel tones, diffused light and clean backdrop that studio baby photography is known for — while keeping your baby looking exactly like your baby.",
    ],
    tipsTitle: "Tips for the sweetest baby portrait",
    tips: [
      "Use a calm, well-lit photo — sleeping or content expressions work beautifully.",
      "A simple background in the original photo helps the AI build a cleaner studio backdrop.",
      "Avoid heavy shadows across the face for the gentlest result.",
    ],
  },
  "graduation-photo": {
    paragraphs: [
      "Not everyone gets the official cap-and-gown shot — ceremonies get cancelled, photographers run out of time, or you just want another version. This recreates that proud moment from any selfie.",
      "Upload a clear photo and the AI adds the cap, gown, diploma and a ceremony-style backdrop, keeping your face exactly as it is. It's become a popular way to mark the milestone even without the formal event photo.",
    ],
    tipsTitle: "Tips for a convincing graduation portrait",
    tips: [
      "A front-facing, well-lit selfie gives the cleanest result.",
      "Simple backgrounds in the original photo help the ceremony backdrop blend naturally.",
      "Re-run it if the first gown colour or pose doesn't feel right — each pass varies slightly.",
    ],
  },
  "gym-transformation": {
    paragraphs: [
      "Fitness motivation content is everywhere, and a stylised 'future you' photo is a fun, harmless way to visualize a goal — not a medical prediction, just an energising piece of motivation art.",
      "Upload a photo and the AI applies gym lighting, workout styling and an athletic mood while keeping your actual face and identity. People use it for motivation boards, before-you-start posts, or just for fun.",
    ],
    tipsTitle: "Tips for the best motivational result",
    tips: [
      "A clear, well-lit photo gives the most natural gym-styled result.",
      "Remember this is stylised motivation art, not a fitness or medical forecast.",
      "Pair it with a real workout plan — the photo is the spark, not the substitute.",
    ],
  },
  "ghibli-style": {
    paragraphs: [
      "That soft, hand-painted Japanese animation look has a huge following, and turning a real photo into it used to mean a skilled illustrator and a long wait. This does it from any photo, instantly.",
      "Upload a photo and the AI repaints it with watercolour backgrounds, warm nostalgic light and gently simplified, expressive features — while keeping you recognisable. Great for profile pictures, prints or just admiring.",
    ],
    tipsTitle: "Tips for the dreamiest result",
    tips: [
      "Photos with some background scenery (not just a tight face crop) translate best into the painterly style.",
      "Soft natural light in the original photo carries through beautifully.",
      "Re-run for variation — the brushwork and palette shift a little each time.",
    ],
  },
  "y2k-aesthetic": {
    paragraphs: [
      "The early-2000s digital-camera look — flash, grain, saturated colour — is back everywhere on social feeds. Recreating it convincingly from a modern photo takes some specific editing knowledge. This does it in one click.",
      "Upload a selfie and the AI applies that glossy flash-lit, slightly grainy Y2K look while keeping your face the same. It's an easy way to make a normal photo feel like it was pulled from a 2003 digital camera roll.",
    ],
    tipsTitle: "Tips for an authentic Y2K look",
    tips: [
      "Close-up selfies with a plain background give the most convincing flash-photo feel.",
      "Bold, simple outfits read better in the saturated Y2K colour grade.",
      "Try a few runs — the grain and flash intensity vary each time.",
    ],
  },
  "wedding-invite-photo": {
    paragraphs: [
      "A proper engagement shoot isn't always in the budget or the calendar, but the invitation still needs a great photo of the two of you. This builds that elegant portrait from a photo you already have together.",
      "Upload a clear couple photo and the AI styles it with refined attire, soft romantic light and a tasteful backdrop with room for your names and date — ready to drop straight into invitation design software.",
    ],
    tipsTitle: "Tips for an invite-ready portrait",
    tips: [
      "Choose a photo where both faces are clearly visible and evenly lit.",
      "Standing close together with simple backgrounds gives the cleanest, most elegant composition.",
      "Generate a couple of versions and pick the one with the calmest backdrop for text overlay.",
    ],
  },
  "corporate-avatar": {
    paragraphs: [
      "Work chat apps all want a profile picture, and most people end up using a cropped vacation photo or no photo at all. This gives you a clean, simple avatar built specifically for that small circular frame.",
      "Upload a selfie and the AI creates a friendly, professional-looking icon with business-casual styling and a calm solid background — designed to look good even at the tiny size Slack and Teams display it.",
    ],
    tipsTitle: "Tips for an avatar that reads well small",
    tips: [
      "Use a close, front-facing selfie — avatars get cropped tight and small.",
      "Good even lighting matters more than background detail here.",
      "A relaxed, approachable expression works best for a profile icon people see daily.",
    ],
  },
  "old-money-aesthetic": {
    paragraphs: [
      "The 'old money' quiet-luxury aesthetic — tailored neutrals, soft light, understated elegance — is one of the most consistent viral photo trends. Building that look usually means a wardrobe and a location most people don't have.",
      "Upload a photo and the AI restyles it with that timeless, tailored, soft-lit mood while keeping you exactly recognisable. It works well for profile photos, aesthetic social posts, or just seeing yourself in a different mood.",
    ],
    tipsTitle: "Tips for the most timeless result",
    tips: [
      "A calm, well-lit portrait gives the AI the cleanest base for the understated styling.",
      "Simple original backgrounds blend best with the elegant backdrop.",
      "Re-run a couple of times — the tone and styling shift subtly with each generation.",
    ],
  },
  "barbie-box": {
    paragraphs: [
      "The doll-box trend took over feeds for a reason — there's something irresistibly funny about seeing yourself as a collectible toy, complete with branded packaging and tiny printed accessories.",
      "Upload a clear photo and the AI packages you up in glossy pink retail-box styling, keeping your likeness intact while building the toy presentation around you. Great for a laugh, a profile picture, or just joining the trend.",
    ],
    tipsTitle: "Tips for the best doll-box photo",
    tips: [
      "A clear, front-facing or half-body photo gives the cleanest box composition.",
      "Simple backgrounds in the original photo help the AI focus on packaging you, not the scene.",
      "Bold, distinct outfits read better on the printed box art.",
    ],
  },
  "ai-baby-predictor": {
    paragraphs: [
      "Every couple eventually wonders what their kids might look like, and this is the fun, harmless way to find out — or at least get an entertaining guess. It's become one of the most shared AI photo trends among couples.",
      "Upload a clear photo of both of you and the AI blends your features into a sweet illustrated baby portrait. It's playful entertainment, not a genetics tool — think of it as a fun keepsake rather than a forecast.",
    ],
    tipsTitle: "Tips for the sweetest result",
    tips: [
      "Use a photo where both faces are clearly visible and well lit.",
      "Front-facing shots work better than angled or side profiles.",
      "Re-run it a few times — each pass blends the features a little differently.",
    ],
  },
  "lego-minifigure": {
    paragraphs: [
      "Building a custom Lego figure of yourself by hand takes specialised 3D skills most people don't have. This gets the same charming brick-toy effect from a single photo.",
      "Upload a photo and the AI turns you into a glossy, blocky minifigure — complete with your outfit's colours — and drops it into toy packaging for that shelf-ready look. A fun gift idea or just a profile picture upgrade.",
    ],
    tipsTitle: "Tips for the best minifigure",
    tips: [
      "A clear photo showing your outfit and pose helps the AI build a more recognisable toy version.",
      "Bold, simple colours in your clothing translate best into the brick-toy style.",
      "Full-body or waist-up shots work better than tight face crops.",
    ],
  },
  "pixar-avatar": {
    paragraphs: [
      "That polished 3D animated-movie look — big expressive eyes, soft cinematic lighting — usually takes a studio pipeline to create. This gets you there from a single selfie.",
      "Upload a photo and the AI redraws you as a stylised 3D character, keeping your likeness recognisable while giving you that warm, rounded animated-film quality. Great as an avatar, profile picture, or just to see yourself animated.",
    ],
    tipsTitle: "Tips for the best 3D avatar",
    tips: [
      "A clear, front-facing selfie with good lighting converts the most accurately.",
      "Simple backgrounds let the AI focus on stylising your features.",
      "Try a few runs — the exact styling shifts slightly each time.",
    ],
  },
  "renaissance-portrait": {
    paragraphs: [
      "Classic oil-painting portraits have a timeless gravity that modern photos don't — the dramatic light, the rich colour, the sense of history. Commissioning a real painted portrait costs a fortune and takes months. This takes seconds.",
      "Upload a selfie and the AI repaints you with the dramatic chiaroscuro lighting and ornate styling of a Renaissance masterpiece, while keeping your face recognisable beneath the brushwork. A striking print, a unique gift, or just a fun transformation.",
    ],
    tipsTitle: "Tips for the most striking portrait",
    tips: [
      "A clear, well-lit front-facing photo gives the painting the strongest likeness to work from.",
      "Simple original backgrounds blend more naturally into the dark museum-style backdrop.",
      "Pair the result with our free upscaler if you want a sharper, print-ready version.",
    ],
  },
  "age-progression": {
    paragraphs: [
      "Curiosity about your future self is universal — and a stylised preview is a fun way to satisfy it without waiting decades. This is illustrative entertainment, not a scientific forecast, but it's a surprisingly fun one.",
      "Upload a clear selfie and the AI ages your features naturally — greying hair, softened skin texture — while keeping your identity obviously recognisable. People use it for fun, for laughs with friends, or just out of curiosity.",
    ],
    tipsTitle: "Tips for the most natural result",
    tips: [
      "A clear, front-facing photo with even lighting ages the most convincingly.",
      "Remember this is a stylised illustration, not a medical or scientific prediction.",
      "Try it on a few different photos — results vary with expression and lighting.",
    ],
  },
  "superhero-costume": {
    paragraphs: [
      "Everyone's imagined their superhero alter ego at some point. This skips the cosplay budget and the photoshoot and gets straight to the dramatic cape-and-costume payoff.",
      "Upload a clear photo and the AI suits you up in a sleek heroic costume with cinematic comic-movie lighting, keeping your face exactly as it is. Great for a fun profile picture or just living the fantasy for thirty seconds.",
    ],
    tipsTitle: "Tips for the most dynamic hero shot",
    tips: [
      "A clear, front-facing photo with a visible pose gives the most dynamic result.",
      "Simple backgrounds help the AI build a cleaner heroic backdrop around you.",
      "Re-run a couple of times — the costume style and pose vary each generation.",
    ],
  },
  "tarot-card-portrait": {
    paragraphs: [
      "Tarot card aesthetics — gold borders, celestial symbols, rich jewel tones — make for some of the most strikingly designed art on social feeds. Designing one by hand takes real illustration skill. This builds one around your own portrait.",
      "Upload a selfie and the AI frames you in an ornate mystical card design, complete with celestial symbolism and dramatic painterly lighting, while keeping your face recognisable in the artwork. A unique profile picture or a fun personalised print.",
    ],
    tipsTitle: "Tips for the most mystical result",
    tips: [
      "A clear, well-lit portrait gives the artwork the strongest base to build around.",
      "Front-facing photos integrate most naturally into the symmetrical card design.",
      "Pair it with our free upscaler for a sharper, print-ready version.",
    ],
  },
  "90s-yearbook-photo": {
    paragraphs: [
      "That unmistakable 90s school-photo aesthetic — laser-grid backdrops, soft flash, slightly awkward charm — has become a genuinely beloved nostalgia trend. This recreates it from any modern selfie.",
      "Upload a photo and the AI applies the retro studio backdrop, flash lighting and period styling while keeping your face the same. It's a fun, funny throwback for social posts, no actual yearbook required.",
    ],
    tipsTitle: "Tips for the most authentic throwback",
    tips: [
      "A clear, front-facing selfie with simple lighting gives the most convincing retro studio look.",
      "Close-up portraits work best — yearbook photos are tightly framed.",
      "Re-run a couple of times for different backdrop and styling variations.",
    ],
  },
  "cyberpunk-avatar": {
    paragraphs: [
      "Neon-lit, high-contrast cyberpunk aesthetics are a staple of gaming and sci-fi profile pictures, but building that look convincingly takes specific lighting and editing knowledge. This applies it in one step.",
      "Upload a selfie and the AI adds neon pink and cyan lighting, a futuristic backdrop and dramatic rim light, while keeping your face exactly as it is. A striking avatar for gaming profiles, Discord, or just a futuristic alter ego.",
    ],
    tipsTitle: "Tips for the most striking cyberpunk look",
    tips: [
      "A clear, front-facing photo with simple lighting gives the neon effects the cleanest base.",
      "Darker original backgrounds blend most naturally with the neon-lit futuristic backdrop.",
      "Try a few runs — the neon colour balance varies each generation.",
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
