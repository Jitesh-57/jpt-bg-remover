import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
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

  try {
    const resultDataUrl = await upscaleImage(src, "2x");
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req, "upscale");
  } catch (e) {
    console.error("[upscale]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
