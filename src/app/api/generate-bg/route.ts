import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

type GeminiPart = { inlineData?: { mimeType: string; data: string }; text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

async function generateWithGemini(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured - check environment variables");
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  try {
    const enhancedPrompt = `Professional background image. ${prompt}. High quality, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Gemini API error:", res.status, errorData);
      return null;
    }

    const data = (await res.json()) as GeminiResponse;
    if (data.error) {
      console.error("Gemini error:", data.error.message);
      return null;
    }

    const parts = data.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData?.data) {
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
        }
      }
    }

    console.error("No image output from Gemini");
    return null;
  } catch (e) {
    console.error("Gemini generation error:", e);
    return null;
  }
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
      return NextResponse.json({ error: "Gemini image generation failed. Try again in a moment." }, { status: 500 });
    }

    return withCredits({ data: result.data, mimeType: result.mimeType }, session);
  } catch (e: any) {
    console.error("Background generation error:", e);
    const errorMsg = e?.message || "Unknown error";
    if (errorMsg.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in environment" }, { status: 500 });
    }
    return NextResponse.json({ error: `Generation error: ${errorMsg.substring(0, 50)}` }, { status: 500 });
  }
}
