import type { Metadata } from "next";
import { ALL as DATASET, allFacets } from "@/lib/prompts/data";
import { PROMPTS as ORIGINALS } from "@/lib/prompt-library";
import { CREATIVE_CONTENT } from "@/lib/creative-apps";
import type { Media } from "@/lib/prompts/types";

/**
 * index-policy.ts — which pages Google is asked to index.
 *
 * Search Console had 1,147 URLs "Discovered – currently not indexed": the
 * template-built prompt and creative pages, and hundreds of short blog posts
 * that each say less than a longer post on the same topic. Every thin page
 * Google does crawl lowers its opinion of the rest, so only the strongest
 * pages are offered. The others stay live and linked, for people, with
 * `noindex, follow`: crawlers still follow their links, they just don't list
 * the page.
 *
 * One file decides, and both the page metadata and the sitemaps read it, so a
 * page can never be in a sitemap while telling Google not to index it.
 *
 * To re-enable pages as indexing improves, raise a count here — e.g. +50
 * image prompts — and the next 50 by score go back into the sitemap.
 */
export const INDEX_POLICY = {
  /** Blog posts shorter than this (body words) are noindexed. */
  blogMinWords: 400,
  /** Image prompt pages indexed (originals and the dataset together), best first. */
  imagePromptsIndexed: 60,
  /** Video prompt pages indexed, best first. */
  videoPromptsIndexed: 15,
  /** A prompt category page needs at least this many prompts to be indexed. */
  promptFacetMinItems: 10,
};

/** The robots value for a page that stays live but out of the index. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: true };

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);

// ── Blog ──────────────────────────────────────────────────────────────────

export function blogWordCount(post: { sections: { body: string }[] }): number {
  return post.sections.reduce((n, s) => n + words(s.body), 0);
}

export function blogIndexable(post: { sections: { body: string }[] }): boolean {
  return blogWordCount(post) >= INDEX_POLICY.blogMinWords;
}

// ── Creative apps ─────────────────────────────────────────────────────────

/** Only the apps with hand-written content; the catalog-generated ones are template text. */
export function creativeIndexable(slug: string): boolean {
  return !!CREATIVE_CONTENT[slug];
}

// ── Prompts ───────────────────────────────────────────────────────────────

/*
  Scoring. Every dataset prompt shows a real output (image or video
  thumbnail), so that signal can't separate them; what does:
    · text  — words of page-specific text. For dataset prompts, the
              description and (at half weight) the prompt itself; for our own
              originals, the prompt minus the shared identity/photoreal
              boilerplate, plus the tip.
    · hot   — the dataset's popularity rank (originals sit mid-table).
    · hub   — on the first page of its model listing or a category listing,
              i.e. linked from a page Google already sees.
    · own   — our originals are text nobody else has.
*/
/** Matches CategoryPage and ModelLanding: a listing shows 48 prompts per page. */
const LISTING_PAGE_SIZE = 48;

const KEEP_BOILERPLATE = /Keep my face, bone structure[^.]*\.|The result must read as a real photograph[^.]*\./g;

function onFirstListingPage(): Set<string> {
  const first = new Set<string>();
  const add = (list: typeof DATASET) => list.slice(0, LISTING_PAGE_SIZE).forEach((r) => first.add(r.uid));
  const models = new Set(DATASET.map((r) => r.modelSlug));
  models.forEach((m) => add(DATASET.filter((r) => r.modelSlug === m)));
  for (const media of ["image", "video"] as Media[]) {
    for (const { kind, facet } of allFacets(media)) {
      add(DATASET.filter((r) => r.media === media && (
        kind === "use-cases" ? r.useCase === facet.name : kind === "styles" ? r.styles.includes(facet.name) : r.subjects.includes(facet.name)
      )));
    }
  }
  return first;
}

function rankIndexable(): { image: Set<string>; video: Set<string> } {
  const onHub = onFirstListingPage();
  const hotRank = new Map([...DATASET].sort((a, b) => b.hotScore - a.hotScore).map((r, i, arr) => [r.uid, 1 - i / arr.length]));

  type Scored = { id: string; score: number };
  const dataset = (media: Media): Scored[] => DATASET.filter((r) => r.media === media).map((r) => ({
    id: r.uid,
    score:
      2 * Math.min(1, (words(r.description) + 0.5 * words(r.prompt)) / 150) +
      (r.featured ? 0.5 : 0) +
      (hotRank.get(r.uid) ?? 0) +
      (onHub.has(r.uid) ? 0.5 : 0),
  }));
  const originals: Scored[] = ORIGINALS.map((p) => ({
    id: p.slug,
    score: 2 * Math.min(1, (words(p.text.replace(KEEP_BOILERPLATE, "")) + words(p.tip)) / 150) + 0.5 + 0.5,
  }));

  const top = (list: Scored[], n: number) =>
    new Set([...list].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, n).map((x) => x.id));
  return {
    image: top([...dataset("image"), ...originals], INDEX_POLICY.imagePromptsIndexed),
    video: top(dataset("video"), INDEX_POLICY.videoPromptsIndexed),
  };
}

const INDEXED = rankIndexable();

/** An image prompt page (`/prompts/{slug or uid}`): originals and dataset prompts. */
export function imagePromptIndexable(slugOrUid: string): boolean {
  return INDEXED.image.has(slugOrUid);
}

/** A video prompt page (`/video-prompts/{uid}`). */
export function videoPromptIndexable(uid: string): boolean {
  return INDEXED.video.has(uid);
}

/** A prompt category page (`/prompts/{media}/{facet}`). */
export function facetIndexable(count: number): boolean {
  return count >= INDEX_POLICY.promptFacetMinItems;
}
