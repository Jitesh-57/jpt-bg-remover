import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPrediction } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { image } = await req.json() as { image?: string };
  if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const outputUrl = await runPixelBinPrediction(image, "erase", "bg");
    // fetch the output and return as base64
    const resp = await fetch(outputUrl);
    const buf = Buffer.from(await resp.arrayBuffer());
    const b64 = `data:image/png;base64,${buf.toString("base64")}`;
    return withCredits({ image: b64 }, session!);
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
