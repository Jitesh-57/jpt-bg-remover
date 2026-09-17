/**
 * ai-image.ts — the single entry point every AI route uses for image work.
 *
 * Routing: fal.ai is the primary backend (it is where the account's credit
 * sits). Gemini's direct API stays as an automatic fallback so a fal outage or
 * a missing FAL_KEY degrades instead of failing outright.
 *
 * Routes should import from here, never from fal.ts or gemini.ts directly, so
 * the provider can be switched in one place.
 */

import { falConfigured, falEditImage, falGenerateImage, falRemoveBackground, FalError, type FalModel } from "@/lib/fal";
import {
  openaiConfigured,
  openaiEditImage,
  openaiImageModel,
  OpenAIImageError,
  type OpenAISize,
} from "@/lib/openai-image";
import {
  geminiEditImage,
  geminiGenerateBg,
  geminiRemoveBg,
  geminiUpscale,
  geminiGenerateFromText,
} from "@/lib/gemini";

export type { FalModel };

/** Which model a request asked for; anything unrecognised falls to the default. */
export function resolveModel(requested?: string): FalModel {
  return requested === "gpt-image" ? "gpt-image" : "nano-banana";
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

/** Attempts against fal before considering the other provider. */
const FAL_ATTEMPTS = 3;

/**
 * Runs the fal path, falling back to Gemini when fal cannot serve the request.
 *
 * Only the interactive routes come through here — the bulk generator passes
 * `strict` and bypasses it, so it still stops dead on a bad key rather than
 * quietly spending a different provider's quota.
 *
 * A credentials failure used to be rethrown, on the reasoning that a real
 * misconfiguration deserves to be visible rather than papered over. That is
 * right for a batch job and wrong here: it left every AI tool showing
 * "The image service rejected our credentials" and doing nothing, when the
 * other provider was sitting there able to serve the request. The visibility
 * argument is satisfied by logging it loudly — which reaches the operator,
 * where it belongs — instead of by breaking the product for the visitor.
 *
 * An empty balance is the exception: Gemini cannot fix that, the account
 * owner has to, and quietly moving the cost to another provider hides the one
 * thing they need to know.
 */
async function viaFal(
  run: () => Promise<string>,
  fallback: () => Promise<string>,
  label: string
): Promise<string> {
  if (!falConfigured()) return fallback();

  let last: unknown;
  /*
    fal is the engine; Gemini is the safety net.

    A throttle is the most common failure in production — a burst of
    generations trips fal's rate limit, which it reports as 429 or as a 403
    with a rate-limit reason — and it clears within seconds. Falling back on
    the first refusal meant a momentary throttle silently moved the work to
    the other provider, so the result came from a different model than the one
    the user picked. Retrying fal first keeps generations on fal, which is
    where the balance and the chosen models are.
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
    console.error(
      `[ai-image] fal ${label} refused the request (${status}) after ${FAL_ATTEMPTS} attempts. ` +
      `Serving from Gemini instead. fal said: ${msg}`
    );
  } else {
    console.warn(`[ai-image] fal ${label} failed, falling back to Gemini:`, msg);
  }

  try {
    return await fallback();
  } catch (g) {
    /*
      Both providers are down. Report that, rather than only the second
      one's message — "temporarily unavailable due to high demand" names
      Gemini's rate limit and hides the fact that fal refused first, which
      sends anyone reading it to the wrong service entirely.
    */
    const gmsg = g instanceof Error ? g.message : String(g);
    console.error(`[ai-image] ${label}: both providers failed. fal: ${msg} | gemini: ${gmsg}`);
    throw new ProviderUnavailableError(`fal: ${msg} | gemini: ${gmsg}`);
  }
  }


/**
 * Runs a fal call, dropping to Nano Banana if GPT Image is not set up.
 *
 * The GPT Image endpoints are fal's BYOK ones — `/byok` in the path — which
 * need an OpenAI key configured on the fal account. Without it fal answers
 * 401/403, indistinguishable at a glance from a bad FAL_KEY, and the user
 * sees "the image service rejected our credentials" for a model sitting right
 * there in the picker. So picking it cannot dead-end: the request is served
 * by the default model instead, and the substitution is logged.
 */
async function withModelFallback(
  m: FalModel,
  run: (model: FalModel) => Promise<string>
): Promise<string> {
  if (m !== "gpt-image") return run(m);
  try {
    return await run(m);
  } catch (e) {
    const fal = e instanceof FalError ? e : null;
    if (fal && (fal.status === 401 || fal.status === 403)) {
      console.warn(
        "[ai-image] GPT Image needs an OpenAI key on the fal account (BYOK); " +
        "serving this request with Nano Banana instead."
      );
      return run("nano-banana");
    }
    throw e;
  }
}

export function editImage(
  src: string,
  prompt: string,
  model?: string,
  aspectRatio?: string,
  opts?: { strict?: boolean; budgetMs?: number; raw?: boolean }
): Promise<string> {
  const m = resolveModel(model);
  if (opts?.strict) {
    if (!falConfigured()) throw new Error("FAL_KEY is not configured.");
    // raw: send the caller's prompt as written. The editor prefix below is
    // right for a user typing "make the sky bluer" and wrong for an app's
    // own tuned prompt, which is already a complete instruction.
    return withModelFallback(m, (mm) =>
      falEditImage(
        src,
        opts.raw ? prompt : `You are a professional photo editor. Edit this image: ${prompt}. Return only the edited image.`,
        mm,
        aspectRatio,
        opts.budgetMs
      )
    );
  }
  return viaFal(
    () => withModelFallback(m, (mm) =>
      falEditImage(src, `You are a professional photo editor. Edit this image: ${prompt}. Return only the edited image.`, mm, aspectRatio, opts?.budgetMs)
    ),
    () => geminiEditImage(src, prompt),
    "edit"
  );
}

export function generateBackground(src: string, prompt: string, model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, `Replace the background of this image with: ${prompt}. Keep the subject exactly as-is — same pose, clothing, appearance. Only change the background.`, m),
    () => geminiGenerateBg(src, prompt),
    "generate-bg"
  );
}

export function removeBackground(src: string, model?: string): Promise<string> {
  const m = resolveModel(model);
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
        // same breath, so hand those straight up to viaFal, which decides
        // between Gemini and surfacing them. A 403 is different: the key
        // works and it is this endpoint the account cannot reach, so the
        // edit model is worth trying.
        const fal = e instanceof FalError ? e : null;
        if (status === 401 || fal?.billingBlocked || /out of credit/i.test(msg)) throw e;
        console.warn("[ai-image] background-removal model failed, trying the edit model:", msg);
        return falEditImage(src, "Remove the background from this image completely. Make it transparent. Keep the subject with clean edges. Return only the resulting PNG image.", m);
      }
    },
    () => geminiRemoveBg(src),
    "remove-bg"
  );
}

export function upscaleImage(src: string, scale: "2x" | "4x", model?: string): Promise<string> {
  const m = resolveModel(model);
  return viaFal(
    () => falEditImage(src, `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve hair strands, skin texture, fabric detail. Remove noise and artifacts. Keep the subject identical.`, m),
    () => geminiUpscale(src, scale),
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
  return viaFal(run, () => geminiGenerateFromText(prompt, opts), "text-to-image");
}

/* ────────────────────────────────────────────────────────────────────────────
   OpenAI-first editing, for the tools where the model is the product.
   ──────────────────────────────────────────────────────────────────────── */

/** Which model actually produced an image. */
export type Engine = "gpt-image" | "nano-banana";

export interface EngineResult {
  dataUrl: string;
  engine: Engine;
  /** Set only when the request could not be served by the model asked for. */
  downgradeReason?: string;
}

/**
 * Runs an edit on OpenAI's image model, and says which engine served it.
 *
 * Three rungs, in order:
 *
 *   1. Our own OpenAI key. Direct, and the only path that can ask for
 *      `input_fidelity: high` — the setting that keeps the reference face
 *      instead of inventing a similar-looking person.
 *   2. fal's BYOK GPT Image endpoints, for an account that has the key on fal
 *      rather than here.
 *   3. Nano Banana (and then Gemini), so the tool still produces something.
 *
 * Rung 3 is the part that needs care. Silently serving a different model is
 * how "use GPT Image for headshots" turns into "the headshots still look the
 * same and nobody can say why", so the result carries the engine and the
 * reason, the caller surfaces it, and the log states it plainly.
 */
export async function editImageOpenAIFirst(
  src: string,
  prompt: string,
  opts?: { size?: OpenAISize; budgetMs?: number; label?: string }
): Promise<EngineResult> {
  const label = opts?.label || "edit";
  const reasons: string[] = [];

  if (openaiConfigured()) {
    /*
      Retry a throttle before dropping down a rung.

      This is the lesson viaFal() records above, and it matters more here: a
      burst of four headshots is four requests in the same second, and a 429
      that clears in two is not a reason to serve the run on a different model
      and put a notice on the page. Anything that is not transient — a bad
      key, an exhausted quota, a rejected image — drops straight through,
      because asking again will not change the answer.
    */
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const dataUrl = await openaiEditImage(src, prompt, {
          size: opts?.size,
          budgetMs: opts?.budgetMs,
        });
        return { dataUrl, engine: "gpt-image" };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const transient = e instanceof OpenAIImageError && e.transient && !e.billingBlocked;
        if (transient && attempt < 2) {
          const wait = 1500 * (attempt + 1);
          console.warn(`[ai-image] ${label}: OpenAI throttled; retrying in ${wait}ms`);
          await sleep(wait);
          continue;
        }
        reasons.push(`openai: ${msg}`);
        console.error(`[ai-image] ${label}: OpenAI (${openaiImageModel()}) failed — ${msg}`);
        break;
      }
    }
  } else {
    reasons.push("openai: OPENAI_API_KEY is not set");
  }

  // Rung 2 — the same model through fal, if the key lives there instead.
  if (falConfigured()) {
    try {
      const dataUrl = await falEditImage(src, prompt, "gpt-image", undefined, opts?.budgetMs);
      return { dataUrl, engine: "gpt-image" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reasons.push(`fal byok: ${msg}`);
      console.error(`[ai-image] ${label}: fal's BYOK GPT Image failed — ${msg}`);
    }
  }

  const why = reasons.join(" | ");
  console.warn(`[ai-image] ${label}: falling back to Nano Banana. ${why}`);
  const dataUrl = await viaFal(
    () => falEditImage(src, prompt, "nano-banana", undefined, opts?.budgetMs),
    () => geminiEditImage(src, prompt),
    label
  );
  return { dataUrl, engine: "nano-banana", downgradeReason: why };
}
