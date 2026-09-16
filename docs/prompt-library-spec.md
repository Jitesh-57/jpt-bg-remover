# AI Prompt Library — Build Spec for Claude Code

Build a prompt-library website for **GoStudio.ai**, modeled on the information architecture of youmind.com/prompts (studied Sept 16, 2026). Use GoStudio's own name, logo, colors and copy. Do **not** reuse YouMind's branding, text, or page copy.

Files in this kit:

| File | What it is |
|---|---|
| `BUILD_SPEC.md` | This document: site map, page anatomy, data model, taxonomy, design notes, build steps |
| `prompts.json` | 871 prompts (662 image, 209 video) with 903 image URLs, authors and source links |
| `parse.py` | Script that rebuilds `prompts.json` from YouMind's open GitHub repos (re-run to refresh) |

---

## 1. Data source and license (read first)

- The prompts come from YouMind's **open-source GitHub repos**, licensed **CC BY 4.0**. You may copy, adapt and republish them, including commercially, **as long as you give credit**.
- Each prompt was originally posted on X/Twitter by an individual creator. Every record in `prompts.json` carries `author.name`, `author.url`, `source_url` and `dataset_repo`.
- **Required on every prompt card and detail page:** "Prompt by @author (link to source post)", plus a site-wide footer line: "Prompt data adapted from YouMind OpenLab (CC BY 4.0)" with a link to https://creativecommons.org/licenses/by/4.0/.
- Images are hosted on `cms-assets.youmind.com`, and video thumbnails on Cloudflare Stream or `pbs.twimg.com`. Hotlinking them is fragile, so download them into your own storage/CDN at build time (keep the original URL in a field) and serve `loading="lazy"` WebP versions.
- Do **not** scrape youmind.com pages directly. It has 30k+ prompts, but the open repos are the licensed route. Pull more data from the repos listed in section 7.

Source repos (all CC BY 4.0):
`awesome-gpt-image-2`, `awesome-nano-banana-pro-prompts`, `awesome-seedream-4.5`, `awesome-gpt-image-1.5`, `awesome-gemini-3-prompts`, `awesome-christmas-card-prompts`, `awesome-seedance-2-prompts`, `awesome-grok-imagine-prompts`. All are under https://github.com/YouMind-OpenLab.

### Dataset stats

| Model | Media | Prompts | Images |
|---|---|---|---|
| Nano Banana Pro | image | 254 | 339 |
| GPT Image 2 | image | 126 | 192 |
| GPT Image 1.5 | image | 122 | 203 |
| Seedream 4.5 | image | 112 | 112 |
| Seedance 2.0 | video | 106 | thumbnails / mp4 |
| Grok Imagine | video | 103 | thumbnails |
| Gemini 3 | image | 48 | 53 |

32 prompts are flagged `featured`. 203 have a `category` (use-case) already; auto-tag the rest (section 4).

---

## 2. Record schema (`prompts.json`)

```ts
type Prompt = {
  id: string;              // "gpt-image-2-1"
  slug: string;            // "vr-headset-exploded-view-poster" (append id suffix for uniqueness in URLs)
  title: string;
  description: string | null;   // 1–2 sentence summary
  prompt: string;          // full prompt text (may be JSON or multiline)
  has_variables: boolean;  // contains {argument name="x" default="y"} or [insert ...]
  model: string;           // "GPT Image 2" | "Nano Banana Pro" | "Seedream 4.5" | ...
  media: "image" | "video";
  featured: boolean;
  section: string;         // original README section
  category: string | null; // use-case, e.g. "Profile / Avatar"
  images: string[];        // result images (image prompts)
  video_url: string | null;       // mp4 (some Seedance entries)
  video_thumbnail: string | null; // poster frame for video prompts
  author: { name: string; url: string };
  source_url: string;      // original X post
  published: string;       // "April 19, 2026" or "Sep 6, 2026" — normalize to ISO
  languages: string[];
  youmind_url: string | null; // original page (used only for attribution, never as the main CTA)
  license: "CC BY 4.0";
  dataset_repo: string;
};
```

**Variables:** Prompts in the Nano Banana repo use `{argument name="famous_quote" default="Stay Hungry"}`. Render these as editable inline chips, and "Copy" should output the filled-in text. This makes a good differentiator.

Add these fields during import: `styles[]`, `subjects[]`, `use_case`, `aspect_ratio`, `created_at` (ISO), `views`, `copies`, `likes`, `hot_score`, `pack_ids[]`.

---

## 3. Site map (mirror this structure)

```
/prompts                                  Hub (landing)
/prompts/image                            Media hub: Image
/prompts/video                            Media hub: Video
/prompts/webpage                          Media hub: Website (phase 2, no data yet)
/prompts/image/{use-cases|styles|subjects}          Facet index pages
/prompts/image/{category-slug}                       Category listing (e.g. /prompts/image/watercolor)
/prompts/video/{category-slug}
/{model}-prompts                          Model landing, e.g. /gpt-image-2-prompts, /nano-banana-pro-prompts,
                                          /seedream-4-5-prompts, /gpt-image-1-5-prompts, /seedance-2-0-prompts,
                                          /grok-imagine-prompts, /gemini-3-prompts
/prompts/{slug}-{id}                      Image prompt detail
/video-prompts/{slug}-{id}                Video prompt detail
/prompts-pack/{pack-slug}                 Curated pack detail
/landing/image-to-prompt                  Tool: upload image -> get prompt (GoStudio can power this)
/landing/photo-prompt                     Tool
```

The model landing pages are the SEO money pages ("gpt image 2 prompts", "nano banana pro prompts"). Build them first.

---

## 4. Taxonomy

### Image — Use cases
Profile / Avatar · Social Media Post · Infographic / Edu Visual · YouTube Thumbnail · Comic / Storyboard · Product Marketing · E-commerce Main Image · Game Asset · Poster / Flyer · App / Web Design

### Image — Styles
Photography · Cinematic / Film Still · Anime / Manga · Illustration · Sketch / Line Art · Comic / Graphic Novel · 3D Render · Chibi / Q-Style · Isometric · Pixel Art · Oil Painting · Watercolor · Ink / Chinese Style · Retro / Vintage · Cyberpunk / Sci-Fi · Minimalism

### Image — Subjects
Portrait / Selfie · Influencer / Model · Character · Group / Couple · Product · Food / Drink · Fashion Item · Animal / Creature · Vehicle · Architecture / Interior · Landscape / Nature · Cityscape / Street · Diagram / Chart · Text / Typography · Abstract / Background

### Video — Use cases
Cinematic Scene Showcase · Vlog / Social Lifestyle · Short Film · Music Video · Brand / Product Commercial · UGC / Talking Head Ad · Explainer / Tutorial · Channel Intro / Brand Asset · Game Cinematic / PV

### Video — Styles
Cinematic Realistic · Fantasy / Magical · Cyberpunk / Sci-Fi · Anime · Vintage / Retro Film · Surreal / Dreamlike · Documentary

### Video — Subjects
Person / Character · Sports / Action · Nature / Landscape (extend as needed)

Slugs are kebab-case, e.g. `infographic-edu-visual`, `cinematic-film-still`, `ugc-talking-head`.

**Auto-tagging:** Most records have no style or subject. Write a one-off script that sends `title + description + prompt` to Claude and asks it to pick 1 use case, 1–3 styles and 1–3 subjects from the lists above (JSON output). Store the results in the DB.

---

## 5. Page anatomy

### 5.1 Hub `/prompts`
1. **Sticky top nav:** logo, product links, Prompts (active), Pricing, Sign in.
2. **Floating left "Page outline"** with anchor links: Overview, Packs, Hottest This Week, Browse by Media, Browse by Model, Browse by Category, About.
3. **Hero** (`#prompts-overview`)
   - Pill badge: "N+ PROMPTS · UPDATED DAILY · 100% FREE"
   - Huge 2-line H1 (line 2 in an accent color), a short subhead, and a left border rule.
   - Right side: a "Weekly featured" card (image, title, yellow "WEEKLY FEATURED" tag) that links to the prompt.
4. **Curated Prompt Packs** (`#prompts-packs`): 3 cards styled like notebooks (ring-binder dots on the left edge). Each card has a title, a 2-line description, "N PROMPTS →" and stacked author avatars with "+N".
5. **🔥 Hottest This Week** (`#prompts-weekly-highlights`): a 4-column grid of 8 cards with a short subtitle on the right. Each card has media (autoplay-muted video on hover for video prompts), title, @author and a MODEL tag.
6. **Browse by Media:** 3 big tiles (Image / Video / Website).
7. **Browse by Model:** a grid of model tiles (name + count) linking to `/{model}-prompts`.
8. **Browse by Category:** "Image Prompt Index" and "Video Prompt Index" panels listing top categories, with "View all" links.
9. **About** (`#prompts-about`): SEO copy block (H2 "What is the GoStudio AI prompt library?").
10. **More Prompt Features:** 3 cards: AI prompt search · Image to Prompt · Other tools.
11. **CTA band:** "Built for creators. Free forever." plus a signup button.
12. **Mega-footer:** tools, comparisons, model pages, legal, and the CC BY attribution.

### 5.2 Media hub `/prompts/image`
- H1 "IMAGE PROMPTS" and a "PROMPT TO IMAGE" CTA.
- 🔥 Hottest This Week (8).
- "Photo Prompts for Real Images" row (8).
- One row per model (6 cards each, with a "View all" link to the model page).
- Category index: 3 numbered columns (01 USE CASES / 02 STYLES / 03 SUBJECTS) listing every category link.

### 5.3 Model landing `/{model}-prompts`
- Breadcrumb, H1 "{Model} Prompts", an "Updated daily" badge, language switcher.
- Inline generator bar (prompt box + GENERATE button). This is GoStudio's conversion hook.
- **Trending Prompts** (with a "View all" link).
- **All Prompts:** category chips (ALL, Profile / Avatar, Social Media Post, …), then SORT (Newest / Hottest / Most copied) and FILTER (style, subject, language, has-variables). Masonry grid with infinite scroll or pagination.
- **Prompt card:** "BY @author · 2 days ago", image, 3-line clamped prompt text, "VIEW FULL PROMPT & COPY" and "GENERATE IMAGE" buttons.
- **About {Model}** plus "Use {Model} in GoStudio".
- **Common Questions** accordion: What is {Model}? · Where do these prompts come from? · How do I use these prompts? (Add FAQPage JSON-LD.)
- CTA band "Ready to create with {Model}?" and a footer cross-link grid (Browse by Model / Media / Tools / Category).

### 5.4 Prompt detail `/prompts/{slug}-{id}`
- Breadcrumb: PROMPTS › IMAGE PROMPT › {MODEL}
- H1 title and a one-line description.
- Media gallery (all `images[]`, lightbox) or a video player.
- **PROMPT** block: monospace text, copy button, editable variable chips, "GENERATE IMAGE WITH PROMPT" primary CTA (deep-link into GoStudio with the prompt prefilled).
- Meta: author avatar and name → X profile, "View original post", published date, model, language, tags.
- "Go beyond generating image": upsell block for GoStudio tools (edit, upscale, video).
- "How to use this prompt": 3–4 numbered steps.
- "More from {Model}": 6 cards.
- "All Image Categories": Use Cases / Styles / Subjects link lists.
- JSON-LD: `CreativeWork` with author and `isBasedOn: source_url`, plus `BreadcrumbList`.

### 5.5 Video detail `/video-prompts/{slug}-{id}`
Same as 5.4, with a video player (poster = `video_thumbnail`), "GENERATE VIDEO WITH PROMPT", "Go beyond generating video" and "All Video Categories". Many video prompts use a timeline format ("0–2s: …"). Render each time range as its own row.

### 5.6 Pack detail `/prompts-pack/{slug}`
- Breadcrumb PACKS / {name}, H1, subtitle.
- "Featured reason" paragraph (why this pack matters now: seasonal or trend-driven).
- "Curated by GoStudio team" avatar.
- "Prompts in this pack 01 / N": a numbered list (#01 …) with a large preview of the selected prompt.
- About this pack: Why this pack matters · What is included · How to use it · Best use cases.
- "More packs" (3 cards).

**Pack schema:** `{slug, title, subtitle, featured_reason, prompt_ids[], about:{why, included, how, use_cases[]}, cover, published_at}`

Starter packs to create from the dataset: Artistic Posters (watercolor, woodcut, collage), Travel Photo Edits, Impossible Camera Moves (video), YouTube Thumbnails, Profile Avatars, Product Infographics, Festival / Holiday Cards (Christmas repo).

---

## 6. Visual design notes (make it your own; don't copy it)

- **Pattern:** warm off-white page background (~#F7F3EC), with cards in a slightly lighter cream.
- Cards have a **thick near-black border (2px) and a hard offset shadow** (e.g. `box-shadow: 6px 6px 0 #1a1a1a`), a neo-brutalist / notebook feel, with rounded corners of about 12px.
- Display headings use a very heavy geometric sans (weight 900, hero ~128px on desktop) with a coral/salmon accent on the second line. Body text uses Inter.
- Small uppercase, letter-spaced labels: "8 PROMPTS →", "SEEDANCE 2.5", "WEEKLY FEATURED" (on a yellow pill).
- Hot section header has a 🔥 emoji and a right-aligned muted subtitle.
- Grid: 4 columns on desktop, 2 on tablet, 1 on mobile. Image area uses a 16:10 cover crop with a neutral beige placeholder while loading.
- Pick GoStudio's own palette and display font so the site is recognizably yours.

---

## 7. Build steps for Claude Code

1. **Stack:** Next.js (App Router) + TypeScript + Tailwind, with Postgres (Supabase) or SQLite plus Prisma. Use ISR/SSG for every listing and detail page, because SEO matters.
2. **Import:** load `prompts.json`, then normalize dates, generate unique slugs (`{slug}-{shortid}`), and map models to URL slugs (`GPT Image 2 → gpt-image-2`, `Seedream 4.5 → seedream-4-5`, `Seedance 2.0 → seedance-2-0`).
3. **Media pipeline:** download every `images[]` and `video_thumbnail` into R2/S3, convert to WebP (sharp), store width/height/blurhash, and keep `original_url`.
4. **Auto-tag** with Claude (section 4) and compute `hot_score` (e.g. copies + views, with recency decay).
5. **Refresh job:** a daily cron that runs `python3 parse.py` (it expects READMEs at `repos/<repo>.md` (run it from the folder that contains `repos/`); fetch them from `https://raw.githubusercontent.com/YouMind-OpenLab/<repo>/main/README.md`) and upserts by `source_url`. The READMEs only list a subset (featured plus latest). Translated READMEs (`README_zh.md`, `README_ja-JP.md`, …) can provide i18n titles and descriptions.
6. **Build pages** in this order: prompt detail → model landing → media hub → category pages → hub → packs.
7. **Search:** Postgres full-text or Meilisearch across title, description, prompt and tags. Phase 2: an "AI prompt search" that uses embeddings.
8. **Conversion:** every "Generate" button deep-links to the matching GoStudio tool with the prompt prefilled (`/tools/{model}?prompt=`), and "Copy" is tracked as an event.
9. **SEO:** unique titles such as "{Title} — {Model} Prompt | GoStudio", meta descriptions from `description`, canonical URLs, sitemap-index split by model, JSON-LD (section 5), and internal links from the category and "More from" blocks.
10. **Attribution:** author credit and source link on every card and detail page, plus the CC BY 4.0 footer (section 1). This is required.
11. **Verify:** Lighthouse ≥ 90, no broken image URLs, every page shows attribution, and a mobile layout with a 16px gutter and no horizontal scroll.
