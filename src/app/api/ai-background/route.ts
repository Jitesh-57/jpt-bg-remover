import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BG_SUFFIX =
  "Landscape orientation. Beautiful, photorealistic, high-quality. " +
  "Suitable as a portrait or product photography background. " +
  "No text, no watermarks, no people, no logos.";

// Enhance prompt using Gemini text (with GPT-4o fallback via GitHub Models)
async function enhancePrompt(prompt: string): Promise<string> {
  // Try Gemini text first
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `You are a professional photographer and prompt engineer. Enhance this background description for high-quality photorealistic image generation. Add specific lighting, atmosphere, depth, and professional photography details. Return ONLY the enhanced prompt, nothing else. Max 150 words.\n\nBackground: "${prompt}"` }],
            }],
            generationConfig: { responseModalities: ["TEXT"] },
          }),
        }
      );
      if (res.ok) {
        const d = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = d.candidates?.[0]?.content?.parts?.find(p => p.text)?.text?.trim();
        if (text) return text;
      }
    } catch {}
  }

  // Fallback: GPT-4o via GitHub Models
  if (GITHUB_TOKEN) {
    try {
      const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GITHUB_TOKEN}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a professional photographer and prompt engineer. Enhance the given background description for high-quality photorealistic image generation. Add lighting, atmosphere, depth, and professional photography details. Return only the enhanced prompt, nothing else. Keep it under 150 words." },
            { role: "user", content: `Enhance this background prompt: "${prompt}"` },
          ],
          max_tokens: 200,
        }),
      });
      if (res.ok) {
        const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return d.choices?.[0]?.message?.content?.trim() || prompt;
      }
    } catch {}
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  const { session, error } = checkAuth(req);
  if (error) return error;

  try {
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const enhancedPrompt = await enhancePrompt(prompt.trim());
    const fullPrompt = `${enhancedPrompt}. ${BG_SUFFIX}`;

    // Try Imagen 4 first (best quality)
    const imagenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1", safetyFilterLevel: "BLOCK_ONLY_HIGH", personGeneration: "DONT_ALLOW" },
        }),
      }
    );

    if (imagenRes.ok) {
      const imagenData = (await imagenRes.json()) as { predictions?: { bytesBase64Encoded?: string; mimeType?: string }[] };
      const pred = imagenData.predictions?.[0];
      if (pred?.bytesBase64Encoded) {
        return withCredits({ data: pred.bytesBase64Encoded, mimeType: pred.mimeType || "image/png" }, session!);
      }
    }

    // Fallback: Gemini 2.5 flash image
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a photorealistic background image: ${fullPrompt}` }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "Image generation failed. Try a different prompt." }, { status: 500 });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
    };

    const inlineData = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
    if (!inlineData) return NextResponse.json({ error: "No image in response. Try a different prompt." }, { status: 500 });

    return withCredits({ data: inlineData.data, mimeType: inlineData.mimeType }, session!);
  } catch (err) {
    console.error("ai-background error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
