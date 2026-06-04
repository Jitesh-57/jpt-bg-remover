import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";

export const runtime  = "nodejs";
export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

const MODELS = [
  { id: "gemini-3.1-flash-image-preview", timeout: 50000 }, // image-gen — primary
  { id: "gemini-2.5-flash-image",         timeout: 50000 }, // image-gen — fallback
];

function buildPrompt(scale: "2x" | "4x"): string {
  if (scale === "4x") {
    return (
      "You are a professional AI image upscaler. Produce an ultra-high-resolution 4x enhanced version of this image. " +
      "Dramatically increase sharpness: make individual hair strands, fabric weaves, skin pores, and fine textures crystal-clear. " +
      "Remove ALL noise, blur, compression artifacts, and pixelation completely. " +
      "Make colors vivid and contrast punchy — like a professional studio DSLR vs. a phone camera. " +
      "Enhance micro-details to the maximum degree possible. " +
      "Preserve exact subject, pose, composition, and overall colors. No content changes — pure 4x quality enhancement. " +
      "Output: maximum sharpness, maximum detail, ultra-photorealistic result."
    );
  }
  return (
    "You are an AI image upscaler. Produce a significantly enhanced, high-resolution 2x version of this image. " +
    "Increase sharpness and fine detail — hair, fabric textures, edges, skin. " +
    "Remove noise, blur, and compression artifacts. Make colors more vivid and contrast more defined. " +
    "The result must look visibly better than the input. " +
    "Preserve exact subject, pose, composition, and colors. No content changes — only quality enhancement. " +
    "Output: sharp, photorealistic, 2x quality improvement."
  );
}

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, scale = "2x" } = (await req.json()) as { dataUrl: string; scale?: "2x" | "4x" };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  const [, mimeType, base64] = match;

  const PROMPT = buildPrompt(scale === "4x" ? "4x" : "2x");

  for (const { id, timeout } of MODELS) {
    try {
      console.log(`[upscale:${scale}] ${id}`);
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
          console.log(`[upscale:${scale}] ✓ ${id}`);
          return await withCredits(
            { dataUrl: `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}` },
            session!
          );
        }
      }
    } catch (e) { console.log(`[upscale] ${id}:`, (e as Error).message); }
  }

  return NextResponse.json({ error: "Upscale failed. Please try again." }, { status: 500 });
}
