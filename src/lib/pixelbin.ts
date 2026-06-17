const PIXELBIN_API_TOKEN = () => process.env.PIXELBIN_API_TOKEN || "";
const PIXELBIN_ACCESS_KEY = () => process.env.PIXELBIN_ACCESS_KEY || "";

function getAuthHeader(): string {
  // PixelBin uses HTTP Basic Auth: base64(token:) as Bearer
  const token = PIXELBIN_API_TOKEN() || PIXELBIN_ACCESS_KEY();
  if (!token) throw new Error("PixelBin API token not configured");
  return `Bearer ${Buffer.from(`${token}:`).toString("base64")}`;
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch result: ${res.status}`);
  const buf = await res.arrayBuffer();
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
}

async function submitInference(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const [, mimeType, base64Content] = match;
  const ext = mimeType.split("/")[1] || "png";

  const formData = new FormData();
  formData.append("plugin", plugin);
  formData.append("operation", operation);
  formData.append("image", new Blob([Buffer.from(base64Content, "base64")], { type: mimeType }), `image.${ext}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) formData.append(k, v);
  }

  const res = await fetch("https://api.pixelbin.io/service/platform/predict/v1/inference", {
    method: "POST",
    headers: { Authorization: getAuthHeader() },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[pixelbin] inference failed (${res.status}):`, text);
    throw new Error(`AI processing failed (${res.status}). Please try again.`);
  }

  const data = (await res.json()) as { predictionId?: string; _id?: string };
  const predictionId = data.predictionId || data._id;
  if (!predictionId) throw new Error("AI processing failed. Please try again.");
  return predictionId;
}

async function pollResult(predictionId: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(
      `https://api.pixelbin.io/service/platform/predict/v1/inference/${predictionId}`,
      { headers: { Authorization: getAuthHeader() } }
    );

    if (!res.ok) throw new Error("AI processing failed. Please try again.");

    const data = (await res.json()) as { status: string; output?: Record<string, unknown> };

    if (data.status === "completed") {
      const out = data.output;
      if (!out) throw new Error("AI processing completed but returned no result.");
      const url = (out.image as string) || (out.url as string) || (Object.values(out)[0] as string);
      if (!url) throw new Error("AI processing completed but returned no result.");
      return url;
    }

    if (data.status === "failed") throw new Error("AI processing failed. Please try again.");
    console.log(`[pixelbin] attempt ${attempt + 1}: ${data.status}`);
  }

  throw new Error("AI processing timed out. Please try again with a smaller image.");
}

/** Returns a CDN URL string (permanent for 30 days) */
export async function runPixelBinPrediction(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const predictionId = await submitInference(imageDataUrl, plugin, operation, extra);
  return pollResult(predictionId);
}

/** Returns a base64 data URL */
export async function runPixelBinPredictionAsDataUrl(
  imageDataUrl: string,
  plugin: string,
  operation: string,
  extra?: Record<string, string>
): Promise<string> {
  const resultUrl = await runPixelBinPrediction(imageDataUrl, plugin, operation, extra);
  return urlToDataUrl(resultUrl);
}
