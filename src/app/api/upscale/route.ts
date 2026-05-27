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
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Upscale this image to 2-3x resolution while maintaining quality. " +
    "Enhance details, sharpen fine features, reduce noise, and improve overall clarity. " +
    "Keep the original content, composition, colors, and subject matter exactly the same. " +
    "Photorealistic, high-quality result.";

  // gemini-2.5-flash-image (Nano Banana) — this was giving superb results
  // Give it maximum time: 55s (within Vercel 60s limit)
  try {
    console.log("[upscale] trying gemini-2.5-flash-image with 55s timeout");
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
        signal: AbortSignal.timeout(55000),
      }
    );

    if (!res.ok) {
      console.log(`[upscale] HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as GeminiResponse;
    if (json.error) {
      console.log("[upscale] error:", json.error.message);
      return null;
    }

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        console.log("[upscale] ✓ success");
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
    console.log("[upscale] no image in response");
  } catch (e) {
    console.log("[upscale] exception:", (e as Error).message);
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
