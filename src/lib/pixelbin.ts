const PIXELBIN_API_TOKEN = process.env.PIXELBIN_API_TOKEN;
const PIXELBIN_ACCESS_KEY = process.env.PIXELBIN_ACCESS_KEY;

function getAuthHeader() {
  const key = PIXELBIN_ACCESS_KEY || PIXELBIN_API_TOKEN;
  const token = Buffer.from(`${key}:`).toString("base64");
  return `Bearer ${token}`;
}

export async function runPixelBinPrediction(
  imageBase64: string,
  plugin: string,
  operation: string,
  input?: Record<string, unknown>
): Promise<string> {
  if (!PIXELBIN_API_TOKEN && !PIXELBIN_ACCESS_KEY) {
    throw new Error("AI service not configured");
  }

  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const [, mimeType, base64Content] = match;

  const ext = mimeType.split("/")[1] || "png";
  const fileName = `image.${ext}`;
  const fileBuffer = Buffer.from(base64Content, "base64");

  // Send image directly to inference endpoint as multipart — no separate upload needed
  const formData = new FormData();
  formData.append("plugin", plugin);
  formData.append("operation", operation);
  formData.append("image", new Blob([fileBuffer], { type: mimeType }), fileName);

  // Merge any extra input fields
  if (input) {
    for (const [k, v] of Object.entries(input)) {
      formData.append(k, String(v));
    }
  }

  const inferenceRes = await fetch(
    "https://api.pixelbin.io/service/platform/predict/v1/inference",
    {
      method: "POST",
      headers: { Authorization: getAuthHeader() },
      body: formData,
    }
  );

  if (!inferenceRes.ok) {
    const text = await inferenceRes.text();
    console.error(`[SJPT-AI] inference failed (${inferenceRes.status}): ${text}`);
    throw new Error(`AI processing failed (${inferenceRes.status}). Please try again.`);
  }

  const inferenceData = (await inferenceRes.json()) as { predictionId?: string; _id?: string };
  const predictionId = inferenceData.predictionId || inferenceData._id;
  if (!predictionId) throw new Error("AI processing failed. Please try again.");

  // Poll for result
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pollRes = await fetch(
      `https://api.pixelbin.io/service/platform/predict/v1/inference/${predictionId}`,
      { headers: { Authorization: getAuthHeader() } }
    );

    if (!pollRes.ok) {
      const text = await pollRes.text();
      console.error(`[SJPT-AI] poll failed (${pollRes.status}): ${text}`);
      throw new Error(`AI processing failed. Please try again.`);
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      output?: Record<string, unknown>;
    };

    if (pollData.status === "completed") {
      const output = pollData.output;
      if (!output) throw new Error("AI processing completed but returned no result.");
      const outputUrl =
        (output.image as string) ||
        (output.url as string) ||
        (Object.values(output)[0] as string);
      if (!outputUrl) throw new Error("AI processing completed but returned no result.");
      return outputUrl;
    }

    if (pollData.status === "failed") {
      throw new Error("AI processing failed. Please try again.");
    }

    console.log(`[SJPT-AI] processing... attempt ${attempt + 1}: ${pollData.status}`);
  }

  throw new Error("AI processing timed out. Please try again with a smaller image.");
}
