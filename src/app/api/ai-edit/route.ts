import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits, CREDIT_COST } from "@/lib/auth";
import { fileCreation } from "@/lib/file-creation";
import { editImage } from "@/lib/ai-image";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
// Nano Banana Pro at 2K can take well over a minute; matches the other image routes.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { dataUrl, imageUrl, prompt, model } = (await req.json()) as {
    dataUrl?: string; imageUrl?: string; prompt?: string;
    /** "nano-banana" or "gpt-image"; anything else falls to the default. */
    model?: string;
  };
  const src = imageUrl || dataUrl;
  if (!src || !prompt) return NextResponse.json({ error: "Pick a photo and describe the edit you want, then try again." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "ai-edit");
  if (blocked) return blocked;

  try {
    const resultDataUrl = await editImage(src, prompt, model, undefined, { budgetMs: 240_000 });
    const saved = await fileCreation({ userId: session!.userId, tool: "ai-edit", label: prompt.trim().slice(0, 60) || "AI Edit", result: resultDataUrl, prompt, creditsSpent: CREDIT_COST });
    return withCredits({ dataUrl: resultDataUrl, saved }, session!, "ai", req, "ai-edit");
  } catch (e) {
    console.error("[ai-edit]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
