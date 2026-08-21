# Supabase creative folders (per page)

Creatives are organised **one folder per page** inside the public **`landing`**
bucket, so you can generate and swap imagery per page. The code reads from:

```
landing/creatives/<page>/<slot>.png
```

Helper: `creativeUrl(page, slot)` in `src/lib/creatives.ts`.
Registry of expected files: `CREATIVE_MANIFEST` in the same file.

Missing files fall back to a designed placeholder (see `BeforeAfter.tsx`), so
pages look finished before any creative exists — uploading a file just makes the
real image appear.

## Folders to create in Supabase Storage (bucket: `landing`)

Storage "folders" are created automatically the moment you upload a file with
that path prefix, so you don't have to pre-create them — just upload to these
paths. Recommended structure:

```
landing/
└── creatives/
    ├── home/
    │   ├── hero.png
    │   ├── remove-bg-before.png
    │   ├── remove-bg-after.png
    │   ├── upscale-before.png      (optional — falls back to landing/upscale-before.jpg)
    │   ├── upscale-after.png       (optional — falls back to landing/upscale-after.jpg)
    │   ├── restore-before.png
    │   └── restore-after.png
    ├── upscale/
    │   ├── hero.png
    │   ├── before.png
    │   └── after.png
    ├── remove-bg/
    │   ├── hero.png
    │   ├── before.png
    │   └── after.png
    ├── compress-image/  (before.png, after.png)
    ├── convert-image/   (before.png, after.png)
    ├── crop-image/      (before.png, after.png)
    ├── resize-image/    (before.png, after.png)
    └── blur-image/      (before.png, after.png)
```

## How the home page uses them

`HOME_SHOWCASE` in `src/lib/creatives.ts` defines the before/after sliders on the
home page. Each entry pulls `creatives/home/<key>-before.png` and
`<key>-after.png`. To change what the home page shows, edit that array or upload
new files to those paths. Add another before/after section by adding an entry
(and its two files).

## Image guidance

- **Before/after pairs:** same subject and framing, roughly 4:3. The slider
  overlays them, so alignment matters.
- **Format:** PNG (transparent where relevant). ~1200px on the long edge is
  plenty; compress before upload.
- **No text baked into the image** — captions come from the code so they stay
  translatable and crisp.

## Adding a folder for a new page

1. Add the page + its slots to `CREATIVE_MANIFEST` in `src/lib/creatives.ts`.
2. Read the images on that page with `creativeUrl("<page>", "<slot>")` (wrap in
   `SafeImage` or `BeforeAfter` for graceful fallback).
3. Upload the files to `landing/creatives/<page>/…`.
