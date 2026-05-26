import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

// ── Strategy 1: Gemini image editing — places subject on pure magenta (#FF00FF)
// Client will remove the magenta via chroma-key canvas pass (transparent PNG).
// Magenta rarely appears in natural photos so false-positives are minimal.
async function removeWithGemini(
  imageData: string,
  mimeType: string
): Promise<{ data: string; mimeType: string; chromaKey: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Edit this image: completely remove the background and replace it with pure solid magenta " +
    "(hex #FF00FF, RGB 255,0,255). The background must be ONLY that exact solid color — " +
    "no gradients, no textures, no variations. Keep the foreground subject (person/product/object) " +
    "exactly as-is with full detail. The magenta background must be pixel-perfect #FF00FF.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: imageData } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(55000),
      }
    );

    const json = (await res.json()) as GeminiResponse;
    if (json.error) {
      console.log("[remove-bg/gemini] error:", json.error.message);
      return null;
    }

    const parts = json.candidates?.[0]?.content?.parts;
    if (!parts) { console.log("[remove-bg/gemini] no parts"); return null; }

    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        console.log("[remove-bg/gemini] ✓ got image, mimeType:", part.inlineData.mimeType);
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
          chromaKey: "FF00FF", // client will remove this color → transparent
        };
      }
    }
  } catch (e) {
    console.log("[remove-bg/gemini] exception:", (e as Error).message);
  }
  return null;
}

// ── Strategy 2: HuggingFace RMBG-2.0 / BiRefNet — returns true transparent PNG
async function removeWithHF(
  imageData: string
): Promise<{ data: string; mimeType: string } | null> {
  const imageBuffer = Buffer.from(imageData, "base64");
  const headers: Record<string, string> = { "Content-Type": "application/octet-stream" };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const endpoints = [
    "https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0",
    "https://api-inference.huggingface.co/models/briaai/RMBG-2.0",
    "https://router.huggingface.co/hf-inference/models/ZhengPeng7/BiRefNet",
    "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: imageBuffer,
        signal: AbortSignal.timeout(25000), // short — Gemini already tried first
      });
      if (!res.ok) {
        console.log(`[remove-bg/hf] ${res.status} from ${url}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 500) continue;
      console.log(`[remove-bg/hf] ✓ ${url} — ${buf.byteLength}B`);
      return { data: Buffer.from(buf).toString("base64"), mimeType: "image/png" };
    } catch (e) {
      console.log(`[remove-bg/hf] error at ${url}:`, (e as Error).message);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  try {
    const { imageData, mimeType } = (await req.json()) as {
      imageData: string;
      mimeType: string;
    };
    if (!imageData) {
      return NextResponse.json({ error: "imageData required" }, { status: 400 });
    }

    // 1️⃣ Gemini (primary) — chroma-key result, client removes magenta → transparent
    const geminiResult = await removeWithGemini(imageData, mimeType || "image/jpeg");
    if (geminiResult) return withCredits(geminiResult, session!);

    // 2️⃣ HuggingFace (fallback) — true transparent PNG
    const hfResult = await removeWithHF(imageData);
    if (hfResult) return withCredits(hfResult, session!);

    return NextResponse.json(
      { error: "Background removal failed. Please try again." },
      { status: 500 }
    );
  } catch (err) {
    console.error("[remove-bg] unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
