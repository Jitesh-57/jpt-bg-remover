# Keyword map

One page per search intent. When two pages chase the same phrase, Google picks
one, often the weaker, and ranks neither well. This file says which URL owns
which searches, so copy, titles and internal links all point the same way.

**How it was built (Oct 2026).** Google autocomplete (US English) for ~75 seed
phrases × 7 modifiers ("free", "online", "app", "how to", "best", "for") —
4,467 real phrasings — plus the titles and headings of the pages that rank for
them today (Fotor, insMind, Kapwing, HeadshotPro, Photoroom, Pixelcut,
Aragon). There is no Search Console data yet; once it exists, re-check every
row against real impressions and re-order the work.

**What the phrasings say about the whole site**

- People type **"free"**, **"online"** and **"app"** after almost everything.
  Titles and H1s should carry "Free" and "Online" where it's true; "app" is
  covered by the copy ("works in your browser, no app to install").
- Trend searches name the model or chatbot people saw it on: "**Gemini** saree
  trend", "**Nano Banana** saree prompt", "Ghibli **in ChatGPT**". Our apps run on
  Nano Banana Pro (Google's Gemini 3 Pro Image model), so we can say so
  honestly, and answer the "how do I do this in ChatGPT/Gemini" question.
- For quality fixes, "**unblur image**" is searched more than "upscale image".
- "How to" questions are everywhere. Each primary page answers its top
  questions in its own words; deeper how-tos go to the blog.

## Clusters

Status: **live** = page exists and is indexed; **hidden** = page exists but is
noindex today; **new** = page to create. PR = where the work lands. An app
with "own page" has its copy in `src/lib/app-pages/<slug>.ts`.

### AI photo apps (`/creative/*`) — the pages that lead to sign-ups

| Cluster | Primary URL | Main phrase | Also covers | Questions to answer on the page | Status / PR |
|---|---|---|---|---|---|
| Ghibli | /creative/ghibli-style | ghibli ai, photo to ghibli (free online) | ghibli filter, ghibli art, ghibli photo generator / converter / maker, studio ghibli ai, ghibli style free | how to make a Ghibli photo; how to convert a photo to Ghibli style in ChatGPT or Gemini; best Ghibli prompt; Ghibli profile picture; couple / pet Ghibli | rewritten (own page), PR 2 |
| Action figure | /creative/3d-figurine | ai action figure generator | 3d figurine from photo, action figure of myself, make yourself an action figure, ai action figure free | how to make an action figure of myself; can I get it as a box / blister pack; does it work for pets and groups | re-aimed to "AI Action Figure Generator", PR 2 |
| Funko | /creative/funko-pop-figure | funko pop ai | funko pop ai generator, custom funko pop of yourself | how to make a Funko Pop of yourself | live, PR 2 batch 2 |
| Saree | /creative/saree-photoshoot | ai saree photo, gemini saree trend | nano banana saree prompt, ai saree photo editor free, saree trend 2026, red saree ai photo | how to do the Gemini saree trend; best saree prompt; which looks are trending | rewritten (own page), PR 2 |
| Retro Bollywood | /creative/retro-bollywood | retro bollywood ai photo | 90s bollywood saree trend, vintage bollywood photo | how to do the retro Bollywood trend | live, PR 2 batch 2 |
| Headshot (one tap) | /creative/professional-headshot | professional headshot from selfie | headshot photo from selfie free, professional headshot online | how to turn a selfie into a headshot; what to wear; will it look like me | rewritten (own page), PR 2 |
| Outfit | /creative/outfit-generator | ai outfit changer | try on clothes ai, change clothes ai, outfit generator (free online) | how to change clothes in a photo with AI; does it keep my face; can I pick the outfit | own page, now indexed, PR 2 |
| Baby photoshoot | /creative/baby-photoshoot | ai baby photoshoot | baby photoshoot ideas at home, ai baby photos free | how to do a baby photoshoot at home; is it safe for newborn photos | rewritten (own page), PR 2 |
| Baby predictor | /creative/ai-baby-predictor | ai baby generator | what will our baby look like, ai baby generator for couples (free) | how does an AI baby generator work; is it accurate | live, PR 2 batch 2 |
| Restore | /creative/restore-old-photos | restore old photos (free) | fix old photos, old photo restoration (online free), fix old photos with ai | how to restore old photos; can AI fix torn / faded photos; scan tips | rewritten (own page), PR 2 |
| Colorize | /creative/colorize-photo | colorize old photos | black and white to color, colorize old photo free | how to colorize old photos | hidden → batch 2 |
| Cartoon | /creative/cartoon-generator | photo to cartoon | cartoon yourself, turn photo into cartoon (free) | how to turn a photo into a cartoon | own page, now indexed, PR 2 |
| Anime | /creative/anime-style | photo to anime | photo to anime converter free, anime yourself | how to convert a photo to anime | rewritten (own page), PR 2 |
| Pixar | /creative/pixar-avatar | pixar style ai | 3d cartoon yourself, disney pixar filter | how to make a Pixar-style picture of yourself | live, PR 2 batch 2 |
| Yearbook | /creative/90s-yearbook-photo | ai yearbook trend | 90s yearbook photos ai, yearbook photo trend tiktok | how to do the AI yearbook trend | rewritten (own page), PR 2 |
| Polaroid | /creative/polaroid-photo | polaroid ai trend | ai polaroid photo, polaroid ai free | how to do the AI Polaroid trend | rewritten (own page), PR 2 |
| Old Hollywood | /creative/old-hollywood-glamour | old hollywood photo | old hollywood photoshoot ai, vintage glamour portrait | how to get an Old Hollywood look | rewritten (own page), PR 2 |
| Glow-up | /creative/glow-up-filter | ai glow up | glow up filter (free online), ai face glow up | how to use AI for a glow-up | rewritten (own page), PR 2 |
| Couple | /creative/couple-photoshoot | ai couple photo | couple photoshoot ai, ai wedding photos, pre-wedding ai | how to make AI couple photos; best couple prompts | rewritten (own page), PR 2 |
| Hairstyle | /creative/hairstyle-changer | ai hairstyle changer | try hairstyles on my face (free), hairstyle filter | how to try hairstyles on my face | own page, now indexed, PR 2 |

Catalog twins of the pages above (ghibli-style-generator, photo-to-anime,
pixar-filter, old-photo-restoration, action-figure-generator,
ai-yearbook-generator, glow-up-editor, saree-photo-editor, ai-headshot-generator,
linkedin-headshot, image-upscaler, background-remover, …) stay **noindex**: they
are working apps the rest of the site links to, but their copy is template
text, so they are kept out of search rather than redirected.

### Tools

| Cluster | Primary URL | Main phrase | Also covers | Questions | Status / PR |
|---|---|---|---|---|---|
| AI headshot generator | /ai-headshot | ai headshot generator (free online) | ai headshot free, professional headshots, ai headshot generator for linkedin | how to use an AI headshot generator; AI headshot vs photographer; what photo to upload | live, rewrite PR 3 |
| LinkedIn headshot | /ai-headshot/linkedin | linkedin headshot (free) | linkedin headshot generator, linkedin photo from selfie | how to take a LinkedIn headshot at home | live, PR 3 |
| Corporate headshots | /ai-headshot/corporate | corporate headshot generator | team headshots, business headshot | matching headshots for a team | live, PR 3 |
| Background remover | /remove-bg | remove background (free) | background remover, remove background from image online free, transparent background | how to remove the background from a picture; on iPhone; vs Canva / remove.bg | live, rewrite PR 3 |
| White / passport background | /remove-bg/passport-photo | white background photo | passport photo white background | how to make a white background for a passport photo | live, PR 3 |
| Product photos | /remove-bg/product-photos | product photo background remover | white background product photo, amazon product photo | — | live, PR 3 |
| Logo / signature | /remove-bg/logo, /remove-bg/signature | transparent logo, transparent signature | make logo / signature transparent | — | live |
| Change background | /creative/background-changer | change background ai | ai background changer, replace photo background | how to change a photo background with AI | live, PR 2 batch 2 |
| Upscaler | /upscale | image upscaler (free) | upscale image, increase image resolution, enhance photo quality, unblur image | how to unblur an image; how to increase resolution without losing quality | live, rewrite PR 3 |
| 4K | /upscale/4k | 4k image upscaler | upscale to 4k free | — | live |
| AI photo editor | /ai-editor | ai photo editor (free online) | edit photo with ai, ai image editor | how to edit a photo with AI (text prompts) | live, rewrite PR 3 |
| Object removal | /ai-editor/remove-object | remove object from photo (free) | remove people from photo, magic eraser | how to remove an object from a photo | live, PR 3 |
| AI image generator | /ai-image-generator | ai image generator (free) | text to image, ai art generator, free ai image generator no sign up, nano banana | how to write a good image prompt | **new**, PR 3 |
| Resize / compress | /resize-image, /compress-image, /compress/* | resize image, compress image, image to 100kb | reduce image size, passport photo size | how to compress an image to 100 KB | live, PR 3 (resize, compress) |
| Prompts | /prompts, /nano-banana-pro-prompts | nano banana prompts, ai photo prompts | gemini photo prompts, chatgpt image prompts | how to write Nano Banana prompts | live; review with Search Console data |

### Retired: thin pages merged into their primary page (PR 1, 301)

| Old URL | Moves to |
|---|---|
| /ai/ai-headshot-generator | /ai-headshot |
| /ai/ai-image-editor, /ai/photo-editor | /ai-editor |
| /ai/background-changer | /creative/background-changer |
| /ai/photo-enhancer | /upscale |
| /ai/ai-photo-generator | /ai-image-generator (in PR 3, when that page exists) |
| /answers/remove-background-from-photo | /remove-bg |
| /answers/change-background-of-product-photo | /remove-bg/product-photos |
| /answers/change-outfit-in-photo | /creative/outfit-generator |
| /answers/edit-photo-with-text-prompt | /ai-editor |
| /answers/enhance-blurry-photo | /upscale |
| /answers/make-instagram-profile-picture | /creative/instagram-pfp-maker |
| /answers/make-professional-headshot-from-selfie | /creative/professional-headshot |
| /answers/make-youtube-thumbnail-from-photo | /creative/youtube-thumbnail-generator |
| /answers/remove-object-from-photo | /ai-editor/remove-object |
| /answers/restore-old-photo | /creative/restore-old-photos |
| /answers (hub) | /guides |

## Blog (PR 4)

The blog owns **how-to and comparison** intent; app and tool pages own the
"do it now" intent. New deep posts, each linking to its app:

1. How to turn a photo into Ghibli style (free, plus ChatGPT and Gemini) → /creative/ghibli-style
2. Best Ghibli prompts (copy-paste) → /creative/ghibli-style
3. How to make an action figure of yourself → /creative/3d-figurine
4. The Gemini AI saree trend: looks, prompts and how to do it free → /creative/saree-photoshoot
5. AI headshot vs a photographer: cost, quality, when each makes sense → /ai-headshot
6. How to restore and colorize old photos → /creative/restore-old-photos
7. AI baby photoshoot at home: ideas that actually work → /creative/baby-photoshoot
8. The AI yearbook trend, explained → /creative/90s-yearbook-photo
9. How to turn a photo into a cartoon or anime → /creative/cartoon-generator
10. Best free AI photo editors, honestly compared → /ai-editor

Existing near-duplicate posts (the upscale cluster first, then headshot) merge
into their strongest post with 301s, following
[duplicate-clusters.md](./duplicate-clusters.md).
