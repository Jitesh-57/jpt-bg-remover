import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { runPixelBinPredictionAsDataUrl } from "@/lib/pixelbin";
import { WOMEN_STYLES, MEN_STYLES } from "@/lib/headshot-prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let imageUrl: string, styleIds: number[], gender: string;
  try {
    ({ imageUrl, styleIds, gender } = (await req.json()) as {
      imageUrl: string;
      styleIds: number[];
      gender: string;
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  if (!Array.isArray(styleIds) || styleIds.length === 0)
    return NextResponse.json({ error: "styleIds required" }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "ai-headshot");
  if (blocked) return blocked;

  const styleLibrary = gender === "men" ? MEN_STYLES : WOMEN_STYLES;
  const selectedStyles = styleLibrary.filter((s) => styleIds.includes(s.id));

  const results = await Promise.allSettled(
    selectedStyles.map(async (style) => {
      const prompt =
        `Professional AI headshot: ${style.prompt} ` +
        `Preserve the exact facial features, hair, skin tone, and identity of the person in the reference photo. ` +
        `High quality, photorealistic, portrait orientation.`;

      const dataUrl = await runPixelBinPredictionAsDataUrl(
        imageUrl,
        "nanoBananaPro",
        "generate",
        { prompt }
      );
      console.log(`Style ${style.id} (${style.name}): OK`);
      return { id: style.id, name: style.name, tag: style.tag, url: dataUrl };
    })
  );

  const images = results
    .filter(
      (r): r is PromiseFulfilledResult<{ id: number; name: string; tag: string; url: string }> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason as Error).message);

  console.log(`Generate done: ${images.length} success, ${errors.length} failed`);

  // Charge credits for each successfully generated headshot (2 credits each like other AI tools)
  if (images.length === 0) {
    return NextResponse.json({ images, errors }, { status: 500 });
  }

  return withCredits({ images, errors }, session!, "ai", req, "ai-headshot");
}
