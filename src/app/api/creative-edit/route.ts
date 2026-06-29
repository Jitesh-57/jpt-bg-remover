import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Creative Apps generation endpoint.
 *
 * Each Creative App slug is its own distinct "tool" in the shared 5-trial
 * system (see src/lib/auth.ts) — free-plan users get one free trial per
 * distinct creative app, up to 5 distinct tools total across the whole site.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error; // 401 when not signed in

  const { dataUrl, imageUrl, prompt, slug } = (await req.json()) as {
    dataUrl?: string;
    imageUrl?: string;
    prompt?: string;
    slug?: string;
  };
  const src = imageUrl || dataUrl;
  if (!src || !prompt) {
    return NextResponse.json({ error: "image and prompt required" }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const result = await runPixelBinPredictionAsDataUrl(src, "nanoBananaPro", "generate", { prompt });
    return withCredits({ dataUrl: result }, session!, "ai", req, `creative:${slug}`);
  } catch (e) {
    console.error("[creative-edit]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
