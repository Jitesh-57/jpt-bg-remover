// Website crawler for the hosted version: plain HTTP instead of a browser, so a
// whole crawl fits in one serverless request. Reads robots.txt and every
// sitemap, ranks pages the same way as the desktop crawler, and extracts
// headings, FAQs, prices and text. Every request is checked against the
// private-address guard.
import { assertPublicUrl } from './browser.js';
import { summarizeSitemap } from './crawl.js';

const SKIP = /\/(login|signin|sign-in|signup|sign-up|register|auth|account|admin|api|cart|checkout|logout|wp-admin|wp-json|feed|tag|tags|author|page\/\d+)(\/|$)|\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|xml|json|txt)$/i;
const LOW_VALUE = /\/(privacy|terms|cookie|legal|gdpr|dmca|careers|jobs|press)(\/|$)/i;
const UA = 'Mozilla/5.0 (compatible; LaunchPilotBot/1.0)';

function score(url) {
  const p = new URL(url).pathname.toLowerCase();
  if (p === '/' || p === '') return 100;
  let s = 50 - p.split('/').filter(Boolean).length * 6;
  if (/pricing|plans|price/.test(p)) s += 45;
  if (/features?|product|tools?|apps?|how-it-works|solutions?/.test(p)) s += 35;
  if (/about|faq|help|docs?|guide|use-cases?|why|compare|vs|alternatives?/.test(p)) s += 25;
  if (/blog|news|changelog|answers|prompts?/.test(p)) s -= 25;
  if (LOW_VALUE.test(p)) s -= 60;
  return s;
}

function normalize(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = '';
    u.search = '';
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString().replace(/\/$/, '') || u.origin;
  } catch {
    return null;
  }
}

// GET with manual redirects so every hop passes the address guard.
async function getText(url, maxBytes = 3_000_000) {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    try {
      await assertPublicUrl(current);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(current, { redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xml,*/*' } }).finally(() => clearTimeout(timer));
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location'), current).toString();
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return { url: current, status: res.status, type: res.headers.get('content-type') || '', body: buf.subarray(0, maxBytes).toString('utf8') };
    } catch {
      return null;
    }
  }
  return null;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', copy: '©', reg: '®', trade: '™', rarr: '→', times: '×' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const strip = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

export function extractPage(url, html) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || '';
  const meta = (name) => decode(head.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))?.[1] ||
    head.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'))?.[1] || '');
  const body = (html.match(/<body[\s\S]*<\/body>/i)?.[0] || html)
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const main = body.match(/<main[\s\S]*<\/main>/i)?.[0] || body;
  const headings = [];
  for (const m of main.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = strip(m[2]);
    if (t.length > 3) headings.push(`${m[1].toUpperCase()}: ${t}`);
    if (headings.length >= 40) break;
  }
  const faqs = [];
  for (const m of main.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/gi)) {
    const q = strip(m[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || '');
    const a = strip(m[1].replace(/<summary[\s\S]*?<\/summary>/i, ''));
    if (q && a) faqs.push({ q, a: a.slice(0, 500) });
  }
  for (const m of main.matchAll(/<(h[2-4]|dt|button)[^>]*>([\s\S]*?)<\/\1>\s*<(p|dd|div)[^>]*>([\s\S]*?)<\/\3>/gi)) {
    const q = strip(m[2]);
    const a = strip(m[4]);
    if (q.endsWith('?') && q.length < 160 && a.length > 10 && !faqs.some((f) => f.q === q)) faqs.push({ q, a: a.slice(0, 500) });
    if (faqs.length >= 20) break;
  }
  const text = strip(main);
  return {
    url,
    title: strip(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''),
    description: meta('description') || meta('og:description'),
    headings,
    faqs: faqs.slice(0, 20),
    prices: [...new Set(text.match(/(?:[$€£₹]\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:USD|EUR|INR|GBP))(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?/gi) || [])].slice(0, 20),
    text: text.slice(0, 6000),
    links: [...body.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => decode(m[1])),
  };
}

async function sitemapUrls(origin, deadline) {
  const robots = await getText(`${origin}/robots.txt`, 200000);
  const queue = [...(robots?.body || '').matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  if (!queue.length) queue.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
  const urls = new Set();
  const seen = new Set();
  while (queue.length && seen.size < 15 && Date.now() < deadline) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const xml = (await getText(sm, 8_000_000))?.body || '';
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      const loc = m[1].replace(/&amp;/g, '&');
      if (/\.xml(\.gz)?$/i.test(loc)) queue.push(loc);
      else urls.add(loc);
    }
  }
  return [...urls];
}

export async function crawlSiteFetch(startUrl, { maxPages = 60, budgetMs = 120000 } = {}) {
  const deadline = Date.now() + budgetMs;
  const first = await getText(startUrl);
  if (!first || first.status >= 400) throw new Error("Couldn't open that website. Check the URL and try again.");
  const origin = new URL(first.url).origin;
  const allSitemapUrls = await sitemapUrls(origin, Date.now() + budgetMs / 3);

  const start = normalize(first.url, first.url) || origin;
  const candidates = new Set([start]);
  for (const u of allSitemapUrls) {
    const n = normalize(u, origin);
    if (n && new URL(n).origin === origin && !SKIP.test(n)) candidates.add(n);
  }
  const visited = new Set();
  const perSection = new Map();
  const sectionCap = Math.max(6, Math.ceil(maxPages / 8));
  const pages = [];
  const section = (u) => new URL(u).pathname.split('/').filter(Boolean)[0] || '/';
  const pick = () => {
    const next = [...candidates].filter((u) => !visited.has(u)).sort((a, b) => score(b) - score(a))[0];
    if (next) visited.add(next);
    return next;
  };
  const handle = (url, res) => {
    if (res.status >= 400 || !/html/.test(res.type)) return;
    const { links, ...page } = extractPage(url, res.body);
    for (const href of links) {
      const n = normalize(href, res.url);
      if (n && new URL(n).origin === origin && !SKIP.test(n) && candidates.size < 3000) candidates.add(n);
    }
    if (page.text.length < 80) return;
    perSection.set(section(url), (perSection.get(section(url)) || 0) + 1);
    pages.push(page);
  };
  visited.add(start);
  handle(start, first);

  async function worker() {
    for (let url = pick(); url && pages.length < maxPages && Date.now() < deadline; url = pick()) {
      const sec = section(url);
      if (sec !== '/' && (perSection.get(sec) || 0) >= sectionCap) continue;
      const res = await getText(url);
      if (res) handle(url, res);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  pages.sort((a, b) => score(b.url) - score(a.url));
  return { origin, pages: pages.slice(0, maxPages), siteMap: summarizeSitemap(allSitemapUrls, origin) };
}
