import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";

async function generateWithNanoBanana(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  const apiKey = process.env.NANOBANNA_API_KEY;
  if (!apiKey) {
    console.error("NANOBANNA_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch("https://api.nanobanna.com/api/v1/imagine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: `Professional background image. ${prompt}. High quality, 1200x1200 pixels, suitable as a background behind a person or product. Professional lighting, clean composition.`,
        model: "nanobanna-pro",
        num_inference_steps: 20,
        guidance_scale: 7.5,
        height: 1200,
        width: 1200,
      }),
    });

    console.log("Nano Banana response status:", res.status);

    if (res.status === 429 || res.status === 503) {
      console.warn("Nano Banana API rate limited or temporarily unavailable");
      return null;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Nano Banana API error:", res.status, errData);
      return null;
    }

    const d = (await res.json()) as { images?: string[]; image?: string };
    const imageData = d.images?.[0] || d.image;

    if (imageData) {
      return { data: imageData, mimeType: "image/png" };
    }

    console.error("No image data in response:", d);
  } catch (e) {
    console.error("Nano Banana generation error:", e);
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
    const result = await generateWithNanoBanana(prompt);
    if (!result) {
      return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
    }

    return withCredits({ data: result.data, mimeType: result.mimeType }, session);
  } catch (e) {
    console.error("Background generation error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
