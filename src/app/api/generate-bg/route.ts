import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits, CREDIT_COST } from "@/lib/auth";
import { fileCreation, fileFailure, keepSource } from "@/lib/file-creation";
import { generateBackground } from "@/lib/ai-image";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
// Nano Banana Pro at 2K can take over a minute.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { session, error: authError } = await checkAuth(req);
  if (authError) return authError;

  const { dataUrl, image, imageUrl, prompt } = (await req.json()) as { dataUrl?: string; image?: string; imageUrl?: string; prompt?: string };
  const src = imageUrl || dataUrl || image;
  if (!prompt?.trim()) return NextResponse.json({ error: "Describe the background you want, then try again." }, { status: 400 });
  if (!src) return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "generate-bg");
  if (blocked) return blocked;

  const source = keepSource(src, "generate-bg", session!.userId);
  const started = Date.now();
  try {
    const resultDataUrl = await generateBackground(src, prompt.trim());
    const saved = await fileCreation({ userId: session!.userId, tool: "generate-bg", label: prompt.trim().slice(0, 60) || "New background", result: resultDataUrl, source, prompt: prompt.trim(), durationMs: Date.now() - started, creditsSpent: CREDIT_COST });
    return withCredits({ dataUrl: resultDataUrl, saved }, session!, "ai", req, "generate-bg");
  } catch (e) {
    console.error("[generate-bg]", e);
    await fileFailure({ userId: session!.userId, tool: "generate-bg", label: prompt.trim().slice(0, 60) || "New background", source, prompt: prompt.trim(), error: e, durationMs: Date.now() - started });
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
