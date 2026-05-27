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

// Best image models in quality order — tested working
const MODELS = [
  { id: "gemini-3.1-flash-image-preview", timeout: 40000 }, // Nano Banana 2 — newest, best
  { id: "gemini-3-pro-image-preview",     timeout: 12000 }, // Nano Banana Pro
  { id: "gemini-2.5-flash-image",         timeout: 5000  }, // Nano Banana — baseline
];

const PROMPT =
  "Upscale this image to 2-3x resolution while maintaining quality. " +
  "Enhance details, sharpen fine features, reduce noise, and improve overall clarity. " +
  "Keep the original content, composition, colors, and subject matter exactly the same. " +
  "Photorealistic, high-quality result.";

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  const { dataUrl } = (await req.json()) as { dataUrl: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  const [, mimeType, base64] = match;

  for (const { id, timeout } of MODELS) {
    try {
      console.log(`[upscale] ${id}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: PROMPT }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
          signal: AbortSignal.timeout(timeout),
        }
      );
      if (!res.ok) { console.log(`[upscale] ${id} HTTP ${res.status}`); continue; }
      const json = (await res.json()) as GeminiResponse;
      if (json.error) { console.log(`[upscale] ${id} err:`, json.error.message); continue; }
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        if ("inlineData" in p && p.inlineData?.data) {
          console.log(`[upscale] ✓ ${id}`);
          return withCredits({ dataUrl: `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}` }, session!);
        }
      }
    } catch (e) { console.log(`[upscale] ${id}:`, (e as Error).message); }
  }

  return NextResponse.json({ error: "Upscale failed. Please try again." }, { status: 500 });
}
