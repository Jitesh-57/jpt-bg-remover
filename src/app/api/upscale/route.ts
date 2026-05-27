import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

// Valid models in order of quality — best first
const UPSCALE_MODELS = [
  "gemini-2.5-pro-preview-05-06",       // Highest quality
  "gemini-2.5-flash-image",             // Same as AI Edit — confirmed working
  "gemini-2.0-flash-exp",               // Good fallback
];

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function upscaleWithGemini(imageData: string, mimeType: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `You are a professional photo enhancer and upscaler. Enhance this image to the highest possible quality.

ENHANCEMENT REQUIREMENTS:
- Increase sharpness and clarity — make every pixel crisp and detailed
- Enhance fine textures: skin pores, hair strands, fabric threads, surface details
- Sharpen edges cleanly without halos or artifacts
- Remove any blur, noise, grain, or compression artifacts
- Enhance facial details if present: eyes, eyelashes, skin texture
- Reconstruct and enhance background details with clarity
- Maintain EXACT same composition, colors, lighting, shadows, and subject matter
- Do NOT change poses, expressions, or creative elements
- Output at maximum possible resolution and quality

The result should look like a professional high-resolution photograph.`;

  for (const model of UPSCALE_MODELS) {
    try {
      console.log(`[upscale] trying model: ${model}`);
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
          signal: AbortSignal.timeout(90000),
        }
      );

      const json = (await res.json()) as GeminiResponse;

      if (json.error) {
        console.log(`[upscale] ${model} error: ${json.error.message}`);
        continue;
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData?.data) {
          console.log(`[upscale] ✓ ${model} succeeded`);
          return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
      console.log(`[upscale] ${model} — no image returned`);
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

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
  const [, mimeType, base64] = match;

  const result = await upscaleWithGemini(base64, mimeType);
  if (result) return withCredits({ dataUrl: result }, session!);

  return NextResponse.json({ error: "Upscale failed. Please try again." }, { status: 500 });
}
