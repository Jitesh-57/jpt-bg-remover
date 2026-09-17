# /admin/creatives — the console

One token, one app picker, two tabs. Both tabs write to storage, **not to the
repo**, so a deploy replaces the code and leaves your edits alone.

## Creatives

Drop files, or paste a link.

| Input | What happens |
| --- | --- |
| A wide before/after | split down the middle into the two panes the page draws |
| Several files | taken in order: before, after, extra-1… |
| A direct image URL | fetched and treated as a file |
| A ChatGPT share link | scraped for image URLs — see the caveat |

Everything found is laid out **before anything is published**, each tile showing
the slot it will take and the exact filename it will get
(`age-progression-tool-before.webp`). Remove or reorder, then press Apply. The
failure mode of a one-click importer is a wrong image on a live page, and
showing it first is the only cheap way to catch that.

Cropping and compression run in the browser, on the machine that has the file:
3–8 MB in, 40–120 KB out.

### The share-link caveat

A ChatGPT share page is drawn by JavaScript, and its image URLs are signed links
that expire. So the server frequently receives HTML with no images in it at all,
and links that do come back can die between being found and being fetched.

It is built anyway, and it fails **legibly**: it says what it read, how many
URLs it found, how many actually loaded, and what to do instead. When it does
not work, right-click the image in ChatGPT → copy image address → paste that, or
download and drop the files in. Both always work.

## SEO

Per page: title, meta description, keywords, H1, tagline, intro, badge.

- The **SERP preview** at the top is drawn at Google's widths, with live
  character counts and a warning when a field will be cut off.
- Each box's **placeholder is the built-in copy**, so an empty field reads as
  "this page still says what the code says".
- **Clearing a box resets it** to the built-in copy — the stored document simply
  drops that key.

Covers the 200 `/creative/*` pages today.

## Why edits survive a deploy

Every app's copy lives in `creative-apps.ts`, which is code. Editing code from an
admin page means either writing to a serverless filesystem — lost on the next
request — or pushing a commit, which is a deploy per typo. Either way the next
deploy decides what the page says, which is exactly what must not happen to
hand-written copy.

So overrides live in Supabase Storage at `landing/overrides/site.json`, outside
the repo and outside the build. Code supplies the default; the stored document
wins where it has an opinion:

```
creative-apps.ts   →  built-in copy
overrides/site.json →  your edits, where set
```

One document, not a row per page: it is a few hundred kilobytes at most, every
render wants the same few keys, and one fetch cached for the page's revalidate
window beats a query per page. Reads never throw — a page that cannot reach the
document renders its built-in copy rather than a 500.

Writes **merge**, so two tabs open on different pages cannot wipe each other.

## Setup

`ADMIN_IMAGE_TOKEN` in Vercel, then paste it once at the top of the page; the
browser remembers it.
