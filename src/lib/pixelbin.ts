// PixelBin transformations via the official @pixelbin/admin SDK.
// Auth: Bearer base64(apiSecret) — handled internally by the SDK.
// Endpoint: /service/platform/transformation/v1.0/predictions/{plugin}/{operation}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PixelbinConfig, PixelbinClient } = require("@pixelbin/admin");

interface PredictionResult {
  status: string;
  output?: unknown;
  error?: unknown;
}

let cachedClient: unknown = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const apiSecret = process.env.PIXELBIN_API_TOKEN || process.env.PIXELBIN_ACCESS_KEY;
  if (!apiSecret) throw new Error("PixelBin API token not configured");
  cachedClient = new PixelbinClient(
    new PixelbinConfig({ domain: "https://api.pixelbin.io", apiSecret })
  );
  return cachedClient;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const [, mimeType, b64] = match;
  return { buffer: Buffer.from(b64, "base64"), ext: mimeType.split("/")[1] || "png" };
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch result: ${res.status}`);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
}

// Dig a URL out of whatever shape the prediction output takes.
function extractUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output.startsWith("http") ? output : null;
  if (Array.isArray(output)) {
    for (const item of output) {
      const u = extractUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    // Common keys first
    for (const key of ["url", "image", "output", "result", "data"]) {
      const u = extractUrl(obj[key]);
      if (u) return u;
    }
    // Fall back to any string value that looks like a URL
    for (const v of Object.values(obj)) {
      const u = extractUrl(v);
      if (u) return u;
    }
  }
  return null;
}

/**
 * Run a PixelBin prediction. `plugin`/`operation` e.g. "erase"/"bg",
 * "nanoBananaPro"/"generate", "sr"/"upscale". Returns a CDN URL.
 */
export async function runPixelBinPrediction(
  imageSource: string, // base64 data URL or https:// URL
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const client = getClient() as {
    predictions: {
      createAndWait: (arg: {
        name: string;
        input: Record<string, unknown>;
        options?: Record<string, number>;
      }) => Promise<PredictionResult>;
    };
  };

  let buffer: Buffer;
  let ext: string;
  if (imageSource.startsWith("http")) {
    const res = await fetch(imageSource);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const arrBuf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    buffer = Buffer.from(arrBuf);
    ext = mime.split("/")[1]?.split(";")[0] || "jpg";
  } else {
    ({ buffer, ext } = dataUrlToBuffer(imageSource));
  }
  // nanoBananaPro takes "images", everything else takes "image"
  const imageField = plugin === "nanoBananaPro" ? "images" : "image";

  const input: Record<string, unknown> = {
    [imageField]: { value: buffer, filename: `image.${ext}` },
    ...(extra || {}),
  };

  const result = await client.predictions.createAndWait({
    name: `${plugin}_${operation}`,
    input,
    options: { maxAttempts: 40, retryFactor: 1, retryInterval: 2000 },
  });

  if (result.status !== "SUCCESS") {
    console.error(`[pixelbin] ${plugin}_${operation} status=${result.status}`, result.error || result.output);
    throw new Error("AI processing failed. Please try again.");
  }

  const url = extractUrl(result.output);
  if (!url) {
    console.error(`[pixelbin] no output URL`, JSON.stringify(result.output).slice(0, 500));
    throw new Error("AI processing returned no result.");
  }
  return url;
}

/**
 * Text-to-image generation (no source image) via nanoBananaPro.generate.
 * Returns a CDN URL of the generated image.
 */
export async function generateImageFromText(
  prompt: string,
  opts?: { aspect_ratio?: string; output_resolution?: string }
): Promise<string> {
  const client = getClient() as {
    predictions: {
      createAndWait: (arg: {
        name: string;
        input: Record<string, unknown>;
        options?: Record<string, number>;
      }) => Promise<PredictionResult>;
    };
  };

  const result = await client.predictions.createAndWait({
    name: "nanoBananaPro_generate",
    input: {
      prompt,
      aspect_ratio: opts?.aspect_ratio || "16:9",
      output_resolution: opts?.output_resolution || "1K",
    },
    options: { maxAttempts: 40, retryFactor: 1, retryInterval: 2000 },
  });

  if (result.status !== "SUCCESS") {
    console.error(`[pixelbin] text2img status=${result.status}`, result.error || result.output);
    throw new Error("Image generation failed.");
  }
  const url = extractUrl(result.output);
  if (!url) throw new Error("Image generation returned no result.");
  return url;
}

/** Same as runPixelBinPrediction but returns a base64 data URL. */
export async function runPixelBinPredictionAsDataUrl(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const resultUrl = await runPixelBinPrediction(imageDataUrl, plugin, operation, extra);
  return urlToDataUrl(resultUrl);
}
