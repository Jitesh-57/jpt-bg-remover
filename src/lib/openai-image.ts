/**
 * openai-image.ts — OpenAI's image model, called directly.
 *
 * Why this exists alongside fal.ts, which already exposes a "gpt-image"
 * model: fal's GPT Image endpoints are BYOK (`/byok` in the path). They need
 * an OpenAI key configured on the *fal account*, and when it is missing fal
 * answers 401/403 — which ai-image.ts cannot tell apart from a bad FAL_KEY,
 * so it quietly serves the request with Nano Banana instead. For a tool whose
 * whole selling point is the model, that is the wrong failure: the picture
 * comes back looking like the model you did not choose.
 *
 * A key of our own (OPENAI_API_KEY) removes the middleman for the routes that
 * care, and gives access to two controls fal's wrapper does not expose:
 *
 *   input_fidelity: "high"  — keeps the face in the reference photo instead
 *                             of producing a plausible stranger. This is the
 *                             single most important setting for headshots.
 *   quality: "high"         — the slow, detailed render.
 *
 * The model id is configurable (OPENAI_IMAGE_MODEL) so a newer one can be
 * adopted with an environment change rather than a deploy.
 */

const KEY = () =>
  (process.env.OPENAI_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();

/** The image model to call. Override in the environment, not in code. */
export function openaiImageModel(): string {
  return (process.env.OPENAI_IMAGE_MODEL || "").trim() || "gpt-image-1";
}

export function openaiConfigured(): boolean {
  return !!KEY();
}

/** Non-secret shape of the configured key, for diagnosing a 401. */
export function openaiKeyShape(): { configured: boolean; length: number; prefix: string } {
  const k = KEY();
  return { configured: !!k, length: k.length, prefix: k ? k.slice(0, 3) : "" };
}

export class OpenAIImageError extends Error {
  readonly status: number;
  /** Rate limited or briefly overloaded — worth asking again. */
  readonly transient: boolean;
  /** The account cannot pay for this. Retrying and falling back both hide it. */
  readonly billingBlocked: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OpenAIImageError";
    this.status = status;
    this.transient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    this.billingBlocked =
      /insufficient[_ ]quota|billing|hard limit|exceeded your current quota/i.test(message);
  }
}

/** Portrait is the right shape for a headshot; the others are here for reuse. */
export type OpenAISize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";

/** Fetches the source into bytes. OpenAI takes a file upload, not a URL. */
async function toBytes(src: string): Promise<{ data: Buffer; mime: string }> {
  if (src.startsWith("data:")) {
    const comma = src.indexOf(",");
    const m = comma < 0 ? null : /^data:([^;,]+)/.exec(src);
    if (!m) throw new Error("The photo could not be read.");
    return { data: Buffer.from(src.slice(comma + 1), "base64"), mime: m[1] || "image/png" };
  }
  if (!src.startsWith("http")) throw new Error("Image must be a data URL or an https URL");
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not download the source photo (${res.status}).`);
  return {
    data: Buffer.from(await res.arrayBuffer()),
    mime: res.headers.get("content-type")?.split(";")[0] || "image/jpeg",
  };
}

/**
 * OpenAI rejects anything that is not png/jpeg/webp, and a data URL from a
 * canvas is occasionally labelled with something else. Falling back to jpeg
 * rather than passing the label through keeps a mislabelled-but-valid photo
 * working, which is the common case.
 */
function safeMime(mime: string): string {
  return /^image\/(png|jpeg|webp)$/.test(mime) ? mime : "image/jpeg";
}

function extFor(mime: string): string {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

/** Pulls a useful sentence out of OpenAI's error body without assuming a shape. */
function errorText(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string; code?: string } };
    if (j.error?.message) return j.error.message;
  } catch {
    /* not JSON — the raw body is the best we have */
  }
  return body.slice(0, 300) || `HTTP ${status}`;
}

/**
 * Edits a photo from a text instruction.
 *
 * Returns a data URL, matching every other backend here, so callers do not
 * have to care which one served them.
 */
export async function openaiEditImage(
  src: string,
  prompt: string,
  opts?: { size?: OpenAISize; quality?: "low" | "medium" | "high" | "auto"; budgetMs?: number }
): Promise<string> {
  const key = KEY();
  if (!key) throw new OpenAIImageError(0, "OPENAI_API_KEY is not configured.");

  const { data, mime } = await toBytes(src);
  const type = safeMime(mime);

  const form = new FormData();
  form.append("model", openaiImageModel());
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", opts?.size || "1024x1536");
  form.append("quality", opts?.quality || "high");
  // The reason for calling OpenAI directly at all — see the file header.
  form.append("input_fidelity", "high");
  form.append("image", new Blob([new Uint8Array(data)], { type }), `source.${extFor(type)}`);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(opts?.budgetMs ?? 180_000),
    });
  } catch (e) {
    // A timeout and a dropped connection are both "ask again later".
    throw new OpenAIImageError(504, e instanceof Error ? e.message : String(e));
  }

  if (!res.ok) throw new OpenAIImageError(res.status, errorText(res.status, await res.text()));

  const json = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const first = json.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) {
    const img = await fetch(first.url);
    if (!img.ok) throw new OpenAIImageError(img.status, "Could not download the generated image.");
    const buf = Buffer.from(await img.arrayBuffer());
    const t = img.headers.get("content-type")?.split(";")[0] || "image/png";
    return `data:${t};base64,${buf.toString("base64")}`;
  }
  throw new OpenAIImageError(502, "The image service returned no image.");
}

/**
 * Asks OpenAI to list the models, using the configured key.
 *
 * 200 means the key works; 401 means it does not. Listing models generates
 * nothing, so this costs nothing and can be repeated after every change. It
 * also reports whether the configured image model is among them, which is the
 * other half of "why is this not working" when OPENAI_IMAGE_MODEL points at a
 * model the account cannot reach.
 */
export async function openaiProbe(): Promise<{
  status: number;
  body: string;
  hasModel: boolean | null;
}> {
  const key = KEY();
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) return { status: res.status, body: text.slice(0, 300), hasModel: null };
  let hasModel: boolean | null = null;
  try {
    const j = JSON.parse(text) as { data?: { id?: string }[] };
    hasModel = !!j.data?.some((m) => m.id === openaiImageModel());
  } catch {
    /* unexpected shape — the status is still the answer that matters */
  }
  return { status: res.status, body: "", hasModel };
}
