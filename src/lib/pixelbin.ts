const PIXELBIN_API_TOKEN = () => process.env.PIXELBIN_API_TOKEN || "";
const PIXELBIN_ACCESS_KEY = () => process.env.PIXELBIN_ACCESS_KEY || "";
const ORG_ID = "318452";

function getAuthHeader(): string {
  const key = PIXELBIN_ACCESS_KEY() || PIXELBIN_API_TOKEN();
  if (!key) throw new Error("PixelBin API token not configured");
  return `Bearer ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch result: ${res.status}`);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
}

function imageDataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const [, mimeType, b64] = match;
  const ext = mimeType.split("/")[1] || "png";
  return { blob: new Blob([Buffer.from(b64, "base64")], { type: mimeType }), ext };
}

async function pollResult(predictionId: string): Promise<string> {
  const pollUrl = `https://api.pixelbin.io/service/platform/playground/v1.0/${ORG_ID}/predict/${predictionId}`;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(pollUrl, { headers: { Authorization: getAuthHeader() } });
    if (!res.ok) throw new Error("AI processing failed. Please try again.");
    const data = (await res.json()) as { status: string; output?: Record<string, unknown> };
    if (data.status === "completed" || data.status === "SUCCESS") {
      const out = data.output;
      if (!out) throw new Error("AI processing completed but returned no result.");
      const url = (out.image as string) || (out.url as string) || (out.output as string) || (Object.values(out)[0] as string);
      if (!url) throw new Error("AI processing completed but returned no result.");
      return url;
    }
    if (data.status === "failed" || data.status === "FAILURE") throw new Error("AI processing failed. Please try again.");
    console.log(`[pixelbin] attempt ${attempt + 1}: ${data.status}`);
  }
  throw new Error("AI processing timed out. Please try again with a smaller image.");
}

/** Run a PixelBin prediction — returns a CDN URL */
export async function runPixelBinPrediction(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const { blob, ext } = imageDataUrlToBlob(imageDataUrl);

  // nanoBananaPro uses "images" field; others use "image"
  const imageField = plugin === "nanoBananaPro" ? "images" : "image";

  const formData = new FormData();
  formData.append(imageField, blob, `image.${ext}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) formData.append(k, v);
  }

  const endpoint = `https://api.pixelbin.io/service/platform/playground/v1.0/${ORG_ID}/predict/${plugin}/${operation}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: getAuthHeader() },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[pixelbin] ${plugin}/${operation} failed (${res.status}):`, text);
    throw new Error(`AI processing failed (${res.status}). Please try again.`);
  }

  const data = (await res.json()) as {
    predictionId?: string; _id?: string;
    status?: string; output?: Record<string, unknown>;
  };

  // Synchronous result
  if (data.status === "completed" || data.status === "SUCCESS") {
    const out = data.output;
    const url = out && ((out.image as string) || (out.url as string) || (Object.values(out)[0] as string));
    if (url) return url;
  }

  const predictionId = data.predictionId || data._id;
  if (!predictionId) throw new Error("AI processing failed. Please try again.");
  return pollResult(predictionId);
}

/** Run a PixelBin prediction — returns a base64 data URL */
export async function runPixelBinPredictionAsDataUrl(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const resultUrl = await runPixelBinPrediction(imageDataUrl, plugin, operation, extra);
  return urlToDataUrl(resultUrl);
}
