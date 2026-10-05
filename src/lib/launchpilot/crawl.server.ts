/**
 * crawl.server.ts — reads a product's website for LaunchPilot.
 *
 * Starts from robots.txt and the sitemaps, adds links found on each page, and
 * reads the pages that say the most about the product first (home, pricing,
 * features, tools, FAQ), keeping a time budget so it fits in one serverless
 * request. Every fetch goes through safeFetch, so a user-supplied URL can never
 * reach a private or internal address.
 *
 * The desktop app (launchpilot/src/crawl.js) does the same with a real browser,
 * which also covers sites that only render in JavaScript.
 */
import { safeFetch } from "@/lib/safe-fetch.server";

export interface CrawledPage {
  url: string;
  title: string;
  description: string;
  headings: string[];
  faqs: { q: string; a: string }[];
  prices: string[];
  text: string;
}

const SKIP = /\/(login|signin|sign-in|signup|sign-up|register|auth|account|admin|api|cart|checkout|logout|wp-admin|wp-json|feed|tag|tags|author|page\/\d+)(\/|$)|\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|xml|json|txt)$/i;
const LOW_VALUE = /\/(privacy|terms|cookie|legal|gdpr|dmca|careers|jobs|press)(\/|$)/i;

function score(url: string): number {
  const p = new URL(url).pathname.toLowerCase();
  if (p === "/" || p === "") return 100;
  let s = 50 - p.split("/").filter(Boolean).length * 6;
  if (/pricing|plans|price/.test(p)) s += 45;
  if (/features?|product|tools?|apps?|how-it-works|solutions?/.test(p)) s += 35;
  if (/about|faq|help|docs?|guide|use-cases?|why|compare|vs|alternatives?/.test(p)) s += 25;
  if (/blog|news|changelog|answers|prompts?/.test(p)) s -= 25;
  if (LOW_VALUE.test(p)) s -= 60;
  return s;
}

function normalize(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    u.hash = "";
    u.search = "";
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString().replace(/\/$/, "") || u.origin;
  } catch {
    return null;
  }
}

async function getText(url: string, maxBytes = 3_000_000): Promise<{ url: string; status: number; type: string; body: string } | null> {
  try {
    const r = await safeFetch(url, maxBytes);
    return { url: r.url, status: r.status, type: r.contentType, body: r.body.toString("utf8") };
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", copy: "©", reg: "®", trade: "™", rarr: "→", times: "×" };
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
const strip = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// Plain-HTML extraction: good for server-rendered sites, which is most product sites.
export function extractPage(url: string, html: string): CrawledPage & { links: string[] } {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || "";
  const meta = (name: string) =>
    decode(head.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1] ||
      head.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"))?.[1] || "");
  const body = (html.match(/<body[\s\S]*<\/body>/i)?.[0] || html)
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const main = body.match(/<main[\s\S]*<\/main>/i)?.[0] || body;

  const headings: string[] = [];
  for (const m of Array.from(main.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi))) {
    const t = strip(m[2]);
    if (t.length > 3) headings.push(`${m[1].toUpperCase()}: ${t}`);
    if (headings.length >= 40) break;
  }

  const faqs: { q: string; a: string }[] = [];
  for (const m of Array.from(main.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/gi))) {
    const q = strip(m[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || "");
    const a = strip(m[1].replace(/<summary[\s\S]*?<\/summary>/i, ""));
    if (q && a) faqs.push({ q, a: a.slice(0, 500) });
  }
  for (const m of Array.from(main.matchAll(/<(h[2-4]|dt|button)[^>]*>([\s\S]*?)<\/\1>\s*<(p|dd|div)[^>]*>([\s\S]*?)<\/\3>/gi))) {
    const q = strip(m[2]);
    const a = strip(m[4]);
    if (q.endsWith("?") && q.length < 160 && a.length > 10 && !faqs.some((f) => f.q === q)) faqs.push({ q, a: a.slice(0, 500) });
    if (faqs.length >= 20) break;
  }

  const text = strip(main);
  const prices = Array.from(new Set(text.match(/(?:[$€£₹]\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:USD|EUR|INR|GBP))(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?/gi) || [])).slice(0, 20);
  const links = Array.from(body.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)).map((m) => decode(m[1]));

  return {
    url,
    title: strip(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
    description: meta("description") || meta("og:description"),
    headings,
    faqs: faqs.slice(0, 20),
    prices,
    text: text.slice(0, 6000),
    links,
  };
}

async function sitemapUrls(origin: string, deadline: number): Promise<string[]> {
  const robots = await getText(`${origin}/robots.txt`, 200_000);
  const queue = Array.from((robots?.body || "").matchAll(/^sitemap:\s*(\S+)/gim)).map((m) => m[1]);
  if (!queue.length) queue.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
  const urls = new Set<string>();
  const seen = new Set<string>();
  while (queue.length && seen.size < 12 && Date.now() < deadline) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);
    const xml = (await getText(sm, 5_000_000))?.body || "";
    for (const m of Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi))) {
      const loc = m[1].replace(/&amp;/g, "&");
      if (/\.xml(\.gz)?$/i.test(loc)) queue.push(loc);
      else urls.add(loc);
    }
  }
  return Array.from(urls);
}

/** Crawls up to `maxPages` pages within `budgetMs`. Pages come back best-first. */
export async function crawlSite(startUrl: string, { maxPages = 30, budgetMs = 70_000 } = {}): Promise<{ origin: string; pages: CrawledPage[] }> {
  const start = new URL(/^https?:\/\//i.test(startUrl) ? startUrl : `https://${startUrl}`);
  const deadline = Date.now() + budgetMs;

  // Follow the homepage's redirects (http → https, apex → www) to find the real origin.
  const first = await getText(start.toString());
  if (!first || first.status >= 400) throw new Error("Couldn't open that website. Check the URL and try again.");
  const origin = new URL(first.url).origin;

  const candidates = new Set<string>([normalize(first.url, first.url) || origin]);
  for (const u of await sitemapUrls(origin, deadline - budgetMs / 2)) {
    const n = normalize(u, origin);
    if (n && new URL(n).origin === origin && !SKIP.test(n)) candidates.add(n);
  }

  const visited = new Set<string>();
  const perSection = new Map<string, number>();
  const pages: CrawledPage[] = [];
  const section = (u: string) => new URL(u).pathname.split("/").filter(Boolean)[0] || "/";
  const pick = () => {
    const next = Array.from(candidates).filter((u) => !visited.has(u)).sort((a, b) => score(b) - score(a))[0];
    if (next) visited.add(next);
    return next;
  };

  const handle = (url: string, res: NonNullable<Awaited<ReturnType<typeof getText>>>) => {
    if (res.status >= 400 || !res.type.includes("html")) return;
    const { links, ...page } = extractPage(url, res.body);
    for (const href of links) {
      const n = normalize(href, res.url);
      if (n && new URL(n).origin === origin && !SKIP.test(n) && candidates.size < 2000) candidates.add(n);
    }
    if (page.text.length < 80) return;
    perSection.set(section(url), (perSection.get(section(url)) || 0) + 1);
    pages.push(page);
  };
  handle(normalize(first.url, first.url) || origin, first);
  visited.add(normalize(first.url, first.url) || origin);

  async function worker() {
    for (let url = pick(); url && pages.length < maxPages && Date.now() < deadline; url = pick()) {
      const sec = section(url);
      if (sec !== "/" && (perSection.get(sec) || 0) >= 6) continue;
      const res = await getText(url);
      if (res) handle(url, res);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  pages.sort((a, b) => score(b.url) - score(a.url));
  return { origin, pages: pages.slice(0, maxPages) };
}

export function crawlToText(pages: CrawledPage[], budget = 220_000): string {
  let out = "";
  for (const p of pages) {
    const block = [
      `### ${p.url}`,
      `Title: ${p.title}`,
      p.description && `Meta: ${p.description}`,
      p.headings.length && `Headings:\n${p.headings.join("\n")}`,
      p.prices.length && `Prices seen: ${p.prices.join(", ")}`,
      p.faqs.length && `FAQ:\n${p.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`,
      `Text: ${p.text}`,
    ].filter(Boolean).join("\n");
    if (out.length + block.length > budget) break;
    out += block + "\n\n";
  }
  return out;
}
