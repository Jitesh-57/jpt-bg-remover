import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPrediction } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error: authError } = await checkAuth(req);
  if (authError) return authError;

  const { image, prompt } = (await req.json()) as { image?: string; prompt?: string };
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const url = await runPixelBinPrediction(image, "generate", "bg", { prompt: prompt.trim() });
    return withCredits({ url }, session!, "ai", req);
  } catch (e) {
    console.error("[generate-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
