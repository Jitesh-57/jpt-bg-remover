/**
 * ad-landing.ts — config for distraction-free /lp/[slug] ad landing pages.
 * These are the destinations for paid Google/Meta ad campaigns: no nav, no
 * footer, one headline, one CTA.
 */

export interface AdLanding {
  slug: string;
  toolHref: string;
  title: string;          // <title> / meta
  metaDescription: string;
  badge: string;
  headline: string;
  highlight: string;      // the word(s) shown in accent color inside headline
  subhead: string;
  cta: string;
  bullets: string[];
  tool: string;           // analytics label
}

export const AD_LANDINGS: AdLanding[] = [
  {
    slug: "remove-background-free",
    toolHref: "/remove-bg",
    title: "Remove Image Background Free — Instant Transparent PNG | JPT AI",
    metaDescription:
      "Remove backgrounds from images free with AI. One click, transparent PNG, no watermark. Try it free — no sign-up required to start.",
    badge: "✨ 100% Free · No Watermark",
    headline: "Remove Any Background in One Click",
    highlight: "One Click",
    subhead: "Upload a photo and get a clean transparent PNG in seconds. Perfect for products, portraits, and e-commerce. No Photoshop, no skills needed.",
    cta: "Remove Background Free →",
    bullets: ["AI-perfect hair & edge detection", "Transparent PNG, full resolution", "10 free images every day"],
    tool: "remove-bg",
  },
  {
    slug: "ai-image-upscaler",
    toolHref: "/upscale",
    title: "Free AI Image Upscaler — Enhance Photos to 4K | JPT AI",
    metaDescription:
      "Upscale images to 4K free with AI. Sharpen blurry photos 2× or 4× with no quality loss and no watermark. Try it free in your browser.",
    badge: "✨ Free · Up to 4× Resolution",
    headline: "Upscale Photos to Crystal-Clear 4K",
    highlight: "4K",
    subhead: "Turn small or blurry images into sharp, high-resolution photos with AI super-resolution. No software, no watermark.",
    cta: "Upscale Your Image Free →",
    bullets: ["2× and 4× AI super-resolution", "Recovers detail in old, blurry photos", "10 free credits every day"],
    tool: "upscale",
  },
  {
    slug: "ai-headshot-generator",
    toolHref: "/ai-headshot",
    title: "Free AI Headshot Generator — LinkedIn-Ready Photos | JPT AI",
    metaDescription:
      "Generate professional AI headshots free from any selfie. LinkedIn-ready, corporate quality, no photographer needed. Try it free.",
    badge: "✨ Professional · LinkedIn-Ready",
    headline: "Turn Any Selfie Into a Pro Headshot",
    highlight: "Pro Headshot",
    subhead: "Get a professional, corporate-quality headshot from a single photo in seconds. Ideal for LinkedIn, resumes, and team pages.",
    cta: "Generate Your Headshot Free →",
    bullets: ["Looks like real photography", "Multiple professional styles", "Full-resolution downloads"],
    tool: "headshot",
  },
  {
    slug: "ai-photo-editor",
    toolHref: "/ai-editor",
    title: "Free AI Photo Editor — Edit with Text Prompts | JPT AI",
    metaDescription:
      "Edit photos free with simple text prompts. Change backgrounds, relight scenes, add effects — no Photoshop skills. Try the AI editor free.",
    badge: "✨ Free · No Photoshop Needed",
    headline: "Edit Photos Just by Describing It",
    highlight: "Describing It",
    subhead: "Type what you want changed and AI does the rest — replace backgrounds, apply styles, fix lighting. No design skills required.",
    cta: "Start Editing Free →",
    bullets: ["Plain-English text-to-edit", "Replace backgrounds & relight", "No watermark on downloads"],
    tool: "ai-editor",
  },
];

export const getAdLanding = (slug: string) => AD_LANDINGS.find((l) => l.slug === slug);
