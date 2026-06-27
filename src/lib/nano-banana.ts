import { DEFAULT_CONFIGS, PageSEO, PageFAQ } from "@/lib/page-config";

/**
 * nano-banana.ts — high-traffic trend/action landing pages targeting the
 * "Nano Banana" (Gemini AI image) search wave, which is among the highest-volume
 * AI image queries of 2025-2026 (especially in India). Each page is an
 * indexed SEO landing page rendered by the shared LandingPage component and
 * sends users into the AI editor.
 *
 * Titles are CTR-optimised: power word + primary keyword front-loaded in the
 * first ~40 chars, "Free" + "Online" qualifiers, brand at the end.
 */

export interface NanoBananaPage {
  slug: string;               // URL segment under /nano-banana
  title: string;              // <title>
  metaDescription: string;
  keywords: string;
  h1: string;
  subtitle: string;
  cta_text: string;
  intro: string;             // short hub-card description
  emoji: string;             // hub-card icon
  promptExamples: string[];  // example prompts shown on page / used for E-E-A-T
  faq: PageFAQ[];
}

export const NANO_BANANA_BASE = "/nano-banana";
// Nano Banana pages route into the AI editor (text-prompt editing).
export const NANO_BANANA_TOOL_HREF = "/editor?tool=ai-edit";
export const NANO_BANANA_PAGE_ID = "ai-editor";

export const NANO_BANANA_PAGES: NanoBananaPage[] = [
  {
    slug: "saree-photoshoot",
    emoji: "🥻",
    title: "Free Nano Banana Saree Photoshoot — Vintage Saree AI Editor | JPT AI",
    metaDescription:
      "Create the viral Nano Banana vintage saree photoshoot free online. Turn any selfie into a cinematic saree portrait with AI — no app, no watermark.",
    keywords: "nano banana saree, nano banana saree photoshoot, vintage saree ai photoshoot, nano banana saree prompt, ai saree photo editor free",
    h1: "Nano Banana Saree Photoshoot — Free AI Editor",
    subtitle: "Recreate the viral vintage saree trend. Upload a selfie, describe the saree look you want, and AI generates a cinematic portrait in seconds — free, no watermark.",
    cta_text: "Create Saree Photoshoot Free",
    intro: "Turn a selfie into the viral cinematic vintage saree portrait.",
    promptExamples: [
      "Transform into a 90s vintage Bollywood saree portrait, warm cinematic lighting, film grain",
      "Royal red silk saree, gold jewellery, palace backdrop, soft golden hour glow",
      "Elegant white chiffon saree, rainy window, moody cinematic tones",
    ],
    faq: [
      { q: "How do I do the Nano Banana saree photoshoot?", a: "Upload a clear selfie, type a saree prompt like '90s vintage Bollywood saree, cinematic lighting', and the AI generates a styled portrait in seconds. You can refine the prompt and regenerate for free." },
      { q: "Is the Nano Banana saree editor free?", a: "Yes. Sign in with Google for free daily credits — enough to create several saree portraits a day with no watermark." },
      { q: "What photo works best?", a: "A clear, well-lit, front-facing selfie gives the most realistic saree results. Avoid heavy shadows or extreme angles." },
    ],
  },
  {
    slug: "3d-figurine",
    emoji: "🧍",
    title: "Free Nano Banana 3D Figurine Maker — Turn Photo Into Figure | JPT AI",
    metaDescription:
      "Make the viral Nano Banana 3D figurine free online. Turn your photo into a collectible action-figure / statue with AI — no app needed, no watermark.",
    keywords: "nano banana 3d figurine, nano banana figurine prompt, photo to 3d figure ai, ai action figure maker free, nano banana statue",
    h1: "Nano Banana 3D Figurine Maker — Free",
    subtitle: "Turn yourself into a collectible 3D figurine or action figure. Upload a photo, apply the viral figurine prompt, and download your mini-me — free and instant.",
    cta_text: "Make My 3D Figurine Free",
    intro: "Turn your photo into a collectible 3D action figure.",
    promptExamples: [
      "Turn into a 1/7 scale collectible figurine on a desk, with packaging box behind it",
      "Detailed PVC action figure on a round base, studio product photography",
      "Cute chibi 3D figure, glossy plastic, soft studio lighting",
    ],
    faq: [
      { q: "How do I make a 3D figurine with Nano Banana?", a: "Upload a full or half-body photo, use a figurine prompt like 'turn into a 1/7 scale collectible figurine with packaging box', and the AI renders a realistic figure version of you." },
      { q: "Is the figurine maker free?", a: "Yes — free daily credits with no watermark on your download." },
      { q: "What kind of photo should I upload?", a: "A clear photo showing your full body or upper body works best so the figure captures your pose and outfit." },
    ],
  },
  {
    slug: "retro-bollywood",
    emoji: "🎬",
    title: "Free Nano Banana Retro Bollywood Photo Editor Online | JPT AI",
    metaDescription:
      "Make viral Nano Banana retro 90s Bollywood photos free online. Cinematic vintage film look from any selfie with AI — no app, no watermark.",
    keywords: "nano banana retro, nano banana bollywood, 90s bollywood photo ai, retro film photo editor free, vintage cinematic ai photo",
    h1: "Nano Banana Retro Bollywood Editor — Free",
    subtitle: "Give any photo the viral retro 90s Bollywood film look — warm tones, grain and cinematic drama. Upload, prompt, and download free with no watermark.",
    cta_text: "Create Retro Photo Free",
    intro: "Give any selfie the viral 90s Bollywood film look.",
    promptExamples: [
      "90s Bollywood film still, warm cinematic colour grade, soft film grain",
      "Retro vintage poster look, dramatic lighting, nostalgic tones",
      "Old film photograph, faded colours, analog grain, cinematic framing",
    ],
    faq: [
      { q: "How do I get the retro Bollywood look?", a: "Upload your photo and apply a prompt like '90s Bollywood film still, warm cinematic grade, film grain'. The AI restyles it with vintage tones and drama." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I use my own photo?", a: "Yes. Any clear photo of a person works; portraits give the most cinematic results." },
    ],
  },
  {
    slug: "polaroid-with-celebrity",
    emoji: "📸",
    title: "Free Nano Banana Polaroid With Celebrity Photo Maker | JPT AI",
    metaDescription:
      "Make the viral Nano Banana polaroid-with-celebrity photo free online. Create a realistic polaroid selfie with anyone using AI — no app, no watermark.",
    keywords: "nano banana polaroid, polaroid with celebrity ai, nano banana celebrity photo, ai polaroid selfie maker free, nano banana hug prompt",
    h1: "Nano Banana Polaroid Photo Maker — Free",
    subtitle: "Create the viral retro polaroid selfie trend with AI. Upload your photo, describe the scene, and get a realistic polaroid-style shot — free and instant.",
    cta_text: "Create Polaroid Photo Free",
    intro: "Create the viral retro polaroid selfie trend.",
    promptExamples: [
      "Vintage polaroid selfie, flash photography, slight blur, white polaroid border",
      "Retro 2000s polaroid, candid pose, warm indoor lighting",
      "Polaroid photo pinned on a wall, nostalgic film look",
    ],
    faq: [
      { q: "How do I make a Nano Banana polaroid photo?", a: "Upload your photo and use a polaroid prompt like 'vintage polaroid selfie, flash photography, white border'. The AI produces a realistic retro polaroid shot." },
      { q: "Is it free to use?", a: "Yes — free daily credits with no watermark." },
      { q: "What makes a good polaroid result?", a: "Clear, front-facing photos with simple backgrounds produce the most realistic polaroid style." },
    ],
  },
  {
    slug: "prompts",
    emoji: "✨",
    title: "Free Nano Banana Prompts — 50+ Viral AI Photo Ideas | JPT AI",
    metaDescription:
      "Free Nano Banana prompts and viral AI photo ideas you can try instantly online. Copy a prompt, upload a photo, and edit with AI — no app, no watermark.",
    keywords: "nano banana prompts, nano banana prompt list, viral ai photo prompts, free nano banana prompts, gemini image prompts",
    h1: "Free Nano Banana Prompts You Can Try Now",
    subtitle: "Browse viral Nano Banana prompts — saree, figurine, retro, polaroid and more — then try any of them instantly in our free AI editor. No app, no watermark.",
    cta_text: "Try a Prompt Free",
    intro: "Copy viral prompts and try them instantly.",
    promptExamples: [
      "90s vintage Bollywood saree portrait, cinematic lighting",
      "Turn into a 1/7 scale collectible figurine with packaging",
      "Vintage polaroid selfie, flash photography, white border",
      "Professional LinkedIn headshot, neutral studio background",
    ],
    faq: [
      { q: "What are Nano Banana prompts?", a: "They are short text instructions you give an AI image model (Google's Gemini 'Nano Banana') to transform a photo — like turning a selfie into a saree portrait or a 3D figurine. You can try the same prompts free in JPT AI's editor." },
      { q: "Can I use these prompts for free?", a: "Yes. Copy any prompt, upload a photo, and run it in the free AI editor — free daily credits, no watermark." },
      { q: "Do I need the Gemini app?", a: "No. JPT AI runs in your browser — no app download needed to try these viral prompt ideas." },
    ],
  },
  {
    slug: "ai-photo-editing",
    emoji: "🪄",
    title: "Free Nano Banana AI Photo Editor Online — Edit by Text | JPT AI",
    metaDescription:
      "Edit photos with Nano Banana-style AI free online. Change backgrounds, outfits and styles with a text prompt — no app, no Photoshop, no watermark.",
    keywords: "nano banana ai photo editing, nano banana editor online, ai photo editor text prompt free, edit photo with ai free, nano banana online",
    h1: "Nano Banana AI Photo Editor — Free Online",
    subtitle: "Edit any photo just by describing the change — outfits, backgrounds, styles, lighting. Nano Banana-style AI editing in your browser, free and watermark-free.",
    cta_text: "Edit Photo Free",
    intro: "Edit any photo just by describing the change.",
    promptExamples: [
      "Change my outfit to a formal black suit",
      "Replace the background with a sunset beach",
      "Make the lighting warm and cinematic",
    ],
    faq: [
      { q: "What is Nano Banana AI photo editing?", a: "It is text-prompt photo editing powered by AI — you describe a change in plain English and the model applies it. JPT AI offers the same prompt-based editing free in your browser." },
      { q: "Is it free and watermark-free?", a: "Yes — free daily credits and no watermark on downloads." },
      { q: "Do I need design skills?", a: "No. Just type what you want changed; the AI handles the rest." },
    ],
  },
  {
    slug: "restore-old-photos",
    emoji: "🖼️",
    title: "Free Nano Banana Old Photo Restoration Online | JPT AI",
    metaDescription:
      "Restore old, blurry and damaged photos free online with Nano Banana-style AI. Recover detail and colour from vintage family photos — no app, no watermark.",
    keywords: "nano banana restore old photos, restore old photo ai free, nano banana photo restoration, fix old blurry photo ai, colourise old photo free",
    h1: "Nano Banana Old Photo Restoration — Free",
    subtitle: "Bring old, faded and blurry family photos back to life with AI. Recover detail, sharpen faces, and enhance vintage photos — free online, no watermark.",
    cta_text: "Restore Old Photo Free",
    intro: "Bring faded, blurry family photos back to life.",
    promptExamples: [
      "Restore and sharpen this old photo, recover facial detail",
      "Repair scratches and enhance a faded vintage photograph",
      "Enhance and clean up a blurry scanned print",
    ],
    faq: [
      { q: "Can Nano Banana AI restore old photos?", a: "Yes. Upload a scanned or photographed old print and AI restoration recovers detail, sharpens faces, and reduces damage. JPT AI also lets you upscale the result to high resolution." },
      { q: "Is photo restoration free?", a: "Yes — free daily credits with no watermark." },
      { q: "What's the best way to scan an old photo?", a: "A flat, well-lit scan or a straight overhead photo on a plain surface gives the AI the most detail to work with." },
    ],
  },
  {
    slug: "couple-photoshoot",
    emoji: "💑",
    title: "Free Nano Banana Couple Photoshoot AI Editor Online | JPT AI",
    metaDescription:
      "Create viral Nano Banana couple photoshoots free online. Turn your photos into cinematic pre-wedding or saree couple portraits with AI — no watermark.",
    keywords: "nano banana couple photoshoot, ai couple photo editor free, nano banana pre wedding, cinematic couple portrait ai, nano banana couple prompt",
    h1: "Nano Banana Couple Photoshoot — Free AI",
    subtitle: "Turn your couple photos into cinematic pre-wedding or traditional saree portraits with AI. Upload, prompt, and download free — no studio, no watermark.",
    cta_text: "Create Couple Photoshoot Free",
    intro: "Cinematic pre-wedding & couple portraits from a photo.",
    promptExamples: [
      "Cinematic pre-wedding couple portrait, golden hour, soft bokeh",
      "Traditional couple in royal Indian wedding attire, palace backdrop",
      "Romantic rainy-day couple photo, moody cinematic tones",
    ],
    faq: [
      { q: "How do I make a couple photoshoot with AI?", a: "Upload a clear photo of the couple, describe the scene and outfits you want, and the AI generates a styled cinematic portrait. Refine the prompt and regenerate for free." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What photo works best?", a: "A clear photo where both faces are well-lit and visible gives the most realistic results." },
    ],
  },
  {
    slug: "professional-headshot",
    emoji: "💼",
    title: "Free Nano Banana Professional Headshot Generator | JPT AI",
    metaDescription:
      "Create a professional Nano Banana headshot free online. Turn a selfie into a LinkedIn-ready corporate portrait with AI — no photographer, no watermark.",
    keywords: "nano banana headshot, nano banana professional photo, ai headshot from selfie free, linkedin headshot ai, corporate portrait ai free",
    h1: "Nano Banana Professional Headshot — Free",
    subtitle: "Turn any selfie into a polished, LinkedIn-ready professional headshot with AI. Studio lighting and clean background in seconds — free, no watermark.",
    cta_text: "Generate Headshot Free",
    intro: "Turn a selfie into a LinkedIn-ready headshot.",
    promptExamples: [
      "Professional corporate headshot, neutral grey studio background, soft lighting",
      "LinkedIn headshot in a formal suit, confident expression",
      "Clean business portrait, blurred office background",
    ],
    faq: [
      { q: "How do I make a professional headshot from a selfie?", a: "Upload a clear selfie and apply a headshot prompt like 'professional corporate headshot, neutral studio background'. The AI produces a polished, professional portrait." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark. We also have a dedicated AI Headshot tool for more options." },
      { q: "Will it look natural?", a: "Yes. The AI uses realistic enhancement designed to look like professional photography, not an obvious filter." },
    ],
  },
  {
    slug: "festival-photoshoot",
    emoji: "🪔",
    title: "Free Nano Banana Festival Photoshoot — Diwali & Navratri AI | JPT AI",
    metaDescription:
      "Create festive Nano Banana photoshoots free online — Diwali, Navratri, Eid and more. Turn a selfie into a festive AI portrait with no app, no watermark.",
    keywords: "nano banana festival photoshoot, diwali photo editor ai, navratri photoshoot ai free, festival portrait ai, nano banana diwali prompt",
    h1: "Nano Banana Festival Photoshoot — Free AI",
    subtitle: "Celebrate in style — turn a selfie into a festive Diwali, Navratri or Eid portrait with AI. Traditional outfits and festive backdrops, free and instant.",
    cta_text: "Create Festival Photo Free",
    intro: "Festive Diwali, Navratri & Eid portraits from a selfie.",
    promptExamples: [
      "Diwali portrait with diyas, fairy lights and traditional attire, warm glow",
      "Navratri garba look, vibrant chaniya choli, festive backdrop",
      "Elegant Eid portrait, soft lighting, traditional outfit",
    ],
    faq: [
      { q: "How do I make a festival photoshoot with AI?", a: "Upload your selfie and apply a festive prompt like 'Diwali portrait with diyas and traditional attire'. The AI styles you with festive outfits and backdrops." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Can I try different festivals?", a: "Yes — just change the prompt to Diwali, Navratri, Eid, Christmas or any occasion and regenerate." },
    ],
  },
  {
    slug: "pet-portrait",
    emoji: "🐶",
    title: "Free Nano Banana Pet Portrait Maker — AI Pet Photos Online | JPT AI",
    metaDescription:
      "Create fun Nano Banana pet portraits free online. Turn your pet's photo into royal, cartoon or cinematic art with AI — no app needed, no watermark.",
    keywords: "nano banana pet portrait, ai pet photo editor free, royal pet portrait ai, cartoon pet photo maker, nano banana pet prompt",
    h1: "Nano Banana Pet Portrait Maker — Free",
    subtitle: "Turn your pet's photo into a royal, cartoon or cinematic masterpiece with AI. Upload, pick a style, and download a shareable pet portrait — free.",
    cta_text: "Create Pet Portrait Free",
    intro: "Turn your pet into royal or cartoon art.",
    promptExamples: [
      "Royal renaissance pet portrait wearing a crown and robe, oil painting style",
      "Cute cartoon version of my pet, vibrant colours",
      "Cinematic studio portrait of my pet, dramatic lighting",
    ],
    faq: [
      { q: "How do I make an AI pet portrait?", a: "Upload a clear photo of your pet and apply a style prompt like 'royal renaissance portrait with a crown'. The AI restyles your pet into shareable art." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "What pet photo works best?", a: "A clear, well-lit photo where your pet's face is visible gives the best results." },
    ],
  },
  {
    slug: "ghibli-style",
    emoji: "🎨",
    title: "Free Nano Banana Ghibli-Style Photo Converter Online | JPT AI",
    metaDescription:
      "Turn photos into Ghibli-style anime art free online with Nano Banana AI. Convert any selfie into hand-drawn animation style — no app, no watermark.",
    keywords: "nano banana ghibli, ghibli style photo ai free, anime photo converter free, nano banana anime, photo to ghibli art ai",
    h1: "Nano Banana Ghibli-Style Converter — Free",
    subtitle: "Transform any photo into dreamy hand-drawn Ghibli-style anime art with AI. Upload, apply the style, and download your illustration — free and instant.",
    cta_text: "Convert to Ghibli Style Free",
    intro: "Convert any photo into Ghibli-style anime art.",
    promptExamples: [
      "Convert to Studio Ghibli anime style, soft pastel colours, hand-drawn look",
      "Dreamy anime illustration, watercolour background, gentle lighting",
      "Whimsical hand-drawn animation portrait, warm tones",
    ],
    faq: [
      { q: "How do I convert a photo to Ghibli style?", a: "Upload your photo and apply a prompt like 'convert to Studio Ghibli anime style, soft pastel colours'. The AI redraws it as hand-drawn animation art." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Can I upscale the result?", a: "Yes. After converting, use the free upscaler to enlarge the artwork for printing or wallpapers." },
    ],
  },
  {
    slug: "passport-photo",
    emoji: "🛂",
    title: "Free Nano Banana Passport Photo Maker — White Background AI | JPT AI",
    metaDescription:
      "Make a passport / ID photo free online with Nano Banana AI. Get a regulation white-background headshot from a selfie in seconds — no app, no watermark.",
    keywords: "nano banana passport photo, ai passport photo maker free, white background id photo ai, passport size photo online free, nano banana id photo",
    h1: "Nano Banana Passport Photo Maker — Free",
    subtitle: "Turn a selfie into a clean, regulation passport or ID photo with a white background using AI. Free, instant, and watermark-free in your browser.",
    cta_text: "Make Passport Photo Free",
    intro: "Selfie to a clean white-background ID photo.",
    promptExamples: [
      "Convert to a passport photo with a plain white background, neutral expression",
      "Formal ID photo, even lighting, shoulders visible, white backdrop",
      "Clean visa photo, light blue background, front-facing",
    ],
    faq: [
      { q: "How do I make a passport photo with AI?", a: "Upload a front-facing selfie and apply a prompt for a plain white (or blue) background. The AI removes the existing background and produces a clean ID-style photo." },
      { q: "Is it free?", a: "Yes — free daily credits with no watermark." },
      { q: "Does it meet official requirements?", a: "It produces a clean solid-background headshot. Always check your country's exact size and head-position rules before submitting." },
    ],
  },
  {
    slug: "gym-physique",
    emoji: "💪",
    title: "Free Nano Banana Gym Body Photo Editor Online | JPT AI",
    metaDescription:
      "Try the viral Nano Banana gym / physique transformation free online. Visualise a fit body look from a photo with AI — no app needed, no watermark.",
    keywords: "nano banana gym, nano banana body transformation, ai physique editor free, fitness photo ai, nano banana muscle prompt",
    h1: "Nano Banana Gym Physique Editor — Free",
    subtitle: "Visualise the viral fitness transformation look with AI. Upload a photo, apply a physique prompt, and see a motivating fit-body preview — free and instant.",
    cta_text: "Try Physique Editor Free",
    intro: "Visualise a fit-body transformation from a photo.",
    promptExamples: [
      "Athletic muscular physique, gym lighting, fitness photoshoot",
      "Lean toned body transformation, studio fitness portrait",
      "Bodybuilder stage look, dramatic lighting",
    ],
    faq: [
      { q: "What is the Nano Banana gym trend?", a: "It's a viral AI edit that previews a fit, muscular physique from a normal photo. Upload a photo, apply a physique prompt, and the AI generates a motivating preview." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
      { q: "Is the result realistic?", a: "It's an AI visualisation for fun and motivation, not a medical or guaranteed outcome." },
    ],
  },
];

export const getNanoBananaPage = (slug: string) => NANO_BANANA_PAGES.find((p) => p.slug === slug);

/** Build a full PageSEO for a Nano Banana page by extending the AI-editor defaults. */
export function nanoBananaToConfig(p: NanoBananaPage): PageSEO {
  const base = DEFAULT_CONFIGS["ai-editor"];
  return {
    ...base,
    page_id: NANO_BANANA_PAGE_ID,
    title: p.title,
    meta_description: p.metaDescription,
    og_title: p.h1,
    og_description: p.metaDescription,
    keywords: p.keywords,
    h1: p.h1,
    subtitle: p.subtitle,
    cta_text: p.cta_text,
    faq: p.faq,
  };
}
