import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

// Confirmed working image generation models (tested)
const BG_MODELS = [
  { name: "gemini-2.5-flash-image", timeout: 45000 },    // Nano Banana ✅
  { name: "gemini-3-pro-image-preview", timeout: 12000 }, // Nano Banana Pro ✅
];

type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function generateBackground(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) return null;

  const enhancedPrompt = `Professional background image for photo editing. ${prompt}. High quality, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks, no people.`;

  for (const { name, timeout } of BG_MODELS) {
    try {
      console.log(`[generate-bg] trying: ${name}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: enhancedPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
          signal: AbortSignal.timeout(timeout),
        }
      );

      if (!res.ok) {
        console.log(`[generate-bg] ${name} HTTP ${res.status}`);
        continue;
      }

      const json = (await res.json()) as GeminiResponse;
      if (json.error) {
        console.log(`[generate-bg] ${name} error:`, json.error.message);
        continue;
      }

      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          console.log(`[generate-bg] ✓ ${name} succeeded`);
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
        }
      }
      console.log(`[generate-bg] ${name} — no image`);
    } catch (e) {
      console.log(`[generate-bg] ${name} exception:`, (e as Error).message);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error: authError } = checkAuth(req);
  if (authError) return authError;

  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const result = await generateBackground(prompt);
  if (!result) return NextResponse.json({ error: "Background generation failed. Please try again." }, { status: 500 });

  return withCredits({ data: result.data, mimeType: result.mimeType }, session);
}
