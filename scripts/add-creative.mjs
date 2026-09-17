#!/usr/bin/env node
/**
 * add-creative.mjs — put a hand-made before/after example on an app page.
 *
 *   npm run creative -- <page url or slug> <image> [more images…]
 *
 * Examples:
 *   npm run creative -- https://www.sjpt.io/creative/age-progression pair.png
 *   npm run creative -- age-progression before.png after.png
 *   npm run creative -- age-progression --after result.png
 *
 * One wide image is treated as a side-by-side pair and split down the middle;
 * that is what a "before / after" creative usually is. Two images are taken in
 * order. `--after` alone updates just the result pane. `--no-split` forces a
 * single wide image to be used whole as the after pane.
 *
 * What it writes: public/creatives/<slug>-before.webp and -after.webp, cropped
 * to the 4:5 the panes actually render at, capped at 900px wide, WebP quality
 * 80. The cap is the point — these arrive as 2–6 MB PNGs and the pane is 410px
 * on a desktop, so the bytes are almost entirely waste. next/image re-encodes
 * to AVIF per request on top of this; what is committed is the source, not
 * what a visitor downloads.
 *
 * It then rewrites the generated block in src/lib/app-creatives.ts, so the
 * page picks the file up. Nothing else needs editing.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
/*
  sharp is a devDependency. If the install is stale it is missing rather than
  broken, and "Cannot find package 'sharp'" is a worse first impression of a
  one-command tool than a sentence saying what to run.
*/
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("\n  \u2716 sharp is not installed. Run `npm install` first.\n");
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "creatives");
const MANIFEST_FILE = path.join(ROOT, "src", "lib", "app-creatives.ts");

/** The panes render at aspect-ratio 4/5 and at most ~410 CSS px wide. */
const W = 900;
const H = Math.round((W * 5) / 4);
const QUALITY = 80;

function die(msg) {
  console.error(`\n  ✖ ${msg}\n`);
  process.exit(1);
}

/** Accepts a full page URL or a bare slug. */
function toSlug(arg) {
  const cleaned = arg.trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  const m = cleaned.match(/\/creative\/([a-z0-9-]+)$/i);
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9-]+$/i.test(cleaned)) return cleaned.toLowerCase();
  die(`Could not read an app from "${arg}". Pass a page URL or a slug.`);
}

/**
 * The slugs the site actually has.
 *
 * Read out of the source rather than imported, because this is a plain node
 * script and creative-apps.ts is TypeScript. A typo'd slug would otherwise
 * write a file that nothing ever reads, which is the kind of mistake you find
 * weeks later.
 */
async function knownSlugs() {
  const [curated, catalog] = await Promise.all([
    readFile(path.join(ROOT, "src", "lib", "creative-apps.ts"), "utf8"),
    readFile(path.join(ROOT, "src", "lib", "app-catalog.ts"), "utf8").catch(() => ""),
  ]);
  const set = new Set();
  for (const m of curated.matchAll(/slug: "([a-z0-9-]+)"/g)) set.add(m[1]);
  // Catalogue rows are tuples whose first field is the slug.
  for (const m of catalog.matchAll(/\[\s*"([a-z0-9-]+)"\s*,/g)) set.add(m[1]);
  return set;
}

async function readImage(file) {
  if (!existsSync(file)) die(`No such file: ${file}`);
  const buf = await readFile(file);
  const meta = await sharp(buf).metadata();
  if (!meta.width || !meta.height) die(`${file} is not an image this can read.`);
  return { buf, meta, bytes: buf.length };
}

/** Crop to 4:5, cap the width, encode WebP. */
async function pane(input) {
  return sharp(input)
    .rotate() // honour EXIF, or a phone photo lands on its side
    .resize(W, H, { fit: "cover", position: "attention" })
    .webp({ quality: QUALITY })
    .toBuffer();
}

function kb(n) {
  return `${(n / 1024).toFixed(0)} KB`;
}

async function writePane(slug, half, buf, sourceBytes) {
  await mkdir(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${slug}-${half}.webp`);
  await writeFile(out, buf);
  const saved = sourceBytes ? ` (was ${kb(sourceBytes)}, −${Math.round((1 - buf.length / sourceBytes) * 100)}%)` : "";
  console.log(`  ✔ ${path.relative(ROOT, out).padEnd(44)} ${kb(buf.length).padStart(8)}${saved}`);
}

/** Rebuilds the generated block from whatever is on disk. */
async function rewriteManifest() {
  const files = existsSync(OUT_DIR) ? await readdir(OUT_DIR) : [];
  const byslug = {};
  for (const f of files) {
    const m = f.match(/^(.+)-(before|after)\.webp$/);
    if (m) (byslug[m[1]] ??= {})[m[2]] = true;
  }
  const lines = Object.keys(byslug)
    .sort()
    .map((slug) => {
      const halves = ["before", "after"].filter((h) => byslug[slug][h]).map((h) => `${h}: true`);
      return `  "${slug}": { ${halves.join(", ")} },`;
    });

  const src = await readFile(MANIFEST_FILE, "utf8");
  const start = "/* GENERATED:START */";
  const end = "/* GENERATED:END */";
  const a = src.indexOf(start);
  const b = src.indexOf(end);
  if (a === -1 || b === -1) die(`Could not find the generated block in ${MANIFEST_FILE}`);
  const next = src.slice(0, a + start.length) + "\n" + lines.join("\n") + (lines.length ? "\n" : "") + "  " + src.slice(b);
  await writeFile(MANIFEST_FILE, next);
  console.log(`  ✔ ${path.relative(ROOT, MANIFEST_FILE)} — ${Object.keys(byslug).length} app(s) with a hand-made example`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) {
    console.log(`
  npm run creative -- <page url or slug> <image> [image2]

    one wide image   split down the middle into before | after
    two images       taken in order: before, then after
    --after <file>   replace only the result pane
    --before <file>  replace only the source pane
    --no-split       use one wide image whole, as the after pane
`);
    process.exit(0);
  }

  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-split") flags.noSplit = true;
    else if (a === "--after" || a === "--before") flags[a.slice(2)] = argv[++i];
    else positional.push(a);
  }

  const slug = toSlug(positional.shift() ?? die("Pass the page URL or slug first."));
  const known = await knownSlugs();
  if (!known.has(slug)) {
    die(`"${slug}" is not an app on the site. Check the URL — the slug is the last part of /creative/<slug>.`);
  }

  console.log(`\n  ${slug}\n`);

  // Explicit flags win; otherwise the positional images decide.
  if (flags.before) {
    const { buf, bytes } = await readImage(flags.before);
    await writePane(slug, "before", await pane(buf), bytes);
  }
  if (flags.after) {
    const { buf, bytes } = await readImage(flags.after);
    await writePane(slug, "after", await pane(buf), bytes);
  }

  if (positional.length === 1 && !flags.before && !flags.after) {
    const { buf, meta, bytes } = await readImage(positional[0]);
    const wide = meta.width / meta.height >= 1.4;
    if (wide && !flags.noSplit) {
      /*
        A side-by-side creative, split down the middle.

        The two halves land in the two panes the page already draws, which
        keeps the labels and the layout honest. If the source is not actually
        a pair, --no-split says so.
      */
      const half = Math.floor(meta.width / 2);
      const left = await sharp(buf).extract({ left: 0, top: 0, width: half, height: meta.height }).toBuffer();
      const right = await sharp(buf).extract({ left: meta.width - half, top: 0, width: half, height: meta.height }).toBuffer();
      console.log(`  split ${meta.width}×${meta.height} down the middle\n`);
      await writePane(slug, "before", await pane(left), Math.round(bytes / 2));
      await writePane(slug, "after", await pane(right), Math.round(bytes / 2));
    } else {
      await writePane(slug, "after", await pane(buf), bytes);
    }
  } else if (positional.length >= 2) {
    const before = await readImage(positional[0]);
    const after = await readImage(positional[1]);
    await writePane(slug, "before", await pane(before.buf), before.bytes);
    await writePane(slug, "after", await pane(after.buf), after.bytes);
  }

  const wrote = await readdir(OUT_DIR).catch(() => []);
  if (!wrote.some((f) => f.startsWith(`${slug}-`))) die("No image was given, so nothing was written.");

  console.log("");
  await rewriteManifest();
  console.log(`\n  https://www.sjpt.io/creative/${slug}\n`);
}

main().catch((e) => die(e.message));
