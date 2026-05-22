import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const BG_SUFFIX =
  "Landscape orientation. Beautiful, photorealistic, high-quality. " +
  "Suitable as a portrait or product photography background. " +
  "No text, no watermarks, no people, no logos.";

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const fullPrompt = `${prompt.trim()}. ${BG_SUFFIX}`;

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
