#!/usr/bin/env node
/**
 * seo-lastmod.mjs — when each route's content last really changed.
 *
 *   npm run seo:lastmod             # rewrites src/lib/seo/lastmod.json
 *   node scripts/seo-lastmod.mjs --check   # exit 1 if it is out of date
 *
 * Sitemaps should carry a `<lastmod>` that moves only when a page's content
 * does. The build can't work that out: Vercel clones shallowly, so every file
 * looks as new as the latest commit, and stamping the build time is worse than
 * nothing — Google learns to ignore it. So this runs locally, against full git
 * history, and the result is committed. `npm run seo:check` flags it when it
 * has fallen behind a content change.
 *
 * A route's date is the newest of: its page file, the data module its copy
 * lives in (DATA below), and src/lib/page-config.ts for pages whose copy comes
 * from there. A file with uncommitted changes counts as changed today.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const APP = join(ROOT, "src", "app");
const OUT = join(ROOT, "src", "lib", "seo", "lastmod.json");

if (execFileSync("git", ["rev-parse", "--is-shallow-repository"]).toString().trim() === "true") {
  console.error("This clone is shallow, so its dates would be wrong. Run `git fetch --unshallow` first.");
  process.exit(1);
}

/** Where each route family's words live, beyond its own page file. */
const DATA = {
  "/upscale": ["src/lib/landing-variants.ts"],
  "/remove-bg": ["src/lib/landing-variants.ts"],
  "/ai-editor": ["src/lib/landing-variants.ts"],
  "/ai-headshot": ["src/lib/landing-variants.ts"],
  "/alternatives": ["src/lib/alternatives.ts"],
  "/convert": ["src/lib/conversions.ts"],
  "/compress": ["src/lib/compressions.ts"],
  "/crop": ["src/lib/crops.ts"],
  "/creative": ["src/lib/creative-apps.ts", "src/lib/app-catalog.ts"],
  "/ai": ["src/lib/growth-pages.ts"],
  "/use-cases": ["src/lib/growth-pages.ts"],
  "/guides": ["src/lib/blog-topics.ts"],
};

const dirty = new Set(
  execFileSync("git", ["status", "--porcelain"]).toString().split("\n").filter(Boolean).map((l) => l.slice(3).trim()),
);
const today = new Date().toISOString().slice(0, 10);
const cache = new Map();
function changed(file) {
  if (cache.has(file)) return cache.get(file);
  let d = "";
  if (dirty.has(file) || [...dirty].some((x) => x.endsWith("/") && file.startsWith(x))) d = today;
  else d = execFileSync("git", ["log", "-1", "--format=%cs", "--", file]).toString().trim();
  cache.set(file, d);
  return d;
}

/** Every page.tsx under src/app, as its route: "src/app/upscale/[slug]/page.tsx" → "/upscale/[slug]". */
function pages(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name.startsWith("_") || name === "api" || name === "app" || name === "admin") continue;
      out.push(...pages(p));
    } else if (name === "page.tsx") {
      out.push(p);
    }
  }
  return out;
}

const result = {};
for (const file of pages(APP)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  const route = "/" + relative(APP, file).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join("/");
  const files = [rel, ...(DATA["/" + route.split("/")[1]] ?? [])];
  if (readFileSync(file, "utf8").includes("getPageConfig")) files.push("src/lib/page-config.ts");
  const dates = files.map(changed).filter(Boolean).sort();
  if (dates.length) result[route === "/" ? "/" : route.replace(/\/$/, "")] = dates[dates.length - 1];
}

/*
  Apps with a page of their own (src/lib/app-pages/<slug>.ts) change one at a
  time, so each gets its own date rather than the shared /creative/[slug] one:
  the newest of its copy and the template that renders it.
*/
const APP_PAGES_DIR = join(ROOT, "src", "lib", "app-pages");
const NOT_PAGES = new Set(["index.ts", "types.ts", "slugs.ts", "facts.ts"]);
for (const name of readdirSync(APP_PAGES_DIR)) {
  if (!name.endsWith(".ts") || NOT_PAGES.has(name)) continue;
  const files = [`src/lib/app-pages/${name}`, "src/app/creative/[slug]/page.tsx", "src/app/creative/[slug]/AppArticle.tsx"];
  const dates = files.map(changed).filter(Boolean).sort();
  if (dates.length) result[`/creative/${name.slice(0, -3)}`] = dates[dates.length - 1];
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
const json = JSON.stringify(sorted, null, 1) + "\n";

// --check: report, don't write — used by seo-check to flag a stale file.
if (process.argv.includes("--check")) {
  let current = {};
  try { current = JSON.parse(readFileSync(OUT, "utf8")); } catch { /* missing */ }
  const stale = Object.keys(sorted).filter((k) => current[k] !== sorted[k]);
  if (stale.length) {
    console.log(`lastmod.json is out of date for ${stale.length} routes (e.g. ${stale.slice(0, 5).join(", ")}). Run npm run seo:lastmod.`);
    process.exit(1);
  }
  console.log("lastmod.json is up to date.");
  process.exit(0);
}

writeFileSync(OUT, json);
console.log(`Wrote ${Object.keys(sorted).length} routes to ${relative(ROOT, OUT)}`);
