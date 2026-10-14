# Near-duplicate blog posts (not merged yet)

Found on 2026-10-13. These posts answer the same search with a different slug, so they compete with each other. The three clusters in the SEO brief are already merged into one post each and 301-redirected (see `config/redirects.json`):
- blurry/unblur → `fix-blurry-photo-online-free`;
- restore old photos → `ai-photo-restoration-free-online`;
- 4K → `4k-image-upscaler-free`.

The groups below are the rest, for a later round. Each one was checked by hand for the same intent. Pairs that only share words are left out, such as PNG→JPG vs JPG→PNG, or "how to remove a watermark" vs "is it legal to remove a watermark".

**How to merge one:**
1. Fold the best unique sections into the kept post.
2. Add `"/blog/<old>": "/blog/<kept>"` to `config/redirects.json`. The blog stops rendering the old post automatically.
3. Run `npm run seo:check`.

Most merge-ins are under 400 words, so `src/lib/seo/index-policy.ts` already keeps them out of the index. Merging them mainly tidies the blog and passes their links to one page. The ones marked **indexed** are still competing in Google today, so start with those.

## Upscale and enhance (biggest overlap)

| Keep | Merge in |
|---|---|
| `upscale-image-without-losing-quality-free` (2,088 words) | `how-to-upscale-image-without-losing-quality` (2,152, **indexed**), `upscale-jpeg-without-losing-quality-free` (294) |
| `enhance-image-quality-online-free` (2,092) | `ai-image-upscaler-enhance-photo-quality` (2,178, **indexed**), `improve-photo-quality-free` (1,940, **indexed**) |
| `increase-image-resolution-free` (2,149) | `photo-resolution-increaser-free` (2,073, **indexed**), `how-to-increase-image-resolution` (370), `how-to-make-picture-higher-resolution-free` (257) |
| `upscale-photo-for-printing-free` (2,011) | `upscale-image-for-printing-large-format` (2,105, **indexed**), `how-to-upscale-an-image-for-printing` (377) |
| `enhance-product-images-free` (1,953) | `enhance-product-photos-free` (1,948, **indexed**), `upscale-product-photos-ecommerce` (1,977, **indexed**), `how-to-upscale-a-product-photo` (345) |
| `enhance-photo-free-no-download` (1,930) | `enhance-photos-free-no-app-download` (226), `best-free-photo-enhancer-no-app` (259) |
| `upscale-profile-picture-linkedin-professional` (1,949) | `upscale-profile-picture-for-linkedin` (351) |
| `upscale-real-estate-photos-property-listings` (1,926) | `upscale-real-estate-listing-photos` (331) |
| `upscale-anime-image-free` (2,190) | `how-to-upscale-anime-and-cartoon-images` (369) |
| `how-to-enlarge-a-photo-without-losing-quality` (526) | `enlarge-image-without-losing-quality-free` (356) |
| `fix-blurry-photo-online-free` (merged) | `how-to-fix-a-blurry-photo` (389) |

## Compress, resize and crop

| Keep | Merge in |
|---|---|
| `how-to-compress-an-image-to-100kb` (435) | `compress-image-to-100kb-free` (267) |
| `how-to-compress-jpeg-to-200kb` (447) | `compress-image-to-200kb-free` (228) |
| `how-to-compress-png-without-losing-quality` (472) | `compress-png-without-losing-quality-free` (199) |
| `how-to-compress-image-for-email` (534) | `compress-photo-for-email-free` (191) |
| `how-to-reduce-photo-size-for-whatsapp` (391) | `compress-photo-for-whatsapp-free` (193) |
| `how-to-optimize-images-for-website` (439) | `how-to-compress-images-for-a-website` (317), `compress-images-for-website-speed-free` (291) |
| `how-to-crop-a-photo-into-a-circle` (501) | `circle-crop-profile-picture-free` (197), `make-round-profile-picture-free` (182) |
| `how-to-crop-a-photo-to-a-square` (291) | `crop-photo-to-square-free` (213) |
| `linkedin-banner-size-guide` (299) | `crop-photo-for-linkedin-banner-free` (201) |

## Convert and PDF

| Keep | Merge in |
|---|---|
| `how-to-convert-jpg-to-png` (450) | `convert-jpg-to-png-free` (180) |
| `how-to-convert-png-to-jpg` (423) | `convert-png-to-jpg-free` (192) |
| `how-to-convert-webp-to-png` (416) | `convert-webp-to-png-free` (176) |
| `how-to-convert-png-to-webp` (389) | `convert-png-to-webp-for-faster-site-free` (230) |
| `how-to-convert-webp-to-jpg` (299) | `convert-webp-to-jpg-free` (187) |
| `png-vs-jpg-which-to-use` (587) | `jpg-vs-png-vs-webp-which-to-use` (257) |
| `how-to-convert-image-to-pdf` (464) | `convert-image-to-pdf-free` (181) |
| `how-to-convert-jpg-to-pdf` (294) | `jpg-to-pdf-free` (176) |

## TikTok, memes, watermarks

| Keep | Merge in |
|---|---|
| `download-tiktok-videos-without-a-watermark` (1,335) | `how-to-download-tiktok-videos-without-watermark` (303), `remove-tiktok-watermark-without-signup` (1,182, **indexed**) |
| `how-to-make-a-meme` (501) | `make-a-meme-free-no-app` (189) |
| `how-to-add-watermark-to-photos` (530) | `add-watermark-to-photos-free` (204) |
| `how-to-remove-a-watermark-from-a-photo` (456) | `how-to-remove-a-watermark-from-a-picture-online` (317) |

## Restored posts that overlap (brought back on 2026-10-14)

The 44 posts held back for their old free-trial wording are live again: the wording is now country-aware. A few of them cover the same ground as a post that was already live:

| Keep | Merge in |
|---|---|
| `remove-background-from-image-online-free` (2,050) | `how-to-remove-background-without-photoshop` (362) |
| `remove-background-from-product-photo-free` (2,097) | `remove-background-product-photos-amazon` (2,035, **indexed**) |
| `change-photo-background-with-ai-free` (2,050) | `change-background-ai-editor` (2,113, **indexed**), `how-to-change-photo-background-online-free` (1,936, **indexed**), `change-photo-background-ai-scene` (312) |
| `ai-professional-headshot-from-selfie-free` (1,942) | `ai-professional-headshot-from-selfie` (283) |
| `remove-object-from-photo-free` (2,017) | `how-to-remove-an-object-from-a-photo` (317) |

Close, but different enough to keep apart:
- `ai-photo-editor-vs-photoshop` vs `ai-photo-editor-no-photoshop-free`: a comparison vs a how-to;
- `white-background-photo-free` vs `passport-photo-white-background-free`: general vs passport rules.
