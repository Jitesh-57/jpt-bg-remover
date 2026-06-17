import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { geminiRemoveBg } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, image } = await req.json() as { dataUrl?: string; image?: string };
  const src = dataUrl || image;
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const resultDataUrl = await geminiRemoveBg(src);
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req);
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
