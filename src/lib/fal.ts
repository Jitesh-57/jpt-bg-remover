/**
 * fal.ts — image generation and editing through fal.ai.
 *
 * Two model families are exposed:
 *   nano-banana  → Google Gemini 2.5 Flash Image ("nano banana"). Fast, cheap,
 *                  very strong at identity-preserving edits. The default.
 *   gpt-image    → OpenAI GPT Image. Slower and pricier, better at text inside
 *                  the image and at following long, literal instructions.
 *
 * Requires FAL_KEY in the environment (fal.ai → Dashboard → Keys).
 *
 * Uses the queue API rather than the synchronous one: image edits regularly
 * take longer than a single HTTP request should be held open for, and the
 * queue lets us poll within the route's maxDuration instead of risking a
 * gateway timeout mid-generation.
 */

/**
 * The fal credential, normalised.
 *
 * trim() is not cosmetic: a key pasted into a dashboard field very often
 * arrives with a trailing newline or a stray space, and fal then answers 401
 * — which surfaces as "The image service rejected our credentials" even
 * though the key itself is correct. Quotes around the value and an
 * accidentally-included "Key " prefix are stripped for the same reason.
 */
const KEY = () =>
  (process.env.FAL_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Key\s+/i, "")
    .trim();

/** Non-secret shape of the configured key, for diagnosing a 401. */
export function falKeyShape(): { configured: boolean; length: number; hasColon: boolean } {
  const k = KEY();
  return { configured: !!k, length: k.length, hasColon: k.includes(":") };
}

/**
 * Asks fal about a request id that cannot exist, using the exact header every
 * other call here uses.
 *
 * A wrong key answers 401; a working key answers 404, because the id is
 * unknown. Nothing is generated, so it costs nothing and can be run as often
 * as needed. Lives here rather than in the route so the diagnostic can never
 * drift from what the app actually sends.
 */
export async function falProbe(): Promise<{ status: number; body: string }> {
  const res = await fetch(
    "https://queue.fal.run/fal-ai/nano-banana/requests/00000000-0000-0000-0000-000000000000/status",
    { headers: authHeaders() }
  );
  return { status: res.status, body: (await res.text()).slice(0, 200) };
}

/**
 * The models this app can call.
 *
 * Two families, which differ in the input they take and in what they are good
 * at, not merely in name:
 *
 *   nano-banana  → Google Gemini 2.5 Flash Image. Fast, cheap, very strong at
 *                  identity-preserving edits. The default everywhere.
 *   gpt-image-*  → OpenAI's image models, hosted by fal. Slower and pricier,
 *                  better at text inside the image, at long literal
 *                  instructions, and at photorealism.
 *
 * The GPT entries are fal's `openai/...` endpoints, which fal serves on fal
 * credit. The older `fal-ai/gpt-image-1/.../byok` pair is kept as
 * `gpt-image-1-byok` only for an account that still routes through its own
 * OpenAI key; nothing selects it by default.
 */
/**
 * Asks fal about one endpoint, without generating anything.
 *
 * The request body is empty on purpose. Every image endpoint requires a
 * prompt, so fal rejects it before any work is queued — which makes this free
 * to run as often as you like, while still distinguishing the four things that
 * all look identical from the outside:
 *
 *   404  the path is wrong — this model is not at this address
 *   422  the path is right; fal got as far as validating the input
 *   403  the path is right and this account may not use it
 *   401  FAL_KEY is wrong, and nothing on fal will work
 *
 * That distinction is the whole diagnosis. Without it, "the headshots came out
 * on Nano Banana" could be a typo in a path, a model the account is not
 * entitled to, or a key problem, and there is no way to tell them apart from
 * the outside.
 */
export async function falEndpointProbe(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`https://queue.fal.run/${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: "{}",
  });
  return { status: res.status, body: (await res.text()).slice(0, 300) };
}

export type FalModel =
  | "nano-banana"
  | "gpt-image-2.5-sunburst"
  | "gpt-image-2.5-flare"
  | "gpt-image-2"
  | "gpt-image-1-byok";

/** Which input shape an endpoint expects. */
type Family = "nano" | "gpt";

interface ModelSpec {
  edit: string;
  generate: string;
  family: Family;
  label: string;
}

const MODEL_SPECS: Record<FalModel, ModelSpec> = {
  "nano-banana": {
    edit: "fal-ai/nano-banana/edit",
    generate: "fal-ai/nano-banana",
    family: "nano",
    label: "Nano Banana",
  },
  // "Editing built for the tightest control, edits scoped precisely to the
  // instruction, with subject and composition preserved." Extra fidelity on
  // intricate detail, in exchange for a longer render.
  "gpt-image-2.5-sunburst": {
    edit: "openai/gpt-image-2.5/sunburst/edit",
    generate: "openai/gpt-image-2.5/sunburst/text-to-image",
    family: "gpt",
    label: "GPT Image 2.5 Sunburst",
  },
  // OpenAI's default for most applications: fast, high-quality, natural
  // lighting and rich textures.
  "gpt-image-2.5-flare": {
    edit: "openai/gpt-image-2.5/flare/edit",
    generate: "openai/gpt-image-2.5/flare/text-to-image",
    family: "gpt",
    label: "GPT Image 2.5 Flare",
  },
  "gpt-image-2": {
    edit: "openai/gpt-image-2/edit",
    generate: "openai/gpt-image-2",
    family: "gpt",
    label: "GPT Image 2",
  },
  "gpt-image-1-byok": {
    edit: "fal-ai/gpt-image-1/edit-image/byok",
    generate: "fal-ai/gpt-image-1/text-to-image/byok",
    family: "gpt",
    label: "GPT Image 1 (BYOK)",
  },
};

/**
 * Other spellings the same model might live at.
 *
 * These paths are transcribed from fal's model listing rather than fetched, so
 * a wrong one is a real possibility — and a wrong path fails as 404, which from
 * the outside is indistinguishable from "this account cannot use this model".
 * Both end with the generation quietly served by Nano Banana.
 *
 * So a 404 tries the alternatives before giving up on the model. It costs one
 * more rejected round trip, a 404 returns immediately, and the path that worked
 * is logged so it can be pinned with FAL_ENDPOINT_<ID>_EDIT and the guessing
 * stops. This is a recovery path, not a naming convention: nothing here is
 * invented at runtime.
 */
const PATH_VARIANTS: Partial<Record<FalModel, { edit: string[]; generate: string[] }>> = {
  "gpt-image-2.5-sunburst": {
    edit: [
      "fal-ai/gpt-image-2.5/sunburst/edit",
      "openai/gpt-image-2.5/sunburst/edit-image",
      "openai/gpt-image-2.5/sunburst/image-to-image",
    ],
    generate: ["fal-ai/gpt-image-2.5/sunburst/text-to-image"],
  },
  "gpt-image-2.5-flare": {
    edit: [
      "fal-ai/gpt-image-2.5/flare/edit",
      "openai/gpt-image-2.5/flare/edit-image",
      "openai/gpt-image-2.5/flare/image-to-image",
    ],
    generate: ["fal-ai/gpt-image-2.5/flare/text-to-image"],
  },
  "gpt-image-2": {
    edit: [
      "fal-ai/gpt-image-2/edit",
      "openai/gpt-image-2/edit-image",
      "openai/gpt-image-2/image-to-image",
    ],
    generate: ["fal-ai/gpt-image-2"],
  },
};

/** The configured path first, then the alternatives worth trying on a 404. */
export function falPathVariants(m: FalModel, half: "edit" | "generate"): string[] {
  const configured = falEndpoint(m, half);
  const alts = PATH_VARIANTS[m]?.[half] ?? [];
  return [configured, ...alts.filter((p) => p !== configured)];
}

export function falModelSpec(m: FalModel): ModelSpec {
  return MODEL_SPECS[m];
}

export function falModelIds(): FalModel[] {
  return Object.keys(MODEL_SPECS) as FalModel[];
}

/**
 * Every model's endpoint can be overridden from the environment, keyed by id:
 *
 *   FAL_ENDPOINT_GPT_IMAGE_2_5_SUNBURST_EDIT=openai/<path>
 *   FAL_ENDPOINT_GPT_IMAGE_2_EDIT=openai/<path>
 *   …and _GENERATE for the text-to-image half.
 *
 * This exists because fal renames and reorganises model paths, and a renamed
 * path should be a setting rather than a deploy. A leading slash and a full
 * https:// prefix are both tolerated, because that is how fal writes them in
 * its own model pages and pasting one verbatim should not produce a 404.
 */
function envKey(m: FalModel, half: "EDIT" | "GENERATE"): string {
  return `FAL_ENDPOINT_${m.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${half}`;
}

function normaliseEndpoint(raw: string): string {
  return raw.trim().replace(/^https?:\/\/(queue\.)?fal\.run\//i, "").replace(/^\/+/, "");
}

export function falEndpoint(m: FalModel, half: "edit" | "generate"): string {
  const override = process.env[envKey(m, half === "edit" ? "EDIT" : "GENERATE")];
  if (override && override.trim()) return normaliseEndpoint(override);
  return MODEL_SPECS[m][half];
}

/** Every model's resolved endpoints, for the admin check. */
export function falEndpointTable(): Record<string, { edit: string; generate: string; overridden: boolean }> {
  const out: Record<string, { edit: string; generate: string; overridden: boolean }> = {};
  for (const m of falModelIds()) {
    out[m] = {
      edit: falEndpoint(m, "edit"),
      generate: falEndpoint(m, "generate"),
      overridden: !!(process.env[envKey(m, "EDIT")] || process.env[envKey(m, "GENERATE")]),
    };
  }
  return out;
}

export const DEFAULT_MODEL: FalModel = "nano-banana";

/**
 * The background-removal model, as asked for.
 *
 * A purpose-built segmentation model beats instructing a general image model
 * to "remove the background": it returns a real alpha channel with clean hair
 * and edge detail, costs less, and cannot reinterpret the subject — which a
 * prompt-driven edit sometimes does.
 */
const BG_REMOVAL_MODEL = "pixelcut/background-removal";

export function falConfigured(): boolean {
  return !!KEY();
}

function assertKey() {
  if (!KEY()) {
    throw new Error(
      "FAL_KEY not configured. Add it in your environment (fal.ai → Dashboard → Keys)."
    );
  }
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Key ${KEY()}`, "Content-Type": "application/json" };
}

/**
 * The aspect ratios fal actually accepts.
 *
 * Discovered the hard way: "16:10" is not among them, and a run that used it
 * lost every job to a 422 while the Gemini fallback reported a rate limit
 * instead. Anything not on this list is rejected before a request is sent, so
 * the same mistake cannot reach the API again.
 */
export const FAL_ASPECT_RATIOS = [
  "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16",
] as const;

export function assertAspectRatio(ratio: string | undefined): void {
  if (ratio && !(FAL_ASPECT_RATIOS as readonly string[]).includes(ratio)) {
    throw new Error(
      `Unsupported aspect ratio "${ratio}". fal accepts: ${FAL_ASPECT_RATIOS.join(", ")}.`
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fal accepts a public URL or a base64 data URI for image inputs. */
async function toFalImageUrl(src: string): Promise<string> {
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  throw new Error("Image must be a data URL or an https URL");
}

type QueueSubmit = { request_id?: string; status_url?: string; response_url?: string; detail?: string };

/**
 * Submits to the queue and polls until the result is ready.
 * `budgetMs` keeps the poll loop inside the calling route's maxDuration.
 */
async function runQueued(
  model: string,
  input: object,
  budgetMs = 55_000,
  opts?: { minimalInput?: object; paths?: string[] }
): Promise<unknown> {
  assertKey();
  const started = Date.now();

  const post = (path: string, body: object) =>
    fetch(`https://queue.fal.run/${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

  const candidates = opts?.paths?.length ? opts.paths : [model];
  let submit!: Response;
  let submitBody!: QueueSubmit;

  for (let i = 0; i < candidates.length; i++) {
    const path = candidates[i];
    submit = await post(path, input);
    submitBody = (await submit.json().catch(() => ({}))) as QueueSubmit;

    /*
      422 means fal understood the request and rejected its shape.

      fal's models do not share one input schema; a field one endpoint takes
      (`quality`, `image_size`, `output_format`) another may not recognise.
      Those are all optional refinements, so losing a generation over one is
      the wrong trade — the retry sends the prompt and the image alone. It
      costs one round trip, only on an endpoint that has already refused, and
      the discarded fields are logged so a real schema change is visible
      rather than silently absorbed.
    */
    if (submit.status === 422 && opts?.minimalInput) {
      console.warn(
        `[fal] ${path} rejected the request shape (422): ${JSON.stringify(submitBody).slice(0, 200)}. ` +
        `Retrying with prompt and image only.`
      );
      submit = await post(path, opts.minimalInput);
      submitBody = (await submit.json().catch(() => ({}))) as QueueSubmit;
    }

    // 404 is the only status worth trying another spelling for: the path is
    // wrong. Anything else is an answer about this model, not its address.
    if (submit.status !== 404 || i === candidates.length - 1) {
      if (i > 0 && submit.ok) {
        console.warn(
          `[fal] ${candidates[0]} is a 404; this model answered at ${path} instead. ` +
          `Pin it with the FAL_ENDPOINT_… variable for this model to skip the extra round trips.`
        );
      }
      break;
    }
    console.warn(`[fal] ${path} does not exist (404); trying the next known spelling.`);
  }

  if (!submit.ok) {
    throw new FalError(falError(submit.status, submitBody), submit.status, JSON.stringify(submitBody).slice(0, 400));
  }

  const statusUrl = submitBody.status_url;
  const responseUrl = submitBody.response_url;
  if (!statusUrl || !responseUrl) throw new Error("fal did not return a queue handle");

  let delay = 700;
  while (Date.now() - started < budgetMs) {
    await sleep(delay);
    delay = Math.min(delay * 1.4, 3000);

    const st = await fetch(statusUrl, { headers: authHeaders() });
    const stBody = (await st.json().catch(() => ({}))) as { status?: string };
    if (!st.ok) throw new FalError(falError(st.status, stBody), st.status, JSON.stringify(stBody).slice(0, 400));

    if (stBody.status === "COMPLETED") {
      const res = await fetch(responseUrl, { headers: authHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new FalError(falError(res.status, body), res.status, JSON.stringify(body).slice(0, 400));
      return body;
    }
    // IN_QUEUE / IN_PROGRESS → keep waiting.
  }
  throw new FalError("The image took too long to generate. Please try again.", 408, `timed out after ${budgetMs}ms`);
}

/** A fal failure that still carries its HTTP status, for retry decisions. */
export class FalError extends Error {
  constructor(message: string, readonly status: number, readonly detail: string) {
    super(message);
    this.name = "FalError";
  }
  /**
   * The account cannot pay for the request.
   *
   * fal does not always use 402 for this. It also answers 403 with
   * "User is locked. Reason: Exhausted balance." — which has to be recognised
   * from the body, because nothing about the status code says billing.
   *
   * Checked before rateLimited on purpose: "Exhausted balance" contains
   * "exhaust", so a rate-limit pattern matching that word classified a locked
   * account as a throttle, retried it three times, and let a Gemini fallback
   * swallow the one message that actually said what was wrong.
   */
  get billingBlocked(): boolean {
    const text = `${this.detail} ${this.message}`;
    return (
      this.status === 402 ||
      /exhausted balance|user is locked|insufficient (funds|balance|credit)|top ?up your balance|out of credit/i.test(text)
    );
  }

  /**
   * Throttled rather than refused.
   *
   * fal signals this as 429, but also as 403 with a rate-limit reason in the
   * body — and a 403 read as "bad credentials" is how a burst of generations
   * came to look like a misconfigured key. The distinction matters because
   * this one clears on its own: the right response is to wait and try fal
   * again, not to conclude the key is wrong or switch provider.
   */
  get rateLimited(): boolean {
    if (this.billingBlocked) return false;
    const text = `${this.detail} ${this.message}`;
    return (
      this.status === 429 ||
      (this.status === 403 && /rate.?limit|too many|quota|exhaust|concurren/i.test(text))
    );
  }

  /** Worth trying again: rate limiting, capacity, or a server-side blip. */
  get transient(): boolean {
    if (this.billingBlocked) return false;
    return this.status === 408 || this.status >= 500 || this.rateLimited;
  }

  /**
   * A credentials or billing problem: every other request will fail the same
   * way, so a bulk job should stop rather than burn through its queue.
   *
   * A throttled 403 is explicitly not this — it is transient, and stopping a
   * run on it wastes the whole queue over something that resolves in seconds.
   */
  get fatal(): boolean {
    if (this.billingBlocked) return true;
    return !this.rateLimited && (this.status === 401 || this.status === 403);
  }

  /**
   * fal refused *this* prompt (or this prompt/image pair) and will keep
   * refusing it, but nothing is wrong with the key or the account.
   *
   * Worth distinguishing because run 10 conflated the two: one app prompt came
   * back 422 "Could not generate images with the given prompts and images",
   * that was read as fatal, and a run which had already produced 24 images
   * stopped with dozens of workable jobs still queued.
   */
  get promptRejected(): boolean {
    const text = `${this.detail} ${this.message}`;
    return (
      this.status === 422 ||
      /content_policy|content checker|invalid_request|did not generate the expected output/i.test(text)
    );
  }
}

/** Turns a fal error body into something worth showing a user. */
function falError(status: number, body: unknown): string {
  const b = body as { detail?: unknown; error?: unknown; message?: unknown };
  const detail =
    typeof b?.detail === "string" ? b.detail
    : typeof b?.error === "string" ? b.error
    : typeof b?.message === "string" ? b.message
    : "";

  /*
    When fal says why, that is the message. Nothing is appended.

    A guess bolted onto fal's own text made the real cause unreadable: fal
    answered 403 "User is locked. Reason: Exhausted balance. Top up your
    balance at fal.ai/dashboard/billing", and the sentence that followed it
    said "the key is being accepted, so this is usually a rate limit or an
    endpoint the account cannot reach" — contradicting the only authoritative
    part of the message. Speculation is only useful when fal is silent.
  */
  const billing = /exhausted balance|user is locked|insufficient (funds|balance|credit)|top ?up/i.test(detail);
  if (status === 402 || billing) {
    return detail
      ? `The image service is out of credit: ${detail}`
      : "The image service is out of credit. Please top up the fal.ai balance.";
  }
  if (status === 401) {
    return detail
      ? `The image service rejected our key: ${detail}`
      : "The image service rejected our key. A new one from fal.ai → Dashboard → Keys will fix it.";
  }
  if (status === 403) {
    return detail
      ? `The image service refused this request: ${detail}`
      : "The image service refused this request. The key is accepted, so this is usually a rate limit or an endpoint the account cannot reach.";
  }
  if (status === 429) {
    return "The image service is busy right now. Please try again in a moment.";
  }
  if (status >= 500) {
    return "The image service is having trouble right now. Please try again.";
  }
  return detail || `Image generation failed (${status}).`;
}

/** Pulls the first image URL out of whichever shape the model returned. */
function firstImageUrl(result: unknown): string {
  const r = result as {
    images?: { url?: string }[];
    image?: { url?: string };
    data?: { images?: { url?: string }[] };
  };
  const url =
    r?.images?.[0]?.url ||
    r?.image?.url ||
    r?.data?.images?.[0]?.url;
  if (!url) throw new Error("The image service returned no image.");
  return url;
}

/** Downloads a result and returns it as a data URL, matching the Gemini path. */
async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the generated image (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Maps an aspect ratio to the nearest size GPT Image accepts. */
function gptImageSize(aspectRatio?: string): string {
  switch (aspectRatio) {
    case "16:9":
    case "3:2":
    case "21:9":
    case "16:10":
      return "1536x1024";
    case "9:16":
    case "4:5":
    case "3:4":
      return "1024x1536";
    case "1:1":
      return "1024x1024";
    default:
      return "auto";
  }
}

/** Edits an existing image from a text instruction. */
export async function falEditImage(
  src: string,
  prompt: string,
  model: FalModel = DEFAULT_MODEL,
  aspectRatio?: string,
  budgetMs?: number
): Promise<string> {
  const imageUrl = await toFalImageUrl(src);
  assertAspectRatio(aspectRatio);
  const endpoint = falEndpoint(model, "edit");

  // The two families name this differently: nano-banana takes aspect_ratio,
  // the GPT models take image_size. Omitted means "keep the source framing".
  const input =
    falModelSpec(model).family === "nano"
      ? { prompt, image_urls: [imageUrl], num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, image_urls: [imageUrl], num_images: 1, quality: "high",
          image_size: gptImageSize(aspectRatio) };

  const result = await runQueued(endpoint, input, budgetMs, {
    // The framing and quality fields are the optional part of the request.
    // If an endpoint does not recognise one of them it answers 422, and a
    // rejected *option* is a poor reason to lose the generation — so the
    // retry drops to prompt and image alone. See runQueued.
    minimalInput: { prompt, image_urls: [imageUrl], num_images: 1 },
    paths: falPathVariants(model, "edit"),
  });
  return urlToDataUrl(firstImageUrl(result));
}

/** Edits using several reference images at once (e.g. identity + style refs). */
export async function falEditImages(
  srcs: string[],
  prompt: string,
  model: FalModel = DEFAULT_MODEL
): Promise<string> {
  if (!srcs.length) throw new Error("At least one image is required");
  const imageUrls = await Promise.all(srcs.map(toFalImageUrl));
  const endpoint = falEndpoint(model, "edit");

  const input =
    falModelSpec(model).family === "nano"
      ? { prompt, image_urls: imageUrls, num_images: 1, output_format: "png" }
      : { prompt, image_urls: imageUrls, num_images: 1, image_size: "auto", quality: "high" };

  const result = await runQueued(endpoint, input, undefined, {
    minimalInput: { prompt, image_urls: imageUrls, num_images: 1 },
    paths: falPathVariants(model, "edit"),
  });
  return urlToDataUrl(firstImageUrl(result));
}

/**
 * Removes the background, returning a PNG with transparency.
 *
 * Falls back to nothing here on purpose — the caller decides, because a
 * segmentation failure and a credentials failure want different handling.
 */
export async function falRemoveBackground(src: string, budgetMs?: number): Promise<string> {
  const imageUrl = await toFalImageUrl(src);
  const result = await runQueued(BG_REMOVAL_MODEL, { image_url: imageUrl }, budgetMs);
  return urlToDataUrl(firstImageUrl(result));
}

/** Generates an image from a prompt alone. */
export async function falGenerateImage(
  prompt: string,
  model: FalModel = DEFAULT_MODEL,
  aspectRatio?: string,
  budgetMs?: number
): Promise<string> {
  assertAspectRatio(aspectRatio);
  const endpoint = falEndpoint(model, "generate");

  const input =
    falModelSpec(model).family === "nano"
      ? { prompt, num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, num_images: 1, image_size: aspectRatio ? gptImageSize(aspectRatio) : "1024x1024", quality: "high" };

  const result = await runQueued(endpoint, input, budgetMs, {
    minimalInput: { prompt, num_images: 1 },
    paths: falPathVariants(model, "generate"),
  });
  return urlToDataUrl(firstImageUrl(result));
}
