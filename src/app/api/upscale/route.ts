import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function callModel(model: string, imageData: string, mimeType: string, prompt: string, timeoutMs: number): Promise<string | null> {
  try {
    console.log(`[upscale] trying: ${model}`);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: imageData } },
              { text: prompt },
            ],
          }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) { console.log(`[upscale] ${model} HTTP ${res.status}`); return null; }
    const json = (await res.json()) as GeminiResponse;
    if (json.error) { console.log(`[upscale] ${model} error:`, json.error.message); return null; }
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        console.log(`[upscale] ✓ ${model} succeeded`);
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
    console.log(`[upscale] ${model} — no image`);
  } catch (e) {
    console.log(`[upscale] ${model}:`, (e as Error).message);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  const { dataUrl } = (await req.json()) as { dataUrl: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  const [, mimeType, base64] = match;

  const prompt =
    "Upscale this image to 2-3x resolution while maintaining quality. " +
    "Enhance details, sharpen fine features, reduce noise, and improve overall clarity. " +
    "Keep the original content, composition, colors, and subject matter exactly the same. " +
    "Photorealistic, high-quality result.";

  // Nano Banana Pro — best quality upscaling model
  let result = await callModel("gemini-3-pro-image-preview", base64, mimeType, prompt, 40000);

  // Fallback: Nano Banana 2
  if (!result) result = await callModel("gemini-3.1-flash-image-preview", base64, mimeType, prompt, 12000);

  // Fallback: Nano Banana
  if (!result) result = await callModel("gemini-2.5-flash-image", base64, mimeType, prompt, 5000);

  if (result) return withCredits({ dataUrl: result }, session!);
  return NextResponse.json({ error: "Upscale failed. Please try again." }, { status: 500 });
}
