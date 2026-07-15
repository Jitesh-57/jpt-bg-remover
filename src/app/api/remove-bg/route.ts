import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { geminiRemoveBg } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// Remove BG is an AI (Gemini) tool: paid-plan users spend 2 credits; free users
// get the upgrade popup (gated by checkEntitlement / AI_TOOLS_PAID_ONLY).
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, image, imageUrl } = await req.json() as { dataUrl?: string; image?: string; imageUrl?: string };
  const src = imageUrl || dataUrl || image;
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "remove-bg");
  if (blocked) return blocked;

  try {
    const resultDataUrl = await geminiRemoveBg(src);
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req, "remove-bg");
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
