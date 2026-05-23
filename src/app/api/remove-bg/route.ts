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

// Primary: Gemini 2.5 Flash Image with explicit transparency request
async function removeWithGemini(imageData: string, mimeType: string): Promise<{ data: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "You are a professional background removal tool. Remove the background from this image completely. " +
    "Output ONLY the main subject (person, product, or object) on a fully transparent background. " +
    "The output must be a PNG with proper alpha channel — where the background was, use full transparency (alpha=0). " +
    "Keep all fine details: hair, fur, soft edges, semi-transparent areas. " +
    "Do not add any color to the background — use pure transparency. Professional quality result.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: imageData } }, { text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  const data = (await res.json()) as GeminiResponse;
  if (data.error) { console.error("Gemini remove-bg:", data.error.message); return null; }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if ("inlineData" in part && part.inlineData?.data) {
      return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
    }
  }
  return null;
}

// Fallback: HuggingFace RMBG-2.0 (returns true transparent PNG)
async function removeWithHF(imageData: string, mimeType: string): Promise<{ data: string; mimeType: string } | null> {
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  // Try direct endpoint first, then router
  const endpoints = [
    "https://api-inference.huggingface.co/models/briaai/RMBG-2.0",
    "https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: Buffer.from(imageData, "base64"),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      return { data: Buffer.from(buf).toString("base64"), mimeType: "image/png" };
    } catch { continue; }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  try {
    const { imageData, mimeType } = (await req.json()) as { imageData: string; mimeType: string };
    if (!imageData) return NextResponse.json({ error: "imageData required" }, { status: 400 });

    // Try Gemini first (best quality, handles transparency)
    const geminiResult = await removeWithGemini(imageData, mimeType || "image/jpeg");
    if (geminiResult) return withCredits(geminiResult, session!);

    // Fallback: HF RMBG-2.0 (reliable transparent PNG)
    const hfResult = await removeWithHF(imageData, mimeType || "image/jpeg");
    if (hfResult) return withCredits(hfResult, session!);

    return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
  } catch (err) {
    console.error("remove-bg error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
