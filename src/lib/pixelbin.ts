// src/lib/pixelbin.ts
const PIXELBIN_API_TOKEN = process.env.PIXELBIN_API_TOKEN;

export async function runPixelBinPrediction(
  imageBase64: string,         // full data URL e.g. data:image/png;base64,...
  plugin: string,              // e.g. "erase"
  operation: string,           // e.g. "bg"
  input?: Record<string, unknown>  // extra input fields merged with { image: <url> }
): Promise<string> {           // returns output image URL
  if (!PIXELBIN_API_TOKEN) throw new Error("PIXELBIN_API_TOKEN not configured");

  // Extract mime type and base64 content from data URL
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const [, mimeType, base64Content] = match;

  // ── Step 1: Upload image via presigned upload endpoint ──────────────────────
  const fileBuffer = Buffer.from(base64Content, "base64");

  // Get extension from mime type
  const ext = mimeType.split("/")[1] || "png";
  const fileName = `upload-${Date.now()}.${ext}`;

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("path", "jpt-uploads");
  formData.append("access", "public-read");

  const uploadRes = await fetch(
    "https://api.pixelbin.io/service/platform/assets/v2/upload",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${PIXELBIN_API_TOKEN}` },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`PixelBin upload failed (${uploadRes.status}): ${text}`);
  }

  const uploadData = (await uploadRes.json()) as { url: string };
  const imageUrl = uploadData.url;
  if (!imageUrl) throw new Error("PixelBin upload returned no URL");

  // ── Step 2: Create prediction ───────────────────────────────────────────────
  const inferenceRes = await fetch(
    "https://api.pixelbin.io/service/platform/predict/v1/inference",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PIXELBIN_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plugin,
        operation,
        input: { image: imageUrl, ...input },
      }),
    }
  );

  if (!inferenceRes.ok) {
    const text = await inferenceRes.text();
    throw new Error(`PixelBin inference failed (${inferenceRes.status}): ${text}`);
  }

  const inferenceData = (await inferenceRes.json()) as { predictionId?: string; _id?: string };
  const predictionId = inferenceData.predictionId || inferenceData._id;
  if (!predictionId) throw new Error("PixelBin inference returned no predictionId");

  // ── Step 3: Poll for result ─────────────────────────────────────────────────
  const pollInterval = 2000; // 2 seconds
  const maxAttempts = 30;    // 60 seconds total

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const pollRes = await fetch(
      `https://api.pixelbin.io/service/platform/predict/v1/inference/${predictionId}`,
      {
        headers: { Authorization: `Bearer ${PIXELBIN_API_TOKEN}` },
      }
    );

    if (!pollRes.ok) {
      const text = await pollRes.text();
      throw new Error(`PixelBin poll failed (${pollRes.status}): ${text}`);
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      output?: Record<string, unknown>;
    };

    if (pollData.status === "completed") {
      const output = pollData.output;
      if (!output) throw new Error("PixelBin completed but no output");
      // Try output.image, then output.url, then first value
      const outputUrl =
        (output.image as string) ||
        (output.url as string) ||
        (Object.values(output)[0] as string);
      if (!outputUrl) throw new Error("PixelBin output has no image URL");
      return outputUrl;
    }

    if (pollData.status === "failed") {
      throw new Error("PixelBin prediction failed");
    }

    // status is "pending" or "processing" — keep polling
    console.log(`[pixelbin] poll attempt ${attempt + 1}: status=${pollData.status}`);
  }

  throw new Error("PixelBin prediction timed out after 60 seconds");
}
