import { DEFAULT_CONFIGS, PageSEO, PageFAQ } from "@/lib/page-config";

export type ParentTool = "remove-bg" | "upscale" | "ai-headshot" | "ai-editor";

export interface LandingVariant {
  parent: ParentTool;
  slug: string;            // URL segment under the parent, e.g. "product-photos"
  title: string;          // <title>
  metaDescription: string;
  keywords: string;
  h1: string;
  subtitle: string;
  cta_text: string;
  faq: PageFAQ[];
}

// Parent → editor tool query + canonical base path
export const PARENT_META: Record<ParentTool, { toolHref: string; base: string }> = {
  "remove-bg":   { toolHref: "/editor?tool=remove-bg", base: "/remove-bg" },
  upscale:       { toolHref: "/editor?tool=upscale",   base: "/upscale" },
  "ai-headshot": { toolHref: "/ai-headshot",           base: "/ai-headshot" },
  "ai-editor":   { toolHref: "/editor?tool=ai-edit",   base: "/ai-editor" },
};

// pageId used by LandingPage for use-case blocks + imagery
export const PARENT_PAGE_ID: Record<ParentTool, string> = {
  "remove-bg": "remove-bg",
  upscale: "upscale",
  "ai-headshot": "headshot",
  "ai-editor": "ai-editor",
};

export const VARIANTS: LandingVariant[] = [
  // ───────── Remove BG use-cases ─────────
  {
    parent: "remove-bg",
    slug: "product-photos",
    title: "Free Background Remover for Product Photos — White Background in One Click | JPT AI",
    metaDescription: "Remove backgrounds from product photos free online. Get clean white or transparent backgrounds for Amazon, Shopify, Flipkart & Etsy listings in seconds — no watermark.",
    keywords: "product photo background remover free, white background product photo, amazon product photo background, ecommerce background remover free",
    h1: "Free Product Photo Background Remover",
    subtitle: "Turn any product shot into a clean white or transparent background — ready for Amazon, Shopify, Flipkart and Etsy. Free, instant, no watermark.",
    cta_text: "Remove Product Background Free",
    faq: [
      { q: "How do I get a white background for Amazon product photos?", a: "Upload your product photo, let the AI remove the background to transparent, then place it on a pure white (#FFFFFF) canvas in the editor. This meets Amazon's main-image white-background requirement." },
      { q: "Is it free to remove backgrounds from product photos?", a: "Yes. Sign in with Google for free daily credits — enough to process several product photos a day at no cost, with no watermark." },
      { q: "Can I batch-process a whole catalogue?", a: "Yes. Use the Batch Editor to remove backgrounds from up to 100 product photos in one session — ideal for large catalogues." },
      { q: "Does it keep fine edges like jewellery and fabric?", a: "Yes. The AI is trained to preserve fine edges including jewellery chains, fabric texture, and transparent packaging." },
    ],
  },
  {
    parent: "remove-bg",
    slug: "signature",
    title: "Free Signature Background Remover — Make Signature Transparent Online | JPT AI",
    metaDescription: "Remove the background from a signature free online. Get a clean transparent PNG of your signature for documents, contracts and e-signing in one click.",
    keywords: "signature background remover free, transparent signature png, remove white background from signature, signature transparent online free",
    h1: "Free Signature Background Remover",
    subtitle: "Upload a photo or scan of your signature and get a clean transparent PNG — perfect for contracts, PDFs and e-signatures. Free and instant.",
    cta_text: "Make Signature Transparent Free",
    faq: [
      { q: "How do I make my signature background transparent?", a: "Take a photo or scan of your signature on white paper, upload it, and the AI removes the white background — leaving a transparent PNG you can drop onto any document." },
      { q: "What format is the signature saved in?", a: "A transparent PNG, which preserves the transparency so your signature blends onto any document or background." },
      { q: "Is my signature stored or shared?", a: "No. Images are processed securely, never used for training, and automatically deleted after your session." },
    ],
  },
  {
    parent: "remove-bg",
    slug: "logo",
    title: "Free Logo Background Remover — Transparent Logo PNG Online | JPT AI",
    metaDescription: "Remove the background from a logo free online. Get a clean transparent PNG logo for websites, merch and presentations in one click — no watermark.",
    keywords: "logo background remover free, transparent logo png, remove white background from logo, make logo transparent free",
    h1: "Free Logo Background Remover",
    subtitle: "Turn any logo with a solid background into a clean transparent PNG — ready for websites, merchandise, and presentations. Free and instant.",
    cta_text: "Make Logo Transparent Free",
    faq: [
      { q: "How do I make a logo background transparent?", a: "Upload your logo image and the AI detects and removes the background, giving you a transparent PNG that works on any colour." },
      { q: "Will the edges of my logo stay sharp?", a: "Yes. The AI preserves crisp edges on text and shapes, so your transparent logo looks clean at any size." },
      { q: "Is it really free?", a: "Yes — free daily credits with no watermark on your downloaded transparent logo." },
    ],
  },
  {
    parent: "remove-bg",
    slug: "passport-photo",
    title: "Free Passport Photo Background Changer — White/Blue Background Online | JPT AI",
    metaDescription: "Change passport photo background to white or blue free online. AI removes the background instantly so you can meet visa and ID photo requirements — no watermark.",
    keywords: "passport photo background changer free, white background passport photo, change id photo background, visa photo background remover free",
    h1: "Free Passport Photo Background Changer",
    subtitle: "Remove and replace your passport or ID photo background with regulation white or blue — meets visa, passport and ID requirements. Free and instant.",
    cta_text: "Change Passport Background Free",
    faq: [
      { q: "How do I change my passport photo to a white background?", a: "Upload your photo, the AI removes the existing background to transparent, then set a plain white background in the editor to meet passport requirements." },
      { q: "Can I get a blue background for visa photos?", a: "Yes. After removing the background you can apply any solid colour, including the off-white or light-blue some countries require." },
      { q: "Does it meet official ID photo standards?", a: "The tool produces a clean solid background. Always check your country's exact dimension and head-position rules before submitting." },
    ],
  },
  // ───────── Upscale use-cases ─────────
  {
    parent: "upscale",
    slug: "old-photos",
    title: "Free Old Photo Enhancer — Restore & Upscale Blurry Old Photos with AI | JPT AI",
    metaDescription: "Restore and upscale old, blurry, low-resolution photos free with AI. Recover lost detail, reduce noise and sharpen vintage family photos online — no watermark.",
    keywords: "old photo enhancer free, restore old photos online free, upscale old photos ai, fix blurry old photos free, enhance vintage photo",
    h1: "Free Old Photo Enhancer & Restorer",
    subtitle: "Bring blurry, faded, low-resolution family photos back to life. AI recovers fine detail, reduces noise, and sharpens vintage photos — free online.",
    cta_text: "Restore Old Photo Free",
    faq: [
      { q: "Can AI fix a blurry old photo?", a: "Yes. AI super-resolution reconstructs detail and sharpens edges in old or blurry photos far better than traditional enlargement, which only stretches pixels." },
      { q: "Will it work on scanned printed photos?", a: "Yes. Scan your printed photo, upload it, and the AI enhances resolution, reduces grain, and sharpens details." },
      { q: "Is the old-photo enhancer free?", a: "Yes — free daily credits with no watermark on the restored image." },
    ],
  },
  {
    parent: "upscale",
    slug: "4k",
    title: "Free 4K Image Upscaler — Upscale Photos to 4K Resolution Online | JPT AI",
    metaDescription: "Upscale any image to 4K resolution free online with AI. Enhance photos up to 4× without losing quality — sharp, clean results with no watermark.",
    keywords: "4k image upscaler free, upscale image to 4k, ai 4k upscaler online free, increase image resolution to 4k",
    h1: "Free 4K Image Upscaler",
    subtitle: "Upscale any photo to crisp 4K resolution with AI super-resolution. Up to 4× larger with no loss of quality — free, instant, no watermark.",
    cta_text: "Upscale to 4K Free",
    faq: [
      { q: "Can I upscale an image to 4K for free?", a: "Yes. JPT AI upscales images up to 4× their original size — enough to reach 4K from most source photos — free with your daily credits." },
      { q: "Will upscaling to 4K blur the image?", a: "No. Unlike basic resizing, AI super-resolution reconstructs detail so the 4K result looks sharp and natural, not stretched." },
      { q: "What's the maximum output size?", a: "You can upscale up to 4× and to very large output dimensions — easily covering 4K and beyond for most images." },
    ],
  },
  {
    parent: "upscale",
    slug: "anime",
    title: "Free Anime & Art Upscaler — Upscale Anime Images to HD/4K with AI | JPT AI",
    metaDescription: "Upscale anime, illustrations and AI art free online. Enhance resolution to HD or 4K while keeping clean lines and vivid colour — no watermark.",
    keywords: "anime upscaler free, upscale anime image ai, ai art upscaler online free, enhance illustration resolution free",
    h1: "Free Anime & AI-Art Upscaler",
    subtitle: "Upscale anime, illustrations and AI-generated art to HD or 4K. Keep clean line-art and vivid colour while multiplying resolution — free and instant.",
    cta_text: "Upscale Anime Free",
    faq: [
      { q: "Does AI upscaling work on anime and illustrations?", a: "Yes. AI super-resolution enhances line-art, flat colour, and shading in anime and illustrations while keeping edges crisp." },
      { q: "Can I upscale AI-generated art for printing?", a: "Yes. Upscale AI art up to 4× to reach print-quality resolution for posters, merchandise, and large prints." },
      { q: "Is the anime upscaler free?", a: "Yes — free daily credits with no watermark on the upscaled image." },
    ],
  },
  {
    parent: "upscale",
    slug: "profile-picture",
    title: "Free Profile Picture Enhancer — Upscale & Sharpen Your PFP with AI | JPT AI",
    metaDescription: "Enhance and upscale your profile picture free online. Sharpen blurry PFPs for Instagram, LinkedIn, Discord and WhatsApp with AI — no watermark.",
    keywords: "profile picture enhancer free, upscale profile picture ai, sharpen pfp online free, enhance instagram profile photo",
    h1: "Free Profile Picture Enhancer",
    subtitle: "Sharpen and upscale your profile picture for Instagram, LinkedIn, Discord and WhatsApp. Crisp, clear PFPs with AI — free and instant.",
    cta_text: "Enhance Profile Picture Free",
    faq: [
      { q: "How do I make my profile picture less blurry?", a: "Upload your PFP and AI super-resolution sharpens detail and increases resolution, removing the blur that comes from compressed or small images." },
      { q: "What size should a profile picture be?", a: "Most platforms display PFPs at 400×400 or larger. Upscaling ensures your photo stays crisp even on high-resolution displays." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
    ],
  },
  // ───────── AI Headshot use-cases ─────────
  {
    parent: "ai-headshot",
    slug: "linkedin",
    title: "Free LinkedIn Headshot Generator — Professional Profile Photo with AI | JPT AI",
    metaDescription: "Create a professional LinkedIn headshot free with AI. Turn any selfie into a polished profile photo that gets 21× more views — no photographer, no watermark.",
    keywords: "linkedin headshot generator free, professional linkedin photo ai, ai profile photo for linkedin free, linkedin profile picture maker",
    h1: "Free LinkedIn Headshot Generator",
    subtitle: "Turn any selfie into a polished, professional LinkedIn headshot with AI. Profiles with great headshots get 21× more views — free and instant.",
    cta_text: "Generate LinkedIn Headshot Free",
    faq: [
      { q: "How do I make a professional LinkedIn photo from a selfie?", a: "Upload a clear, well-lit selfie and the AI generates a polished, professional-looking headshot suitable for LinkedIn and corporate profiles." },
      { q: "Do professional headshots really help on LinkedIn?", a: "Yes — LinkedIn profiles with professional headshots get up to 21× more profile views and 9× more connection requests." },
      { q: "Is the LinkedIn headshot generator free?", a: "Yes — free daily credits with no watermark on your headshot." },
    ],
  },
  {
    parent: "ai-headshot",
    slug: "corporate",
    title: "Free Corporate Headshot Generator — Team & Business Photos with AI | JPT AI",
    metaDescription: "Generate consistent corporate headshots free with AI. Professional team photos for company websites and directories without a studio — no watermark.",
    keywords: "corporate headshot generator free, business headshot ai, team photo generator free, professional company headshot online",
    h1: "Free Corporate Headshot Generator",
    subtitle: "Create consistent, professional corporate headshots for your whole team — for company websites, directories and media kits. No studio, free and instant.",
    cta_text: "Generate Corporate Headshot Free",
    faq: [
      { q: "Can I get consistent headshots for my whole team?", a: "Yes. Each team member uploads a selfie and the AI generates headshots with a consistent professional style for your website or directory." },
      { q: "Do I need a photographer or studio?", a: "No. The AI produces studio-quality results from a regular well-lit photo — no equipment or photographer needed." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
    ],
  },
  // ───────── AI Editor use-cases ─────────
  {
    parent: "ai-editor",
    slug: "change-background",
    title: "Free AI Background Changer — Replace Photo Background with Text Prompt | JPT AI",
    metaDescription: "Change any photo background free with AI. Describe a new scene in plain English — studio, beach, office — and AI replaces it instantly. No watermark.",
    keywords: "ai background changer free, replace photo background ai, change background online free, ai background generator free",
    h1: "Free AI Background Changer",
    subtitle: "Replace any photo background by simply describing the scene you want — studio, beach, office, sunset. AI generates and blends it instantly. Free.",
    cta_text: "Change Background Free",
    faq: [
      { q: "How do I change a photo background with AI?", a: "Upload your photo and type the background you want — like 'modern office' or 'sunset beach'. The AI removes the old background and generates the new scene." },
      { q: "Can I use a solid colour or my own image as the background?", a: "Yes. You can replace the background with a solid colour, a generated scene, or your own uploaded image." },
      { q: "Is the AI background changer free?", a: "Yes — free daily credits with no watermark." },
    ],
  },
  {
    parent: "ai-editor",
    slug: "remove-object",
    title: "Free AI Object Remover — Erase Objects & People from Photos Online | JPT AI",
    metaDescription: "Remove unwanted objects, people or text from photos free with AI. Describe what to erase and AI fills the gap naturally — no Photoshop, no watermark.",
    keywords: "ai object remover free, remove object from photo online free, erase people from photo ai, remove unwanted object free",
    h1: "Free AI Object Remover",
    subtitle: "Erase unwanted objects, people, or text from any photo by describing what to remove. AI fills the gap naturally — free, no Photoshop needed.",
    cta_text: "Remove Object Free",
    faq: [
      { q: "How do I remove an object from a photo for free?", a: "Upload your photo and describe the object to remove — like 'remove the person on the left'. The AI erases it and reconstructs the background." },
      { q: "Can it remove photobombers and unwanted people?", a: "Yes. Describe the person or area to remove and the AI fills the space with a natural-looking background." },
      { q: "Is it free?", a: "Yes — free daily credits, no watermark." },
    ],
  },
];

/** Build a full PageSEO config for a variant by extending its parent's defaults. */
export function variantToConfig(v: LandingVariant): PageSEO {
  const parentId = PARENT_PAGE_ID[v.parent];
  const base = DEFAULT_CONFIGS[parentId];
  return {
    ...base,
    page_id: parentId,
    title: v.title,
    meta_description: v.metaDescription,
    og_title: v.h1,
    og_description: v.metaDescription,
    keywords: v.keywords,
    h1: v.h1,
    subtitle: v.subtitle,
    cta_text: v.cta_text,
    faq: v.faq,
  };
}

export function getVariant(parent: ParentTool, slug: string): LandingVariant | undefined {
  return VARIANTS.find((v) => v.parent === parent && v.slug === slug);
}

export function variantsFor(parent: ParentTool): LandingVariant[] {
  return VARIANTS.filter((v) => v.parent === parent);
}
