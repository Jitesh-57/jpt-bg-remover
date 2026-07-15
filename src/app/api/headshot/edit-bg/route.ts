import { NextResponse } from "next/server";
import { geminiEditImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

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

export async function POST(req: Request) {
  const { imageUrl, bgType, bgColor, bgLabel, bgImageUrl, customPrompt } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  try {
    let prompt: string;

    if (bgType === "color") {
      const colorName = bgLabel || COLOR_NAMES[bgColor?.toLowerCase()] || bgColor || "white";
      prompt = `Replace the background with a solid ${colorName} colored background. Keep the person exactly as-is — same face, hair, clothing, and pose. No shadows, no gradients, no vignette. Clean professional headshot.`;
    } else if (bgType === "prompt") {
      if (!customPrompt) return NextResponse.json({ error: "customPrompt required" }, { status: 400 });
      prompt = `${customPrompt.trim()}. Keep the person's face, hair, clothing, and pose exactly the same. Professional headshot quality.`;
    } else if (bgType === "image") {
      // For uploaded background images: remove bg then composite via PixelBin erase
      // Fall back to a plain background generation
      if (!bgImageUrl) return NextResponse.json({ error: "bgImageUrl required" }, { status: 400 });
      prompt = `Place the person onto a clean professional background. Keep the person's face, hair, clothing, and pose exactly the same. No shadows or dark edges.`;
    } else {
      return NextResponse.json({ error: "bgType must be 'color', 'image', or 'prompt'" }, { status: 400 });
    }

    const resultDataUrl = await geminiEditImage(imageUrl, prompt);

    return NextResponse.json({ url: resultDataUrl });
  } catch (e) {
    console.error("[headshot/edit-bg]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't process the image right now. Please try again." }, { status: 500 });
  }
}
