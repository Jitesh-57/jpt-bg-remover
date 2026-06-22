import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, image, imageUrl } = await req.json() as { dataUrl?: string; image?: string; imageUrl?: string };
  const src = imageUrl || dataUrl || image;
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const resultDataUrl = await runPixelBinPredictionAsDataUrl(src, "erase", "bg");
    return withCredits({ dataUrl: resultDataUrl }, session!, "standard", req);
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
