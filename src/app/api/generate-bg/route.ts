import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";

async function generateWithHuggingFace(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const enhancedPrompt = `Professional background image. ${prompt}. High quality, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks.`;

    // Using Hugging Face's free inference API with Stable Diffusion XL
    const res = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: { Accept: "image/png" },
        method: "POST",
        body: JSON.stringify({ inputs: enhancedPrompt }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Hugging Face API error:", res.status, errorText);
      return null;
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { data: base64, mimeType: "image/png" };
  } catch (e) {
    console.error("Hugging Face generation error:", e);
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
    const result = await generateWithHuggingFace(prompt);
    if (!result) {
      return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
    }

    return withCredits({ data: result.data, mimeType: result.mimeType }, session);
  } catch (e) {
    console.error("Background generation error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
