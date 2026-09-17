# The headshot model

## What changed

`/api/headshot/generate` used to call `editImage(...)` with no model, which
resolves to `nano-banana` — Google's Gemini 2.5 Flash Image, through fal. It is
fast, cheap and good at identity-preserving edits, and it is the right default
for most of the site.

It is not the right default for headshots. A headshot is judged on one thing:
whether it looks like a real photograph of the actual person. So this route now
asks for OpenAI's image model first.

## The three rungs

`editImageOpenAIFirst()` in `src/lib/ai-image.ts`:

| | Path | Needs |
| - | --- | --- |
| 1 | `openaiEditImage()` — our own key, direct | `OPENAI_API_KEY` |
| 2 | fal's BYOK GPT Image endpoints | An OpenAI key on the **fal** account |
| 3 | Nano Banana, then Gemini | `FAL_KEY` |

Rung 1 exists because of one parameter. OpenAI's edit endpoint takes
`input_fidelity: "high"`, which is the difference between a headshot of *this
person* and a headshot of a plausible stranger who resembles them. fal's wrapper
does not expose it.

Rung 2 is for an account that keeps its OpenAI key on fal rather than here.

Rung 3 is the part that needed care. Serving a different model without saying so
is how "we switched headshots to GPT Image" and "the headshots look exactly the
same" end up both being true with nobody able to connect them. So:

- every image carries the `engine` that produced it;
- the server log names the engine and, on a downgrade, the reason;
- the response carries `engineNotice`, and the gallery shows it — **only** on a
  downgrade. A banner naming the engine on every successful run is noise.

The reason string names our providers, so it stays in the log. The customer gets
one sentence with no supplier in it.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Unset means every headshot is served by rung 2 or 3. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | So a newer model is an environment change, not a deploy. |

Check both without spending anything:

```
GET /api/admin/openai-check?token=<ADMIN_IMAGE_TOKEN>
```

It reports whether the key is accepted and whether the configured model is in
the account's model list. Like the fal check, it authenticates only — an account
with an exhausted quota still passes, and only fails on a request that costs
money.

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

Portrait framing (`1024x1536`) and `quality: high`, which is slow by design; the
route's budget is 240s inside a 300s `maxDuration`.

## What was deliberately left alone

`/api/headshot/edit-bg` still uses the default model. It replaces a background
on an already-generated headshot — Nano Banana is strong at exactly that, it is
much cheaper, and the face in that image has already been through rung 1.
