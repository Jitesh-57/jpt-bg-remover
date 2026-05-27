import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

// Support both env var names
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

// Models to try in order for text-to-image generation
const IMAGE_GEN_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-preview-04-17",
];

type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string; code?: number };
};

async function generateBackground(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) {
    console.error("[generate-bg] No API key found");
    return null;
  }

  const enhancedPrompt = `Professional background image for photo editing. ${prompt}. High quality, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks, no people, 1024x1024 pixels.`;

  for (const model of IMAGE_GEN_MODELS) {
    try {
      console.log(`[generate-bg] Trying model: ${model}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: enhancedPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
          signal: AbortSignal.timeout(50000),
        }
      );

      const json = (await res.json()) as GeminiResponse;

      if (json.error) {
        console.log(`[generate-bg] ${model} error: ${json.error.message}`);
        continue;
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[generate-bg] ✓ ${model} succeeded`);
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
        }
      }
      console.log(`[generate-bg] ${model} returned no image`);
    } catch (e) {
      console.log(`[generate-bg] ${model} exception:`, (e as Error).message);
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

  const result = await generateBackground(prompt);
  if (!result) {
    return NextResponse.json(
      { error: "Background generation failed. Please try a different prompt." },
      { status: 500 }
    );
  }

  return withCredits({ data: result.data, mimeType: result.mimeType }, session);
}
