import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: GeminiPart[];
    };
  }[];
  error?: { message: string };
};

function extractImageFromResponse(data: GeminiResponse): { data: string; mimeType: string } | null {
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if ("inlineData" in part && part.inlineData?.data) {
      return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { imageData, mimeType } = (await req.json()) as {
      imageData: string;
      mimeType: string;
    };

    if (!imageData) return NextResponse.json({ error: "imageData required" }, { status: 400 });

    const prompt =
      "Remove the background from this image completely. " +
      "Isolate the main subject (person, product, or object) with clean, sharp edges. " +
      "Replace the background with pure white (#FFFFFF). " +
      "Do not alter the subject in any way. High quality, professional result.";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: imageData } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );

    const data = (await res.json()) as GeminiResponse;

    if (data.error) {
      console.error("Gemini remove-bg error:", data.error.message);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const image = extractImageFromResponse(data);
    if (!image) {
      console.error("No image in Gemini response:", JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: "Gemini did not return an image. Try a clearer subject photo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: image.data, mimeType: image.mimeType });
  } catch (err) {
    console.error("remove-bg route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
