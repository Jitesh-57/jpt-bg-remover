/**
 * sitemap-data.ts — one place that decides what is in every sitemap.
 *
 * Split into six sections (pages, tools, blog, prompts, video-prompts,
 * creative) because a single 1,600-URL file gives Search Console one blended
 * indexing number. Six files give six numbers, so "prompts is barely
 * indexing" and "tools is fine" stop being the same fact.
 *
 * Every entry's `lastModified` is either a real date pulled off the content
 * itself, or absent. Filling it with the build timestamp is worse than
 * leaving it out: Google reads a `lastmod` that changes on every deploy
 * regardless of whether the content did, learns it is meaningless, and starts
 * ignoring it everywhere on the site — including the pages where it was true.
 */

import { POSTS } from "@/app/blog/_data/posts";
import { VARIANTS, PARENT_META, type ParentTool } from "@/lib/landing-variants";
import { CREATIVE_APPS, CREATIVE_BASE } from "@/lib/creative-apps";
import { USE_CASES, ANSWER_PAGES } from "@/lib/growth-pages";
import { QUERY_PAGES } from "@/lib/query-pages";
import { CONVERSIONS } from "@/lib/conversions";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";
import { ALTERNATIVES } from "@/lib/alternatives";
import { PAID_FEATURES_ENABLED } from "@/lib/features";
import { PROMPTS as LIBRARY_PROMPTS, PROMPT_COUNT as LIBRARY_COUNT } from "@/lib/prompt-library";
import { pageHref } from "@/lib/prompts/page-href";

export const BASE = "https://www.sjpt.io";
export const PAGE_SIZE = 48;
export const LIBRARY_PAGE_SIZE = 48;

export interface SitemapUrl {
  url: string;
  /** ISO date string. Omitted, not guessed, when there is no real one. */
  lastModified?: string;
}

/** Keeps the first entry per URL — a few groups legitimately overlap. */
export function dedupe(entries: SitemapUrl[]): SitemapUrl[] {
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
}

/** Every page a listing's pagination produces, beyond page 1 (which the
 *  listing's own entry already covers). Page 1 is never repeated here. */
function paginationUrls(basePath: string, count: number, pageSize = PAGE_SIZE): SitemapUrl[] {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const out: SitemapUrl[] = [];
  for (let p = 2; p <= totalPages; p++) out.push({ url: `${BASE}${pageHref(basePath, p)}` });
  return out;
}

function variantsFor(parent: ParentTool): SitemapUrl[] {
  return VARIANTS.filter((v) => v.parent === parent).map((v) => ({
    url: `${BASE}${PARENT_META[parent].base}/${v.slug}`,
  }));
}

// ── pages ─────────────────────────────────────────────────────────────────

export function pagesUrls(): SitemapUrl[] {
  const out: SitemapUrl[] = [
    { url: BASE },
    { url: `${BASE}/tools` },
    { url: `${BASE}/about` },
    { url: `${BASE}/contact` },
    { url: `${BASE}/privacy` },
    { url: `${BASE}/terms` },
    { url: `${BASE}/80s-ai-photo-prompts` },
    { url: `${BASE}/batch-editor` },
    { url: `${BASE}/use-cases` },
    { url: `${BASE}/ai` },
    { url: `${BASE}/answers` },
    { url: `${BASE}/docs` },
  ];
  if (PAID_FEATURES_ENABLED) out.push({ url: `${BASE}/pricing` });
  return dedupe(out);
}

// ── tools ─────────────────────────────────────────────────────────────────

export function toolsUrls(): SitemapUrl[] {
  const out: SitemapUrl[] = [
    { url: `${BASE}/upscale` }, ...variantsFor("upscale"),
    { url: `${BASE}/compress-image` },
    { url: `${BASE}/convert-image` },
    { url: `${BASE}/crop-image` },
    { url: `${BASE}/resize-image` },
    { url: `${BASE}/rotate-image` },
    { url: `${BASE}/qr-code-generator` },
    { url: `${BASE}/blur-image` },
    { url: `${BASE}/watermark-image` },
    { url: `${BASE}/meme-generator` },
    { url: `${BASE}/image-to-pdf` },
    { url: `${BASE}/alternatives` },
    ...ALTERNATIVES.map((a) => ({ url: `${BASE}/alternatives/${a.slug}` })),
    ...CONVERSIONS.map((c) => ({ url: `${BASE}/convert/${c.slug}` })),
    ...COMPRESSIONS.map((c) => ({ url: `${BASE}/compress/${c.slug}` })),
    ...CROPS.map((c) => ({ url: `${BASE}/crop/${c.slug}` })),
  ];
  if (PAID_FEATURES_ENABLED) {
    out.push(
      { url: `${BASE}/remove-bg` }, ...variantsFor("remove-bg"),
      { url: `${BASE}/ai-editor` }, ...variantsFor("ai-editor"),
      { url: `${BASE}/ai-headshot` }, ...variantsFor("ai-headshot"),
    );
  }
  return dedupe(out);
}

// ── blog ──────────────────────────────────────────────────────────────────

export function blogUrls(): SitemapUrl[] {
  return dedupe([
    { url: `${BASE}/blog` },
    ...POSTS.map((post) => ({ url: `${BASE}/blog/${post.slug}`, lastModified: post.date })),
  ]);
}

// ── prompts (the hub, the image dataset, the originals, models, packs) ─────

export function promptsUrls(): SitemapUrl[] {
  // Only our own prompts. The third-party dataset pages (YouMind OpenLab) are
  // noindex — see src/lib/ad-policy.ts — so they stay out of the sitemap too.
  const out: SitemapUrl[] = [
    { url: `${BASE}/prompts` },
    { url: `${BASE}/prompts/originals` },
    ...paginationUrls("/prompts/originals", LIBRARY_COUNT, LIBRARY_PAGE_SIZE),
    ...LIBRARY_PROMPTS.map((p) => ({ url: `${BASE}/prompts/${p.slug}` })),
  ];
  return dedupe(out);
}

// ── video prompts ────────────────────────────────────────────────────────

export function videoPromptsUrls(): SitemapUrl[] {
  // Every video prompt comes from the third-party dataset, so none are listed.
  return [];
}

// ── creative ─────────────────────────────────────────────────────────────

export function growthUrls(): SitemapUrl[] {
  return dedupe([
    { url: `${BASE}/use-cases` },
    ...USE_CASES.map((p) => ({ url: `${BASE}/use-cases/${p.slug}` })),
    { url: `${BASE}/ai` },
    ...ANSWER_PAGES.map((p) => ({ url: `${BASE}/ai/${p.slug}` })),
    ...QUERY_PAGES.map((p) => ({ url: `${BASE}/answers/${p.slug}` })),
  ]);
}

export function creativeUrls(): SitemapUrl[] {
  if (!PAID_FEATURES_ENABLED) return [];
  return dedupe([
    { url: `${BASE}${CREATIVE_BASE}` },
    ...CREATIVE_APPS.map((a) => ({ url: `${BASE}${CREATIVE_BASE}/${a.slug}` })),
  ]);
}

export const SECTIONS = {
  pages: pagesUrls,
  tools: toolsUrls,
  blog: blogUrls,
  prompts: promptsUrls,
  "video-prompts": videoPromptsUrls,
  creative: creativeUrls,
  growth: growthUrls,
} as const;

export type SectionName = keyof typeof SECTIONS;
