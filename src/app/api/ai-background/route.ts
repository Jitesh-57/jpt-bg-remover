import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BG_SUFFIX =
  "Landscape orientation. Beautiful, photorealistic, high-quality. " +
  "Suitable as a portrait or product photography background. " +
  "No text, no watermarks, no people, no logos.";

async function enhancePromptWithGPT(prompt: string): Promise<string> {
  if (!GITHUB_TOKEN) return prompt;
  try {
    const res = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a professional photographer and prompt engineer. Enhance the given background description for high-quality photorealistic image generation. Add lighting, atmosphere, depth, and professional photography details. Return only the enhanced prompt, nothing else. Keep it under 150 words.",
            },
            {
              role: "user",
              content: `Enhance this background prompt for image generation: "${prompt}"`,
            },
          ],
          max_tokens: 200,
        }),
      }
    );
    if (!res.ok) return prompt;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || prompt;
  } catch {
    return prompt;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // Use GPT-4o (GitHub Models) to enhance the prompt
    const enhancedPrompt = await enhancePromptWithGPT(prompt.trim());
    const fullPrompt = `${enhancedPrompt}. ${BG_SUFFIX}`;

    // Imagen 4 for image generation
    const imagenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "BLOCK_ONLY_HIGH",
            personGeneration: "DONT_ALLOW",
          },
        }),
      }
    );

    if (imagenRes.ok) {
      const imagenData = (await imagenRes.json()) as {
        predictions?: { bytesBase64Encoded?: string; mimeType?: string }[];
      };
      const pred = imagenData.predictions?.[0];
      if (pred?.bytesBase64Encoded) {
        return NextResponse.json({
          data: pred.bytesBase64Encoded,
          mimeType: pred.mimeType || "image/png",
        });
      }
    }

    // Fallback: Gemini 2.5-flash-image
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini fallback error:", errText);
      return NextResponse.json(
        { error: "Image generation failed. Try a different prompt." },
        { status: 500 }
      );
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: {
        content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] };
      }[];
    };

    const inlineData = geminiData.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    )?.inlineData;

    if (!inlineData) {
      return NextResponse.json(
        { error: "No image in response. Try a different prompt." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: inlineData.data, mimeType: inlineData.mimeType });
  } catch (err) {
    console.error("ai-background route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
