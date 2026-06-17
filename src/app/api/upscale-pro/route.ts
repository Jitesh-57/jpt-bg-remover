import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl } = await req.json() as { dataUrl?: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  try {
    const resultDataUrl = await runPixelBinPredictionAsDataUrl(dataUrl, "sr", "upscale");
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req);
  } catch (e) {
    console.error("[upscale-pro]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
