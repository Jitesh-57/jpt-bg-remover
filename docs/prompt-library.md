# Prompt library

Two collections under one set of routes.

| | Count | Source | Licence |
| --- | --- | --- | --- |
| Licensed dataset | 871 (662 image, 209 video) | YouMind OpenLab, via `data/youmind-prompts.json` | CC BY 4.0 — **attribution required** |
| Pixel Shine originals | 122 | Written in-house | ours |

## Attribution is load-bearing

CC BY 4.0 permits commercial use on one condition: credit. So the author line
and the link to their original post are part of `PromptCard` and
`PromptCredit`, not decorations on them, and the footer carries the dataset
credit site-wide. If those stop rendering the site is using the data outside
its licence. Don't make a card variant without them.

## Routes

```
/prompts                        hub
/prompts/image | /video         media hubs
/prompts/{image,video}/{facet}  category listings (use case / style / subject)
/prompts/{slug}-{shortid}       image prompt detail   (dataset)
/prompts/{slug}                 prompt detail         (originals — bare slug)
/prompts/originals              the originals library
/video-prompts/{slug}-{shortid} video prompt detail
/{model}-prompts                model landing, one file per model
/prompts-pack/{slug}            curated packs
```

`/prompts/[slug]` serves both kinds: a `{slug}-{shortid}` hits the dataset, a
bare slug hits the originals. That is what keeps the original URLs working —
they were already indexed when the dataset landed.

Model pages are seven small route files rather than a root-level dynamic
segment. `/{model}-prompts` is a suffix pattern, and the only way to match it
dynamically is a catch-all at the root of the app, which would then sit in
front of every future top-level path on the site.

## Rebuilding the dataset

```
node scripts/build-prompt-dataset.mjs     # data/youmind-prompts.json → src/lib/prompts/dataset.json
```

Deterministic: same input, same slugs, same URLs. That matters more than it
sounds — a transform that reshuffles ids on each run silently breaks every
indexed page.

It also does the tagging. 668 of the 871 records arrived with no category, so
a keyword pass assigns a use case, up to three styles and up to three subjects
from the spec's taxonomy. **This is not the model-driven tagging the spec asks
for** — it is a deterministic offline approximation that runs for free and
says nothing when it is unsure, which is why a facet page can be smaller than
a model-tagged version would be. Re-running with a real tagger is a drop-in
replacement for that one function.

`hotScore` is likewise a stand-in. There is no views/copies telemetry, so it
ranks on what the data knows: featured, how much there is to look at, recency.
Replace it the day real counts exist.

To refresh from upstream, `scripts/refresh-youmind-prompts.py` (shipped with
the kit) rebuilds the source JSON from the GitHub READMEs.

## Images

Sources are on `cms-assets.youmind.com` and `pbs.twimg.com`. The site hotlinks
them until a mirrored copy exists, then prefers ours:

```
GET /api/admin/prompt-mirror?token=<ADMIN_IMAGE_TOKEN>            # what's missing
GET /api/admin/prompt-mirror?token=<ADMIN_IMAGE_TOKEN>&apply=1    # copy 25
```

Creates the `Prompt library mirror` bucket on the first apply, names each file
for the sha1 of its source URL (the source filenames collide), pages the
listing past 1000, and skips anything already copied. Costs bandwidth, not
credits.

## Variables

344 dataset prompts carry `{argument name="x" default="y"}`. `PromptBlock`
renders each as an input, substitutes live, and copies the filled-in text —
the difference between a prompt you can use and one you have to hand-edit
first. The parser lives in `lib/prompts/variables.ts`, apart from `data.ts`,
because the editor is a client component and `data.ts` imports a 1.8MB JSON
that must never follow it into the browser.

## Not built

- `/prompts/webpage` — no data for it.
- `/landing/image-to-prompt`, `/landing/photo-prompt` — tools, not library pages.
- Embedding search — the substring search covers this size fine.
