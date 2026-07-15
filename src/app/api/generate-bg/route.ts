import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { geminiGenerateBg } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error: authError } = await checkAuth(req);
  if (authError) return authError;

  const { dataUrl, image, imageUrl, prompt } = (await req.json()) as { dataUrl?: string; image?: string; imageUrl?: string; prompt?: string };
  const src = imageUrl || dataUrl || image;
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "generate-bg");
  if (blocked) return blocked;

  try {
    const resultDataUrl = await geminiGenerateBg(src, prompt.trim());
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req, "generate-bg");
  } catch (e) {
    console.error("[generate-bg]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
