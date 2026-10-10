/**
 * ai-image.ts — the single entry point every AI route uses for image work.
 *
 * Routing: fal.ai is the only image backend — it is where the account's
 * credit and the chosen models are. Google's Gemini API is never called
 * directly for images; Nano Banana Pro is reached through fal.
 *
 * Routes should import from here, never from fal.ts directly, so the provider
 * can be switched in one place.
 */

import {
  falConfigured, falEditImage, falEndpoint, falGenerateImage, falModelIds, falModelSpec,
  falRemoveBackground, FalError, type FalModel,
} from "@/lib/fal";
import { editorDirective } from "@/lib/staging";

export type { FalModel };

/**
 * Which model a request asked for; anything unrecognised falls to the default.
 *
 * "gpt-image" is kept as an alias rather than a model. It is what every
 * existing picker, saved preference and admin URL sends, and it used to mean
 * the BYOK GPT Image 1 endpoint. Mapping it to the current default GPT model
 * upgrades all of them at once instead of stranding them on a name.
 *
 * ChatGPT (GPT Image 2.5 Flare, 2K) is the default: a request that names no
 * model, or one this build does not know, gets it. A GPT model that cannot
 * serve a request still drops to Nano Banana Pro (see withModelFallback and
 * editImageGptFirst), so the default can never dead-end a visitor.
 */
export const DEFAULT_GPT_MODEL: FalModel = "gpt-image-2.5-flare";

export function resolveModel(requested?: string): FalModel {
  if (!requested || requested === "gpt-image") return DEFAULT_GPT_MODEL;
  return (falModelIds() as string[]).includes(requested) ? (requested as FalModel) : DEFAULT_GPT_MODEL;
}

/** True for any of OpenAI's models, whichever one was picked. */
function isGpt(m: FalModel): boolean {
  return falModelSpec(m).family === "gpt";
}

/**
 * Something on our side of the wire is not working — our provider's key, our
 * provider's balance, our provider's capacity.
 *
 * None of that is the visitor's business and none of it is their fault, so
 * they get one sentence they can act on. "The image service is out of credit:
 * User is locked. Reason: TOP_UP." was our supplier's billing state rendered
 * into a customer's browser: a paying user holding 24 credits reads that as
 * their own balance being gone.
 *
 * The real reason is not lost — it goes to the server log where the operator
 * can read it, and /api/admin/fal-check answers it on demand.
 */
export class ProviderUnavailableError extends Error {
  constructor(readonly operatorDetail: string) {
    super(
      "AI generation is temporarily unavailable while we restore capacity. " +
      "No credits were used for this attempt, and every free tool still works."
    );
    this.name = "ProviderUnavailableError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * How long the one-shot tools (background, upscale, remove-bg fallback) wait
 * on fal. Nano Banana Pro at 2K can take over a minute; their routes allow 300s.
 */
const SLOW_BUDGET_MS = 240_000;

/** Attempts against fal before giving up. */
const FAL_ATTEMPTS = 3;

/**
 * Runs a generation on fal — the only image provider. Every image is made on
 * fal.ai, never by calling Google's Gemini API directly: that is where the
 * balance and the chosen models are, and a second provider meant a result
 * could quietly come from a different model than the one the visitor picked.
 *
 * A throttle is retried (it clears within seconds). Anything that is ours to
 * fix — no FAL_KEY, a rejected key, an exhausted balance — reaches the visitor
 * as one plain sentence (ProviderUnavailableError) and the operator as the
 * real reason in the log. Anything about the request itself (a timeout, a
 * prompt the model refused) is passed through for userMessage() to explain.
 */
async function viaFal(run: () => Promise<string>, label: string): Promise<string> {
  if (!falConfigured()) {
    console.error(`[ai-image] ${label}: FAL_KEY is not configured; no image can be generated.`);
    throw new ProviderUnavailableError("FAL_KEY is not configured");
  }

  let last: unknown;
  /*
    A throttle is the most common failure in production — a burst of
    generations trips fal's rate limit, which it reports as 429 or as a 403
    with a rate-limit reason — and it clears within seconds, so it is retried.
  */
  for (let attempt = 0; attempt < FAL_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (e) {
      last = e;
      const fal = e instanceof FalError ? e : null;
      // An exhausted balance will not resolve by asking again, and it is the
      // one failure the account owner has to see verbatim.
      if (fal?.billingBlocked) throw e;
      if (!fal?.transient || attempt === FAL_ATTEMPTS - 1) break;
      const wait = 1200 * (attempt + 1);
      console.warn(`[ai-image] fal ${label} throttled (${fal.status}); retrying in ${wait}ms`);
      await sleep(wait);
    }
  }

  const e = last;
  const msg = e instanceof Error ? e.message : String(e);
  const status = e instanceof FalError ? e.status : 0;

  /*
    Out of credit is surfaced, never absorbed.

    This used to test only for 402 and the words "out of credit", so fal's
    403 "User is locked. Reason: Exhausted balance." slipped past, got three
    retries, then had its message replaced by Gemini's "temporarily
    unavailable due to high demand" — which describes a different provider's
    rate limit and gives the owner no way to work out that their fal balance
    had run out. FalError.billingBlocked recognises both shapes now.
  */
  if ((e instanceof FalError && e.billingBlocked) || /out of credit/i.test(msg)) {
    console.error(`[ai-image] ${label}: fal will not serve this account — ${msg}`);
    throw new ProviderUnavailableError(msg);
  }

  if (status === 401 || status === 403 || /rejected our key|refused this request/i.test(msg)) {
    console.error(`[ai-image] fal ${label} refused the request (${status}) after ${FAL_ATTEMPTS} attempts: ${msg}`);
    throw new ProviderUnavailableError(msg);
  }

  console.warn(`[ai-image] fal ${label} failed:`, msg);
  throw e;
}


/**
 * Runs a fal call, dropping to Nano Banana if the chosen GPT model cannot
 * serve it.
 *
 * A model in a picker must not dead-end. fal renames and retires endpoints,
 * an account may not be entitled to every model, and the old BYOK endpoint
 * additionally needs an OpenAI key on the fal account — all of which surface
 * as 401/403/404, indistinguishable at a glance from a bad FAL_KEY. So the
 * request is served by the default model instead, and the substitution is
 * logged with the endpoint that refused it, which is the part that makes it
 * diagnosable.
 */
async function withModelFallback(
  m: FalModel,
  run: (model: FalModel) => Promise<string>
): Promise<string> {
  if (!isGpt(m)) return run(m);
  try {
    return await run(m);
  } catch (e) {
    const fal = e instanceof FalError ? e : null;
    if (fal && (fal.status === 401 || fal.status === 403 || fal.status === 404)) {
      console.warn(
        `[ai-image] ${m} (${falEndpoint(m, "edit")}) refused the request (${fal.status}); ` +
        `serving it with Nano Banana instead. fal said: ${fal.message}`
      );
      return run("nano-banana");
    }
    throw e;
  }
}

export async function editImage(
  src: string,
  prompt: string,
  model?: string,
  aspectRatio?: string,
  opts?: { strict?: boolean; budgetMs?: number; raw?: boolean }
): Promise<string> {
  const m = resolveModel(model);
  /*
    raw: send the caller's prompt as written.

    The wrapper matters more than it looks. "You are a professional photo
    editor. Edit this image: …" tells the model to *edit* — to change the
    smallest thing that satisfies the words — and every one-click app was
    going through it, which is half the reason an age app returned the same
    photograph with a wrinkled face. An app prompt is already a complete
    instruction that says how much of the frame to rebuild, so it goes
    through untouched; the prompt bar's own text gets the directive that
    makes "change only this" explicit rather than implied.
  */
  const text = opts?.raw ? prompt : editorDirective(prompt);

  /*
    "ChatGPT" in the picker is a family, not an endpoint.

    Someone choosing it wants OpenAI's model, not one particular hosted path,
    and fal does not offer all of them to every account. Walking the same
    cascade the headshot tool uses means the choice gets the best one
    available instead of the picker quietly resolving to Nano Banana because
    the first path happened to be unavailable.
  */
  if (isGpt(m)) {
    const { dataUrl } = await editImageGptFirst(src, text, {
      aspectRatio,
      budgetMs: opts?.budgetMs,
      label: "edit",
      // Keep the visitor's pick at the front of the queue.
      first: m,
    });
    return dataUrl;
  }

  if (opts?.strict) {
    if (!falConfigured()) throw new Error("FAL_KEY is not configured.");
    return falEditImage(src, text, m, aspectRatio, opts.budgetMs);
  }
  return viaFal(() => falEditImage(src, text, m, aspectRatio, opts?.budgetMs), "edit");
}

export function generateBackground(src: string, prompt: string, model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => withModelFallback(m, (mm) =>
      falEditImage(src, `Replace the background of this image with: ${prompt}. Keep the subject exactly as-is — same pose, clothing, appearance. Only change the background.`, mm, undefined, SLOW_BUDGET_MS)),
    "generate-bg"
  );
}

/*
  Upscale and the background-removal fallback stay on Nano Banana Pro unless a
  model is named. Both must keep the photo pixel-faithful ("keep the subject
  identical"), which is what it is best at; a GPT model redraws the image.
*/
const FAITHFUL_MODEL: FalModel = "nano-banana";

export function removeBackground(src: string, model?: string): Promise<string> {
  const m = model ? resolveModel(model) : FAITHFUL_MODEL;
  return viaFal(
    /*
      A dedicated segmentation model, not a prompt.

      Asking a general image model to "remove the background" re-renders the
      picture: edges soften, hair gets approximated, and the subject itself is
      occasionally reinterpreted. pixelcut/background-removal returns the
      original pixels with a real alpha channel instead — and it is cheaper.

      The prompt-driven edit stays as the second rung: if the segmentation
      model is unavailable the tool still works rather than failing outright.
    */
    async () => {
      try {
        return await falRemoveBackground(src);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const status = e instanceof FalError ? e.status : 0;
        // A rejected key or an empty balance will fail the edit model in the
        // same breath, so hand those straight up to viaFal, which surfaces
        // them. A 403 is different: the key
        // works and it is this endpoint the account cannot reach, so the
        // edit model is worth trying.
        const fal = e instanceof FalError ? e : null;
        if (status === 401 || fal?.billingBlocked || /out of credit/i.test(msg)) throw e;
        console.warn("[ai-image] background-removal model failed, trying the edit model:", msg);
        return falEditImage(src, "Remove the background from this image completely. Make it transparent. Keep the subject with clean edges. Return only the resulting PNG image.", m, undefined, SLOW_BUDGET_MS);
      }
    },
    "remove-bg"
  );
}

export function upscaleImage(src: string, scale: "2x" | "4x", model?: string): Promise<string> {
  const m = model ? resolveModel(model) : FAITHFUL_MODEL;
  return viaFal(
    () => falEditImage(src, `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve hair strands, skin texture, fabric detail. Remove noise and artifacts. Keep the subject identical.`, m, undefined, SLOW_BUDGET_MS),
    "upscale"
  );
}

export function generateFromText(
  prompt: string,
  opts?: {
    aspect_ratio?: string;
    model?: string;
    /**
     * Skip the Gemini fallback and let fal's own error through.
     *
     * The fallback is right for a user-facing route — a visitor would rather
     * have an image from the other provider than an error. It is wrong for the
     * bulk generator: masking a fal 429 behind Gemini's rate-limit message
     * reports the wrong provider, the wrong cause and the wrong remedy, and
     * hides the one thing needed to decide whether to retry.
     */
    strict?: boolean;
    /** Queue poll budget. The default suits a 60s route, not a 300s job. */
    budgetMs?: number;
  }
): Promise<string> {
  const m = resolveModel(opts?.model);
  const aspect = opts?.aspect_ratio || "16:9";
  const run = () =>
    withModelFallback(m, (mm) =>
      falGenerateImage(
        `High-quality, photorealistic image (${aspect} aspect ratio): ${prompt}`,
        mm,
        aspect,
        opts?.budgetMs
      )
    );
  if (opts?.strict) {
    if (!falConfigured()) throw new Error("FAL_KEY is not configured.");
    return run();
  }
  return viaFal(run, "text-to-image");
}

/* ────────────────────────────────────────────────────────────────────────────
   GPT Image editing, for the tools where the model is the product.
   ──────────────────────────────────────────────────────────────────────── */

/** Which model actually produced an image. */
export type Engine = FalModel;

export interface EngineResult {
  dataUrl: string;
  engine: Engine;
  /** Set only when no GPT model could serve the request. Operator-facing. */
  downgradeReason?: string;
}

/**
 * The GPT models to try, best first.
 *
 * Sunburst leads because of what it is built for — edits scoped precisely to
 * the instruction with the subject preserved — which is exactly a headshot:
 * change the clothes, the setting and the light, change nothing about the
 * face. Flare is next as the faster general-purpose one, then GPT Image 2.
 *
 * Overridable as a comma-separated list, because this is a judgement about
 * which model looks best, and that is the kind of thing worth changing
 * without a deploy:
 *
 *   HEADSHOT_MODELS=gpt-image-2.5-flare,gpt-image-2
 */
const DEFAULT_GPT_CASCADE: FalModel[] = [
  "gpt-image-2.5-sunburst",
  "gpt-image-2.5-flare",
  "gpt-image-2",
];

export function gptCascade(): FalModel[] {
  const raw = (process.env.HEADSHOT_MODELS || "").trim();
  if (!raw) return DEFAULT_GPT_CASCADE;
  const ids = falModelIds() as string[];
  const picked = raw.split(",").map((x) => x.trim()).filter((x) => ids.includes(x)) as FalModel[];
  return picked.length ? picked : DEFAULT_GPT_CASCADE;
}

/**
 * Runs an edit on the best GPT model that will take it, and says which one did.
 *
 * Why a cascade rather than one model: fal hosts several of OpenAI's image
 * models, they are not equally available to every account, and fal renames and
 * retires endpoints. One hard-coded path turns any of that into "headshots
 * stopped looking right" with no way to see why. Trying them in order costs a
 * single rejected round trip per unavailable model — a 4xx comes back
 * immediately — and means a rename takes out one rung instead of the feature.
 *
 * Nano Banana is the last rung, so the tool always produces something. That
 * substitution is never silent in the log: the engine and the reason are both
 * recorded, because "the headshots look the same as before" and "we switched
 * models" being simultaneously true, with nothing connecting them, is the
 * failure this function exists to prevent.
 */
export async function editImageGptFirst(
  src: string,
  prompt: string,
  opts?: { aspectRatio?: string; budgetMs?: number; label?: string; first?: FalModel }
): Promise<EngineResult> {
  const label = opts?.label || "edit";
  const reasons: string[] = [];
  // A visitor's pick goes to the front; the rest of the cascade stays behind
  // it as the fallback, so choosing one model never means losing the others.
  const order = opts?.first
    ? [opts.first, ...gptCascade().filter((m) => m !== opts.first)]
    : gptCascade();

  if (!falConfigured()) {
    console.error(`[ai-image] ${label}: FAL_KEY is not configured; no image can be generated.`);
    throw new ProviderUnavailableError("FAL_KEY is not configured");
  }

  for (const model of order) {
    /*
      Retry a throttle before moving down the cascade.

      This is the lesson viaFal() records above. A burst of four headshots is
      four requests in the same second, and a 429 that clears in two is not a
      reason to finish the run on a different model. Anything that is not
      transient — a rejected key, an exhausted balance, an endpoint this
      account cannot reach — moves on immediately, because asking the same
      endpoint again will not change the answer.
    */
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const dataUrl = await falEditImage(src, prompt, model, opts?.aspectRatio, opts?.budgetMs);
        if (reasons.length) {
          console.warn(`[ai-image] ${label}: served by ${model} after ${reasons.length} refused. ${reasons.join(" | ")}`);
        }
        return { dataUrl, engine: model };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const fal = e instanceof FalError ? e : null;
        if (fal?.transient && !fal.billingBlocked && attempt < 2) {
          const wait = 1500 * (attempt + 1);
          console.warn(`[ai-image] ${label}: ${model} throttled; retrying in ${wait}ms`);
          await sleep(wait);
          continue;
        }
        /*
          An exhausted balance ends the whole cascade. Every model here is
          billed to the same fal account, so the next one cannot succeed, and
          trying it just spends time before the same failure — while hiding
          the one message the account owner actually needs.
        */
        if (fal?.billingBlocked) {
          console.error(`[ai-image] ${label}: fal will not serve this account — ${msg}`);
          throw new ProviderUnavailableError(msg);
        }
        reasons.push(`${model}: ${msg}`);
        console.error(`[ai-image] ${label}: ${model} (${falEndpoint(model, "edit")}) failed — ${msg}`);
        break;
      }
    }
  }

  const why = reasons.join(" | ");
  console.warn(`[ai-image] ${label}: no GPT model could serve this; falling back to Nano Banana. ${why}`);
  const dataUrl = await viaFal(() => falEditImage(src, prompt, "nano-banana", opts?.aspectRatio, opts?.budgetMs), label);
  return { dataUrl, engine: "nano-banana", downgradeReason: why };
}
