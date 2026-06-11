import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPrediction } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl } = (await req.json()) as { dataUrl?: string };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  try {
    const outputUrl = await runPixelBinPrediction(dataUrl, "sr", "upscale");
    const resp = await fetch(outputUrl);
    const buf = Buffer.from(await resp.arrayBuffer());
    const b64 = `data:image/png;base64,${buf.toString("base64")}`;
    return withCredits({ dataUrl: b64 }, session!);
  } catch (e) {
    console.error("[upscale]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
