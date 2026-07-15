import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { geminiUpscale } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, imageUrl } = (await req.json()) as { dataUrl?: string; imageUrl?: string };
  const src = imageUrl || dataUrl;
  if (!src) return NextResponse.json({ error: "dataUrl or imageUrl required" }, { status: 400 });

  try {
    const resultDataUrl = await geminiUpscale(src, "2x");
    return withCredits({ dataUrl: resultDataUrl }, session!, "basic", req);
  } catch (e) {
    console.error("[upscale]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
