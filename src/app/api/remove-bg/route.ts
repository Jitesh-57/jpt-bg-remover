import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

// Confirmed available image-capable models (tested against live API)
const IMAGE_MODELS = [
  "gemini-2.5-flash-preview-image-generation",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
];

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

// ── Strategy 1: Gemini image editing
// Places subject on pure magenta (#FF00FF). Client strips it → transparent PNG.
async function removeWithGemini(
  imageData: string,
  mimeType: string
): Promise<{ data: string; mimeType: string; chromaKey: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Edit this image: remove the background completely and replace it with solid pure magenta " +
    "(exactly #FF00FF, RGB 255,0,255). The background must be ONLY that flat color — " +
    "no gradients, textures, or variations. Preserve the foreground subject perfectly.";

  for (const model of IMAGE_MODELS) {
    try {
      console.log(`[remove-bg] trying Gemini ${model}`);
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
          signal: AbortSignal.timeout(50000),
        }
      );

      const json = (await res.json()) as GeminiResponse;
      if (json.error) {
        console.log(`[remove-bg] ${model} error: ${json.error.message}`);
        continue;
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData?.data) {
          console.log(`[remove-bg] ✓ Gemini ${model} returned image`);
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png", chromaKey: "FF00FF" };
        }
      }
      console.log(`[remove-bg] ${model} no image in response`);
    } catch (e) {
      console.log(`[remove-bg] ${model} exception:`, (e as Error).message);
    }
  }
  return null;
}

// ── Strategy 2: HuggingFace RMBG-2.0 / BiRefNet
// x-wait-for-model: true tells HF to block until model is loaded (handles cold starts)
async function removeWithHF(
  imageData: string
): Promise<{ data: string; mimeType: string } | null> {
  const imageBuffer = Buffer.from(imageData, "base64");
  const headers: Record<string, string> = {
    "Content-Type": "application/octet-stream",
    "x-wait-for-model": "true", // wait for cold-start instead of returning 503
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const endpoints = [
    "https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0",
    "https://api-inference.huggingface.co/models/briaai/RMBG-2.0",
    "https://router.huggingface.co/hf-inference/models/ZhengPeng7/BiRefNet",
    "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet",
  ];

  for (const url of endpoints) {
    try {
      console.log(`[remove-bg] trying HF ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: imageBuffer,
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) { console.log(`[remove-bg] HF ${res.status} at ${url}`); continue; }
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 500) { console.log(`[remove-bg] HF tiny response ${buf.byteLength}B`); continue; }
      console.log(`[remove-bg] ✓ HF ${url} — ${buf.byteLength}B`);
      return { data: Buffer.from(buf).toString("base64"), mimeType: "image/png" };
    } catch (e) {
      console.log(`[remove-bg] HF error at ${url}:`, (e as Error).message);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  try {
    const { imageData, mimeType } = (await req.json()) as { imageData: string; mimeType: string };
    if (!imageData) return NextResponse.json({ error: "imageData required" }, { status: 400 });

    // 1️⃣ Gemini (primary) — chroma-key approach
    const geminiResult = await removeWithGemini(imageData, mimeType || "image/jpeg");
    if (geminiResult) return await withCredits(geminiResult, session!);

    // 2️⃣ HuggingFace (fallback) — true transparent PNG
    const hfResult = await removeWithHF(imageData);
    if (hfResult) return await withCredits(hfResult, session!);

    return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
  } catch (err) {
    console.error("[remove-bg] unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
