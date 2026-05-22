import { NextResponse } from "next/server";

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

  const res = await fetch(
    "https://router.huggingface.co/hf-inference/models/jasperai/Flux.1-dev-Controlnet-Upscaler",
    { method: "POST", headers, body: Buffer.from(base64, "base64") }
  );
  if (!res.ok) return null;

  const buf = await res.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
}

async function upscaleWithGemini(base64: string, mimeType: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Upscale and enhance this image to higher resolution. Sharpen fine details, reduce noise, improve clarity, and enhance overall quality. " +
    "Keep the original content, composition, colors, and subject matter exactly the same. Photorealistic high-quality result.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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

export async function POST(req: Request) {
  const { dataUrl } = (await req.json()) as { dataUrl: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
  const [, mimeType, base64] = match;

  // Try HF Real-ESRGAN first, fall back to Gemini enhancement
  const hfResult = await upscaleWithRealESRGAN(base64, mimeType);
  if (hfResult) return NextResponse.json({ dataUrl: hfResult });

  const geminiResult = await upscaleWithGemini(base64, mimeType);
  if (geminiResult) return NextResponse.json({ dataUrl: geminiResult });

  return NextResponse.json({ error: "Upscale failed" }, { status: 500 });
}
