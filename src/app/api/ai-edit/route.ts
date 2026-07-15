import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { geminiEditImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, imageUrl, prompt } = (await req.json()) as { dataUrl?: string; imageUrl?: string; prompt?: string };
  const src = imageUrl || dataUrl;
  if (!src || !prompt) return NextResponse.json({ error: "image and prompt required" }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "ai-edit");
  if (blocked) return blocked;

  try {
    const resultDataUrl = await geminiEditImage(src, prompt);
    return withCredits({ dataUrl: resultDataUrl }, session!, "ai", req, "ai-edit");
  } catch (e) {
    console.error("[ai-edit]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
