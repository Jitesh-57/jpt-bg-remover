import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";

export const runtime  = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

// gemini-3-pro-image-preview is unresponsive — skip it
const MODELS = [
  { id: "gemini-2.5-flash-preview-image-generation", timeout: 44000 },
  { id: "gemini-2.0-flash-preview-image-generation", timeout: 44000 },
  { id: "gemini-3.1-flash-image-preview",            timeout: 44000 },
  { id: "gemini-2.5-flash-image",                    timeout: 12000 },
];

export async function POST(req: NextRequest) {
  const { session, error: authError } = await checkAuth(req);
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
          return await withCredits(
            { data: p.inlineData.data, mimeType: p.inlineData.mimeType || "image/png" },
            session!
          );
        }
      }
    } catch (e) { console.log(`[generate-bg] ${id}:`, (e as Error).message); }
  }

  return NextResponse.json({ error: "Background generation failed. Please try again." }, { status: 500 });
}
