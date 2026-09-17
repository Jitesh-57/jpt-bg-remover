# The headshot model

## What changed

`/api/headshot/generate` used to call `editImage(...)` with no model, which
resolves to `nano-banana` — Google's Gemini 2.5 Flash Image, through fal. It is
fast, cheap and good at identity-preserving edits, and it is the right default
for most of the site.

It is not the right default for headshots. A headshot is judged on one thing:
whether it looks like a real photograph of the actual person. So this route now
asks for OpenAI's image model first.

## The cascade

`editImageGptFirst()` in `src/lib/ai-image.ts` walks OpenAI's models on fal,
best first, and falls back to Nano Banana only if none of them will serve the
request:

| | Model | Endpoint |
| - | --- | --- |
| 1 | GPT Image 2.5 Sunburst | `openai/gpt-image-2.5/sunburst/edit` |
| 2 | GPT Image 2.5 Flare | `openai/gpt-image-2.5/flare/edit` |
| 3 | GPT Image 2 | `openai/gpt-image-2/edit` |
| 4 | Nano Banana, then Gemini | `fal-ai/nano-banana/edit` |

All of these are fal's `openai/...` endpoints, billed to fal. No OpenAI account,
no BYOK. (`gpt-image-1-byok` is still in the registry for an account that routes
through its own OpenAI key; nothing selects it.)

Sunburst leads because of what it is built for — edits scoped precisely to the
instruction with the subject preserved — which is exactly a headshot: change the
clothes, the setting and the light, change nothing about the face. Flare is the
faster general-purpose one; GPT Image 2 is third.

Why a cascade rather than one model: fal hosts several of these, they are not
equally available to every account, and fal renames and retires endpoints. One
hard-coded path turns any of that into "headshots stopped looking right" with no
way to see why. Each unavailable model costs a single rejected round trip — a
4xx returns immediately — so a rename takes out one rung instead of the feature.

An exhausted fal balance ends the cascade immediately rather than walking it:
every model is billed to the same account, so the rest cannot succeed, and
trying them only buries the one message the account owner needs.

### image_size is an enum, not a pixel string

The first live run failed on every GPT model with:

```
Input should be a valid dictionary or object to extract fields from,
Input should be 'square_hd', 'square', 'portrait_4_3', 'portrait_16_9',
'landscape_4_3', 'landscape_16_9' or 'auto'
```

We were sending `1024x1536`. fal's own models take the **named** sizes; the
OpenAI BYOK wrapper passes OpenAI's **pixel** strings straight through. So each
model carries a `sizeStyle` and `imageSizeFor()` picks the spelling — the model
decides, not the caller.

### A failed job is not a running job

That failure took 240 seconds to surface, because the poll loop tested only for
`COMPLETED` and treated everything else as "still working". The job had failed
in under a second and fal knew exactly why; none of it reached the log, and what
did reach it — a timeout — was not the problem.

Terminal statuses (`FAILED`, `ERROR`, `CANCELLED`) are read now, and fal's own
reason is fetched from the response URL and carried in the error. If that reason
looks like input validation, the request is retried once with the prompt and the
image alone: fal validates at execution time rather than at submit, so the 422
path above never sees these.

### A 404 tries the other spellings

The endpoint paths are transcribed from fal's model listing rather than fetched,
so a wrong one is a real possibility — and a wrong path fails as 404, which from
the outside is indistinguishable from "this account cannot use this model".
Both end with the generation quietly served by Nano Banana.

So a 404 tries the alternative spellings in `PATH_VARIANTS` before giving up on
the model, and logs the one that answered. Pinning it with
`FAL_ENDPOINT_<ID>_EDIT` then skips the extra round trip. Only a 404 does this:
a 403 is an answer about the model, not its address, so it moves straight on.

### Finding out what is actually reachable

```
GET /api/admin/model-probe?token=<ADMIN_IMAGE_TOKEN>
```

Probes every model and every alternative spelling and reports what each one
answers. It generates nothing and costs nothing — each probe sends an empty
body, which every image endpoint rejects before queueing work — so the status is
free, and the status is the diagnosis:

| | |
| --- | --- |
| 404 | the path is wrong |
| 422 | the path is right; fal got as far as validating the input |
| 403 | the path is right and this account may not use it |
| 401 | `FAL_KEY` is wrong, and nothing on fal will work |

Without that distinction, "the headshots came out on Nano Banana" could be a
typo in a path, a model the account is not entitled to, or a key problem, with
no way to tell them apart.

### A 422 does not lose the generation

fal's models do not share one input schema. A field one endpoint takes
(`quality`, `image_size`, `output_format`) another may not recognise, and it
answers 422. Those are optional refinements, so `runQueued` retries once with
the prompt and the image alone, and logs what it dropped.

### Nothing about this reaches the customer

The fallback used to put a line on the gallery: *"generated with the standard
model … quality may differ."* That was a mistake. Someone who has just spent
credits and is looking at four perfectly good headshots learns only that they
might have got something better, with nothing they can do about it — an apology
for a choice they never made. The engine and the reason go to the server log,
where somebody can act on them.

## The prompt

The style descriptions in `headshot-prompts.ts` are long and literal, which is
what GPT Image is good at. But a long description of clothing and lighting is
also what pulls a generated face away from the real one, so the route wraps each
style:

1. **Identity** first and named as most important — bone structure, skin
   texture, hairline, age, glasses, facial hair. Explicitly *no* beautifying,
   slimming, smoothing or lightening. Left alone the model flatters, and a
   flattered face is somebody else's; that is the most common complaint about AI
   headshots.
2. **Styling** — the style's own text.
3. **Camera** — 85mm at f/2, visible pores, catchlights, no illustration or
   3D-render look.

Portrait framing and `quality: high`, which is slow by design; the route's budget
is 240s inside a 300s `maxDuration`. The aspect ratio is given once as `3:4` —
fal maps that to GPT Image's `1024x1536` and passes it to Nano Banana as an
aspect ratio, so one value frames every rung.

## The picker

`MODELS` in `src/lib/app-presets.ts` offers Nano Banana and the same three GPT
models to the editor and the creative apps. A model there can never dead-end a
visitor: `withModelFallback()` serves the request with Nano Banana if the chosen
one answers 401, 403 or 404, and logs the endpoint that refused.

`"gpt-image"` is still accepted by the API as an alias for the current default
GPT model, so older saved preferences and bookmarked admin URLs keep working
rather than silently reverting to Nano Banana.

## What was deliberately left alone

`/api/headshot/edit-bg` still uses the default model. It replaces a background
on an already-generated headshot — Nano Banana is strong at exactly that, it is
much cheaper, and the face in that image has already been through the cascade.
