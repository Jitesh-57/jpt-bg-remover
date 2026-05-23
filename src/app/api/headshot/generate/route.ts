import { NextResponse } from "next/server";
import { WOMEN_STYLES, MEN_STYLES } from "@/lib/headshot-prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message: string };
};

function parseDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function generateHeadshot(imageData: string, mimeType: string, stylePrompt: string): Promise<string | null> {
  const prompt =
    `Generate a professional AI headshot portrait. ${stylePrompt} ` +
    `Maintain the exact facial features, hair, skin tone, and likeness of the person in the reference photo. ` +
    `Only change the setting, background, outfit, and lighting as described. ` +
    `High quality, photorealistic result. Aspect ratio 3:4 portrait orientation.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: imageData } }, { text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  const result = (await res.json()) as GeminiResponse;
  if (result.error) {
    console.error(`Gemini generate error:`, result.error.message);
    return null;
  }

  const parts = result.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
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

  let imageUrl: string, styleIds: number[], gender: string;
  try {
    ({ imageUrl, styleIds, gender } = (await req.json()) as { imageUrl: string; styleIds: number[]; gender: string });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  if (!Array.isArray(styleIds) || styleIds.length === 0)
    return NextResponse.json({ error: "styleIds required" }, { status: 400 });

  const parsed = parseDataUrl(imageUrl);
  if (!parsed) return NextResponse.json({ error: "imageUrl must be a data URL" }, { status: 400 });

  const styleLibrary = gender === "men" ? MEN_STYLES : WOMEN_STYLES;
  const selectedStyles = styleLibrary.filter((s) => styleIds.includes(s.id));

  const results = await Promise.allSettled(
    selectedStyles.map(async (style) => {
      const dataUrl = await generateHeadshot(parsed.data, parsed.mimeType, style.prompt);
      console.log(`Style ${style.id} (${style.name}): ${dataUrl ? "OK" : "FAILED"}`);
      if (!dataUrl) throw new Error(`Generation failed for style ${style.id} (${style.name})`);
      return { id: style.id, name: style.name, tag: style.tag, url: dataUrl };
    })
  );

  const images = results
    .filter((r): r is PromiseFulfilledResult<{ id: number; name: string; tag: string; url: string }> =>
      r.status === "fulfilled"
    )
    .map((r) => r.value);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason as Error).message);

  console.log(`Generate done: ${images.length} success, ${errors.length} failed`);
  return NextResponse.json({ images, errors });
}
