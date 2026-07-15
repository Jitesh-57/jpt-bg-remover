// Gemini image generation via direct REST (v1beta supports responseModalities).
// This is the sole AI image backend for the app (Google "Nano Banana" /
// gemini-2.5-flash-image). Set GEMINI_API_KEY in the environment.
const API_KEY = () => process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

// Accept either a base64 data URL or an https:// URL and return an inlineData part.
async function srcToPart(src: string) {
  if (src.startsWith("http")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/png";
    return { inlineData: { mimeType, data: buf.toString("base64") } };
  }
  return dataUrlToPart(src);
}

function assertKey() {
  if (!API_KEY()) {
    throw new Error(
      "GEMINI_API_KEY not configured. Add it in your environment (get one at https://aistudio.google.com/apikey)."
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Pull Google's suggested retry delay (e.g. "9s") out of a 429 body, capped.
function retryDelayMs(body: string, attempt: number): number {
  const m = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  const suggested = m ? Math.ceil(parseFloat(m[1]) * 1000) : 0;
  const backoff = 800 * 2 ** attempt; // 800ms, 1.6s, 3.2s…
  return Math.min(Math.max(suggested, backoff), 6000);
}

// POST to Gemini with automatic retry on transient rate-limit/overload (429/503).
async function postGemini(body: object): Promise<Response> {
  assertKey();
  const MAX_ATTEMPTS = 3;
  let res: Response | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    res = await fetch(`${ENDPOINT}?key=${API_KEY()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    if ((res.status === 429 || res.status === 503) && attempt < MAX_ATTEMPTS - 1) {
      const errBody = await res.clone().text();
      await sleep(retryDelayMs(errBody, attempt));
      continue;
    }
    return res;
  }
  return res as Response;
}

// Turn a raw Gemini API failure into a short, user-friendly message. The raw
// body is logged server-side (see callers) for debugging; users never see it.
function friendlyGeminiError(status: number, body: string): Error {
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(body)) {
    return new Error("This AI feature is temporarily unavailable due to high demand. Please try again in a few minutes.");
  }
  if (status === 401 || status === 403 || /API key|permission|billing/i.test(body)) {
    return new Error("The AI service is being set up and will be back shortly. Please try again later.");
  }
  return new Error("Couldn't process the image right now. Please try again.");
}

function extractImage(json: {
  candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
}): string {
  const parts = json.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Couldn't process the image right now. Please try again.");
}

// Image-in / image-out edit.
async function callGemini(src: string, text: string): Promise<string> {
  const imagePart = await srcToPart(src);
  const res = await postGemini({
    contents: [{ parts: [imagePart, { text }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[gemini] ${res.status} ${err.slice(0, 500)}`);
    throw friendlyGeminiError(res.status, err);
  }

  return extractImage(await res.json());
}

export async function geminiEditImage(src: string, prompt: string): Promise<string> {
  return callGemini(
    src,
    `You are a professional photo editor. Edit this image: ${prompt}. Return only the edited image.`
  );
}

export async function geminiGenerateBg(src: string, prompt: string): Promise<string> {
  return callGemini(
    src,
    `Replace the background of this image with: ${prompt}. Keep the subject exactly as-is — same pose, clothing, appearance. Only change the background. Return only the edited image.`
  );
}

export async function geminiRemoveBg(src: string): Promise<string> {
  return callGemini(
    src,
    "Remove the background from this image completely. Make it transparent. Keep the subject with clean edges. Return only the resulting PNG image."
  );
}

export async function geminiUpscale(src: string, scale: "2x" | "4x"): Promise<string> {
  return callGemini(
    src,
    `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve hair strands, skin texture, fabric detail. Remove noise and artifacts. Make colors vivid with punchy contrast. Return only the enhanced image.`
  );
}

/**
 * Text-to-image generation (no source image) via Gemini. Returns a base64
 * data URL. Drop-in replacement for the former PixelBin generateImageFromText.
 */
export async function geminiGenerateFromText(
  prompt: string,
  opts?: { aspect_ratio?: string }
): Promise<string> {
  const aspect = opts?.aspect_ratio || "16:9";
  const res = await postGemini({
    contents: [
      {
        parts: [
          {
            text: `Generate a high-quality, photorealistic image (${aspect} aspect ratio): ${prompt}. Return only the image.`,
          },
        ],
      },
    ],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[gemini] text2img ${res.status} ${err.slice(0, 500)}`);
    throw friendlyGeminiError(res.status, err);
  }

  return extractImage(await res.json());
}
