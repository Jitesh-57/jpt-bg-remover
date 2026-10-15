#!/usr/bin/env node
/**
 * seo-check.mjs — re-runs the checks from the Search Console audit.
 *
 *   npm run seo:check                                  # against http://localhost:3000
 *   npm run seo:check -- --base https://www.sjpt.io
 *   npm run seo:check -- --links                       # also fetch every internal link found
 *
 * Fails (exit 1) on:
 *   sitemaps   a duplicate URL, a ?page= URL, an entry without <lastmod>
 *   pages      a sitemap URL that isn't 200, says noindex, canonicalizes
 *              elsewhere, has no meta description, or doesn't have one H1;
 *              a title with the brand twice
 *   linking    an indexable blog post with fewer than 2 links in from other
 *              sitemap pages (the /blog/page/N listings don't count)
 *   redirects  a config/redirects.json entry that isn't a 301 to its target,
 *              a target that isn't 200 (so no chains), or a source that is
 *              still a live page
 *   lastmod    src/lib/seo/lastmod.json behind the git history
 * Warns on titles over 60 characters (Google cuts at about that).
 *
 * See also seo-audit.mjs, which crawls from / and reports click depth.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const BASE = flag("base", "http://localhost:3000").replace(/\/+$/, "");
const CONCURRENCY = Number(flag("concurrency", "10"));
const CHECK_LINKS = args.includes("--links");
const PROD = "https://www.sjpt.io";
const TITLE_WARN = 60;

const fails = [];
const warns = [];
const fail = (kind, msg) => fails.push(`[${kind}] ${msg}`);
const warn = (kind, msg) => warns.push(`[${kind}] ${msg}`);

/** Sitemap entries name production; fetch them from whatever --base is. */
const local = (u) => (u.startsWith(PROD) ? BASE + u.slice(PROD.length) : u);
const pathOf = (u) => { try { return new URL(u, PROD).pathname.replace(/\/$/, "") || "/"; } catch { return u; } };

async function get(url, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, { redirect: "manual", headers: { "user-agent": "sjpt-seo-check" }, ...opts });
    } catch (e) {
      if (attempt >= 2) throw e;
    }
  }
}

async function pool(items, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) { const item = items[i++]; await fn(item); }
  }));
}

const attr = (tag, name) => (new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag) || [])[1];
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// ── 1. Sitemaps ────────────────────────────────────────────────────────────
const indexXml = await (await get(`${BASE}/sitemap.xml`)).text();
const children = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const entries = []; // { url, lastmod, sitemap }
for (const child of children) {
  const xml = await (await get(local(child))).text();
  const name = child.split("/").pop();
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    entries.push({ url: decode(m[1]), lastmod: m[2], sitemap: name });
  }
}
const seen = new Map();
for (const e of entries) {
  if (seen.has(e.url)) fail("sitemap", `duplicate ${e.url} (${seen.get(e.url)} and ${e.sitemap})`);
  else seen.set(e.url, e.sitemap);
  if (e.url.includes("?page=")) fail("sitemap", `paginated URL listed: ${e.url}`);
  if (!e.lastmod) fail("sitemap", `no <lastmod>: ${e.url} (${e.sitemap})`);
}
const urls = [...seen.keys()];
const bySitemap = {};
for (const e of entries) bySitemap[e.sitemap] = (bySitemap[e.sitemap] || 0) + 1;

// ── 2. Every sitemap page ──────────────────────────────────────────────────
const inbound = new Map(); // path → Set(source path)
const allLinks = new Set();
const titles = [];
await pool(urls, async (url) => {
  const res = await get(local(url));
  if (res.status !== 200) { fail("page", `${res.status} ${url}${res.headers.get("location") ? " → " + res.headers.get("location") : ""}`); return; }
  const html = await res.text();
  const head = html.slice(0, html.indexOf("</head>") + 1 || 200000);
  const robots = [...head.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map((m) => attr(m[0], "content") || "").join(" ");
  if (/noindex/i.test(robots)) fail("page", `noindex but in a sitemap: ${url}`);
  const canon = (/<link[^>]+rel="canonical"[^>]*>/i.exec(head) || [])[0];
  const canonHref = canon && attr(canon, "href");
  if (!canonHref) fail("page", `no canonical: ${url}`);
  else if (pathOf(canonHref) !== pathOf(url) || new URL(canonHref, PROD).search !== new URL(url).search) fail("page", `canonical ${canonHref} ≠ ${url}`);
  const desc = (/<meta[^>]+name="description"[^>]*>/i.exec(head) || [])[0];
  if (!desc || !(attr(desc, "content") || "").trim()) fail("page", `no meta description: ${url}`);
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) fail("page", `${h1s} H1s: ${url}`);
  const title = decode((/<title>([^<]*)<\/title>/i.exec(head) || [])[1] || "");
  titles.push({ url, title });
  if ((title.match(/Pixel ?Shine/gi) || []).length > 1) fail("title", `brand twice: "${title}" ${url}`);
  if (/Pixel Shine/.test(title)) fail("title", `search spelling is PixelShine: "${title}" ${url}`);
  if (title.length > TITLE_WARN) warn("title", `${title.length} chars: "${title}" ${url}`);

  const from = pathOf(url);
  for (const m of html.matchAll(/<a\s[^>]*href="([^"#]+)"/gi)) {
    const href = decode(m[1]);
    let u;
    try { u = new URL(href, PROD); } catch { continue; }
    if (u.origin !== PROD && u.origin !== BASE) continue;
    const to = u.pathname.replace(/\/$/, "") || "/";
    allLinks.add(to + u.search);
    if (to === from || /^\/blog\/page\//.test(from)) continue;
    if (!inbound.has(to)) inbound.set(to, new Set());
    inbound.get(to).add(from);
  }
});

// ── 3. Links into indexable blog posts ─────────────────────────────────────
const posts = urls.filter((u) => /\/blog\/[^/]+$/.test(pathOf(u)) && !/\/blog\/page\//.test(u));
let thin = 0;
for (const u of posts) {
  const n = inbound.get(pathOf(u))?.size ?? 0;
  if (n < 2) { thin++; fail("links", `${n} links in: ${u}`); }
}

// ── 4. Redirects ───────────────────────────────────────────────────────────
const redirects = JSON.parse(readFileSync(new URL("../config/redirects.json", import.meta.url), "utf8"));
const sources = new Set(Object.keys(redirects));
await pool(Object.entries(redirects), async ([from, to]) => {
  if (sources.has(to)) fail("redirect", `chain: ${from} → ${to} → ${redirects[to]}`);
  const r = await get(BASE + from);
  const loc = r.headers.get("location") || "";
  if (r.status !== 301) fail("redirect", `${from} returned ${r.status}${loc ? " → " + loc : ""}, expected 301`);
  else if (pathOf(loc) !== to) fail("redirect", `${from} → ${loc}, expected ${to}`);
  const t = await get(BASE + to);
  if (t.status !== 200) fail("redirect", `target ${to} returned ${t.status}`);
});
for (const l of allLinks) {
  const p = l.split("?")[0];
  if (sources.has(p)) warn("links", `a page links to redirected ${p} — link the target instead`);
}

// ── 5. Every internal link (optional) ──────────────────────────────────────
if (CHECK_LINKS) {
  const targets = [...allLinks].filter((l) => !l.startsWith("/api/") && !/\.(png|jpe?g|webp|svg|pdf|xml|txt)$/i.test(l));
  await pool(targets, async (l) => {
    const r = await get(BASE + l);
    if (r.status === 404 || r.status >= 500) fail("links", `${r.status} for linked ${l}`);
  });
}

// ── 6. lastmod freshness ───────────────────────────────────────────────────
try {
  execFileSync("node", [new URL("./seo-lastmod.mjs", import.meta.url).pathname, "--check"], { stdio: "pipe" });
} catch (e) {
  fail("lastmod", (e.stdout?.toString() || e.message).trim());
}

// ── Report ─────────────────────────────────────────────────────────────────
const long = titles.filter((t) => t.title.length > TITLE_WARN).length;
console.log(`\nSitemaps: ${Object.entries(bySitemap).map(([k, v]) => `${k} ${v}`).join(", ")} = ${urls.length} URLs`);
console.log(`Blog posts in sitemaps: ${posts.length}, under 2 links in: ${thin}`);
console.log(`Redirects: ${sources.size}`);
console.log(`Titles over ${TITLE_WARN} chars: ${long} of ${titles.length}`);
if (warns.length) console.log(`\n${warns.length} warnings:\n  ${warns.slice(0, 40).join("\n  ")}${warns.length > 40 ? `\n  … ${warns.length - 40} more` : ""}`);
if (fails.length) {
  console.log(`\n${fails.length} failures:\n  ${fails.slice(0, 60).join("\n  ")}${fails.length > 60 ? `\n  … ${fails.length - 60} more` : ""}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
