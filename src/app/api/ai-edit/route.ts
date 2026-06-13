import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPrediction } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, prompt } = (await req.json()) as { dataUrl?: string; prompt?: string };
  if (!dataUrl || !prompt) return NextResponse.json({ error: "dataUrl and prompt required" }, { status: 400 });

  try {
    const url = await runPixelBinPrediction(dataUrl, "nanoBananaPro", "generate", { prompt });
    return withCredits({ url }, session!, "ai");
  } catch (e) {
    console.error("[ai-edit]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
