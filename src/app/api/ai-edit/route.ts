import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

// Use Gemini text model to understand image context and enhance the user's prompt
async function enhancePrompt(userPrompt: string, imageData: string, mimeType: string): Promise<string> {
  if (!GEMINI_API_KEY) return userPrompt;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: imageData } },
              { text: `You are an expert AI image editing prompt engineer. Analyze this image carefully, then enhance the following editing instruction to be more precise, specific and effective for an AI image model.\n\nUser instruction: "${userPrompt}"\n\nEnhanced version (return ONLY the enhanced prompt, nothing else, max 100 words):` },
            ],
          }],
          generationConfig: { responseModalities: ["TEXT"] },
        }),
      }
    );
    if (!res.ok) return userPrompt;
    const d = (await res.json()) as GeminiResponse;
    const text = d.candidates?.[0]?.content?.parts?.find(p => "text" in p) as { text: string } | undefined;
    return text?.text?.trim() || userPrompt;
  } catch { return userPrompt; }
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  if (!GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const { dataUrl, prompt } = (await req.json()) as { dataUrl: string; prompt: string };
  if (!dataUrl || !prompt) return NextResponse.json({ error: "dataUrl and prompt required" }, { status: 400 });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
  const [, mimeType, base64] = match;

  // Enhance the prompt with Gemini context analysis
  const enhancedPrompt = await enhancePrompt(prompt, base64, mimeType);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: enhancedPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  const data = (await res.json()) as GeminiResponse;
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

  const parts = data.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        return withCredits(
          { dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
          session!
        );
      }
    }
  }
  return NextResponse.json({ error: "No image output from AI" }, { status: 500 });
}
