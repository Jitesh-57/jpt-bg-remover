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

const KEY = () => process.env.FAL_KEY || "";

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
    throw new Error(falError(submit.status, submitBody));
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
    if (!st.ok) throw new Error(falError(st.status, stBody));

    if (stBody.status === "COMPLETED") {
      const res = await fetch(responseUrl, { headers: authHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(falError(res.status, body));
      return body;
    }
    // IN_QUEUE / IN_PROGRESS → keep waiting.
  }
  throw new Error("The image took too long to generate. Please try again.");
}

/** Turns a fal error body into something worth showing a user. */
function falError(status: number, body: unknown): string {
  const b = body as { detail?: unknown; error?: unknown; message?: unknown };
  const detail =
    typeof b?.detail === "string" ? b.detail
    : typeof b?.error === "string" ? b.error
    : typeof b?.message === "string" ? b.message
    : "";

  if (status === 401 || status === 403) {
    return "The image service rejected our credentials. Please check the FAL_KEY configuration.";
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
  aspectRatio?: string
): Promise<string> {
  const imageUrl = await toFalImageUrl(src);
  const endpoint = ENDPOINTS[model].edit;

  // The two families name this differently: nano-banana takes aspect_ratio,
  // gpt-image takes image_size. Omitted means "keep the source framing".
  const input =
    model === "nano-banana"
      ? { prompt, image_urls: [imageUrl], num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, image_urls: [imageUrl], num_images: 1, quality: "high",
          image_size: gptImageSize(aspectRatio) };

  const result = await runQueued(endpoint, input);
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

/** Generates an image from a prompt alone. */
export async function falGenerateImage(
  prompt: string,
  model: FalModel = DEFAULT_MODEL,
  aspectRatio?: string
): Promise<string> {
  const endpoint = ENDPOINTS[model].generate;

  const input =
    model === "nano-banana"
      ? { prompt, num_images: 1, output_format: "png",
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}) }
      : { prompt, num_images: 1, image_size: aspectRatio ? gptImageSize(aspectRatio) : "1024x1024", quality: "high" };

  const result = await runQueued(endpoint, input);
  return urlToDataUrl(firstImageUrl(result));
}
