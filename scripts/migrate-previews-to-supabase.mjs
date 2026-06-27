#!/usr/bin/env node
/**
 * migrate-previews-to-supabase.mjs
 *
 * One-time migration: pull the 12 Creative App before/after preview images from
 * the PixelBin CDN (resized) and upload them to Supabase Storage so they are
 * served from our own Supabase CDN instead of PixelBin.
 *
 * Run once from any machine with normal network access:
 *   node scripts/migrate-previews-to-supabase.mjs
 *
 * Reads from .env.local (or the process env):
 *   NEXT_PUBLIC_SUPABASE_URL          (required)
 *   SUPABASE_SERVICE_ROLE_KEY         (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Uploads to bucket "landing" at path creative/<slug>.png — the exact path
 * previewUrl() in src/lib/creative-apps.ts already points to.
 */
import { readFileSync } from "node:fs";

// Load .env.local if present (no dependency on dotenv).
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on real env */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "landing";
const PIXELBIN_CDN = "https://cdn.pixelbin.io/v2/misty-band-06f445";

if (!SUPABASE_URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or a Supabase key in env / .env.local");
  process.exit(1);
}

// slug -> PixelBin source path (saree's asset landed at the storage root).
const SOURCES = {
  "saree-photoshoot": "creative/result_0.png",
  "3d-figurine": "creative/3d-figurine/result_0.png",
  "retro-bollywood": "creative/retro-bollywood/result_0.png",
  "polaroid-photo": "creative/polaroid-photo/result_0.png",
  "restore-old-photos": "creative/restore-old-photos/result_0.png",
  "couple-photoshoot": "creative/couple-photoshoot/result_0.png",
  "professional-headshot": "creative/professional-headshot/result_0.png",
  "festival-photoshoot": "creative/festival-photoshoot/result_0.png",
  "pet-portrait": "creative/pet-portrait/result_0.png",
  "anime-style": "creative/anime-style/result_0.png",
  "passport-photo": "creative/passport-photo/result_0.png",
  "background-changer": "creative/background-changer/result_0.png",
};

async function migrate(slug, srcPath) {
  // Fetch a resized (~1200px) copy from PixelBin to keep file sizes reasonable.
  const src = `${PIXELBIN_CDN}/t.resize(w:1200)/${srcPath}`;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch ${src} -> ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());

  const dest = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/creative/${slug}.png`;
  const up = await fetch(dest, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!up.ok) throw new Error(`upload ${slug} -> ${up.status}: ${await up.text()}`);
  console.log(`✓ ${slug}  (${(bytes.length / 1024).toFixed(0)} KB)`);
}

let ok = 0;
for (const [slug, srcPath] of Object.entries(SOURCES)) {
  try {
    await migrate(slug, srcPath);
    ok++;
  } catch (e) {
    console.error(`✗ ${slug}: ${e.message}`);
  }
}
console.log(`\nDone: ${ok}/${Object.keys(SOURCES).length} uploaded to Supabase bucket "${BUCKET}/creative/".`);
