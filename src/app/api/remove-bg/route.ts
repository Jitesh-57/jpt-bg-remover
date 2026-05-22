import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const HF_TOKEN = process.env.HF_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string; code?: number };
};

async function removeWithHuggingFace(
  imageData: string,
  mimeType: string
): Promise<{ data: string; mimeType: string } | null> {
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(
    "https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0",
    { method: "POST", headers, body: Buffer.from(imageData, "base64") }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("HF RMBG error:", res.status, text.slice(0, 200));
    return null;
  }

  const resultBuffer = await res.arrayBuffer();
  return {
    data: Buffer.from(resultBuffer).toString("base64"),
    mimeType: "image/png",
  };
}

async function removeWithGemini(
  imageData: string,
  mimeType: string
): Promise<{ data: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt =
    "Remove the background from this image completely. " +
    "Isolate the main subject (person, product, or object) with clean, sharp edges. " +
    "Replace the background with pure white (#FFFFFF). " +
    "Do not alter the subject in any way. High quality, professional result.";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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
    }
  );

  const data = (await res.json()) as GeminiResponse;
  if (data.error) {
    console.error("Gemini remove-bg error:", data.error.message);
    return null;
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if ("inlineData" in part && part.inlineData?.data) {
      return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { imageData, mimeType } = (await req.json()) as {
      imageData: string;
      mimeType: string;
    };

    if (!imageData)
      return NextResponse.json({ error: "imageData required" }, { status: 400 });

    // Primary: Hugging Face RMBG-2.0 (free, purpose-built for background removal)
    const hfResult = await removeWithHuggingFace(imageData, mimeType);
    if (hfResult) return NextResponse.json(hfResult);

    // Fallback: Gemini (for users with paid quota)
    const geminiResult = await removeWithGemini(imageData, mimeType);
    if (geminiResult) return NextResponse.json(geminiResult);

    return NextResponse.json(
      {
        error:
          "Background removal failed. Add a free HF_TOKEN from huggingface.co to fix this.",
      },
      { status: 500 }
    );
  } catch (err) {
    console.error("remove-bg route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
