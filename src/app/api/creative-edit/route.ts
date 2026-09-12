import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editImage } from "@/lib/ai-image";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * AI app generation endpoint.
 *
 * Credits-only: every generation costs CREDIT_COST, whichever app it came from.
 * The caller picks the model (nano-banana or gpt-image) and an aspect ratio.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error; // 401 when not signed in

  const { dataUrl, imageUrl, prompt, slug, model, aspectRatio } = (await req.json()) as {
    dataUrl?: string;
    imageUrl?: string;
    prompt?: string;
    slug?: string;
    model?: string;
    aspectRatio?: string;
  };
  const src = imageUrl || dataUrl;
  if (!src || !prompt) {
    return NextResponse.json({ error: "image and prompt required" }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const blocked = await checkEntitlement(session!, "ai", `creative:${slug}`);
  if (blocked) return blocked;

  try {
    const result = await editImage(src, prompt, model, aspectRatio);
    return withCredits({ dataUrl: result }, session!, "ai", req, `creative:${slug}`);
  } catch (e) {
    console.error("[creative-edit]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
