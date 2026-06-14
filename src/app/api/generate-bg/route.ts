import { NextRequest, NextResponse } from "next/server";
import { checkAuth, withCredits } from "@/lib/auth";
import { geminiGenerateBg } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error: authError } = await checkAuth(req);
  if (authError) return authError;

  const { dataUrl, image, prompt } = (await req.json()) as { dataUrl?: string; image?: string; prompt?: string };
  const src = dataUrl || image;
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  if (!src) return NextResponse.json({ error: "image required" }, { status: 400 });

  try {
    const resultDataUrl = await geminiGenerateBg(src, prompt.trim());
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req);
  } catch (e) {
    console.error("[generate-bg]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
