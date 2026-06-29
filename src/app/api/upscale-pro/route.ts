import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, imageUrl } = await req.json() as { dataUrl?: string; imageUrl?: string };
  const src = imageUrl || dataUrl;
  if (!src) return NextResponse.json({ error: "dataUrl or imageUrl required" }, { status: 400 });

  try {
    const resultDataUrl = await runPixelBinPredictionAsDataUrl(src, "sr", "upscale");
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req, "upscale-pro");
  } catch (e) {
    console.error("[upscale-pro]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
