// Gemini image generation via direct REST (v1beta supports responseModalities)
const API_KEY = () => process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-2.0-flash-preview-image-generation";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

async function callGemini(imagePart: object, text: string): Promise<string> {
  const res = await fetch(`${ENDPOINT}?key=${API_KEY()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [imagePart, { text }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const json = await res.json() as {
    candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[]
  };

  const parts = json.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Gemini did not return an image. Check your API key and billing.");
}

export async function geminiEditImage(dataUrl: string, prompt: string): Promise<string> {
  return callGemini(
    dataUrlToPart(dataUrl),
    `You are a professional photo editor. Edit this image: ${prompt}. Return only the edited image.`
  );
}

export async function geminiGenerateBg(dataUrl: string, prompt: string): Promise<string> {
  return callGemini(
    dataUrlToPart(dataUrl),
    `Replace the background of this image with: ${prompt}. Keep the subject exactly as-is — same pose, clothing, appearance. Only change the background. Return only the edited image.`
  );
}

export async function geminiRemoveBg(dataUrl: string): Promise<string> {
  return callGemini(
    dataUrlToPart(dataUrl),
    "Remove the background from this image completely. Make it transparent. Keep the subject with clean edges. Return only the resulting PNG image."
  );
}

export async function geminiUpscale(dataUrl: string, scale: "2x" | "4x"): Promise<string> {
  return callGemini(
    dataUrlToPart(dataUrl),
    `Enhance this image to ${scale} resolution. Increase sharpness, detail, and clarity. Improve hair strands, skin texture, fabric detail. Remove noise and artifacts. Make colors vivid with punchy contrast. Return only the enhanced image.`
  );
}
