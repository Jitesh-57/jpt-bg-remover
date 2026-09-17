# /admin/creatives — the console

One token, one app picker, two tabs. Both tabs write to storage, **not to the
repo**, so a deploy replaces the code and leaves your edits alone.

## Creatives

Paste a link or drop files. **Everything found arrives unassigned**, and you
choose the section for each one:

| Section | What happens to the image |
| --- | --- |
| **Main · Before** | cropped to the 4:5 the left pane renders at |
| **Main · After** | cropped to the 4:5 the right pane renders at |
| **More examples · 1–6** | **published whole — no crop** |

The main pair is cropped because those two panes are a fixed shape. The rest
are not: they are finished creatives with their own before/after labels, and
cropping one cuts the thing that makes it readable. They render at their own
aspect ratio in a "More examples" section on the page.

Nothing is assigned automatically. Guessing which of six images is the "after"
is a guess that looks right until it is wrong on a live page, and the cost of
being wrong is higher than the cost of two clicks.

Each tile shows the exact filename it will get
(`age-progression-tool-showcase-1.webp`) and its size before and after. Apply is
a separate press, and it waits: an image still encoding is not publishable, and
the button says how many are still being prepared. Publishing fewer images than
are on screen while reporting success is the worst kind of wrong.

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

Grouped by where the text appears:

| Section | Fields |
| --- | --- |
| **Search result** | title, meta description, keywords |
| **Page header** | H1, tagline, badge |
| **Hub card** | short intro |

- Every box **loads with the page's current text**, so editing a sentence is
  editing, not retyping it.
- The **SERP preview** is drawn at Google's widths, with live character counts
  and a warning when a field will be cut off.
- A changed box is marked and outlined, with **"put the original text back"**
  beside it.
- **Only fields you actually changed are stored.** Saving all seven would freeze
  the untouched ones too, and a later improvement to the built-in copy would
  never reach the page. An override means "I decided something different here".

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
