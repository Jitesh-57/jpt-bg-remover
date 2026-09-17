# Adding a hand-made before/after to an app page

You generate the creative; this puts it on the site.

```
npm run creative -- <page url or slug> <image> [image2]
```

```
npm run creative -- https://www.sjpt.io/creative/age-progression pair.png
npm run creative -- age-progression before.png after.png
npm run creative -- age-progression --after result.png
```

| You give it | It does |
| --- | --- |
| one wide image | splits it down the middle — before on the left, after on the right |
| two images | takes them in order: before, then after |
| `--after <file>` | replaces only the result pane |
| `--before <file>` | replaces only the source pane |
| `--no-split` | uses one wide image whole, as the after pane |
| `--gravity south` | keeps a caption burned into the bottom of the frame |

A wide image (aspect 1.4 or more) is assumed to be a side-by-side pair, because
that is what a before/after creative usually is. `--no-split` overrides it.

## Getting the file here

**An image may be a path or a URL**, and the URL is the one that matters: a
picture in a chat window is not a file on the machine running this. Only GitHub
is reachable from a session like this one — Supabase, imgur and the paste hosts
are all blocked at the egress proxy — so the handoff is:

1. Drag the image into a GitHub issue or PR comment.
2. Paste the link it gives you (`github.com/user-attachments/assets/…`).

Or upload it into the repo through GitHub's web UI and pass the path after a
pull. Either works; the first is fewer clicks.

## Sizing

The largest 4:5 window that fits inside the source, capped at 900px wide. A
smaller creative keeps its own size rather than being blown up — upscaling
makes it blurrier *and* the file bigger, which is both halves of the job
backwards.

`withoutEnlargement` is the obvious way to express that and the wrong one:
combined with `cover` it makes sharp give up on the aspect ratio instead of the
scale, and a 420×420 input came back 420×420 for a 4:5 pane.

## What it writes

`public/creatives/<slug>-before.webp` and `-after.webp`, cropped to the 4:5 the
panes actually render at, capped at 900px wide, WebP quality 80. Typically
2–6 MB in, 40–120 KB out.

The cap is the point. These arrive as full-resolution PNGs and the pane is
410 CSS px on a desktop, so most of those bytes never had anywhere to go.
`next/image` then re-encodes to AVIF or WebP per request on top of this — what
is committed is the *source*, not what a visitor downloads. A visitor on a phone
gets something closer to 15 KB.

It also rewrites the generated block in `src/lib/app-creatives.ts`. Nothing else
needs editing: the app page, the `/creative` hub and the homepage cards all
prefer a local file over the bulk-generated Supabase one, and the social preview
image for that page switches too.

## Why the repo rather than the bucket

The bulk-generated set lives in Supabase and is uploaded with a service key that
only production has. Committing to `public/` is the path that works end to end
from a session like this one: you paste a link and an image, and it ships.

The trade is a deploy per batch — about two minutes — and some repo weight. At
40–120 KB each that is a few megabytes across the whole catalogue, which is
worth it for images that took real effort to make. Send several at once and
they go out together.

## Guards

- The slug is checked against the apps the site actually has. A typo fails
  loudly instead of writing a file nothing reads.
- EXIF rotation is honoured, so a phone photo does not land on its side.
- The crop is `position: "attention"`, so a 4:5 window off a wide source lands
  on the busiest part of the frame rather than the middle.
- A missing file is still a normal state: the page draws the app's own
  placeholder artwork, never a broken image.
