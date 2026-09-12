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

export type FalModel = "nano-banana" | "gpt-image";

const ENDPOINTS: Record<FalModel, { edit: string; generate: string }> = {
  "nano-banana": {
    edit: "fal-ai/nano-banana/edit",
    generate: "fal-ai/nano-banana",
  },
  "gpt-image": {
    edit: "fal-ai/gpt-image-1/edit-image/byok",
    generate: "fal-ai/gpt-image-1/text-to-image/byok",
  },
};

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
async function runQueued(model: string, input: object, budgetMs = 55_000): Promise<unknown> {
  assertKey();
  const started = Date.now();

  const submit = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });

  const submitBody = (await submit.json().catch(() => ({}))) as QueueSubmit;
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
  /** Worth trying again: rate limiting, capacity, or a server-side blip. */
  get transient(): boolean {
    return this.status === 429 || this.status === 408 || this.status >= 500;
  }

  /**
   * A credentials or billing problem: every other request will fail the same
   * way, so a bulk job should stop rather than burn through its queue.
   */
  get fatal(): boolean {
    return this.status === 401 || this.status === 402 || this.status === 403;
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
    401 and 403 are not the same problem and must not share a message.

    401 is the key itself: absent, wrong, or revoked. 403 is a key fal
    accepts, refused for this particular request — an endpoint the account
    cannot reach, or a rate limit after a burst. Telling someone to "check
    the FAL_KEY configuration" when the key is fine and the account is
    throttled sends them to fix something that is not broken, which is
    exactly what happened after a run put 95 generations through in three
    minutes. fal's own text is appended because it usually says which.
  */
  if (status === 401) {
    return `The image service rejected our key${detail ? `: ${detail}` : "."} It may have been revoked or replaced — a new key from fal.ai → Dashboard → Keys will fix it.`;
  }
  if (status === 403) {
    return `The image service refused this request${detail ? `: ${detail}` : "."} The key is being accepted, so this is usually a rate limit or an endpoint the account cannot reach.`;
  }
  if (status === 402) {
    return "The image service is out of credit. Please top up the fal.ai balance.";
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
  const endpoint = ENDPOINTS[model].edit;

  // The two families name this differently: nano-banana takes aspect_ratio,
  // gpt-image takes image_size. Omitted means "keep the source framing".
  const input =
    model === "nano-banana"
      ? { prompt, image_urls: [imageUrl], num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, image_urls: [imageUrl], num_images: 1, quality: "high",
          image_size: gptImageSize(aspectRatio) };

  const result = await runQueued(endpoint, input, budgetMs);
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
  const endpoint = ENDPOINTS[model].edit;

  const input =
    model === "nano-banana"
      ? { prompt, image_urls: imageUrls, num_images: 1, output_format: "png" }
      : { prompt, image_urls: imageUrls, num_images: 1, image_size: "auto", quality: "high" };

  const result = await runQueued(endpoint, input);
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
  const endpoint = ENDPOINTS[model].generate;

  const input =
    model === "nano-banana"
      ? { prompt, num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, num_images: 1, image_size: aspectRatio ? gptImageSize(aspectRatio) : "1024x1024", quality: "high" };

  const result = await runQueued(endpoint, input, budgetMs);
  return urlToDataUrl(firstImageUrl(result));
}
