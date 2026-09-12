# Image slots — every page and the exact filename it looks for

Generated from the code, not written by hand. Regenerate after adding pages.

**How a slot fills:** upload a file with the exact name into the named Supabase bucket.
No redeploy and no code change — the page picks it up (app pages revalidate every 5 minutes).
A slot with no file shows a gradient placeholder, never a broken image.

Buckets: **`landing`** (public) · **`Blogs`** (public) · **`App preset images`** (public)

Names are matched literally: lowercase, hyphens, `.png` unless stated.

---

## 0. Brand (4 files, do these first)

| File | Bucket | Size | What it is |
|---|---|---|---|
| `logo-wordmark.png` | landing | ~3400×940, transparent | mark + "Pixel Shine", no tagline — navbar, footer, sign-in, batch editor |
| `logo.png` | landing | ~2000×652, transparent | full lockup incl. tagline — /lp/ pages |
| `logo-mark.png` | landing | 512×512, transparent | square mark — favicon, apple icon |
| `og-default.png` | landing | 1200×630 | social share card (not yet wired — say the word) |

---

## 1. Homepage — `/` (4 files)

| File | Bucket | Aspect | Export | What it shows |
|---|---|---|---|---|
| `home-hero.png` | landing | 21:9 | 2100×900 | wide before/after strip: original left, Pixel Shine result right |
| `home-step-1.png` | landing | 16:10 | 1200×750 | a photo being dropped onto an upload area |
| `home-step-2.png` | landing | 16:10 | 1200×750 | a grid of style choices / a typed prompt |
| `home-step-3.png` | landing | 16:10 | 1200×750 | the finished image downloading, full-res, no watermark |

---

## 2. Pro tool landing pages (6 files)

| URL | File | Bucket | Export |
|---|---|---|---|
| `/` + `/upscale` | `upscale-before.jpg` **and** `upscale-after.jpg` | landing | 1200×750 each — same crop, one soft one sharp |
| `/remove-bg` | `page-remove-bg.png` | landing | 1200×750 |
| `/ai-editor` | `page-ai-editor.png` | landing | 1200×750 |
| `/ai-headshot` | `page-ai-headshot.png` | landing | 1200×750 |

Variant pages under these parents reuse the parent image:

- `/upscale` → `/upscale/4k`, `/upscale/anime`, `/upscale/old-photos`, `/upscale/profile-picture`
- `/remove-bg` → `/remove-bg/logo`, `/remove-bg/passport-photo`, `/remove-bg/product-photos`, `/remove-bg/signature`
- `/ai-editor` → `/ai-editor/change-background`, `/ai-editor/remove-object`
- `/ai-headshot` → `/ai-headshot/corporate`, `/ai-headshot/linkedin`

---

## 3. Free tool pages (13 files)

All 1200×750, bucket in the table. Each is a labelled before/after of that tool doing its job.

| URL | File | Bucket |
|---|---|---|
| `/compress-image` | `image-compressor-before-after.png` | landing |
| `/convert-image` | `image-converter-before-after.png` | landing |
| `/crop-image` | `image-cropper-before-after.png` | landing |
| `/resize-image` | `image-resizer-before-after.png` | landing |
| `/rotate-image` | `rotate-flip-before-after.png` | landing |
| `/watermark-image` | `add-text-watermark-before-after.png` | landing |
| `/meme-generator` | `meme-generator-before-after.png` | landing |
| `/image-to-pdf` | `photo-to-pdf-before-after.png` | landing |
| `/tiktok-watermark-remover` | `tiktok-watermark-remover-hero.png` | landing |
| `/blur-image` | `blur-image-before-after.png` | Blogs |
| `/qr-code-generator` | `qr-code-generator-showcase.png` | Blogs |
| `/watermark-remover` | `watermark-before-1..4.png` + `watermark-after-1..4.png` (8 files, 4:3) | Blogs |

---

## 4. AI app pages — `/creative/<slug>` (200 files)

One file per app: `creative/<slug>.png` in the **landing** bucket (note the `creative/` folder).
**4:5 portrait, export 1000×1250.** It is the app's card on the homepage and hub *and* the
before/after showcase on the app page, so make it the finished result of that app.

| # | URL | Image file |
|---|---|---|
| 1 | `/creative/saree-photoshoot` | `creative/saree-photoshoot.png` |
| 2 | `/creative/3d-figurine` | `creative/3d-figurine.png` |
| 3 | `/creative/retro-bollywood` | `creative/retro-bollywood.png` |
| 4 | `/creative/polaroid-photo` | `creative/polaroid-photo.png` |
| 5 | `/creative/restore-old-photos` | `creative/restore-old-photos.png` |
| 6 | `/creative/couple-photoshoot` | `creative/couple-photoshoot.png` |
| 7 | `/creative/professional-headshot` | `creative/professional-headshot.png` |
| 8 | `/creative/festival-photoshoot` | `creative/festival-photoshoot.png` |
| 9 | `/creative/pet-portrait` | `creative/pet-portrait.png` |
| 10 | `/creative/anime-style` | `creative/anime-style.png` |
| 11 | `/creative/passport-photo` | `creative/passport-photo.png` |
| 12 | `/creative/background-changer` | `creative/background-changer.png` |
| 13 | `/creative/linkedin-banner` | `creative/linkedin-banner.png` |
| 14 | `/creative/christmas-photo` | `creative/christmas-photo.png` |
| 15 | `/creative/baby-photoshoot` | `creative/baby-photoshoot.png` |
| 16 | `/creative/graduation-photo` | `creative/graduation-photo.png` |
| 17 | `/creative/gym-transformation` | `creative/gym-transformation.png` |
| 18 | `/creative/ghibli-style` | `creative/ghibli-style.png` |
| 19 | `/creative/y2k-aesthetic` | `creative/y2k-aesthetic.png` |
| 20 | `/creative/wedding-invite-photo` | `creative/wedding-invite-photo.png` |
| 21 | `/creative/corporate-avatar` | `creative/corporate-avatar.png` |
| 22 | `/creative/old-money-aesthetic` | `creative/old-money-aesthetic.png` |
| 23 | `/creative/barbie-box` | `creative/barbie-box.png` |
| 24 | `/creative/ai-baby-predictor` | `creative/ai-baby-predictor.png` |
| 25 | `/creative/lego-minifigure` | `creative/lego-minifigure.png` |
| 26 | `/creative/pixar-avatar` | `creative/pixar-avatar.png` |
| 27 | `/creative/renaissance-portrait` | `creative/renaissance-portrait.png` |
| 28 | `/creative/age-progression` | `creative/age-progression.png` |
| 29 | `/creative/superhero-costume` | `creative/superhero-costume.png` |
| 30 | `/creative/tarot-card-portrait` | `creative/tarot-card-portrait.png` |
| 31 | `/creative/90s-yearbook-photo` | `creative/90s-yearbook-photo.png` |
| 32 | `/creative/cyberpunk-avatar` | `creative/cyberpunk-avatar.png` |
| 33 | `/creative/funko-pop-figure` | `creative/funko-pop-figure.png` |
| 34 | `/creative/claymation-portrait` | `creative/claymation-portrait.png` |
| 35 | `/creative/comic-book-cover` | `creative/comic-book-cover.png` |
| 36 | `/creative/coastal-cowgirl` | `creative/coastal-cowgirl.png` |
| 37 | `/creative/old-hollywood-glamour` | `creative/old-hollywood-glamour.png` |
| 38 | `/creative/prom-photoshoot` | `creative/prom-photoshoot.png` |
| 39 | `/creative/thanksgiving-photoshoot` | `creative/thanksgiving-photoshoot.png` |
| 40 | `/creative/glow-up-filter` | `creative/glow-up-filter.png` |
| 41 | `/creative/astronaut-photoshoot` | `creative/astronaut-photoshoot.png` |
| 42 | `/creative/pixel-art-avatar` | `creative/pixel-art-avatar.png` |
| 43 | `/creative/ai-headshot-generator` | `creative/ai-headshot-generator.png` |
| 44 | `/creative/linkedin-headshot` | `creative/linkedin-headshot.png` |
| 45 | `/creative/ceo-headshot` | `creative/ceo-headshot.png` |
| 46 | `/creative/actor-headshot` | `creative/actor-headshot.png` |
| 47 | `/creative/doctor-headshot` | `creative/doctor-headshot.png` |
| 48 | `/creative/lawyer-headshot` | `creative/lawyer-headshot.png` |
| 49 | `/creative/real-estate-headshot` | `creative/real-estate-headshot.png` |
| 50 | `/creative/business-headshot` | `creative/business-headshot.png` |
| 51 | `/creative/outdoor-headshot` | `creative/outdoor-headshot.png` |
| 52 | `/creative/eras-headshot` | `creative/eras-headshot.png` |
| 53 | `/creative/add-suit-to-photo` | `creative/add-suit-to-photo.png` |
| 54 | `/creative/celebrity-headshot` | `creative/celebrity-headshot.png` |
| 55 | `/creative/ai-photoshoot` | `creative/ai-photoshoot.png` |
| 56 | `/creative/ai-selfie-generator` | `creative/ai-selfie-generator.png` |
| 57 | `/creative/profile-picture-maker` | `creative/profile-picture-maker.png` |
| 58 | `/creative/outfit-generator` | `creative/outfit-generator.png` |
| 59 | `/creative/saree-photo-editor` | `creative/saree-photo-editor.png` |
| 60 | `/creative/dress-photo-editor` | `creative/dress-photo-editor.png` |
| 61 | `/creative/maternity-photoshoot` | `creative/maternity-photoshoot.png` |
| 62 | `/creative/birthday-photo-editor` | `creative/birthday-photo-editor.png` |
| 63 | `/creative/anniversary-photo-editor` | `creative/anniversary-photo-editor.png` |
| 64 | `/creative/fashion-photo-editor` | `creative/fashion-photo-editor.png` |
| 65 | `/creative/aesthetic-photo-editor` | `creative/aesthetic-photo-editor.png` |
| 66 | `/creative/travel-photo-editor` | `creative/travel-photo-editor.png` |
| 67 | `/creative/ghibli-style-generator` | `creative/ghibli-style-generator.png` |
| 68 | `/creative/pixar-filter` | `creative/pixar-filter.png` |
| 69 | `/creative/photo-to-anime` | `creative/photo-to-anime.png` |
| 70 | `/creative/cartoon-generator` | `creative/cartoon-generator.png` |
| 71 | `/creative/caricature-maker` | `creative/caricature-maker.png` |
| 72 | `/creative/photo-to-oil-painting` | `creative/photo-to-oil-painting.png` |
| 73 | `/creative/photo-to-illustration` | `creative/photo-to-illustration.png` |
| 74 | `/creative/ai-webtoon-generator` | `creative/ai-webtoon-generator.png` |
| 75 | `/creative/comic-generator` | `creative/comic-generator.png` |
| 76 | `/creative/pixel-art-generator` | `creative/pixel-art-generator.png` |
| 77 | `/creative/south-park-style` | `creative/south-park-style.png` |
| 78 | `/creative/stardew-profile-maker` | `creative/stardew-profile-maker.png` |
| 79 | `/creative/ai-vtuber-maker` | `creative/ai-vtuber-maker.png` |
| 80 | `/creative/goth-generator` | `creative/goth-generator.png` |
| 81 | `/creative/ai-vampire` | `creative/ai-vampire.png` |
| 82 | `/creative/ai-fairy-filter` | `creative/ai-fairy-filter.png` |
| 83 | `/creative/ai-mermaid-filter` | `creative/ai-mermaid-filter.png` |
| 84 | `/creative/superhero-generator` | `creative/superhero-generator.png` |
| 85 | `/creative/glitch-effect` | `creative/glitch-effect.png` |
| 86 | `/creative/silhouette-maker` | `creative/silhouette-maker.png` |
| 87 | `/creative/stencil-maker` | `creative/stencil-maker.png` |
| 88 | `/creative/coloring-page-generator` | `creative/coloring-page-generator.png` |
| 89 | `/creative/ai-tattoo-generator` | `creative/ai-tattoo-generator.png` |
| 90 | `/creative/birth-flower-tattoo` | `creative/birth-flower-tattoo.png` |
| 91 | `/creative/ai-art-generator` | `creative/ai-art-generator.png` |
| 92 | `/creative/ai-painter` | `creative/ai-painter.png` |
| 93 | `/creative/ai-pokemon-generator` | `creative/ai-pokemon-generator.png` |
| 94 | `/creative/image-to-emoji` | `creative/image-to-emoji.png` |
| 95 | `/creative/text-to-emoji` | `creative/text-to-emoji.png` |
| 96 | `/creative/photo-retouching` | `creative/photo-retouching.png` |
| 97 | `/creative/blemish-remover` | `creative/blemish-remover.png` |
| 98 | `/creative/red-eye-remover` | `creative/red-eye-remover.png` |
| 99 | `/creative/eye-color-changer` | `creative/eye-color-changer.png` |
| 100 | `/creative/face-expression-changer` | `creative/face-expression-changer.png` |
| 101 | `/creative/smile-filter` | `creative/smile-filter.png` |
| 102 | `/creative/sad-face-filter` | `creative/sad-face-filter.png` |
| 103 | `/creative/hairstyle-changer` | `creative/hairstyle-changer.png` |
| 104 | `/creative/hair-color-changer` | `creative/hair-color-changer.png` |
| 105 | `/creative/blonde-hair-filter` | `creative/blonde-hair-filter.png` |
| 106 | `/creative/long-hair-filter` | `creative/long-hair-filter.png` |
| 107 | `/creative/curly-hair-filter` | `creative/curly-hair-filter.png` |
| 108 | `/creative/bangs-filter` | `creative/bangs-filter.png` |
| 109 | `/creative/buzz-cut-filter` | `creative/buzz-cut-filter.png` |
| 110 | `/creative/bald-filter` | `creative/bald-filter.png` |
| 111 | `/creative/beard-filter` | `creative/beard-filter.png` |
| 112 | `/creative/no-beard-filter` | `creative/no-beard-filter.png` |
| 113 | `/creative/eyebrow-filter` | `creative/eyebrow-filter.png` |
| 114 | `/creative/braces-filter` | `creative/braces-filter.png` |
| 115 | `/creative/add-glasses-to-photo` | `creative/add-glasses-to-photo.png` |
| 116 | `/creative/piercing-filter` | `creative/piercing-filter.png` |
| 117 | `/creative/muscle-generator` | `creative/muscle-generator.png` |
| 118 | `/creative/abs-filter` | `creative/abs-filter.png` |
| 119 | `/creative/photo-color-correction` | `creative/photo-color-correction.png` |
| 120 | `/creative/brighten-image` | `creative/brighten-image.png` |
| 121 | `/creative/darken-image` | `creative/darken-image.png` |
| 122 | `/creative/recolor-image` | `creative/recolor-image.png` |
| 123 | `/creative/invert-image-color` | `creative/invert-image-color.png` |
| 124 | `/creative/color-splash` | `creative/color-splash.png` |
| 125 | `/creative/old-photo-restoration` | `creative/old-photo-restoration.png` |
| 126 | `/creative/colorize-photo` | `creative/colorize-photo.png` |
| 127 | `/creative/black-and-white-to-color` | `creative/black-and-white-to-color.png` |
| 128 | `/creative/unblur-image` | `creative/unblur-image.png` |
| 129 | `/creative/unpixelate-image` | `creative/unpixelate-image.png` |
| 130 | `/creative/denoise-image` | `creative/denoise-image.png` |
| 131 | `/creative/image-sharpener` | `creative/image-sharpener.png` |
| 132 | `/creative/image-upscaler` | `creative/image-upscaler.png` |
| 133 | `/creative/4k-image-upscaler` | `creative/4k-image-upscaler.png` |
| 134 | `/creative/image-enlarger` | `creative/image-enlarger.png` |
| 135 | `/creative/hd-photo-converter` | `creative/hd-photo-converter.png` |
| 136 | `/creative/png-maker` | `creative/png-maker.png` |
| 137 | `/creative/background-remover` | `creative/background-remover.png` |
| 138 | `/creative/white-background-remover` | `creative/white-background-remover.png` |
| 139 | `/creative/background-generator` | `creative/background-generator.png` |
| 140 | `/creative/blur-background` | `creative/blur-background.png` |
| 141 | `/creative/room-design` | `creative/room-design.png` |
| 142 | `/creative/ai-interior-design` | `creative/ai-interior-design.png` |
| 143 | `/creative/interior-photo-editor` | `creative/interior-photo-editor.png` |
| 144 | `/creative/house-photo-editor` | `creative/house-photo-editor.png` |
| 145 | `/creative/architecture-photo-editor` | `creative/architecture-photo-editor.png` |
| 146 | `/creative/object-remover` | `creative/object-remover.png` |
| 147 | `/creative/remove-people-from-photo` | `creative/remove-people-from-photo.png` |
| 148 | `/creative/watermark-remover-ai` | `creative/watermark-remover-ai.png` |
| 149 | `/creative/remove-text-from-image` | `creative/remove-text-from-image.png` |
| 150 | `/creative/emoji-remover` | `creative/emoji-remover.png` |
| 151 | `/creative/remove-shadow-from-photo` | `creative/remove-shadow-from-photo.png` |
| 152 | `/creative/blur-face` | `creative/blur-face.png` |
| 153 | `/creative/license-plate-blur` | `creative/license-plate-blur.png` |
| 154 | `/creative/mirror-image` | `creative/mirror-image.png` |
| 155 | `/creative/product-photoshoot` | `creative/product-photoshoot.png` |
| 156 | `/creative/ai-product-photography` | `creative/ai-product-photography.png` |
| 157 | `/creative/ecommerce-product-editor` | `creative/ecommerce-product-editor.png` |
| 158 | `/creative/amazon-product-editor` | `creative/amazon-product-editor.png` |
| 159 | `/creative/image-editor-for-jewelry` | `creative/image-editor-for-jewelry.png` |
| 160 | `/creative/image-editor-for-beauty` | `creative/image-editor-for-beauty.png` |
| 161 | `/creative/food-photo-editor` | `creative/food-photo-editor.png` |
| 162 | `/creative/car-photo-editor` | `creative/car-photo-editor.png` |
| 163 | `/creative/bike-photo-editor` | `creative/bike-photo-editor.png` |
| 164 | `/creative/truck-photo-editor` | `creative/truck-photo-editor.png` |
| 165 | `/creative/image-editor-for-real-estate` | `creative/image-editor-for-real-estate.png` |
| 166 | `/creative/image-editor-for-hotels` | `creative/image-editor-for-hotels.png` |
| 167 | `/creative/image-editor-for-restaurants` | `creative/image-editor-for-restaurants.png` |
| 168 | `/creative/image-editor-for-electronics` | `creative/image-editor-for-electronics.png` |
| 169 | `/creative/image-editor-for-home-decor` | `creative/image-editor-for-home-decor.png` |
| 170 | `/creative/ai-ads-generator` | `creative/ai-ads-generator.png` |
| 171 | `/creative/marketing-creative-editor` | `creative/marketing-creative-editor.png` |
| 172 | `/creative/thumbnail-maker` | `creative/thumbnail-maker.png` |
| 173 | `/creative/youtube-thumbnail-generator` | `creative/youtube-thumbnail-generator.png` |
| 174 | `/creative/instagram-photo-editor` | `creative/instagram-photo-editor.png` |
| 175 | `/creative/instagram-pfp-maker` | `creative/instagram-pfp-maker.png` |
| 176 | `/creative/linkedin-pfp-maker` | `creative/linkedin-pfp-maker.png` |
| 177 | `/creative/discord-pfp-maker` | `creative/discord-pfp-maker.png` |
| 178 | `/creative/youtube-pfp-maker` | `creative/youtube-pfp-maker.png` |
| 179 | `/creative/facebook-pfp-maker` | `creative/facebook-pfp-maker.png` |
| 180 | `/creative/roblox-pfp-maker` | `creative/roblox-pfp-maker.png` |
| 181 | `/creative/fish-eye-pfp` | `creative/fish-eye-pfp.png` |
| 182 | `/creative/linkedin-banner-maker` | `creative/linkedin-banner-maker.png` |
| 183 | `/creative/album-cover-generator` | `creative/album-cover-generator.png` |
| 184 | `/creative/movie-poster-generator` | `creative/movie-poster-generator.png` |
| 185 | `/creative/book-cover-generator` | `creative/book-cover-generator.png` |
| 186 | `/creative/logo-maker` | `creative/logo-maker.png` |
| 187 | `/creative/gaming-logo-maker` | `creative/gaming-logo-maker.png` |
| 188 | `/creative/icon-generator` | `creative/icon-generator.png` |
| 189 | `/creative/age-progression-tool` | `creative/age-progression-tool.png` |
| 190 | `/creative/old-filter` | `creative/old-filter.png` |
| 191 | `/creative/baby-face-filter` | `creative/baby-face-filter.png` |
| 192 | `/creative/ai-time-machine` | `creative/ai-time-machine.png` |
| 193 | `/creative/ai-yearbook-generator` | `creative/ai-yearbook-generator.png` |
| 194 | `/creative/1980s-photo-trend` | `creative/1980s-photo-trend.png` |
| 195 | `/creative/action-figure-generator` | `creative/action-figure-generator.png` |
| 196 | `/creative/funko-figure-maker` | `creative/funko-figure-maker.png` |
| 197 | `/creative/aura-farm-horse` | `creative/aura-farm-horse.png` |
| 198 | `/creative/ai-character-generator` | `creative/ai-character-generator.png` |
| 199 | `/creative/ai-avatar-generator` | `creative/ai-avatar-generator.png` |
| 200 | `/creative/glow-up-editor` | `creative/glow-up-editor.png` |

---

## 5. App preset thumbnails — 74 files cover all 200 apps

Bucket **`App preset images`**, **3:4 portrait, export 600×800.**

Three names are tried, most specific first, so you only need the middle one:

1. `<app-slug>__<preset-id>.png` — overrides one app
2. **`<category>__<preset-id>.png` — covers every app in that category** ← fill these in
3. `preset__<preset-id>.png` — shared last resort

| Category | Files to upload |
|---|---|
| `background` | `background__transparent.png` · `background__studio.png` · `background__office.png` · `background__outdoor.png` · `background__gradient.png` · `background__bokeh.png` |
| `enhance` | `enhance__upscale2.png` · `enhance__upscale4.png` · `enhance__sharpen.png` · `enhance__denoise.png` · `enhance__artefact.png` · `enhance__print.png` |
| `fun` | `fun__product.png` · `fun__desk.png` · `fun__plain.png` · `fun__scene.png` · `fun__group.png` · `fun__closeup.png` |
| `headshot` | `headshot__corporate.png` · `headshot__linkedin.png` · `headshot__exec.png` · `headshot__creative.png` · `headshot__outdoor.png` · `headshot__plain.png` |
| `portrait` | `portrait__studio.png` · `portrait__golden.png` · `portrait__candid.png` · `portrait__editorial.png` · `portrait__moody.png` · `portrait__fullbody.png` |
| `product` | `product__white.png` · `product__studio.png` · `product__lifestyle.png` · `product__marble.png` · `product__outdoor.png` · `product__gradient.png` |
| `remove` | `remove__people.png` · `remove__objects.png` · `remove__text.png` · `remove__clutter.png` · `remove__glare.png` · `remove__clean.png` |
| `restore` | `restore__repair.png` · `restore__fade.png` · `restore__colourise.png` · `restore__mono.png` · `restore__sharpen.png` · `restore__faces.png` |
| `retouch` | `retouch__natural.png` · `retouch__colour.png` · `retouch__light.png` · `retouch__denoise.png` · `retouch__shine.png` · `retouch__polish.png` |
| `social` | `social__square.png` · `social__portrait.png` · `social__wide.png` · `social__circle.png` · `social__bold.png` · `social__minimal.png` |
| `style` | `style__portrait.png` · `style__fullbody.png` · `style__flat.png` · `style__textured.png` · `style__avatar.png` · `style__poster.png` |
| *(fallback)* | `preset__studio.png` · `preset__street.png` · `preset__cinema.png` · `preset__closeup.png` · `preset__fullbody.png` · `preset__golden.png` · `preset__moody.png` · `preset__editorial.png` |

Plus 3 sample photos users can try without uploading — same bucket, 3:4:
`sample1.png`, `sample2.png`, `sample3.png`

---

## 6. Programmatic tool pages

Bucket **`Blogs`**, 600px wide, before/after of that exact conversion.

### Convert — 11 pages

| URL | Image file |
|---|---|
| `/convert/avif-to-jpg` | `convert-avif-to-jpg.png` |
| `/convert/avif-to-png` | `convert-avif-to-png.png` |
| `/convert/bmp-to-jpg` | `convert-bmp-to-jpg.png` |
| `/convert/gif-to-png` | `convert-gif-to-png.png` |
| `/convert/jpg-to-png` | `convert-jpg-to-png.png` |
| `/convert/jpg-to-webp` | `convert-jpg-to-webp.png` |
| `/convert/png-to-jpg` | `convert-png-to-jpg.png` |
| `/convert/png-to-webp` | `convert-png-to-webp.png` |
| `/convert/svg-to-png` | `convert-svg-to-png.png` |
| `/convert/webp-to-jpg` | `convert-webp-to-jpg.png` |
| `/convert/webp-to-png` | `convert-webp-to-png.png` |

### Compress — 6 pages

| URL | Image file |
|---|---|
| `/compress/compress-image-to-100kb` | `compress-image-to-100kb.png` |
| `/compress/compress-image-to-1mb` | `compress-image-to-1mb.png` |
| `/compress/compress-image-to-200kb` | `compress-image-to-200kb.png` |
| `/compress/compress-image-to-20kb` | `compress-image-to-20kb.png` |
| `/compress/compress-image-to-500kb` | `compress-image-to-500kb.png` |
| `/compress/compress-image-to-50kb` | `compress-image-to-50kb.png` |

### Crop — 6 pages

| URL | Image file |
|---|---|
| `/crop/circle-crop-image` | `circle-crop-image.png` |
| `/crop/crop-image-to-square` | `crop-image-to-square.png` |
| `/crop/instagram-post-size` | `instagram-post-size.png` |
| `/crop/instagram-profile-picture` | `instagram-profile-picture.png` |
| `/crop/instagram-story-size` | `instagram-story-size.png` |
| `/crop/youtube-thumbnail-crop` | `youtube-thumbnail-crop.png` |

---

## 7. Blog — 216 posts

Bucket **`landing`**, folder `blog/`, **16:9, export 1600×900.**

| URL | Image file |
|---|---|
| `/blog/4k-image-upscaler-free` | `blog/4k-image-upscaler-free.png` |
| `/blog/add-watermark-to-photos-free` | `blog/add-watermark-to-photos-free.png` |
| `/blog/ai-enhance-old-photos-free` | `blog/ai-enhance-old-photos-free.png` |
| `/blog/ai-image-enhancer-no-watermark` | `blog/ai-image-enhancer-no-watermark.png` |
| `/blog/ai-image-upscaler-enhance-photo-quality` | `blog/ai-image-upscaler-enhance-photo-quality.png` |
| `/blog/ai-photo-enhancer-free-online` | `blog/ai-photo-enhancer-free-online.png` |
| `/blog/ai-photo-restoration-free-online` | `blog/ai-photo-restoration-free-online.png` |
| `/blog/ai-upscaling-vs-traditional-upscaling-comparison` | `blog/ai-upscaling-vs-traditional-upscaling-comparison.png` |
| `/blog/batch-upscale-images-bulk-photo-processing` | `blog/batch-upscale-images-bulk-photo-processing.png` |
| `/blog/before-after-photo-upscale-comparison` | `blog/before-after-photo-upscale-comparison.png` |
| `/blog/best-free-ai-image-upscaler-tools-2025` | `blog/best-free-ai-image-upscaler-tools-2025.png` |
| `/blog/best-free-ai-photo-enhancer-2025` | `blog/best-free-ai-photo-enhancer-2025.png` |
| `/blog/best-free-image-upscaler-no-watermark` | `blog/best-free-image-upscaler-no-watermark.png` |
| `/blog/best-free-photo-enhancer-no-app` | `blog/best-free-photo-enhancer-no-app.png` |
| `/blog/best-free-tinypng-alternatives` | `blog/best-free-tinypng-alternatives.png` |
| `/blog/best-image-sizes-for-social-media` | `blog/best-image-sizes-for-social-media.png` |
| `/blog/compress-image-to-100kb-free` | `blog/compress-image-to-100kb-free.png` |
| `/blog/compress-photo-for-email-free` | `blog/compress-photo-for-email-free.png` |
| `/blog/compress-vs-upscale-image-quality-free` | `blog/compress-vs-upscale-image-quality-free.png` |
| `/blog/convert-image-to-pdf-free` | `blog/convert-image-to-pdf-free.png` |
| `/blog/convert-jpg-to-png-free` | `blog/convert-jpg-to-png-free.png` |
| `/blog/convert-photo-to-4k-free` | `blog/convert-photo-to-4k-free.png` |
| `/blog/convert-png-to-jpg-free` | `blog/convert-png-to-jpg-free.png` |
| `/blog/crop-image-for-instagram-free` | `blog/crop-image-for-instagram-free.png` |
| `/blog/download-tiktok-video-in-hd-no-watermark` | `blog/download-tiktok-video-in-hd-no-watermark.png` |
| `/blog/download-tiktok-videos-without-a-watermark` | `blog/download-tiktok-videos-without-a-watermark.png` |
| `/blog/enhance-baby-newborn-photos` | `blog/enhance-baby-newborn-photos.png` |
| `/blog/enhance-black-and-white-photos-free` | `blog/enhance-black-and-white-photos-free.png` |
| `/blog/enhance-blurry-video-call-screenshot` | `blog/enhance-blurry-video-call-screenshot.png` |
| `/blog/enhance-blurry-wedding-photos-free` | `blog/enhance-blurry-wedding-photos-free.png` |
| `/blog/enhance-cctv-security-camera-image-free` | `blog/enhance-cctv-security-camera-image-free.png` |
| `/blog/enhance-fashion-lookbook-photos` | `blog/enhance-fashion-lookbook-photos.png` |
| `/blog/enhance-image-quality-online-free` | `blog/enhance-image-quality-online-free.png` |
| `/blog/enhance-low-resolution-image` | `blog/enhance-low-resolution-image.png` |
| `/blog/enhance-passport-visa-photo-quality` | `blog/enhance-passport-visa-photo-quality.png` |
| `/blog/enhance-photo-free-no-download` | `blog/enhance-photo-free-no-download.png` |
| `/blog/enhance-photos-free-no-app-download` | `blog/enhance-photos-free-no-app-download.png` |
| `/blog/enhance-portrait-photos-ai-free` | `blog/enhance-portrait-photos-ai-free.png` |
| `/blog/enhance-product-images-free` | `blog/enhance-product-images-free.png` |
| `/blog/enhance-product-photos-free` | `blog/enhance-product-photos-free.png` |
| `/blog/enhance-profile-picture-free` | `blog/enhance-profile-picture-free.png` |
| `/blog/enhance-scanned-photos-free` | `blog/enhance-scanned-photos-free.png` |
| `/blog/enlarge-image-without-losing-quality-free` | `blog/enlarge-image-without-losing-quality-free.png` |
| `/blog/facebook-cover-photo-size-guide` | `blog/facebook-cover-photo-size-guide.png` |
| `/blog/fix-blurry-photo-online-free` | `blog/fix-blurry-photo-online-free.png` |
| `/blog/fix-low-light-concert-photos` | `blog/fix-low-light-concert-photos.png` |
| `/blog/fix-whatsapp-blurry-photos` | `blog/fix-whatsapp-blurry-photos.png` |
| `/blog/flip-mirror-image-free` | `blog/flip-mirror-image-free.png` |
| `/blog/free-ai-upscaler-unlimited-no-limits` | `blog/free-ai-upscaler-unlimited-no-limits.png` |
| `/blog/free-alternative-to-lets-enhance` | `blog/free-alternative-to-lets-enhance.png` |
| `/blog/free-alternative-to-topaz-gigapixel` | `blog/free-alternative-to-topaz-gigapixel.png` |
| `/blog/free-bulk-image-upscaler-batch` | `blog/free-bulk-image-upscaler-batch.png` |
| `/blog/free-image-upscaler-no-sign-up` | `blog/free-image-upscaler-no-sign-up.png` |
| `/blog/free-image-upscaler-vs-paid` | `blog/free-image-upscaler-vs-paid.png` |
| `/blog/free-online-photo-sharpener` | `blog/free-online-photo-sharpener.png` |
| `/blog/free-tiktok-video-downloader-apps` | `blog/free-tiktok-video-downloader-apps.png` |
| `/blog/free-webp-image-upscaler` | `blog/free-webp-image-upscaler.png` |
| `/blog/how-to-add-a-caption-to-a-photo` | `blog/how-to-add-a-caption-to-a-photo.png` |
| `/blog/how-to-add-a-logo-watermark-to-photos` | `blog/how-to-add-a-logo-watermark-to-photos.png` |
| `/blog/how-to-add-a-transparent-watermark` | `blog/how-to-add-a-transparent-watermark.png` |
| `/blog/how-to-add-text-to-a-photo` | `blog/how-to-add-text-to-a-photo.png` |
| `/blog/how-to-add-watermark-to-photos` | `blog/how-to-add-watermark-to-photos.png` |
| `/blog/how-to-bulk-edit-photos` | `blog/how-to-bulk-edit-photos.png` |
| `/blog/how-to-combine-images-into-a-pdf` | `blog/how-to-combine-images-into-a-pdf.png` |
| `/blog/how-to-compress-a-png-file` | `blog/how-to-compress-a-png-file.png` |
| `/blog/how-to-compress-an-image-to-100kb` | `blog/how-to-compress-an-image-to-100kb.png` |
| `/blog/how-to-compress-an-image-to-500kb` | `blog/how-to-compress-an-image-to-500kb.png` |
| `/blog/how-to-compress-an-image-to-50kb` | `blog/how-to-compress-an-image-to-50kb.png` |
| `/blog/how-to-compress-image-for-email` | `blog/how-to-compress-image-for-email.png` |
| `/blog/how-to-compress-images-for-a-website` | `blog/how-to-compress-images-for-a-website.png` |
| `/blog/how-to-compress-jpeg-to-200kb` | `blog/how-to-compress-jpeg-to-200kb.png` |
| `/blog/how-to-compress-multiple-images-at-once` | `blog/how-to-compress-multiple-images-at-once.png` |
| `/blog/how-to-compress-png-without-losing-quality` | `blog/how-to-compress-png-without-losing-quality.png` |
| `/blog/how-to-convert-bmp-to-jpg` | `blog/how-to-convert-bmp-to-jpg.png` |
| `/blog/how-to-convert-gif-to-png` | `blog/how-to-convert-gif-to-png.png` |
| `/blog/how-to-convert-heic-to-jpg` | `blog/how-to-convert-heic-to-jpg.png` |
| `/blog/how-to-convert-image-to-pdf` | `blog/how-to-convert-image-to-pdf.png` |
| `/blog/how-to-convert-jpg-to-pdf` | `blog/how-to-convert-jpg-to-pdf.png` |
| `/blog/how-to-convert-jpg-to-png` | `blog/how-to-convert-jpg-to-png.png` |
| `/blog/how-to-convert-multiple-images-at-once` | `blog/how-to-convert-multiple-images-at-once.png` |
| `/blog/how-to-convert-png-to-jpg` | `blog/how-to-convert-png-to-jpg.png` |
| `/blog/how-to-convert-png-to-pdf` | `blog/how-to-convert-png-to-pdf.png` |
| `/blog/how-to-convert-png-to-webp` | `blog/how-to-convert-png-to-webp.png` |
| `/blog/how-to-convert-tiff-to-jpg` | `blog/how-to-convert-tiff-to-jpg.png` |
| `/blog/how-to-convert-webp-to-jpg` | `blog/how-to-convert-webp-to-jpg.png` |
| `/blog/how-to-convert-webp-to-png` | `blog/how-to-convert-webp-to-png.png` |
| `/blog/how-to-copyright-your-photos-with-a-watermark` | `blog/how-to-copyright-your-photos-with-a-watermark.png` |
| `/blog/how-to-crop-a-photo-into-a-circle` | `blog/how-to-crop-a-photo-into-a-circle.png` |
| `/blog/how-to-crop-a-photo-to-4x6` | `blog/how-to-crop-a-photo-to-4x6.png` |
| `/blog/how-to-crop-a-photo-to-a-square` | `blog/how-to-crop-a-photo-to-a-square.png` |
| `/blog/how-to-crop-a-screenshot` | `blog/how-to-crop-a-screenshot.png` |
| `/blog/how-to-download-a-tiktok-without-the-app` | `blog/how-to-download-a-tiktok-without-the-app.png` |
| `/blog/how-to-download-tiktok-sound` | `blog/how-to-download-tiktok-sound.png` |
| `/blog/how-to-download-tiktok-videos-on-pc` | `blog/how-to-download-tiktok-videos-on-pc.png` |
| `/blog/how-to-download-tiktok-videos-without-watermark` | `blog/how-to-download-tiktok-videos-without-watermark.png` |
| `/blog/how-to-enhance-a-zoomed-in-photo` | `blog/how-to-enhance-a-zoomed-in-photo.png` |
| `/blog/how-to-enlarge-a-photo-without-losing-quality` | `blog/how-to-enlarge-a-photo-without-losing-quality.png` |
| `/blog/how-to-fix-a-blurry-photo` | `blog/how-to-fix-a-blurry-photo.png` |
| `/blog/how-to-fix-a-sideways-photo` | `blog/how-to-fix-a-sideways-photo.png` |
| `/blog/how-to-fix-pixelated-image-free` | `blog/how-to-fix-pixelated-image-free.png` |
| `/blog/how-to-flip-an-image-vertically` | `blog/how-to-flip-an-image-vertically.png` |
| `/blog/how-to-get-hd-photos-free` | `blog/how-to-get-hd-photos-free.png` |
| `/blog/how-to-increase-image-resolution` | `blog/how-to-increase-image-resolution.png` |
| `/blog/how-to-make-a-demotivational-poster` | `blog/how-to-make-a-demotivational-poster.png` |
| `/blog/how-to-make-a-meme` | `blog/how-to-make-a-meme.png` |
| `/blog/how-to-make-a-meme-on-your-phone` | `blog/how-to-make-a-meme-on-your-phone.png` |
| `/blog/how-to-make-a-pdf-from-photos-on-iphone` | `blog/how-to-make-a-pdf-from-photos-on-iphone.png` |
| `/blog/how-to-make-a-profile-picture` | `blog/how-to-make-a-profile-picture.png` |
| `/blog/how-to-make-an-image-smaller` | `blog/how-to-make-an-image-smaller.png` |
| `/blog/how-to-make-picture-higher-resolution-free` | `blog/how-to-make-picture-higher-resolution-free.png` |
| `/blog/how-to-mirror-an-image` | `blog/how-to-mirror-an-image.png` |
| `/blog/how-to-optimize-images-for-website` | `blog/how-to-optimize-images-for-website.png` |
| `/blog/how-to-put-text-on-a-meme` | `blog/how-to-put-text-on-a-meme.png` |
| `/blog/how-to-reduce-image-size-in-kb` | `blog/how-to-reduce-image-size-in-kb.png` |
| `/blog/how-to-reduce-jpeg-file-size` | `blog/how-to-reduce-jpeg-file-size.png` |
| `/blog/how-to-reduce-photo-size-for-whatsapp` | `blog/how-to-reduce-photo-size-for-whatsapp.png` |
| `/blog/how-to-remove-a-date-stamp-from-a-photo` | `blog/how-to-remove-a-date-stamp-from-a-photo.png` |
| `/blog/how-to-remove-a-logo-from-an-image` | `blog/how-to-remove-a-logo-from-an-image.png` |
| `/blog/how-to-remove-a-watermark-from-a-photo` | `blog/how-to-remove-a-watermark-from-a-photo.png` |
| `/blog/how-to-remove-a-watermark-from-a-picture-online` | `blog/how-to-remove-a-watermark-from-a-picture-online.png` |
| `/blog/how-to-remove-a-watermark-from-a-screenshot` | `blog/how-to-remove-a-watermark-from-a-screenshot.png` |
| `/blog/how-to-remove-a-watermark-from-ai-generated-images` | `blog/how-to-remove-a-watermark-from-ai-generated-images.png` |
| `/blog/how-to-remove-a-watermark-on-your-phone` | `blog/how-to-remove-a-watermark-on-your-phone.png` |
| `/blog/how-to-remove-an-object-from-a-photo` | `blog/how-to-remove-an-object-from-a-photo.png` |
| `/blog/how-to-remove-text-from-an-image` | `blog/how-to-remove-text-from-an-image.png` |
| `/blog/how-to-remove-tiktok-username-from-video` | `blog/how-to-remove-tiktok-username-from-video.png` |
| `/blog/how-to-resize-an-image` | `blog/how-to-resize-an-image.png` |
| `/blog/how-to-resize-an-image-for-instagram` | `blog/how-to-resize-an-image-for-instagram.png` |
| `/blog/how-to-resize-multiple-images-at-once` | `blog/how-to-resize-multiple-images-at-once.png` |
| `/blog/how-to-rotate-a-photo-90-degrees` | `blog/how-to-rotate-a-photo-90-degrees.png` |
| `/blog/how-to-rotate-a-picture-on-your-phone` | `blog/how-to-rotate-a-picture-on-your-phone.png` |
| `/blog/how-to-rotate-or-flip-an-image` | `blog/how-to-rotate-or-flip-an-image.png` |
| `/blog/how-to-save-tiktok-videos-to-camera-roll` | `blog/how-to-save-tiktok-videos-to-camera-roll.png` |
| `/blog/how-to-scan-a-document-with-your-phone` | `blog/how-to-scan-a-document-with-your-phone.png` |
| `/blog/how-to-straighten-a-crooked-photo` | `blog/how-to-straighten-a-crooked-photo.png` |
| `/blog/how-to-turn-a-screenshot-into-a-pdf` | `blog/how-to-turn-a-screenshot-into-a-pdf.png` |
| `/blog/how-to-upscale-a-product-photo` | `blog/how-to-upscale-a-product-photo.png` |
| `/blog/how-to-upscale-an-image-for-printing` | `blog/how-to-upscale-an-image-for-printing.png` |
| `/blog/how-to-upscale-an-image-to-4k` | `blog/how-to-upscale-an-image-to-4k.png` |
| `/blog/how-to-upscale-anime-and-cartoon-images` | `blog/how-to-upscale-anime-and-cartoon-images.png` |
| `/blog/how-to-upscale-image-without-losing-quality` | `blog/how-to-upscale-image-without-losing-quality.png` |
| `/blog/how-to-watermark-instagram-photos` | `blog/how-to-watermark-instagram-photos.png` |
| `/blog/how-to-watermark-multiple-photos-at-once` | `blog/how-to-watermark-multiple-photos-at-once.png` |
| `/blog/how-to-watermark-your-photography` | `blog/how-to-watermark-your-photography.png` |
| `/blog/image-file-formats-explained` | `blog/image-file-formats-explained.png` |
| `/blog/image-resolution-explained-beginners` | `blog/image-resolution-explained-beginners.png` |
| `/blog/improve-photo-quality-free` | `blog/improve-photo-quality-free.png` |
| `/blog/increase-image-resolution-free` | `blog/increase-image-resolution-free.png` |
| `/blog/increase-photo-dpi-free-300dpi` | `blog/increase-photo-dpi-free-300dpi.png` |
| `/blog/increase-photo-size-kb-mb-free` | `blog/increase-photo-size-kb-mb-free.png` |
| `/blog/instagram-profile-picture-size` | `blog/instagram-profile-picture-size.png` |
| `/blog/is-ai-image-upscaling-free` | `blog/is-ai-image-upscaling-free.png` |
| `/blog/is-it-legal-to-remove-a-watermark` | `blog/is-it-legal-to-remove-a-watermark.png` |
| `/blog/jpeg-vs-jpg-difference` | `blog/jpeg-vs-jpg-difference.png` |
| `/blog/jpg-to-pdf-free` | `blog/jpg-to-pdf-free.png` |
| `/blog/linkedin-banner-size-guide` | `blog/linkedin-banner-size-guide.png` |
| `/blog/make-a-meme-free-no-app` | `blog/make-a-meme-free-no-app.png` |
| `/blog/make-blurry-screenshot-clear` | `blog/make-blurry-screenshot-clear.png` |
| `/blog/make-blurry-text-in-image-clear-free` | `blog/make-blurry-text-in-image-clear-free.png` |
| `/blog/make-image-clearer-online-free` | `blog/make-image-clearer-online-free.png` |
| `/blog/make-old-photos-hd-free` | `blog/make-old-photos-hd-free.png` |
| `/blog/make-round-profile-picture-free` | `blog/make-round-profile-picture-free.png` |
| `/blog/meme-font-guide-impact` | `blog/meme-font-guide-impact.png` |
| `/blog/passport-photo-size-guide` | `blog/passport-photo-size-guide.png` |
| `/blog/photo-resolution-increaser-free` | `blog/photo-resolution-increaser-free.png` |
| `/blog/png-vs-jpg-which-to-use` | `blog/png-vs-jpg-which-to-use.png` |
| `/blog/remove-tiktok-watermark-without-signup` | `blog/remove-tiktok-watermark-without-signup.png` |
| `/blog/restore-old-photos-ai-upscale` | `blog/restore-old-photos-ai-upscale.png` |
| `/blog/rotate-image-online-free` | `blog/rotate-image-online-free.png` |
| `/blog/sharpen-blurry-image-online-free` | `blog/sharpen-blurry-image-online-free.png` |
| `/blog/svg-to-png-convert-vector-to-raster` | `blog/svg-to-png-convert-vector-to-raster.png` |
| `/blog/tiktok-video-downloader-by-username` | `blog/tiktok-video-downloader-by-username.png` |
| `/blog/tiktok-video-link-downloader` | `blog/tiktok-video-link-downloader.png` |
| `/blog/unblur-image-online-free` | `blog/unblur-image-online-free.png` |
| `/blog/unblur-photo-online-free` | `blog/unblur-photo-online-free.png` |
| `/blog/upscale-ai-generated-images-free` | `blog/upscale-ai-generated-images-free.png` |
| `/blog/upscale-anime-image-free` | `blog/upscale-anime-image-free.png` |
| `/blog/upscale-car-photos-for-listings` | `blog/upscale-car-photos-for-listings.png` |
| `/blog/upscale-digital-art-for-print` | `blog/upscale-digital-art-for-print.png` |
| `/blog/upscale-drone-aerial-photos` | `blog/upscale-drone-aerial-photos.png` |
| `/blog/upscale-enhance-pet-photos` | `blog/upscale-enhance-pet-photos.png` |
| `/blog/upscale-food-photos-menu-delivery` | `blog/upscale-food-photos-menu-delivery.png` |
| `/blog/upscale-gaming-screenshots-4k` | `blog/upscale-gaming-screenshots-4k.png` |
| `/blog/upscale-image-4k-free-online` | `blog/upscale-image-4k-free-online.png` |
| `/blog/upscale-image-for-facebook-cover-free` | `blog/upscale-image-for-facebook-cover-free.png` |
| `/blog/upscale-image-for-printing-large-format` | `blog/upscale-image-for-printing-large-format.png` |
| `/blog/upscale-image-for-tshirt-print-free` | `blog/upscale-image-for-tshirt-print-free.png` |
| `/blog/upscale-image-for-youtube-thumbnail` | `blog/upscale-image-for-youtube-thumbnail.png` |
| `/blog/upscale-image-free-unlimited-no-signup` | `blog/upscale-image-free-unlimited-no-signup.png` |
| `/blog/upscale-image-free-without-photoshop` | `blog/upscale-image-free-without-photoshop.png` |
| `/blog/upscale-image-on-phone-free` | `blog/upscale-image-on-phone-free.png` |
| `/blog/upscale-image-to-1080p-full-hd-free` | `blog/upscale-image-to-1080p-full-hd-free.png` |
| `/blog/upscale-image-to-4k-free` | `blog/upscale-image-to-4k-free.png` |
| `/blog/upscale-image-to-8k-free` | `blog/upscale-image-to-8k-free.png` |
| `/blog/upscale-image-without-losing-quality-free` | `blog/upscale-image-without-losing-quality-free.png` |
| `/blog/upscale-images-book-cover-kindle` | `blog/upscale-images-book-cover-kindle.png` |
| `/blog/upscale-images-social-media-instagram-linkedin` | `blog/upscale-images-social-media-instagram-linkedin.png` |
| `/blog/upscale-jpeg-without-losing-quality-free` | `blog/upscale-jpeg-without-losing-quality-free.png` |
| `/blog/upscale-landscape-nature-photos` | `blog/upscale-landscape-nature-photos.png` |
| `/blog/upscale-logo-without-losing-quality-free` | `blog/upscale-logo-without-losing-quality-free.png` |
| `/blog/upscale-old-photos-free` | `blog/upscale-old-photos-free.png` |
| `/blog/upscale-photo-for-printing-free` | `blog/upscale-photo-for-printing-free.png` |
| `/blog/upscale-photos-instagram-story-reels` | `blog/upscale-photos-instagram-story-reels.png` |
| `/blog/upscale-png-image-free` | `blog/upscale-png-image-free.png` |
| `/blog/upscale-product-photos-ecommerce` | `blog/upscale-product-photos-ecommerce.png` |
| `/blog/upscale-profile-picture-for-linkedin` | `blog/upscale-profile-picture-for-linkedin.png` |
| `/blog/upscale-profile-picture-linkedin-professional` | `blog/upscale-profile-picture-linkedin-professional.png` |
| `/blog/upscale-real-estate-listing-photos` | `blog/upscale-real-estate-listing-photos.png` |
| `/blog/upscale-real-estate-photos-property-listings` | `blog/upscale-real-estate-photos-property-listings.png` |
| `/blog/upscale-selfie-free` | `blog/upscale-selfie-free.png` |
| `/blog/upscale-tattoo-design-reference` | `blog/upscale-tattoo-design-reference.png` |
| `/blog/upscale-wallpapers-4k-desktop-background` | `blog/upscale-wallpapers-4k-desktop-background.png` |
| `/blog/watermark-photos-in-bulk-free` | `blog/watermark-photos-in-bulk-free.png` |
| `/blog/what-is-webp-image-format` | `blog/what-is-webp-image-format.png` |
| `/blog/youtube-banner-size-guide` | `blog/youtube-banner-size-guide.png` |
| `/blog/youtube-thumbnail-size-guide` | `blog/youtube-thumbnail-size-guide.png` |

---

## 8. Pages with no image slot yet — 21 pages

These render fine without one. Say the word and I will add a slot to any of them.

`/creative` (hub) · `/tools` · `/pricing` · `/alternatives` · `/batch-editor` · `/80s-ai-photo-prompts` (already has your 100 uploads) · `/privacy` · `/terms` · `/editor` (app UI, noindex)

Alternatives comparison pages (16): `/alternatives/adobe-express-alternative` · `/alternatives/befunky-alternative` · `/alternatives/canva-background-remover-alternative` · `/alternatives/clipping-magic-alternative` · `/alternatives/cutout-pro-alternative` · `/alternatives/fotor-alternative` · `/alternatives/lets-enhance-alternative` · `/alternatives/photoroom-alternative` · `/alternatives/photoshop-alternative` · `/alternatives/picsart-alternative` · `/alternatives/pixlr-alternative` · `/alternatives/remove-bg-alternative` · `/alternatives/slazzer-alternative` · `/alternatives/tinypng-alternative` · `/alternatives/topaz-gigapixel-alternative` · `/alternatives/upscale-media-alternative`

---

**Total slots: 543**  —  brand 4 · homepage 4 · pro tools 6 · free tools 13 · apps 200 · presets 74 + 3 samples · convert 11 · compress 6 · crop 6 · blog 216
