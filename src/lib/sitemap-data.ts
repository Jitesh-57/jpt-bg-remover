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

import { editedPosts } from "@/lib/blog-edits.server";
import { VARIANTS, PARENT_META, type ParentTool } from "@/lib/landing-variants";
import { CREATIVE_APPS, CREATIVE_BASE } from "@/lib/creative-apps";
import { CONVERSIONS } from "@/lib/conversions";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";
import { PAID_FEATURES_ENABLED } from "@/lib/features";
import { PROMPTS as LIBRARY_PROMPTS } from "@/lib/prompt-library";
import { ALL as DATASET_PROMPTS, MODELS as PROMPT_MODELS, allFacets } from "@/lib/prompts/data";
import { PACKS } from "@/lib/prompts/packs";
import { BLOG_TOPICS, topicHref, topicOf } from "@/lib/blog-topics";
import LASTMOD from "@/lib/seo/lastmod.json";
import { blogIndexable, creativeIndexable, facetIndexable, guideIndexable, imagePromptIndexable, videoPromptIndexable } from "@/lib/seo/index-policy";

export const BASE = "https://www.sjpt.io";

export interface SitemapUrl {
  url: string;
  /** ISO date string. Omitted, not guessed, when there is no real one. */
  lastModified?: string;
}

/*
  When a route's content last changed, from git (scripts/seo-lastmod.mjs,
  committed as lib/seo/lastmod.json — a shallow build clone can't know).
  Keys are routes: "/resize-image", or "/upscale/[slug]" for every variant.
*/
const ROUTE_DATES = LASTMOD as Record<string, string>;
const DYNAMIC = Object.keys(ROUTE_DATES)
  .filter((k) => k.includes("["))
  .map((k) => ({ re: new RegExp("^" + k.replace(/\[[^\]]+\]/g, "[^/]+") + "$"), date: ROUTE_DATES[k] }));

function lastmodFor(url: string): string | undefined {
  const path = url.slice(BASE.length) || "/";
  return ROUTE_DATES[path] ?? DYNAMIC.find((d) => d.re.test(path))?.date;
}

/** Adds the route's real last-change date to entries that have none of their own. */
function dated(entries: SitemapUrl[]): SitemapUrl[] {
  return entries.map((e) => (e.lastModified ? e : { ...e, ...(lastmodFor(e.url) ? { lastModified: lastmodFor(e.url) } : {}) }));
}

/** Keeps the first entry per URL — a few groups legitimately overlap. */
export function dedupe(entries: SitemapUrl[]): SitemapUrl[] {
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
}

/*
  Only indexable pages are listed — see lib/seo/index-policy, which the pages'
  own robots metadata reads too, so a URL here is never one that says noindex.
  Paginated listings (`?page=N`) are left out: each canonicalizes to itself,
  but page 1 is the one worth offering, and pages 2+ are reached by following
  its links.
*/

function variantsFor(parent: ParentTool): SitemapUrl[] {
  return VARIANTS.filter((v) => v.parent === parent).map((v) => ({
    url: `${BASE}${PARENT_META[parent].base}/${v.slug}`,
  }));
}

// ── pages ─────────────────────────────────────────────────────────────────

/** Async: a topic hub is listed only while enough indexable posts sit on its topic. */
export async function pagesUrls(): Promise<SitemapUrl[]> {
  const posts = (await editedPosts()).filter(blogIndexable);
  const out: SitemapUrl[] = [
    { url: BASE },
    { url: `${BASE}/tools` },
    { url: `${BASE}/privacy` },
    { url: `${BASE}/terms` },
    { url: `${BASE}/80s-ai-photo-prompts` },
    { url: `${BASE}/docs` },
    // The blog's topic hubs (lib/blog-topics): each links every post on its topic.
    { url: `${BASE}/guides` },
    ...BLOG_TOPICS
      .filter((t) => guideIndexable(posts.filter((p) => topicOf(p) === t.slug).length))
      .map((t) => ({ url: `${BASE}${topicHref(t)}` })),
  ];
  if (PAID_FEATURES_ENABLED) out.push({ url: `${BASE}/pricing` });
  return dated(dedupe(out));
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
    { url: `${BASE}/tiktok-watermark-remover` },
    { url: `${BASE}/watermark-remover` },
    { url: `${BASE}/invisible-watermark-remover` },
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
  return dated(dedupe(out));
}

// ── blog ──────────────────────────────────────────────────────────────────

/** Async: posts hidden in /admin/blog 404, so they are read with their edits and left out. */
export async function blogUrls(): Promise<SitemapUrl[]> {
  const posts = await editedPosts();
  return dated(dedupe([
    { url: `${BASE}/blog` },
    ...posts.filter(blogIndexable).map((post) => ({ url: `${BASE}/blog/${post.slug}`, lastModified: post.date })),
  ]));
}

// ── prompts (the hub, the image dataset, the originals, models, packs) ─────

export function promptsUrls(): SitemapUrl[] {
  const imageFacets = allFacets("image");
  const imageModels = PROMPT_MODELS.filter((m) => m.media === "image");
  const out: SitemapUrl[] = [
    { url: `${BASE}/prompts` },
    { url: `${BASE}/prompts/image` },
    { url: `${BASE}/prompts/originals` },
    ...LIBRARY_PROMPTS.filter((p) => imagePromptIndexable(p.slug)).map((p) => ({ url: `${BASE}/prompts/${p.slug}` })),
    ...DATASET_PROMPTS.filter((p) => p.media === "image" && imagePromptIndexable(p.uid)).map((p) => ({
      url: `${BASE}/prompts/${p.uid}`,
      ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
    })),
    ...imageModels.map((m) => ({ url: `${BASE}/${m.slug}-prompts` })),
    ...imageFacets.filter((f) => facetIndexable(f.facet.count)).map((f) => ({ url: `${BASE}/prompts/image/${f.facet.slug}` })),
    ...PACKS.map((p) => ({ url: `${BASE}/prompts-pack/${p.slug}` })),
  ];
  return dated(dedupe(out));
}

// ── video prompts ────────────────────────────────────────────────────────

export function videoPromptsUrls(): SitemapUrl[] {
  const videoFacets = allFacets("video");
  const videoModels = PROMPT_MODELS.filter((m) => m.media === "video");
  const out: SitemapUrl[] = [
    { url: `${BASE}/prompts/video` },
    ...DATASET_PROMPTS.filter((p) => p.media === "video" && videoPromptIndexable(p.uid)).map((p) => ({
      url: `${BASE}/video-prompts/${p.uid}`,
      ...(p.publishedAt ? { lastModified: p.publishedAt } : {}),
    })),
    ...videoModels.map((m) => ({ url: `${BASE}/${m.slug}-prompts` })),
    ...videoFacets.filter((f) => facetIndexable(f.facet.count)).map((f) => ({ url: `${BASE}/prompts/video/${f.facet.slug}` })),
  ];
  return dated(dedupe(out));
}

// ── creative ─────────────────────────────────────────────────────────────

/*
  The use-case and answer pages are noindex now (see the sections note in
  lib/seo/index-policy), so this sitemap is empty. It still answers, with an
  empty <urlset>, because Search Console may have it on file.
*/
export function growthUrls(): SitemapUrl[] {
  return [];
}

export function creativeUrls(): SitemapUrl[] {
  if (!PAID_FEATURES_ENABLED) return [];
  return dated(dedupe([
    { url: `${BASE}${CREATIVE_BASE}` },
    ...CREATIVE_APPS.filter((a) => creativeIndexable(a.slug)).map((a) => ({ url: `${BASE}${CREATIVE_BASE}/${a.slug}` })),
  ]));
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
