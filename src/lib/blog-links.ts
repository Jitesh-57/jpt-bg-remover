import { POSTS, type BlogPost } from "@/app/blog/_data/posts";
import { topicOf } from "@/lib/blog-topics";
import { blogIndexable } from "@/lib/seo/index-policy";

/**
 * blog-links.ts — which posts link to which.
 *
 * The old "Related articles" box showed the three newest posts for the same
 * tool, so every upscale post linked to the same three upscale posts and
 * ~200 posts had no link from any other page at all. This builds the links
 * once, as a graph:
 *
 *   1. each post links its 4 most similar posts — shared slug and keyword
 *      words, same topic, same tool;
 *   2. a balancing pass then gives every post at least MIN_IN incoming links,
 *      and every indexable post at least MIN_IN from other indexable posts
 *      (those are the pages Google actually crawls), by adding it to the
 *      lists of its nearest neighbours that still have room.
 *
 * Deterministic: the same posts always produce the same links.
 */

const PER_POST = 4;
const MAX_PER_POST = 6;
const MIN_IN = 2;

const STOP = new Set([
  "a", "an", "the", "to", "for", "of", "in", "on", "with", "without", "and", "or", "your", "you", "my", "how", "what",
  "is", "it", "free", "online", "best", "vs", "image", "images", "photo", "photos", "picture", "pictures", "ai", "app",
  "tool", "tools", "use", "using", "make", "get", "from", "into", "at", "by", "no", "guide",
]);

function tokens(p: BlogPost): Set<string> {
  const words = [p.slug, ...p.keywords].join(" ").toLowerCase().split(/[^a-z0-9]+/);
  return new Set(words.filter((w) => w.length > 1 && !STOP.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter++; });
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

const toolOf = (p: BlogPost) => p.toolHref.split("?")[0];

function buildGraph(posts: BlogPost[]): Map<string, string[]> {
  const info = posts.map((p) => ({ p, tok: tokens(p), topic: topicOf(p), tool: toolOf(p), idx: blogIndexable(p) }));
  const S = info.map((a) => info.map((b) =>
    jaccard(a.tok, b.tok) + (a.topic === b.topic ? 0.6 : 0) + (a.tool === b.tool ? 0.3 : 0)));
  const sim = (i: number, j: number) => S[i][j];
  // Neighbours of each post, most similar first; ties broken by slug so the result is stable.
  const ranked = info.map((_, i) => info
    .map((_, j) => j)
    .filter((j) => j !== i)
    .sort((a, b) => sim(i, b) - sim(i, a) || info[a].p.slug.localeCompare(info[b].p.slug)));

  // 1. Most similar, favouring indexable targets so link equity lands where it counts.
  const lists: number[][] = info.map((_, i) => {
    const byPref = [...ranked[i]].sort((a, b) =>
      (sim(i, b) + (info[b].idx ? 0.15 : 0)) - (sim(i, a) + (info[a].idx ? 0.15 : 0)) || info[a].p.slug.localeCompare(info[b].p.slug));
    return byPref.slice(0, PER_POST);
  });

  // 2. Balance incoming links, counted from every post and from indexable posts only.
  const inAll = info.map(() => 0);
  const inIdx = info.map(() => 0);
  lists.forEach((l, i) => l.forEach((j) => { inAll[j]++; if (info[i].idx) inIdx[j]++; }));
  const top = (j: number, fromIndexableOnly: boolean) => {
    const count = fromIndexableOnly ? inIdx : inAll;
    for (const i of ranked[j]) {
      if (count[j] >= MIN_IN) return;
      if (fromIndexableOnly && !info[i].idx) continue;
      if (lists[i].length >= MAX_PER_POST || lists[i].includes(j)) continue;
      lists[i].push(j);
      inAll[j]++;
      if (info[i].idx) inIdx[j]++;
    }
  };
  info.forEach((_, j) => top(j, false));
  info.forEach((x, j) => { if (x.idx) top(j, true); });

  return new Map(info.map((x, i) => [x.p.slug, lists[i].map((j) => info[j].p.slug)]));
}

const GRAPH = buildGraph(POSTS);

/** The slugs a post should link to under "Related guides", best first. */
export function relatedSlugs(slug: string): string[] {
  return GRAPH.get(slug) ?? [];
}

/**
 * Posts to show on a tool page's "Guides" block: those written for this exact
 * page first (e.g. /upscale/4k), then the tool's own posts closest to the
 * page's words, indexable posts preferred.
 */
export function guidesForPath(path: string, n = 4): BlogPost[] {
  const words = new Set(path.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)));
  const base = "/" + path.split("/")[1];
  const score = (p: BlogPost) => {
    const tool = toolOf(p);
    const tok = tokens(p);
    let s = 0;
    if (tool === path) s += 3;
    else if (tool === base || tool.startsWith(base + "/")) s += 1;
    words.forEach((w) => { if (tok.has(w)) s += 0.5; });
    if (blogIndexable(p)) s += 0.4;
    return s;
  };
  return POSTS
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s >= 1)
    .sort((a, b) => b.s - a.s || a.p.slug.localeCompare(b.p.slug))
    .slice(0, n)
    .map((x) => x.p);
}
