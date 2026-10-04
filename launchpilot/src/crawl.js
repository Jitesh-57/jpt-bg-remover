// Crawls a product's website: reads the sitemap (or follows links from the
// homepage), ranks pages by how much they say about the product, and extracts
// each page's headings, text, prices and FAQs in a real browser so
// JavaScript-rendered sites work too.
import { chromium } from 'playwright';
import { launchOptions } from './inspect.js';

const SKIP = /\/(login|signin|sign-in|signup|sign-up|register|auth|account|admin|api|cart|checkout|logout|wp-admin|wp-json|feed|tag|tags|author|page\/\d+)(\/|$)|\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|mp4|mp3|css|js|xml|json|txt)$/i;
const LOW_VALUE = /\/(privacy|terms|cookie|legal|gdpr|dmca|careers|jobs|press)(\/|$)/i;

// Higher = read first. Product-defining pages beat blog posts.
function score(url, origin) {
  const p = new URL(url).pathname.toLowerCase();
  if (p === '/' || p === '') return 100;
  let s = 50 - p.split('/').filter(Boolean).length * 6;
  if (/pricing|plans|price/.test(p)) s += 45;
  if (/features?|product|tools?|apps?|how-it-works|solutions?/.test(p)) s += 35;
  if (/about|faq|help|docs?|guide|use-cases?|why|compare|vs|alternatives?/.test(p)) s += 25;
  if (/blog|news|changelog|answers|prompts?/.test(p)) s -= 25;
  if (LOW_VALUE.test(p)) s -= 60;
  if (new URL(url).origin !== origin) s -= 1000;
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

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 LaunchPilot crawler' } });
    return r.ok ? await r.text() : '';
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

async function sitemapUrls(origin) {
  const robots = await fetchText(`${origin}/robots.txt`);
  const queue = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  if (!queue.length) queue.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
  const urls = new Set();
  const seen = new Set();
  while (queue.length && seen.size < 15) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const xml = await fetchText(sm);
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
    for (const loc of locs) {
      if (/\.xml(\.gz)?$/i.test(loc)) queue.push(loc);
      else urls.add(loc);
    }
  }
  return [...urls];
}

// Runs in the page.
function extract() {
  const root = document.querySelector('main') || document.querySelector('article') || document.body;
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const headings = [...root.querySelectorAll('h1, h2, h3')].map((h) => `${h.tagName}: ${clean(h.innerText)}`).filter((h) => h.length > 4).slice(0, 40);
  const faqs = [];
  root.querySelectorAll('details').forEach((d) => {
    // Closed <details> hide their answer from innerText, so read textContent.
    const summary = d.querySelector('summary')?.textContent || '';
    const q = clean(summary);
    const a = clean(d.textContent.replace(summary, ''));
    if (q && a) faqs.push({ q, a: a.slice(0, 500) });
  });
  root.querySelectorAll('h2, h3, h4, dt, button').forEach((h) => {
    const q = clean(h.innerText);
    if (!q.endsWith('?') || q.length > 160 || faqs.some((f) => f.q === q)) return;
    const next = h.tagName === 'DT' ? h.nextElementSibling : h.nextElementSibling || h.parentElement?.nextElementSibling;
    const a = clean(next?.innerText);
    if (a && a.length > 10) faqs.push({ q, a: a.slice(0, 500) });
  });
  const text = clean(root.innerText);
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '',
    headings,
    faqs: faqs.slice(0, 20),
    prices: [...new Set(text.match(/(?:[$€£₹]\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?(?:USD|EUR|INR|GBP))(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?/gi) || [])].slice(0, 20),
    text: text.slice(0, 6000),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  };
}

/**
 * crawlSite('https://example.com', { maxPages: 40, onProgress })
 * Returns { origin, pages: [{url, title, description, headings, faqs, prices, text}] }
 */
export async function crawlSite(startUrl, { maxPages = 40, onProgress = () => {} } = {}) {
  const origin = new URL(startUrl).origin;
  const candidates = new Set([normalize(startUrl, startUrl) || origin, origin]);
  for (const u of await sitemapUrls(origin)) {
    const n = normalize(u, origin);
    if (n && new URL(n).origin === origin && !SKIP.test(n)) candidates.add(n);
  }
  onProgress({ phase: 'sitemap', found: candidates.size });

  const browser = await chromium.launch(launchOptions(true));
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' });
  await ctx.route('**/*', (route) => (['image', 'media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()));
  const visited = new Set();
  const pages = [];
  const pick = () => {
    const next = [...candidates].filter((u) => !visited.has(u)).sort((a, b) => score(b, origin) - score(a, origin))[0];
    if (next) visited.add(next);
    return next;
  };
  // Keep a variety of sections: at most 6 pages under any one top-level folder.
  const perSection = new Map();
  const section = (u) => new URL(u).pathname.split('/').filter(Boolean)[0] || '/';

  async function worker() {
    for (let url = pick(); url && pages.length < maxPages; url = pick()) {
      const sec = section(url);
      if ((perSection.get(sec) || 0) >= 6 && sec !== '/') continue;
      const page = await ctx.newPage();
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!res || res.status() >= 400) continue;
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        const data = await page.evaluate(extract);
        for (const href of data.links) {
          const n = normalize(href, page.url());
          if (n && new URL(n).origin === origin && !SKIP.test(n) && candidates.size < 2000) candidates.add(n);
        }
        delete data.links;
        if (data.text.length < 80) continue;
        perSection.set(sec, (perSection.get(sec) || 0) + 1);
        pages.push({ url, ...data });
        onProgress({ phase: 'page', url, done: pages.length, total: maxPages });
      } catch {
        // Skip pages that fail to load.
      } finally {
        await page.close().catch(() => {});
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: 4 }, worker));
  } finally {
    await browser.close().catch(() => {});
  }
  pages.sort((a, b) => score(b.url, origin) - score(a.url, origin));
  return { origin, pages };
}

// Compact text version of a crawl for the AI.
export function crawlToText(crawl, budget = 220000) {
  let out = '';
  for (const p of crawl.pages) {
    const block = [
      `### ${p.url}`,
      `Title: ${p.title}`,
      p.description && `Meta: ${p.description}`,
      p.headings.length && `Headings:\n${p.headings.join('\n')}`,
      p.prices.length && `Prices seen: ${p.prices.join(', ')}`,
      p.faqs.length && `FAQ:\n${p.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n')}`,
      `Text: ${p.text}`,
    ].filter(Boolean).join('\n');
    if (out.length + block.length > budget) break;
    out += block + '\n\n';
  }
  return out;
}
