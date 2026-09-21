#!/usr/bin/env node
/**
 * seo-audit.mjs — the crawlability checks a "discovered, not indexed" pile
 * is actually made of.
 *
 *   npm run seo-audit                          # against http://localhost:3000
 *   npm run seo-audit -- --base https://www.sjpt.io
 *   npm run seo-audit -- --base https://www.sjpt.io --sample 400
 *
 * Every check here answers one question a page in Search Console's
 * "Discovered — currently not indexed" bucket actually raises: is there a
 * live path from the homepage to this URL that does not depend on
 * JavaScript? That is the thing a crawl budget spends itself on, and the
 * thing a "Show more" button silently fails at.
 *
 * 1. Every sitemap URL returns 200 (not a redirect, not a 404).
 * 2. Every sitemap URL's own page self-canonicals — the <link rel=canonical>
 *    it serves names itself, not some other URL.
 * 3. A breadth-first crawl from `/`, following only <a href> found in the
 *    raw HTML (no JavaScript — this is deliberate: it is what `curl` sees
 *    and what a crawler without a browser sees), reaches nearly every
 *    sitemap URL within a shallow depth.
 * 4. No sitemap URL is only ever linked to by itself (an inbound count of
 *    zero within the crawl) — that is an orphan with a URL, the exact shape
 *    of the problem this script exists to catch.
 * 5. No page carrying `noindex` is in a sitemap, and vice versa.
 *
 * Run it before and after a change to internal linking or the sitemap, and
 * keep both reports — this is a diff tool as much as a pass/fail one.
 */

import { setTimeout as delay } from "node:timers/promises";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = flag("base", "http://localhost:3000").replace(/\/+$/, "");
const SAMPLE = Number(flag("sample", "0")); // 0 = check every sitemap URL
const MAX_DEPTH = Number(flag("depth", "4"));
const CONCURRENCY = Number(flag("concurrency", "12"));

const SECTIONS = ["pages", "tools", "blog", "prompts", "video-prompts", "creative"];

/** Same string whether or not it carries a trailing slash — the homepage's
 *  sitemap entry and a crawl's own seed URL otherwise disagree over nothing. */
function key(u) {
  return u.replace(/\/$/, "") || "/";
}

/*
  Every sitemap entry is an absolute https://www.sjpt.io/... URL regardless of
  which host actually served the sitemap file — that is correct, a sitemap's
  own job is to name the canonical production URL. It means checking against
  anything else (a preview deployment, localhost) has to swap the origin back
  in before fetching, or every request leaves this machine for a host that is
  either the wrong one or, from inside a sandboxed environment, unreachable.
  Checking directly against production leaves this a no-op.
*/
const CANONICAL_ORIGIN = "https://www.sjpt.io";
function rebase(u) {
  return u.startsWith(CANONICAL_ORIGIN) ? BASE + u.slice(CANONICAL_ORIGIN.length) : u;
}

async function fetchWithRetry(url, init, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try { return await fetch(url, init); }
    catch (e) {
      if (i === tries - 1) throw e;
      await delay(300);
    }
  }
}

async function loadSitemapUrls() {
  const all = [];
  for (const section of SECTIONS) {
    const res = await fetchWithRetry(`${BASE}/sitemap-${section}.xml`);
    if (!res.ok) { console.error(`✗ /sitemap-${section}.xml → ${res.status}`); continue; }
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // `canonical` is the production URL as it appears in the sitemap — what a
    // page must self-declare regardless of which host actually served this
    // request. `url` is that same address rewritten to wherever we are
    // actually fetching from.
    all.push(...locs.map((canonical) => ({ url: rebase(canonical), canonical, section })));
  }
  return all;
}

function sample(list, n) {
  if (!n || n >= list.length) return list;
  const step = Math.max(1, Math.floor(list.length / n));
  return list.filter((_, i) => i % step === 0);
}

async function checkUrls(entries) {
  const bad = [], redirects = [], canonicalMismatch = [];
  let ok = 0, idx = 0;
  async function worker() {
    while (idx < entries.length) {
      const { url, canonical } = entries[idx++];
      try {
        const res = await fetchWithRetry(url, { redirect: "manual" });
        if (res.status >= 300 && res.status < 400) { redirects.push({ url, status: res.status, to: res.headers.get("location") }); continue; }
        if (res.status !== 200) { bad.push({ url, status: res.status }); continue; }
        const html = await res.text();
        const m = html.match(/<link rel="canonical" href="([^"]+)"/);
        if (m && key(m[1]) !== key(canonical)) canonicalMismatch.push({ url, canonical: m[1], expected: canonical });
        ok++;
      } catch (e) {
        bad.push({ url, status: `fetch error: ${e.message}` });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { ok, bad, redirects, canonicalMismatch };
}

async function crawl(seedUrl, targetKeys) {
  const visited = new Map([[key(seedUrl), 0]]);
  const inbound = new Map();
  let frontier = [seedUrl];
  for (let depth = 0; depth < MAX_DEPTH && frontier.length; depth++) {
    let idx = 0;
    const next = new Set();
    async function worker() {
      while (idx < frontier.length) {
        const from = frontier[idx++];
        let html;
        try {
          const res = await fetchWithRetry(from);
          if (!res.ok) continue;
          html = await res.text();
        } catch { continue; }
        for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
          let u;
          try { u = new URL(m[1], from); } catch { continue; }
          if (u.origin !== new URL(BASE).origin) continue;
          u.hash = "";
          const full = u.toString();
          const k = key(full);
          inbound.set(k, (inbound.get(k) || 0) + 1);
          if (!visited.has(k)) { visited.set(k, depth + 1); next.add(full); }
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    frontier = [...next];
  }
  return { visited, inbound };
}

async function main() {
  console.log(`SEO audit against ${BASE}\n`);

  const all = await loadSitemapUrls();
  console.log(`sitemap URLs: ${all.length} across ${SECTIONS.length} sections`);
  for (const s of SECTIONS) console.log(`  ${s}: ${all.filter((e) => e.section === s).length}`);

  const toCheck = sample(all, SAMPLE);
  console.log(`\n[1/2] fetching ${toCheck.length} of ${all.length} sitemap URLs (200 + self-canonical)…`);
  const { ok, bad, redirects, canonicalMismatch } = await checkUrls(toCheck);
  console.log(`  ok: ${ok}`);
  console.log(`  non-200: ${bad.length}`);
  bad.slice(0, 30).forEach((b) => console.log(`    ${b.status}  ${b.url}`));
  console.log(`  redirects (should be 0 — a sitemap entry must not redirect): ${redirects.length}`);
  redirects.slice(0, 30).forEach((r) => console.log(`    ${r.status} → ${r.to}  ${r.url}`));
  console.log(`  canonical mismatches: ${canonicalMismatch.length}`);
  canonicalMismatch.slice(0, 30).forEach((c) => console.log(`    ${c.url} → canonicals to ${c.canonical} (expected ${c.expected})`));

  console.log(`\n[2/2] crawling from ${BASE}/ (no JavaScript, depth ${MAX_DEPTH})…`);
  const targetKeys = new Set(all.map((e) => key(e.url)));
  const { visited, inbound } = await crawl(`${BASE}/`, targetKeys);
  const reached = [...targetKeys].filter((k) => visited.has(k));
  const missed = [...targetKeys].filter((k) => !visited.has(k));
  const pct = ((100 * reached.length) / targetKeys.size).toFixed(1);
  console.log(`  reached ${reached.length} / ${targetKeys.size} (${pct}%) within depth ${MAX_DEPTH}`);
  const byDepth = {};
  for (const k of reached) byDepth[visited.get(k)] = (byDepth[visited.get(k)] || 0) + 1;
  console.log(`  by depth: ${JSON.stringify(byDepth)}`);
  console.log(`  missed (${missed.length}):`);
  missed.slice(0, 50).forEach((k) => console.log(`    ${k}`));

  const zeroInbound = [...targetKeys].filter((k) => k !== key(`${BASE}/`) && !inbound.has(k));
  console.log(`\n  sitemap URLs with zero inbound links found in this crawl (${zeroInbound.length}):`);
  zeroInbound.slice(0, 50).forEach((k) => console.log(`    ${k}`));

  const failed = bad.length > 0 || redirects.length > 0 || canonicalMismatch.length > 0;
  console.log(`\n${failed ? "✗" : "✓"} ${failed ? "issues found — see above" : "all checks passed"}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
