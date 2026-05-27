import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

// Only models confirmed to support IMAGE output modality
const UPSCALE_MODELS = [
  "gemini-2.5-flash-image",   // Same as AI Edit — confirmed working
  "gemini-2.0-flash-exp",     // Reliable fallback
];

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function upscaleWithGemini(imageData: string, mimeType: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error("[upscale] No GEMINI_API_KEY found");
    return null;
  }

  const prompt = `Enhance and upscale this image to maximum quality.

Requirements:
- Make the image sharper, clearer, and higher resolution
- Enhance fine details: skin texture, hair strands, fabric, edges
- Remove blur, noise, grain, and compression artifacts
- Sharpen facial features if present: eyes, eyelashes, lips
- Keep exact same composition, colors, lighting, and subject
- Do NOT change anything creative — only improve quality and sharpness
- Output as a high-quality, sharp, detailed image`;

  for (const model of UPSCALE_MODELS) {
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
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            },
          }),
          signal: AbortSignal.timeout(25000), // 25s per attempt — 2 attempts fit in Vercel's 60s limit
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.log(`[upscale] ${model} HTTP ${res.status}:`, err.substring(0, 200));
        continue;
      }

      const json = (await res.json()) as GeminiResponse;

      if (json.error) {
        console.log(`[upscale] ${model} API error:`, json.error.message);
        continue;
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData?.data) {
          console.log(`[upscale] ✓ ${model} succeeded`);
          return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
      console.log(`[upscale] ${model} — no image in response`);
    } catch (e) {
      console.log(`[upscale] ${model} exception:`, (e as Error).message);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  const { dataUrl } = (await req.json()) as { dataUrl: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  // Validate format
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  const [, mimeType, base64] = match;

  const result = await upscaleWithGemini(base64, mimeType);
  if (result) return withCredits({ dataUrl: result }, session!);

  return NextResponse.json({ error: "Upscale failed. Please try again with a smaller image." }, { status: 500 });
}
