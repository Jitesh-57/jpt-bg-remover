import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";

const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

async function generateWithGemini(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          prompt: `Generate a professional background image. ${prompt}. High quality, 1200x1200 pixels, suitable as a background behind a person or product. Professional lighting, clean composition.`,
          generationConfig: { outputMimeType: "image/png" },
        }),
      });

      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;

      const d = (await res.json()) as { images?: Array<{ imageBytes: string }> };
      if (d.images?.[0]?.imageBytes) {
        return { data: d.images[0].imageBytes, mimeType: "image/png" };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = checkAuth(req);
  if (authError) return authError;

  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  try {
    const result = await generateWithGemini(prompt);
    if (!result) {
      return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
    }

    return withCredits({ data: result.data, mimeType: result.mimeType }, session);
  } catch (e) {
    console.error("Background generation error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
