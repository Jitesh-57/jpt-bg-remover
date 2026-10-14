import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits, CREDIT_COST } from "@/lib/auth";
import { fileCreation, fileFailure, keepSource } from "@/lib/file-creation";
import { editImage } from "@/lib/ai-image";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
// Nano Banana Pro at 2K can take well over a minute; matches the other image routes.
export const maxDuration = 300;

const COLOR_NAMES: Record<string, string> = {
  "#ffffff": "pure white",
  "#f5f5f5": "light grey",
  "#f5f0e8": "warm beige",
  "#e8dcc8": "sand",
  "#b8d4e8": "light blue",
  "#1a3a5c": "dark navy blue",
  "#2d5a3d": "dark green",
  "#5c1a2a": "dark maroon",
  "#c8340a": "red orange",
  "#c85a1a": "burnt orange",
  "#3a3a3a": "dark grey",
  "#0a0a0a": "black",
};

export async function POST(req: NextRequest) {
  // This endpoint was previously unauthenticated and uncharged — an open AI
  // endpoint anyone could call. It now gates and bills like every other.
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { imageUrl, bgType, bgColor, bgLabel, bgImageUrl, customPrompt } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });

  // What was asked for, kept for the record: the user's own words for a
  // prompt edit, otherwise the background they picked.
  let asked: { label: string; prompt: string | null; preset: string } | null = null;
  let source: Promise<string | null> | null = null;
  const started = Date.now();
  try {
    let prompt: string;

    if (bgType === "color") {
      const colorName = bgLabel || COLOR_NAMES[bgColor?.toLowerCase()] || bgColor || "white";
      prompt = `Replace the background with a solid ${colorName} colored background. Keep the person exactly as-is — same face, hair, clothing, and pose. No shadows, no gradients, no vignette. Clean professional headshot.`;
    } else if (bgType === "prompt") {
      if (!customPrompt) return NextResponse.json({ error: "Describe the background you want, then try again." }, { status: 400 });
      prompt = `${customPrompt.trim()}. Keep the person's face, hair, clothing, and pose exactly the same. Professional headshot quality.`;
    } else if (bgType === "image") {
      // For uploaded background images: remove bg then composite via PixelBin erase
      // Fall back to a plain background generation
      if (!bgImageUrl) return NextResponse.json({ error: "Pick a background image, then try again." }, { status: 400 });
      prompt = `Place the person onto a clean professional background. Keep the person's face, hair, clothing, and pose exactly the same. No shadows or dark edges.`;
    } else {
      return NextResponse.json({ error: "Pick a background option, then try again." }, { status: 400 });
    }

    const blocked = await checkEntitlement(session!, "ai", "headshot-edit-bg");
    if (blocked) return blocked;

    asked = bgType === "prompt"
      ? { label: "AI Edit", prompt: String(customPrompt).trim(), preset: "prompt" }
      : bgType === "color"
        ? { label: bgLabel || bgColor || "Color", prompt, preset: `color:${bgColor || bgLabel || ""}` }
        : { label: "Custom BG", prompt, preset: `image:${String(bgImageUrl).slice(0, 300)}` };
    source = keepSource(imageUrl, "headshot-edit", session!.userId);

    const resultDataUrl = await editImage(imageUrl, prompt, undefined, undefined, { budgetMs: 240_000 });

    const saved = await fileCreation({
      userId: session!.userId, tool: "headshot-edit", ...asked, result: resultDataUrl, source,
      durationMs: Date.now() - started, creditsSpent: CREDIT_COST,
    });
    return withCredits({ url: resultDataUrl, saved }, session!, "ai", req, "headshot-edit-bg");
  } catch (e) {
    console.error("[headshot/edit-bg]", e);
    if (asked) await fileFailure({ userId: session!.userId, tool: "headshot-edit", ...asked, source, error: e, durationMs: Date.now() - started });
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
