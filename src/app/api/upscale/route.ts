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

async function upscaleWithGemini(imageData: string, mimeType: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error("[upscale] No API key");
    return null;
  }

  const prompt =
    "Upscale this image to 2-3x resolution while maintaining quality. " +
    "Enhance details, sharpen fine features, reduce noise, and improve overall clarity. " +
    "Keep the original content, composition, colors, and subject matter exactly the same. " +
    "Photorealistic, high-quality result.";

  // Primary: gemini-2.5-flash-image — confirmed working for image editing
  try {
    console.log("[upscale] trying gemini-2.5-flash-image");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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
        signal: AbortSignal.timeout(50000), // 50s — fits in Vercel's 60s limit
      }
    );

    if (res.ok) {
      const json = (await res.json()) as GeminiResponse;
      if (!json.error) {
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if ("inlineData" in part && part.inlineData?.data) {
            console.log("[upscale] ✓ gemini-2.5-flash-image succeeded");
            return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          }
        }
      }
      console.log("[upscale] gemini-2.5-flash-image error:", json.error?.message);
    } else {
      console.log("[upscale] gemini-2.5-flash-image HTTP:", res.status);
    }
  } catch (e) {
    console.log("[upscale] gemini-2.5-flash-image exception:", (e as Error).message);
  }

  // Fallback: gemini-2.0-flash-exp
  try {
    console.log("[upscale] trying gemini-2.0-flash-exp");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
        signal: AbortSignal.timeout(8000), // 8s remaining budget
      }
    );

    if (res.ok) {
      const json = (await res.json()) as GeminiResponse;
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData?.data) {
          console.log("[upscale] ✓ gemini-2.0-flash-exp succeeded");
          return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (e) {
    console.log("[upscale] gemini-2.0-flash-exp exception:", (e as Error).message);
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

  const result = await upscaleWithGemini(base64, mimeType);
  if (result) return withCredits({ dataUrl: result }, session!);

  return NextResponse.json({ error: "Upscale failed. Please try again." }, { status: 500 });
}
