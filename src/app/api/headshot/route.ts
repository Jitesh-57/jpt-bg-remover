import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const BG_PROMPTS: Record<string, string> = {
  "light-gray-studio": "a clean, seamless light gray studio backdrop with soft professional portrait lighting and subtle depth",
  "executive-office": "a modern executive office interior, softly blurred warm bookshelves and desk in background, daylight from side window",
  "glass-boardroom": "a sleek glass boardroom, blurred conference table and city view behind glass, cool blue corporate lighting",
  "city-window": "a large floor-to-ceiling office window with softly blurred urban city skyline, bright natural daylight",
  "brand-gradient": "a minimal smooth gradient studio background transitioning from deep navy to soft slate gray, clean and modern",
  "outdoor-campus": "a modern business campus courtyard, softly blurred greenery and clean architecture, bright natural daylight",
};

const ATTIRE_PROMPTS: Record<string, string> = {
  keep: "preserve the person's existing clothing exactly as-is, do not change their outfit",
  "business-formal": "dress the person in professional business-formal attire: a well-fitted dark blazer or suit jacket with a collared shirt or blouse, clean and authoritative",
  "smart-casual": "dress the person in smart-casual business attire: a neat blazer or structured top, polished yet approachable professional look",
};

const CROP_PROMPTS: Record<string, string> = {
  "head-and-shoulders": "frame as a tight head-and-shoulders portrait with the face centered and eyes sharp, classic LinkedIn-style headshot composition",
  "upper-body": "frame from mid-torso upward showing upper body and face, confident business portrait composition",
};

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) return NextResponse.json({ error: "Image required" }, { status: 400 });

    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!supportedTypes.has(file.type))
      return NextResponse.json({ error: "Upload a JPG, PNG, or WEBP photo." }, { status: 400 });

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "Photo must be 10 MB or smaller." }, { status: 400 });

    const backgroundKey = (formData.get("backgroundKey") as string) || "light-gray-studio";
    const customBackground = (formData.get("customBackground") as string)?.trim() || "";
    const attire = (formData.get("attire") as string) || "business-formal";
    const crop = (formData.get("crop") as string) || "head-and-shoulders";
    const aspectRatio = (formData.get("aspectRatio") as string) || "1:1";

    const bgPrompt = customBackground || BG_PROMPTS[backgroundKey] || BG_PROMPTS["light-gray-studio"];
    const attirePrompt = ATTIRE_PROMPTS[attire] || ATTIRE_PROMPTS["business-formal"];
    const cropPrompt = CROP_PROMPTS[crop] || CROP_PROMPTS["head-and-shoulders"];

    const prompt = `Transform this photo into a professional corporate headshot.

CRITICAL: Keep the exact same person — preserve their face, skin tone, facial features, and identity precisely. Do not change who the person looks like.

Background: ${bgPrompt}
Clothing: ${attirePrompt}
Composition: ${cropPrompt}
Aspect ratio: ${aspectRatio}

Technical requirements:
- Professional studio-quality portrait lighting with soft, even illumination
- Sharp, crisp focus on the eyes and face
- Clean seamless transition between subject and background
- Photorealistic, high resolution output
- LinkedIn, corporate directory, and business card quality
- The final result should look like it was taken by a professional corporate photographer`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType: file.type, data: base64 } },
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
      console.error("Gemini headshot error:", data.error.message);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return NextResponse.json({ error: "No response from Gemini" }, { status: 500 });

    for (const part of parts) {
      if ("inlineData" in part && part.inlineData?.data) {
        return NextResponse.json({ data: part.inlineData.data, mimeType: part.inlineData.mimeType });
      }
    }

    return NextResponse.json({ error: "Gemini did not return an image. Try a clearer portrait photo." }, { status: 500 });
  } catch (err) {
    console.error("headshot route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
