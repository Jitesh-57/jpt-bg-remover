const PIXELBIN_API_TOKEN = process.env.PIXELBIN_API_TOKEN;
const PIXELBIN_ACCESS_KEY = process.env.PIXELBIN_ACCESS_KEY;

// PixelBin platform API: base64(token + ":") per their SDK spec
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
  const fileName = `upload-${Date.now()}.${ext}`;

  // ── Step 1: Get presigned upload URL ────────────────────────────────────────
  const presignRes = await fetch(
    `https://api.pixelbin.io/service/platform/assets/v2/presigned?name=${encodeURIComponent(fileName)}&path=jpt-uploads&access=public-read&overwrite=false`,
    {
      method: "GET",
      headers: { Authorization: getAuthHeader() },
    }
  );

  let imageUrl: string;

  if (presignRes.ok) {
    // ── Step 1a: Use presigned flow (PUT to GCS directly) ──────────────────
    const presignData = (await presignRes.json()) as {
      uploadUrl: string;
      headers: Record<string, string>;
      hostedUrl: string;
    };

    const fileBuffer = Buffer.from(base64Content, "base64");
    const putRes = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: {
        ...presignData.headers,
        "Content-Type": mimeType,
      },
      body: fileBuffer,
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      console.error(`[SJPT-AI] GCS PUT failed (${putRes.status}): ${text}`);
      throw new Error(`Image upload failed (${putRes.status}). Please try again.`);
    }

    imageUrl = presignData.hostedUrl;
  } else {
    // ── Step 1b: Fallback — direct multipart upload ────────────────────────
    const text = await presignRes.text();
    console.error(`[SJPT-AI] presign failed (${presignRes.status}): ${text}. Trying direct upload.`);

    const fileBuffer = Buffer.from(base64Content, "base64");
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("path", "jpt-uploads");
    formData.append("access", "public-read");

    const uploadRes = await fetch(
      "https://api.pixelbin.io/service/platform/assets/v2/upload",
      {
        method: "POST",
        headers: { Authorization: getAuthHeader() },
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[SJPT-AI] upload failed (${uploadRes.status}): ${errText}`);
      throw new Error(`Image upload failed (${uploadRes.status}). Please try again.`);
    }

    const uploadData = (await uploadRes.json()) as { url: string };
    imageUrl = uploadData.url;
    if (!imageUrl) throw new Error("Image upload failed. Please try again.");
  }

  // ── Step 2: Create prediction ────────────────────────────────────────────
  const inferenceRes = await fetch(
    "https://api.pixelbin.io/service/platform/predict/v1/inference",
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
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
    console.error(`[SJPT-AI] inference failed (${inferenceRes.status}): ${text}`);
    throw new Error(`AI processing failed (${inferenceRes.status}). Please try again.`);
  }

  const inferenceData = (await inferenceRes.json()) as { predictionId?: string; _id?: string };
  const predictionId = inferenceData.predictionId || inferenceData._id;
  if (!predictionId) throw new Error("AI processing failed. Please try again.");

  // ── Step 3: Poll for result ──────────────────────────────────────────────
  const pollInterval = 2000;
  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

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
