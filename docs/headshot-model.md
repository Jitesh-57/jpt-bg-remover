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

`editImageGptFirst()` in `src/lib/ai-image.ts`. fal is the route, because fal is
where the account and its balance are:

| | Path | Needs |
| - | --- | --- |
| 1 | fal's GPT Image endpoints | `FAL_KEY` (+ see BYOK below) |
| 2 | `openaiEditImage()` — a direct key | `OPENAI_API_KEY`, optional |
| 3 | Nano Banana, then Gemini | `FAL_KEY` |

Rung 2 is optional and normally unset. It exists for one parameter: OpenAI's
own edit endpoint takes `input_fidelity: "high"`, which holds the reference face
harder than anything fal's wrapper exposes. Worth reaching for if identity drift
on a particular photo is the problem; not worth standing up a second supplier
otherwise.

### BYOK

fal's default GPT Image endpoints end in `/byok` — *bring your own key*. fal
authenticates us with `FAL_KEY` and then calls OpenAI with a key stored on the
**fal account**, not with fal credit alone. So GPT Image through fal needs an
OpenAI key at fal.ai → Settings → Integrations.

If your fal account has a GPT Image endpoint it can serve directly, point at it
without a code change:

```
FAL_GPT_IMAGE_EDIT=fal-ai/<path>
FAL_GPT_IMAGE_GENERATE=fal-ai/<path>
```

A leading slash and a full `https://queue.fal.run/...` prefix are both accepted,
because that is how fal writes them in its own docs and pasting one verbatim
should not produce a 404.

A 401 or 403 from a BYOK endpoint means one of two things — a bad `FAL_KEY`, or
no OpenAI key on the fal account — and fal does not distinguish them, so the log
names both rather than guessing.

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
| `FAL_KEY` | — | Required. Unset means every headshot falls to Gemini. |
| `FAL_GPT_IMAGE_EDIT` | `fal-ai/gpt-image-1/edit-image/byok` | Point at a non-BYOK or newer endpoint. |
| `FAL_GPT_IMAGE_GENERATE` | `fal-ai/gpt-image-1/text-to-image/byok` | As above, for text-to-image. |
| `OPENAI_API_KEY` | — | Optional. Rung 2 only. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Applies to rung 2 only. |

```
GET /api/admin/headshot-model?token=<ADMIN_IMAGE_TOKEN>
```

reports which route is configured, which endpoint GPT Image resolves to, whether
it is a BYOK one, and whether `FAL_KEY` is accepted.

**What it cannot tell you:** whether the BYOK endpoint has a working OpenAI key
behind it. fal only reveals that on a request that would actually cost money, so
it is not worth probing — generate one headshot and read the notice.

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

## What was deliberately left alone

`/api/headshot/edit-bg` still uses the default model. It replaces a background
on an already-generated headshot — Nano Banana is strong at exactly that, it is
much cheaper, and the face in that image has already been through rung 1.
