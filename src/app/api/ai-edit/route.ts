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
    const outputUrl = await runPixelBinPrediction(dataUrl, "nanoBananaPro", "generate", { prompt });
    const resp = await fetch(outputUrl);
    const buf = Buffer.from(await resp.arrayBuffer());
    const b64 = `data:image/png;base64,${buf.toString("base64")}`;
    return withCredits({ dataUrl: b64 }, session!);
  } catch (e) {
    console.error("[ai-edit]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
