import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

// Best image models in quality order — tested working
const MODELS = [
  { id: "gemini-3.1-flash-image-preview", timeout: 40000 }, // Nano Banana 2 — newest, best
  { id: "gemini-3-pro-image-preview",     timeout: 12000 }, // Nano Banana Pro
  { id: "gemini-2.5-flash-image",         timeout: 5000  }, // Nano Banana — baseline
];

export async function POST(req: NextRequest) {
  const { session, error: authError } = checkAuth(req);
  if (authError) return authError;

  const { prompt } = (await req.json()) as { prompt: string };
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const enhancedPrompt = `Professional background image for photo editing. ${prompt}. High quality, photorealistic, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks, no people.`;

  for (const { id, timeout } of MODELS) {
    try {
      console.log(`[generate-bg] ${id}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent?key=${GEMINI_API_KEY}`,
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
      if (!res.ok) { console.log(`[generate-bg] ${id} HTTP ${res.status}`); continue; }
      const json = (await res.json()) as GeminiResponse;
      if (json.error) { console.log(`[generate-bg] ${id} err:`, json.error.message); continue; }
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          console.log(`[generate-bg] ✓ ${id}`);
          return withCredits({ data: p.inlineData.data, mimeType: p.inlineData.mimeType || "image/png" }, session);
        }
      }
    } catch (e) { console.log(`[generate-bg] ${id}:`, (e as Error).message); }
  }

  return NextResponse.json({ error: "Background generation failed. Please try again." }, { status: 500 });
}
