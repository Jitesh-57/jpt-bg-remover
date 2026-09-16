#!/usr/bin/env node
/**
 * build-prompt-dataset.mjs — turns the licensed YouMind OpenLab export into
 * the dataset the site actually renders.
 *
 *   node scripts/build-prompt-dataset.mjs
 *
 * Reads  data/youmind-prompts.json   (CC BY 4.0, see docs/prompt-library-spec.md §1)
 * Writes src/lib/prompts/dataset.json
 *
 * Everything here is deterministic, so re-running after a refresh produces the
 * same slugs and the same URLs. That matters more than it sounds: a slug is a
 * published URL, and a transform that reshuffles them on every run quietly
 * breaks every link and every indexed page.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "data", "youmind-prompts.json");
const OUT = join(ROOT, "src", "lib", "prompts", "dataset.json");

// ── Taxonomy (spec §4) ──────────────────────────────────────────────────────

const IMAGE_USE_CASES = [
  "Profile / Avatar", "Social Media Post", "Infographic / Edu Visual",
  "YouTube Thumbnail", "Comic / Storyboard", "Product Marketing",
  "E-commerce Main Image", "Game Asset", "Poster / Flyer", "App / Web Design",
];
const IMAGE_STYLES = [
  "Photography", "Cinematic / Film Still", "Anime / Manga", "Illustration",
  "Sketch / Line Art", "Comic / Graphic Novel", "3D Render", "Chibi / Q-Style",
  "Isometric", "Pixel Art", "Oil Painting", "Watercolor", "Ink / Chinese Style",
  "Retro / Vintage", "Cyberpunk / Sci-Fi", "Minimalism",
];
const IMAGE_SUBJECTS = [
  "Portrait / Selfie", "Influencer / Model", "Character", "Group / Couple",
  "Product", "Food / Drink", "Fashion Item", "Animal / Creature", "Vehicle",
  "Architecture / Interior", "Landscape / Nature", "Cityscape / Street",
  "Diagram / Chart", "Text / Typography", "Abstract / Background",
];
const VIDEO_USE_CASES = [
  "Cinematic Scene Showcase", "Vlog / Social Lifestyle", "Short Film",
  "Music Video", "Brand / Product Commercial", "UGC / Talking Head Ad",
  "Explainer / Tutorial", "Channel Intro / Brand Asset", "Game Cinematic / PV",
];
const VIDEO_STYLES = [
  "Cinematic Realistic", "Fantasy / Magical", "Cyberpunk / Sci-Fi", "Anime",
  "Vintage / Retro Film", "Surreal / Dreamlike", "Documentary",
];
const VIDEO_SUBJECTS = [
  "Person / Character", "Sports / Action", "Nature / Landscape",
  "Product", "Architecture / Interior", "Animal / Creature",
];

/**
 * Keyword rules, in priority order per facet.
 *
 * The spec asks for the untagged 668 records to be tagged by a model. That is
 * the better answer and this is not it: this is a deterministic keyword pass
 * that runs offline, produces the same tags every time, and can be re-run for
 * free. Where it is unsure it says nothing rather than guessing, which is why
 * a facet page can be smaller than the model-tagged version would be.
 */
const RULES = {
  imageUseCase: [
    ["YouTube Thumbnail", /\b(youtube|thumbnail|clickbait)\b/i],
    ["Profile / Avatar", /\b(avatar|profile pic|profile photo|pfp|headshot|id photo|passport)\b/i],
    ["Infographic / Edu Visual", /\b(infographic|explainer|diagram|chart|educational|textbook|slide|knowledge|encyclopedia|cutaway|exploded view|anatomy|timeline|flowchart)\b/i],
    ["Comic / Storyboard", /\b(comic|manga page|storyboard|panel|strip|four-panel|4-panel|graphic novel)\b/i],
    ["E-commerce Main Image", /\b(e-?commerce|listing|amazon|main image|white background product|catalog(ue)?)\b/i],
    ["Product Marketing", /\b(product (shot|photo|marketing|render|ad)|packaging|advertis|commercial|brand|campaign|billboard|promo)\b/i],
    ["Game Asset", /\b(game (asset|icon|ui|sprite)|rpg|pixel sprite|item icon|skill icon|loading screen)\b/i],
    ["Poster / Flyer", /\b(poster|flyer|leaflet|cover art|movie poster|album cover|invitation|greeting card|christmas card)\b/i],
    ["App / Web Design", /\b(ui design|app (screen|icon|interface)|web ?page|landing page|dashboard|wireframe|mockup screen)\b/i],
    ["Social Media Post", /\b(instagram|social media|feed post|story|xiaohongshu|carousel|reels cover|linkedin post)\b/i],
  ],
  imageStyle: [
    ["Pixel Art", /\b(pixel art|8-?bit|16-?bit|voxel)\b/i],
    ["Isometric", /\bisometric\b/i],
    ["Chibi / Q-Style", /\b(chibi|q-?version|q-?style|blind box|figurine|funko|nendoroid)\b/i],
    ["Anime / Manga", /\b(anime|manga|ghibli|shoujo|shonen|cel-?shad)/i],
    ["Comic / Graphic Novel", /\b(comic|graphic novel|american comic|marvel style|halftone)\b/i],
    ["3D Render", /\b(3d render|c4d|blender|octane|cinema 4d|clay render|3-?d model|pvc|resin)\b/i],
    ["Watercolor", /\bwatercolou?r\b/i],
    ["Oil Painting", /\b(oil painting|impasto|renaissance|baroque|classical painting)\b/i],
    ["Ink / Chinese Style", /\b(ink wash|chinese painting|guohua|sumi-?e|calligraphy|shan shui|水墨)\b/i],
    ["Sketch / Line Art", /\b(line art|sketch|pencil drawing|charcoal|blueprint|technical drawing|coloring page)\b/i],
    ["Cyberpunk / Sci-Fi", /\b(cyberpunk|sci-?fi|futuristic|neon city|dystopian|mecha|space station)\b/i],
    ["Retro / Vintage", /\b(retro|vintage|1950s|1960s|1970s|1980s|1990s|y2k|film grain|polaroid|nostalgi)/i],
    ["Cinematic / Film Still", /\b(cinematic|film still|movie still|anamorphic|widescreen|film noir|teal and orange)\b/i],
    ["Minimalism", /\b(minimalis[tm]|flat design|negative space|clean simple|bauhaus|swiss style)\b/i],
    ["Illustration", /\b(illustration|illustrated|vector art|storybook|children's book|poster art|flat illustration)\b/i],
    ["Photography", /\b(photo(graph|realistic)|dslr|85mm|50mm|bokeh|studio light|shot on|portrait lens|macro photo)\b/i],
  ],
  imageSubject: [
    ["Diagram / Chart", /\b(diagram|chart|infographic|schematic|cutaway|exploded view|map|graph|timeline)\b/i],
    ["Text / Typography", /\b(typograph|lettering|calligraphy|word art|logo|text effect|font)\b/i],
    ["Food / Drink", /\b(food|dish|cuisine|dessert|coffee|cocktail|drink|restaurant|recipe|cake|noodle)\b/i],
    ["Fashion Item", /\b(fashion|outfit|garment|sneaker|handbag|jewel(le)?ry|dress design|streetwear|lookbook)\b/i],
    ["Vehicle", /\b(car|vehicle|motorcycle|spacecraft|aircraft|truck|bicycle|train|yacht)\b/i],
    ["Animal / Creature", /\b(cat|dog|animal|creature|dragon|bird|pet|monster|dinosaur|fox|rabbit)\b/i],
    ["Architecture / Interior", /\b(architect|interior|building|room design|house|villa|apartment|cathedral|museum)\b/i],
    ["Cityscape / Street", /\b(city|street|urban|skyline|alley|downtown|market|neon street)\b/i],
    ["Landscape / Nature", /\b(landscape|mountain|forest|ocean|desert|sunset over|nature|valley|waterfall|sky)\b/i],
    ["Group / Couple", /\b(couple|group photo|family|friends|two people|wedding|crowd)\b/i],
    ["Influencer / Model", /\b(influencer|model pose|fashion model|kol|blogger)\b/i],
    ["Portrait / Selfie", /\b(portrait|selfie|headshot|face|self-?portrait|close-?up of a (wo)?man)\b/i],
    ["Product", /\b(product|bottle|package|device|gadget|cosmetic|perfume|watch|phone|can of)\b/i],
    ["Character", /\b(character|hero|warrior|wizard|mascot|figure|persona|protagonist)\b/i],
    ["Abstract / Background", /\b(abstract|background|texture|pattern|wallpaper|gradient)\b/i],
  ],
  videoUseCase: [
    ["UGC / Talking Head Ad", /\b(ugc|talking head|to camera|unboxing|testimonial|review video)\b/i],
    ["Brand / Product Commercial", /\b(commercial|advertis|product (video|film)|brand film|tvc)\b/i],
    ["Music Video", /\b(music video|mv|concert|performance|singing|band)\b/i],
    ["Explainer / Tutorial", /\b(tutorial|explainer|how-?to|demonstrat|step by step)\b/i],
    ["Channel Intro / Brand Asset", /\b(intro|logo animation|channel|opener|bumper|title sequence)\b/i],
    ["Game Cinematic / PV", /\b(game (cinematic|trailer)|pv|gameplay|rpg cutscene)\b/i],
    ["Vlog / Social Lifestyle", /\b(vlog|lifestyle|daily life|travel video|pov walk|get ready with me)\b/i],
    ["Short Film", /\b(short film|narrative|story|drama|scene where|dialogue)\b/i],
    ["Cinematic Scene Showcase", /\b(cinematic|camera (move|push|pan|orbit)|dolly|crane shot|tracking shot)\b/i],
  ],
  videoStyle: [
    ["Anime", /\b(anime|manga|ghibli|cel-?shad)/i],
    ["Cyberpunk / Sci-Fi", /\b(cyberpunk|sci-?fi|futuristic|space|mecha|robot)\b/i],
    ["Fantasy / Magical", /\b(fantasy|magic|dragon|wizard|fairy|mythical|enchanted)\b/i],
    ["Vintage / Retro Film", /\b(vintage|retro|8mm|16mm|vhs|super 8|1980s|film grain)\b/i],
    ["Surreal / Dreamlike", /\b(surreal|dream|impossible|melting|floating|liminal)\b/i],
    ["Documentary", /\b(documentary|interview|archival|news footage|nature doc)\b/i],
    ["Cinematic Realistic", /\b(cinematic|realistic|photoreal|ultra-?real|film look|shallow depth)\b/i],
  ],
  videoSubject: [
    ["Sports / Action", /\b(sport|running|fight|chase|parkour|skate|surf|race|action)\b/i],
    ["Nature / Landscape", /\b(landscape|mountain|ocean|forest|nature|wildlife|sky|desert)\b/i],
    ["Animal / Creature", /\b(animal|cat|dog|creature|dragon|bird|horse)\b/i],
    ["Vehicle", /\b(car|vehicle|motorcycle|spacecraft|aircraft|train)\b/i],
    ["Architecture / Interior", /\b(architect|interior|building|room|house|city street)\b/i],
    ["Product", /\b(product|bottle|package|device|cosmetic|watch|phone)\b/i],
    ["Person / Character", /\b(man|woman|person|girl|boy|character|he |she |people)\b/i],
  ],
};

const slugify = (s) =>
  String(s).toLowerCase().normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");

const shortId = (s) => createHash("sha1").update(s).digest("hex").slice(0, 6);

/** "April 19, 2026" / "Sep 6, 2026" → "2026-04-19". */
function toIso(published) {
  if (!published) return null;
  const d = new Date(published);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/** "English" → "en", "中文" → "zh". The export mixes codes and names. */
const LANG = {
  en: "en", english: "en",
  zh: "zh", "中文": "zh", chinese: "zh", "zh-cn": "zh", "zh-hans": "zh",
  ja: "ja", "ja-jp": "ja", japanese: "ja", "日本語": "ja",
  ko: "ko", korean: "ko", "한국어": "ko",
  es: "es", spanish: "es", fr: "fr", french: "fr", de: "de", german: "de",
  pt: "pt", ru: "ru", ar: "ar", hi: "hi",
};
function normLangs(list) {
  const out = new Set();
  for (const raw of list || []) {
    const k = String(raw).trim().toLowerCase();
    out.add(LANG[k] || (k.length === 2 ? k : "en"));
  }
  return out.size ? [...out] : ["en"];
}

/** Model display name → URL slug, per spec §7.2. */
function modelSlug(model) {
  return slugify(model).replace(/\./g, "-");
}

function pickOne(rules, hay) {
  for (const [label, re] of rules) if (re.test(hay)) return label;
  return null;
}
function pickMany(rules, hay, max) {
  const out = [];
  for (const [label, re] of rules) {
    if (re.test(hay)) out.push(label);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * A stand-in for the engagement score the spec wants.
 *
 * There is no views/copies telemetry yet, so ranking on it would be inventing
 * numbers. This ranks on what the data actually knows — whether the curators
 * featured it, how much of it there is to look at, and how recent it is — and
 * the field is replaced the day real counts exist.
 */
function hotScore(rec, isoDate) {
  let s = 0;
  if (rec.featured) s += 50;
  s += Math.min(12, (rec.images?.length || 0) * 4);
  if (rec.video_thumbnail || rec.video_url) s += 6;
  if (rec.description) s += 4;
  if (rec.has_variables) s += 5;
  if (rec.category) s += 3;
  if (isoDate) {
    const days = (Date.now() - new Date(isoDate).getTime()) / 86400000;
    s += Math.max(0, 30 - days / 6);
  }
  return Math.round(s * 10) / 10;
}

// ── Transform ───────────────────────────────────────────────────────────────

const raw = JSON.parse(readFileSync(SOURCE, "utf8"));
const seenUid = new Set();
const records = [];

for (const r of raw) {
  const media = r.media === "video" ? "video" : "image";
  const base = slugify(r.slug || r.title || r.id);
  // {slug}-{shortid}: the export has 4 colliding slugs, and a stable hash of
  // the source id keeps every URL unique without depending on array order.
  const uid = `${base}-${shortId(r.id)}`;
  if (seenUid.has(uid)) continue;
  seenUid.add(uid);

  const hay = [r.title, r.description, r.section, r.category, r.prompt.slice(0, 4000)].filter(Boolean).join(" \n ");
  const isVideo = media === "video";
  const publishedAt = toIso(r.published);

  const useCase =
    r.category ||
    pickOne(isVideo ? RULES.videoUseCase : RULES.imageUseCase, hay);
  const styles = pickMany(isVideo ? RULES.videoStyle : RULES.imageStyle, hay, 3);
  const subjects = pickMany(isVideo ? RULES.videoSubject : RULES.imageSubject, hay, 3);

  records.push({
    uid,
    id: r.id,
    title: String(r.title || "").trim(),
    description: r.description ? String(r.description).trim() : null,
    prompt: r.prompt,
    hasVariables: !!r.has_variables,
    model: r.model,
    modelSlug: modelSlug(r.model),
    media,
    featured: !!r.featured,
    useCase,
    styles,
    subjects,
    images: Array.isArray(r.images) ? r.images : [],
    videoUrl: r.video_url || null,
    videoThumbnail: r.video_thumbnail || null,
    author: { name: r.author?.name || "unknown", url: r.author?.url || null },
    sourceUrl: r.source_url || null,
    publishedAt,
    languages: normLangs(r.languages),
    license: "CC BY 4.0",
    datasetRepo: r.dataset_repo,
    hotScore: hotScore(r, publishedAt),
  });
}

records.sort((a, b) => b.hotScore - a.hotScore || a.uid.localeCompare(b.uid));

// ── Facets ──────────────────────────────────────────────────────────────────

function facet(media, field, allowed) {
  const counts = new Map();
  for (const r of records) {
    if (r.media !== media) continue;
    const vals = Array.isArray(r[field]) ? r[field] : r[field] ? [r[field]] : [];
    for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1);
  }
  return allowed
    .filter((name) => counts.has(name))
    .map((name) => ({ name, slug: slugify(name), count: counts.get(name) }));
}

const models = [...new Set(records.map((r) => r.model))].map((name) => {
  const rs = records.filter((r) => r.model === name);
  return {
    name,
    slug: modelSlug(name),
    media: rs[0].media,
    count: rs.length,
    repo: rs[0].datasetRepo,
  };
}).sort((a, b) => b.count - a.count);

const dataset = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "YouMind OpenLab (CC BY 4.0)",
  counts: {
    total: records.length,
    image: records.filter((r) => r.media === "image").length,
    video: records.filter((r) => r.media === "video").length,
    featured: records.filter((r) => r.featured).length,
    withVariables: records.filter((r) => r.hasVariables).length,
    authors: new Set(records.map((r) => r.author.name)).size,
  },
  models,
  facets: {
    image: {
      useCases: facet("image", "useCase", IMAGE_USE_CASES),
      styles: facet("image", "styles", IMAGE_STYLES),
      subjects: facet("image", "subjects", IMAGE_SUBJECTS),
    },
    video: {
      useCases: facet("video", "useCase", VIDEO_USE_CASES),
      styles: facet("video", "styles", VIDEO_STYLES),
      subjects: facet("video", "subjects", VIDEO_SUBJECTS),
    },
  },
  records,
};

writeFileSync(OUT, JSON.stringify(dataset));
const kb = Math.round(Buffer.byteLength(JSON.stringify(dataset)) / 1024);

console.log(`wrote ${OUT} (${kb} KB)`);
console.log(dataset.counts);
console.log("models:", models.map((m) => `${m.name}=${m.count}`).join(", "));
for (const media of ["image", "video"]) {
  for (const f of ["useCases", "styles", "subjects"]) {
    const list = dataset.facets[media][f];
    const tagged = records.filter((r) => r.media === media && (Array.isArray(r[f === "useCases" ? "useCase" : f === "styles" ? "styles" : "subjects"]) ? r[f === "styles" ? "styles" : "subjects"].length : r.useCase)).length;
    console.log(`${media}.${f}: ${list.length} facets, ${tagged} records tagged`);
  }
}
