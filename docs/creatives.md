# Adding a before/after to an app page

## The easy way: /admin/creatives

```
https://www.sjpt.io/admin/creatives
```

Pick the app, drop the image, press publish. Paste the admin token once; the
browser remembers it.

- A **wide** image is split down the middle into the Before and After panes.
- Anything else becomes the After pane.
- **Crop: centre / top / bottom** — use *bottom* when the creative has a caption
  burned into the bottom of the frame that a centre crop would trim.

The cropping and compression happen **in the browser**, on the machine that has
the file: a creative comes out of an image tool at 3–8 MB and the pane it lands
in is 410 CSS px wide, so uploading the original would be slow, cost storage,
and still need cropping. What crosses the wire is the 40–120 KB that was
actually needed — typically **80% smaller**.

It stores to Supabase, so it is live without a deploy. The page caches for five
minutes.

No deploy, no session, no waiting on anyone.

---

## The other way: the script

For an image that arrives in a Claude session. Same processing, but it commits
to the repo and therefore needs a deploy.

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

## Which source wins

For each pane, in order:

1. `public/creatives/<slug>-<half>.webp` — committed by the script
2. `landing/creatives/<slug>-<half>.webp` — uploaded by /admin/creatives
3. the bulk-generated Supabase image
4. the app's own placeholder artwork

Nothing on the server knows which of these exist — the bucket is not queried at
build time, and a HEAD request per app per render would be absurd. So the
browser finds out the only way it can: it tries one and moves to the next when
the load fails. Falling straight to the placeholder on the first miss is what
would make an uploaded creative invisible behind a stale path.

## Guards

- The slug is checked against the apps the site actually has. A typo fails
  loudly instead of writing a file nothing reads.
- EXIF rotation is honoured, so a phone photo does not land on its side.
- The crop is `position: "attention"`, so a 4:5 window off a wide source lands
  on the busiest part of the frame rather than the middle.
- A missing file is still a normal state: the page draws the app's own
  placeholder artwork, never a broken image.
