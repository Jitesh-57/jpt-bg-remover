import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits, CREDIT_COST } from "@/lib/auth";
import { fileCreation, fileFailure, keepSource } from "@/lib/file-creation";
import { upscaleImage } from "@/lib/ai-image";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
export const maxDuration = 300;

/*
  Server-side 2x upscale, on fal like every other AI image call.

  It used to run on Google's Gemini API for free, because sending a free tool
  through fal would spend the paid balance on visitors who are not paying.
  Images are now made on fal only, so this is an AI call and charged like one:
  the balance is checked before anything runs. No page calls it today — the
  free upscaler works in the browser and Pro upscale is /api/upscale-pro.
*/
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, imageUrl } = (await req.json()) as { dataUrl?: string; imageUrl?: string };
  const src = imageUrl || dataUrl;
  if (!src) return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "upscale");
  if (blocked) return blocked;

  const source = keepSource(src, "upscale", session!.userId);
  const started = Date.now();
  try {
    const resultDataUrl = await upscaleImage(src, "2x");
    const saved = await fileCreation({ userId: session!.userId, tool: "upscale", label: "2x Upscale", result: resultDataUrl, source, preset: "2x", durationMs: Date.now() - started, creditsSpent: CREDIT_COST });
    return withCredits({ dataUrl: resultDataUrl, saved }, session!, "ai", req, "upscale");
  } catch (e) {
    console.error("[upscale]", e);
    await fileFailure({ userId: session!.userId, tool: "upscale", label: "2x Upscale", source, preset: "2x", error: e, durationMs: Date.now() - started });
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
