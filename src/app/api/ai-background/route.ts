import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/google-drive";
import { checkEntitlement, CREDIT_COST } from "@/lib/auth";
import { fileCreation, fileFailure } from "@/lib/file-creation";
import { userMessage } from "@/lib/user-message";
import { generateFromText } from "@/lib/ai-image";

export const runtime = "nodejs";
export const maxDuration = 300;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const BG_SUFFIX =
  "Landscape orientation. Beautiful, photorealistic, high-quality. " +
  "Suitable as a portrait or product photography background. " +
  "No text, no watermarks, no people, no logos.";

// Enhance the prompt with GPT-4o via GitHub Models; Google's API is not called directly.
async function enhancePrompt(prompt: string): Promise<string> {
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
  const { session, error } = await checkAuth(req);
  if (error) return error;

  /*
    Check the balance before generating, not after.

    withCredits at the end does refuse a user who cannot pay — they never
    receive the image — but by then the generation has already run and been
    billed to us. Every other AI route preflights; this one was missed, so a
    visitor with no credits could make the account spend money on an image
    they would then be denied. The client turns this 402 into the packs modal.
  */
  const blocked = await checkEntitlement(session!, "ai", "ai-background");
  if (blocked) return blocked;

  let asked = "";
  const started = Date.now();
  try {
    const { prompt } = (await req.json()) as { prompt: string };
    if (!prompt?.trim()) return NextResponse.json({ error: "Describe the background you want, then try again." }, { status: 400 });
    asked = prompt.trim();

    const enhancedPrompt = await enhancePrompt(asked);
    const fullPrompt = `${enhancedPrompt}. ${BG_SUFFIX}`;

    // Made on fal (Nano Banana Pro, 2K) — never through Google's APIs directly.
    const dataUrl = await generateFromText(`Photorealistic background image: ${fullPrompt}`, { aspect_ratio: "1:1", budgetMs: 240_000 });
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error("The AI could not make that background. Try describing it differently.");

    // The user's own words are the prompt on record; the enhanced one is what the model saw.
    const saved = await fileCreation({
      userId: session!.userId, tool: "ai-background", label: asked.slice(0, 60) || "AI background",
      result: dataUrl, prompt: asked, preset: fullPrompt.slice(0, 200), aspectRatio: "1:1",
      durationMs: Date.now() - started, creditsSpent: CREDIT_COST,
    });
    return await withCredits({ data: m[2], mimeType: m[1], saved }, session!, "ai", req, "ai-background");
  } catch (err) {
    console.error("ai-background error:", err);
    if (asked) await fileFailure({ userId: session!.userId, tool: "ai-background", label: asked.slice(0, 60), prompt: asked, error: err, durationMs: Date.now() - started });
    return NextResponse.json({ error: userMessage(err) }, { status: 500 });
  }
}
