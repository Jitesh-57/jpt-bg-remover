/**
 * dashboard-catalog.ts — the one place the logged-in dashboard reads its
 * tool list from.
 *
 * The site already has this data — CREATIVE_APPS (~200 AI apps, each with a
 * category) and the free-tool list — spread across two differently-shaped
 * arrays with no cost field on either (cost is a global constant: CREDIT_COST
 * for every AI generation, 0 for a free tool). This file normalizes both into
 * one `DashboardTool` shape so the dashboard's search, catalog grid and
 * command palette can all read one list instead of three.
 *
 * It does not invent any new app, name or description — every entry here
 * already exists in creative-apps.ts or app-catalog.ts.
 */

import { CAT_META, type AppCat } from "@/lib/app-catalog";
import { categoryOf } from "@/lib/creative-categories";
import { CREATIVE_APPS, CREATIVE_BASE } from "@/lib/creative-apps";
import { CREDIT_COST } from "@/lib/plans";

export interface DashboardTool {
  slug: string;
  name: string;
  blurb: string;
  href: string;
  emoji: string;
  /** 0 = free, unlimited, no account. */
  credits: number;
  category: CategoryId;
}

/** AppCat plus one bucket for the on-device utility tools, which have no AppCat of their own. */
export type CategoryId = AppCat | "utility";

export const UTILITY_META: { label: string; emoji: string; blurb: string } = {
  label: "Free tools", emoji: "🧰", blurb: "Unlimited, on-device, no account needed.",
};

/**
 * The dozen on-device tools — unlimited, no sign-in, no watermark. The same
 * list HomePage.tsx renders on the marketing homepage; kept here as the
 * single source so the dashboard and the homepage never drift apart.
 */
export const UTILITY_TOOLS: DashboardTool[] = [
  { slug: "upscale",          name: "Image Upscaler",    blurb: "Sharpen and enlarge up to 4×",   href: "/upscale",          emoji: "🔍", credits: 0, category: "utility" },
  { slug: "compress-image",   name: "Compress Image",    blurb: "Hit an exact KB target",          href: "/compress-image",   emoji: "🗜️", credits: 0, category: "utility" },
  { slug: "convert-image",    name: "Convert Format",    blurb: "JPG · PNG · WebP",                href: "/convert-image",    emoji: "🔀", credits: 0, category: "utility" },
  { slug: "crop-image",       name: "Crop Image",        blurb: "Social presets and circle crop",  href: "/crop-image",       emoji: "✂️", credits: 0, category: "utility" },
  { slug: "resize-image",     name: "Resize Image",      blurb: "Exact pixels or percent",         href: "/resize-image",     emoji: "↔️", credits: 0, category: "utility" },
  { slug: "rotate-image",     name: "Rotate & Flip",     blurb: "Any angle, mirror either way",    href: "/rotate-image",     emoji: "🔄", credits: 0, category: "utility" },
  { slug: "blur-image",       name: "Blur Image",        blurb: "Hide faces and details",          href: "/blur-image",       emoji: "🫥", credits: 0, category: "utility" },
  { slug: "watermark-image",  name: "Add Watermark",     blurb: "Text watermark, any position",    href: "/watermark-image",  emoji: "🔖", credits: 0, category: "utility" },
  { slug: "watermark-remover",name: "Watermark Remover", blurb: "Lift a watermark off a photo",    href: "/watermark-remover",emoji: "🩹", credits: 0, category: "utility" },
  { slug: "meme-generator",   name: "Meme Generator",    blurb: "Top and bottom captions",         href: "/meme-generator",   emoji: "😂", credits: 0, category: "utility" },
  { slug: "image-to-pdf",     name: "Image to PDF",      blurb: "Combine images into one PDF",     href: "/image-to-pdf",     emoji: "📄", credits: 0, category: "utility" },
  { slug: "qr-code-generator",name: "QR Code Generator", blurb: "Link or text to QR",              href: "/qr-code-generator",emoji: "🔳", credits: 0, category: "utility" },
  { slug: "batch-editor",     name: "Batch Editor",      blurb: "Same edit, 100 images",           href: "/batch-editor",     emoji: "⚡", credits: 0, category: "utility" },
];

/**
 * The four flagship tiles on the dashboard home — the highest-intent credit
 * tools, always shown, cost never hidden.
 *
 * "4× Upscale" points at /editor?tool=upscale (the AI super-resolution pass),
 * not /upscale — that route is the free on-device upscaler already listed
 * above under Free tools, a different tool from the one this tile promises.
 */
export const FLAGSHIP_TOOLS: (DashboardTool & { sub: string })[] = [
  { slug: "ai-editor", name: "AI Photo Editor", blurb: "Edit anything with a sentence", sub: "Describe your edit in plain English", href: "/ai-editor", emoji: "✨", credits: CREDIT_COST, category: "utility" },
  { slug: "ai-headshot", name: "AI Headshot", blurb: "Studio-quality portraits from a selfie", sub: "Studio-quality portraits from a selfie", href: "/ai-headshot", emoji: "🎯", credits: CREDIT_COST, category: "headshot" },
  { slug: "remove-bg", name: "Remove Background", blurb: "One-click cutouts, no watermark", sub: "One-click cutouts, no watermark", href: "/remove-bg", emoji: "🪄", credits: CREDIT_COST, category: "background" },
  { slug: "editor-upscale", name: "4× Upscale", blurb: "Sharpen and enlarge without losing detail", sub: "Sharpen and enlarge without losing detail", href: "/editor?tool=upscale", emoji: "🔬", credits: CREDIT_COST, category: "enhance" },
];

let _aiTools: DashboardTool[] | null = null;

/** Every /creative/* app, normalized. Computed once and cached — CREATIVE_APPS is static. */
export function aiTools(): DashboardTool[] {
  if (_aiTools) return _aiTools;
  _aiTools = CREATIVE_APPS.map((a) => ({
    slug: a.slug,
    name: a.h1,
    blurb: a.intro,
    href: `${CREATIVE_BASE}/${a.slug}`,
    emoji: a.emoji,
    credits: CREDIT_COST,
    category: (categoryOf(a) ?? "fun") as CategoryId,
  }));
  return _aiTools;
}

/** Every tool the dashboard knows about — AI apps plus the free utilities. Used by search/⌘K. */
export function allTools(): DashboardTool[] {
  return [...aiTools(), ...UTILITY_TOOLS];
}

export interface CategoryGroup {
  id: CategoryId;
  label: string;
  emoji: string;
  blurb: string;
  tools: DashboardTool[];
}

/** AI-app categories only (not "utility"), each with its tools, in CAT_META's declared order. */
export function aiCategories(): CategoryGroup[] {
  const buckets = new Map<AppCat, DashboardTool[]>();
  for (const t of aiTools()) {
    const cat = t.category as AppCat;
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(t);
  }
  return (Object.keys(CAT_META) as AppCat[])
    .filter((id) => buckets.has(id))
    .map((id) => ({ id, ...CAT_META[id], tools: buckets.get(id)! }));
}

export function categoryMeta(id: CategoryId): { label: string; emoji: string; blurb: string } {
  if (id === "utility") return UTILITY_META;
  return CAT_META[id];
}

/**
 * A fixed, curated shortlist for the dashboard home's "Popular" chip —
 * deliberately not "whatever has the most generations" (that needs usage
 * data this build doesn't track yet), just the apps most likely to be what
 * someone came here for.
 */
const POPULAR_SLUGS = [
  "professional-headshot", "linkedin-headshot", "restore-old-photos", "ghibli-style",
  "background-remover", "object-remover", "saree-photoshoot", "3d-figurine",
  "ai-headshot-generator", "passport-photo", "unblur-image", "hairstyle-changer",
];

export function popularTools(): DashboardTool[] {
  const byslug = new Map(aiTools().map((t) => [t.slug, t]));
  return POPULAR_SLUGS.map((s) => byslug.get(s)).filter((t): t is DashboardTool => !!t);
}
