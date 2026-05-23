import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

const NO_SHADOW_INSTRUCTIONS =
  "Do not add any new shadows, drop shadows, cast shadows, contact shadows, glow, vignette, halo, dark edge, or artificial grounding effect. " +
  "Do not darken the background around the person. Blend the person cleanly with natural edges only.";

function parseDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function geminiEdit(parts: GeminiPart[]): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  const result = (await res.json()) as GeminiResponse;
  if (result.error) {
    console.error("Gemini edit-bg error:", result.error.message);
    return null;
  }

  const resParts = result.candidates?.[0]?.content?.parts;
  if (!resParts) return null;
  for (const part of resParts) {
    if ("inlineData" in part && part.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Server not configured: GEMINI_API_KEY missing" }, { status: 500 });
  }

  const { imageUrl, bgType, bgColor, bgImageUrl, bgLabel, customPrompt } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  const parsed = parseDataUrl(imageUrl);
  if (!parsed) return NextResponse.json({ error: "imageUrl must be a data URL" }, { status: 400 });

  let prompt: string;
  let apiParts: GeminiPart[];

  if (bgType === "color") {
    const colorName = bgLabel || bgColor || "white";
    prompt =
      `Take the person from this photo and place them in front of a solid ${colorName} color background. ` +
      `Keep the person's face, hair, clothing, and pose exactly the same. ` +
      `${NO_SHADOW_INSTRUCTIONS} Clean, professional corporate headshot. Sharp and polished result.`;
    apiParts = [{ inlineData: { mimeType: parsed.mimeType, data: parsed.data } }, { text: prompt }];
  } else if (bgType === "image") {
    if (!bgImageUrl) return NextResponse.json({ error: "bgImageUrl required" }, { status: 400 });
    const parsedBg = parseDataUrl(bgImageUrl);
    if (!parsedBg) return NextResponse.json({ error: "bgImageUrl must be a data URL" }, { status: 400 });
    prompt =
      `Use the second image as a locked background plate. Do not alter, regenerate, blur, or replace the background image. ` +
      `Only extract the person from the first image and composite them onto the locked background. ` +
      `Keep the person's face, hair, clothing, and pose exactly the same. ` +
      `${NO_SHADOW_INSTRUCTIONS} Professional headshot portrait quality.`;
    apiParts = [
      { inlineData: { mimeType: parsed.mimeType, data: parsed.data } },
      { inlineData: { mimeType: parsedBg.mimeType, data: parsedBg.data } },
      { text: prompt },
    ];
  } else if (bgType === "prompt") {
    if (!customPrompt) return NextResponse.json({ error: "customPrompt required" }, { status: 400 });
    prompt =
      `${customPrompt}. ` +
      `Keep the person's face, hair, clothing, and pose exactly the same. ` +
      `${NO_SHADOW_INSTRUCTIONS}`;
    apiParts = [{ inlineData: { mimeType: parsed.mimeType, data: parsed.data } }, { text: prompt }];
  } else {
    return NextResponse.json({ error: "bgType must be 'color', 'image', or 'prompt'" }, { status: 400 });
  }

  const dataUrl = await geminiEdit(apiParts);
  if (!dataUrl) return NextResponse.json({ error: "Edit failed — no output from Gemini" }, { status: 500 });

  return NextResponse.json({ url: dataUrl });
}
