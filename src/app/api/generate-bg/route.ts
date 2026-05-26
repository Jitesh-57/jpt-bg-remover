import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";

async function generateWithReplicate(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    console.error("REPLICATE_API_TOKEN not set");
    return null;
  }

  try {
    const enhancedPrompt = `Professional background image. ${prompt}. High quality, suitable as a background behind a person or product. Professional lighting, clean composition, no text, no watermarks.`;

    // Using Stable Diffusion XL on Replicate
    const res = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`,
      },
      body: JSON.stringify({
        model: "stability-ai/sdxl",
        input: {
          prompt: enhancedPrompt,
          image_dimensions: "1024x1024",
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Replicate API error:", res.status, errData);
      return null;
    }

    const prediction = (await res.json()) as {
      id: string;
      status: string;
      output?: string[];
      error?: string;
    };

    if (prediction.error) {
      console.error("Replicate error:", prediction.error);
      return null;
    }

    // Poll for completion if needed
    let currentPrediction = prediction;
    let attempts = 0;
    while (currentPrediction.status === "processing" && attempts < 60) {
      await new Promise(r => setTimeout(r, 1000));
      const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${apiKey}` },
      });

      if (!checkRes.ok) break;
      currentPrediction = (await checkRes.json()) as typeof prediction;
      attempts++;
    }

    if (currentPrediction.status === "succeeded" && currentPrediction.output?.[0]) {
      // Fetch the image and convert to base64
      const imageRes = await fetch(currentPrediction.output[0]);
      const buffer = await imageRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { data: base64, mimeType: "image/png" };
    }

    console.error("Prediction not completed:", currentPrediction.status);
  } catch (e) {
    console.error("Replicate generation error:", e);
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
    const result = await generateWithReplicate(prompt);
    if (!result) {
      return NextResponse.json({ error: "Image generation failed. Please set REPLICATE_API_TOKEN in environment variables." }, { status: 500 });
    }

    return withCredits({ data: result.data, mimeType: result.mimeType }, session);
  } catch (e) {
    console.error("Background generation error:", e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
