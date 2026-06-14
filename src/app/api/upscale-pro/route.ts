import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { geminiUpscale } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, scale } = await req.json() as { dataUrl?: string; scale?: "2x" | "4x" };
  if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

  try {
    const resultDataUrl = await geminiUpscale(dataUrl, scale || "2x");
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req);
  } catch (e) {
    console.error("[upscale-pro]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
