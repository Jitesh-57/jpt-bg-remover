# Prompt library

`/prompts` — 122 prompts, one indexable page each at `/prompts/<slug>`.

| | |
| --- | --- |
| Content | `src/lib/prompt-library.ts` |
| Example images | `src/lib/prompt-library-images.ts` (+ the bucket below) |
| Hub page | `src/app/prompts/page.tsx` + `PromptLibrary.tsx` |
| Detail page | `src/app/prompts/[slug]/page.tsx` |
| Image generator | `GET /api/admin/prompt-images` |

## Adding a prompt

One `P(...)` call in `PROMPTS`. The slug is derived from the title, so a title
change changes the URL — pick it once. `app` links the prompt to a Creative
App, which puts a "skip the prompt" card on the detail page.

The prompts follow one order, because it is the order the models answer to:
identity → scene → light → camera → finish. `KEEP_ME` is one shared constant
rather than retyped, because a weaker paraphrase of that sentence is the
difference between a photo of you and a photo of someone who looks like you.

Nothing here is copied from another prompt site. That would be someone else's
work and duplicate content besides, which defeats the point of the page.

## Example images

They live in a public Supabase bucket, **`Prompt library images`**, matched to
prompts by filename at request time — `corporate-headshot-on-grey.png`, or
`007.png` for the seventh. A prompt with no file gets a designed placeholder,
which is the state the whole grid ships in.

To fill them:

```
GET /api/admin/prompt-images?token=<ADMIN_IMAGE_TOKEN>            # what's missing
GET /api/admin/prompt-images?token=<ADMIN_IMAGE_TOKEN>&apply=1    # generate a batch of 4
GET /api/admin/prompt-images?token=…&apply=1&slug=<slug>          # redo one
```

The first `apply=1` creates the bucket if it does not exist. Each call
generates a small batch and reports what remains, so it is called repeatedly
rather than run once; re-running never repeats work, and a credential or
billing failure stops the batch instead of burning the rest of it.

**Every generation costs money at the provider**, which is why this is guarded
by `ADMIN_IMAGE_TOKEN`, batched, and never triggered by a page view. That last
part is the difference between this and `/api/cron/blog-images`, which a
visitor's browser can trigger and which therefore carries its token in the
page — see the note in `lib/admin-token.ts`.

The generated example is not the library prompt verbatim: `examplePromptFor()`
strips the first-person identity language, because a text-to-image model with
no photo attached has no face to preserve, and adds an explicit instruction
that the subject is an anonymous model — these are illustrations of a look on
a public page and should not resemble a real person.

## Search and filters

All client-side over an array that ships with the page: 122 rows is instant,
needs no API, and means a filtered view is a shareable URL (`?c=`, `?p=`,
`?q=`). The grid pages 24 at a time.
