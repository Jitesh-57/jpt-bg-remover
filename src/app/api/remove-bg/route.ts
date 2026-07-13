import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { geminiRemoveBg } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// Remove BG is a free tool for everyone. The client tries the in-browser engine
// first; this server route (Gemini) is the fallback. It's ungated ("basic" —
// no plan check, no credits) so it works for every signed-in user.
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, image, imageUrl } = await req.json() as { dataUrl?: string; image?: string; imageUrl?: string };
  const src = imageUrl || dataUrl || image;
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const resultDataUrl = await geminiRemoveBg(src);
    return withCredits({ dataUrl: resultDataUrl }, session!, "basic", req);
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
