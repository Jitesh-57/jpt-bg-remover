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

async function upscaleWithRealESRGAN(base64: string, mimeType: string): Promise<string | null> {
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;
  try {
    const res = await fetch(
      "https://router.huggingface.co/hf-inference/models/jasperai/Flux.1-dev-Controlnet-Upscaler",
      { method: "POST", headers, body: Buffer.from(base64, "base64"), signal: AbortSignal.timeout(30000) }
    );
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch { return null; }
}

async function upscaleWithGemini(base64: string, mimeType: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Upscale and enhance this image to higher resolution. Sharpen fine details, reduce noise, improve clarity, and enhance overall quality. " +
    "Keep the original content, composition, colors, and subject matter exactly the same. Photorealistic high-quality result.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  const data = (await res.json()) as GeminiResponse;
  if (data.error) { console.error("Gemini upscale error:", data.error.message); return null; }

  const parts = data.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
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

  const hfResult = await upscaleWithRealESRGAN(base64, mimeType);
  if (hfResult) return withCredits({ dataUrl: hfResult }, session!);

  const geminiResult = await upscaleWithGemini(base64, mimeType);
  if (geminiResult) return withCredits({ dataUrl: geminiResult }, session!);

  return NextResponse.json({ error: "Upscale failed" }, { status: 500 });
}
