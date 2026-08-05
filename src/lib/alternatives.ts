// Data + content generator for the programmatic "<competitor> alternative"
// landing pages under /alternatives/<slug> (e.g. /alternatives/remove-bg-alternative).
//
// These target high-intent searchers already looking to switch tools — a much
// warmer audience than generic "background remover" queries. Each entry maps a
// competitor to the free sjpt.io tool that replaces it, and the shared generator
// below produces the page copy, FAQ and a side-by-side comparison table.
//
// Claims about competitors are kept qualitative and evergreen on purpose (no
// hard prices, which change) so the pages stay accurate over time.

export type ToolKey = "remove-bg" | "editor" | "upscale" | "compress" | "convert" | "pdf";

interface ToolInfo {
  label: string;    // human name of our tool
  href: string;     // where the CTA sends the user
  verb: string;     // e.g. "remove backgrounds"
}

export const TOOLS: Record<ToolKey, ToolInfo> = {
  "remove-bg": { label: "Background Remover", href: "/editor?tool=remove-bg", verb: "remove image backgrounds" },
  editor:      { label: "Photo Editor",       href: "/editor",                verb: "edit your photos" },
  upscale:     { label: "Image Upscaler",     href: "/",                      verb: "upscale images" },
  compress:    { label: "Image Compressor",   href: "/compress-image",        verb: "compress images" },
  convert:     { label: "Image Converter",    href: "/convert-image",         verb: "convert image formats" },
  pdf:         { label: "Image to PDF",        href: "/image-to-pdf",          verb: "turn images into PDFs" },
};

export interface Alternative {
  slug: string;       // full URL slug, e.g. "remove-bg-alternative"
  name: string;       // competitor display name, e.g. "Remove.bg"
  category: string;   // short category label, e.g. "background remover"
  tool: ToolKey;      // which sjpt tool replaces it
  // The two or three things people dislike about the competitor's free tier.
  gripes: string[];
  // The competitor's cell values in the comparison table (sjpt's are constant).
  compare: { price: string; watermark: string; signup: string; limit: string };
}

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "remove-bg-alternative", name: "Remove.bg", category: "background remover", tool: "remove-bg",
    gripes: ["Free downloads are capped at a low, preview resolution", "Full-resolution results need a paid credit or subscription", "You have to create an account to do much"],
    compare: { price: "Credits / subscription for HD", watermark: "Low-res free preview", signup: "Account required", limit: "Full-res is paid" },
  },
  {
    slug: "photoroom-alternative", name: "PhotoRoom", category: "photo editor", tool: "editor",
    gripes: ["Best features sit behind PhotoRoom Pro", "Free exports can be limited or watermarked", "Pushes you to sign up and subscribe"],
    compare: { price: "Pro subscription", watermark: "On some free templates", signup: "Account required", limit: "Pro-gated features" },
  },
  {
    slug: "canva-background-remover-alternative", name: "Canva", category: "background remover", tool: "remove-bg",
    gripes: ["Background Remover is a Canva Pro feature", "You need a Canva account and login", "The full editor is heavy for a one-off background removal"],
    compare: { price: "Canva Pro required", watermark: "—", signup: "Account required", limit: "Pro-only feature" },
  },
  {
    slug: "photoshop-alternative", name: "Photoshop", category: "photo editor", tool: "editor",
    gripes: ["A paid Creative Cloud subscription", "A steep learning curve for simple edits", "A large desktop install"],
    compare: { price: "Creative Cloud subscription", watermark: "—", signup: "Adobe account", limit: "Desktop install" },
  },
  {
    slug: "adobe-express-alternative", name: "Adobe Express", category: "photo editor", tool: "editor",
    gripes: ["Premium features need an Adobe plan", "An Adobe account is required", "Some exports and assets are Premium-only"],
    compare: { price: "Premium plan for full features", watermark: "—", signup: "Adobe account", limit: "Premium-gated" },
  },
  {
    slug: "picsart-alternative", name: "PicsArt", category: "photo editor", tool: "editor",
    gripes: ["The best tools are PicsArt Gold", "Ads and upsells in the free tier", "Account and app install nudges"],
    compare: { price: "Gold subscription", watermark: "On some effects", signup: "Account required", limit: "Gold-gated tools" },
  },
  {
    slug: "fotor-alternative", name: "Fotor", category: "photo editor", tool: "editor",
    gripes: ["Fotor Pro paywall on key features", "Watermarks on some free exports", "Frequent upgrade prompts"],
    compare: { price: "Pro subscription", watermark: "On some exports", signup: "Account for saving", limit: "Pro-gated" },
  },
  {
    slug: "slazzer-alternative", name: "Slazzer", category: "background remover", tool: "remove-bg",
    gripes: ["Full-resolution output costs credits", "Free previews are downscaled", "Sign-up required for the API and HD"],
    compare: { price: "Credits for HD", watermark: "Low-res free preview", signup: "Account required", limit: "Full-res is paid" },
  },
  {
    slug: "cutout-pro-alternative", name: "Cutout.pro", category: "background remover", tool: "remove-bg",
    gripes: ["HD results need paid credits", "Free tier watermarks or downscales", "You must register to download"],
    compare: { price: "Credits for HD", watermark: "On free HD", signup: "Account required", limit: "Credit-limited" },
  },
  {
    slug: "clipping-magic-alternative", name: "Clipping Magic", category: "background remover", tool: "remove-bg",
    gripes: ["No free downloads — every export costs credits", "A subscription for regular use", "Account required to start"],
    compare: { price: "Credits per download", watermark: "—", signup: "Account required", limit: "No free downloads" },
  },
  {
    slug: "pixlr-alternative", name: "Pixlr", category: "photo editor", tool: "editor",
    gripes: ["Ads and Premium upsells throughout", "Some AI tools are Premium-only", "Account nudges to save work"],
    compare: { price: "Premium subscription", watermark: "—", signup: "Account to save", limit: "Premium-gated AI" },
  },
  {
    slug: "befunky-alternative", name: "BeFunky", category: "photo editor", tool: "editor",
    gripes: ["Most good tools are BeFunky Plus", "Plus subscription for full library", "Upgrade prompts on export"],
    compare: { price: "Plus subscription", watermark: "—", signup: "Account to save", limit: "Plus-gated" },
  },
  {
    slug: "topaz-gigapixel-alternative", name: "Topaz Gigapixel", category: "image upscaler", tool: "upscale",
    gripes: ["A one-time paid license", "A heavy desktop app to install", "GPU-hungry on older machines"],
    compare: { price: "Paid license", watermark: "—", signup: "Desktop install", limit: "Runs locally only" },
  },
  {
    slug: "upscale-media-alternative", name: "Upscale.media", category: "image upscaler", tool: "upscale",
    gripes: ["Higher scale factors are paid", "Sign-up needed for batches", "Free daily limits"],
    compare: { price: "Paid for higher scale", watermark: "—", signup: "Account for more", limit: "Daily cap" },
  },
  {
    slug: "lets-enhance-alternative", name: "Let's Enhance", category: "image upscaler", tool: "upscale",
    gripes: ["Runs on a monthly credit system", "Only a few free credits to start", "Account required to upscale"],
    compare: { price: "Credit subscription", watermark: "—", signup: "Account required", limit: "Few free credits" },
  },
  {
    slug: "tinypng-alternative", name: "TinyPNG", category: "image compressor", tool: "compress",
    gripes: ["Free web tier caps file count and size", "Only PNG/JPG/WebP on the free tool", "Bulk and larger files push you to paid"],
    compare: { price: "Paid for bulk / large files", watermark: "—", signup: "Not for web tool", limit: "File count & size caps" },
  },
];

export function getAlternative(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((a) => a.slug === slug);
}

// ── Content generation ──────────────────────────────────────────────────────

export interface AlternativeContent {
  slug: string;
  name: string;
  tool: ToolInfo;
  title: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  heroSub: string;
  intro: string;
  whyHeading: string;
  gripes: string[];
  steps: { t: string; d: string }[];
  compareRows: { feature: string; them: string; us: string }[];
  faqs: { q: string; a: string }[];
}

export function buildContent(a: Alternative): AlternativeContent {
  const tool = TOOLS[a.tool];
  const title = `Best Free ${a.name} Alternative (2026) — No Watermark, No Sign-Up | sjpt.io`;
  const metaDescription = `Looking for a free ${a.name} alternative? sjpt.io lets you ${tool.verb} online in seconds — no watermark, no credits, no account. See the full comparison.`;

  const steps = [
    { t: "Open the free tool", d: `Head to the sjpt.io ${tool.label} — nothing to install and no account to create.` },
    { t: "Upload your image", d: "Drag and drop a photo or pick one from your device. Your image is processed privately." },
    { t: `Let sjpt ${tool.verb}`, d: "The result is ready in seconds, at full quality with no watermark added." },
    { t: "Download free", d: "Save your image instantly — no credits spent, no paywall, no catch." },
  ];

  const compareRows = [
    { feature: "Price to get a full-quality result", them: a.compare.price, us: "Free" },
    { feature: "Watermark on free output", them: a.compare.watermark, us: "Never" },
    { feature: "Account / sign-up", them: a.compare.signup, us: "Not required" },
    { feature: "Free-tier limit", them: a.compare.limit, us: "Unlimited on free tools" },
    { feature: "Works in the browser", them: "Varies", us: "Yes — nothing to install" },
  ];

  const faqs = [
    {
      q: `Is sjpt.io really a free ${a.name} alternative?`,
      a: `Yes. sjpt.io's ${tool.label} lets you ${tool.verb} for free with no watermark and no account. It's built to do the core job of ${a.name} without the paywall.`,
    },
    {
      q: `Do I need to create an account to use it?`,
      a: `No. You can upload, ${tool.verb} and download without signing up. That's one of the main reasons people switch from ${a.name}.`,
    },
    {
      q: `Will there be a watermark on my download?`,
      a: `No. Unlike some free tiers, sjpt.io never stamps a watermark on your result — what you download is clean and full quality.`,
    },
    {
      q: `Is my image kept private?`,
      a: `Your image is used only to produce your result and isn't sold or shared. Many of the tools run right in your browser for extra privacy.`,
    },
    {
      q: `What else can sjpt.io do besides being a ${a.name} alternative?`,
      a: `Plenty — background removal, upscaling, compression, format conversion, cropping, watermarking and image-to-PDF are all free at sjpt.io.`,
    },
  ];

  return {
    slug: a.slug,
    name: a.name,
    tool,
    title,
    metaDescription,
    keywords: `${a.name} alternative, free ${a.name} alternative, ${a.name} alternative no watermark, ${a.category}, free ${a.category}, sjpt.io`,
    h1: `The Free ${a.name} Alternative`,
    heroSub: `Get everything you need from ${a.name} — ${tool.verb} online — without the watermark, credits or sign-up. 100% free at sjpt.io.`,
    intro: `If you've hit ${a.name}'s paywall, watermark or sign-up wall, you're not alone. sjpt.io is a genuinely free ${a.category} that ${tool.verb} in seconds, right in your browser. No account, no credits, no watermark — just upload, process and download.`,
    whyHeading: `Why people switch from ${a.name}`,
    gripes: a.gripes,
    steps,
    compareRows,
    faqs,
  };
}

// Related alternatives — same tool first, to keep internal linking topical.
export function relatedAlternatives(slug: string, limit = 6): Alternative[] {
  const current = getAlternative(slug);
  if (!current) return ALTERNATIVES.slice(0, limit);
  const sameTool = ALTERNATIVES.filter((a) => a.slug !== slug && a.tool === current.tool);
  const rest = ALTERNATIVES.filter((a) => a.slug !== slug && a.tool !== current.tool);
  return [...sameTool, ...rest].slice(0, limit);
}
