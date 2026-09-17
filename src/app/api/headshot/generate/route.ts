import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editImageGptFirst, type Engine } from "@/lib/ai-image";
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
    return NextResponse.json({ error: "Something went wrong sending your photo. Please reload the page and try again." }, { status: 400 });
  }

  if (!imageUrl) return NextResponse.json({ error: "No photo was received. Please upload a photo and try again." }, { status: 400 });
  if (!Array.isArray(styleIds) || styleIds.length === 0)
    return NextResponse.json({ error: "Pick at least one style, then try again." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "ai-headshot");
  if (blocked) return blocked;

  const styleLibrary = gender === "men" ? MEN_STYLES : WOMEN_STYLES;
  const selectedStyles = styleLibrary.filter((s) => styleIds.includes(s.id));

  /*
    Identity first, then the styling.

    These styles are already long, literal descriptions — exactly what GPT
    Image is good at — but a description is also the thing that pulls a
    generated face away from the real one. Stating the constraint before the
    styling, in the model's own terms, keeps the person recognisable: the
    instruction it reads last is not "urban alleyway, navy blazer".

    "No beautification" is deliberate. Left to itself the model smooths skin,
    evens teeth and slims jawlines, and the result is a good-looking photo of
    somebody else — the single most common complaint about AI headshots.
  */
  const framePrompt = (style: (typeof selectedStyles)[number]) =>
    `Photorealistic professional headshot of the exact person in the reference photo.\n\n` +
    `IDENTITY (most important): keep this person's real face — the same bone structure, ` +
    `jawline, nose, eyes, eyebrows, lips, skin tone and skin texture, hairline and hair colour, ` +
    `age, and any glasses, freckles, moles or facial hair. Do not beautify, slim, smooth, ` +
    `lighten or otherwise "improve" the face. A viewer who knows this person must recognise them ` +
    `immediately.\n\n` +
    `STYLING: ${style.prompt}\n\n` +
    `CAMERA: shot on a full-frame camera with an 85mm lens at f/2, natural skin texture with ` +
    `visible pores, catchlights in the eyes, realistic fabric detail, soft studio-quality light. ` +
    `Sharp focus on the eyes. Vertical portrait framing. ` +
    `No text, no watermark, no logo, no illustration or 3D-render look.`;

  const results = await Promise.allSettled(
    selectedStyles.map(async (style) => {
      const { dataUrl, engine, downgradeReason } = await editImageGptFirst(
        imageUrl,
        framePrompt(style),
        {
          // Portrait. fal maps 3:4 to GPT Image's 1024x1536 and passes it to
          // Nano Banana as an aspect ratio, so one value frames every rung.
          aspectRatio: "3:4",
          size: "1024x1536",
          // A budget that fits maxDuration with room to spare — a
          // high-quality GPT Image render is slow by design.
          budgetMs: 240_000,
          label: `headshot ${style.id}`,
        }
      );
      console.log(
        `Style ${style.id} (${style.name}): OK via ${engine}` +
          (downgradeReason ? ` — ${downgradeReason}` : "")
      );
      return { id: style.id, name: style.name, tag: style.tag, url: dataUrl, engine, downgradeReason };
    })
  );

  type Generated = {
    id: number; name: string; tag: string; url: string;
    engine: Engine; downgradeReason: string | undefined;
  };

  const images = results
    .filter((r): r is PromiseFulfilledResult<Generated> => r.status === "fulfilled")
    .map((r) => r.value);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason as Error).message);

  console.log(`Generate done: ${images.length} success, ${errors.length} failed`);

  /*
    Tell the page when it did not get the model it asked for.

    The operator log above is the full story; this is the one sentence the
    person looking at the pictures needs, and only when it applies. Without
    it, "we switched the headshots to GPT Image" and "the headshots look
    exactly as they did before" are both true and nobody can connect them.
  */
  const downgraded = images.some((i) => i.engine !== "gpt-image");
  const engineNotice = downgraded
    ? "These were generated with the standard model. The premium photorealistic model is not " +
      "available right now, so quality may differ."
    : undefined;

  // Charge credits for each successfully generated headshot (2 credits each like other AI tools)
  if (images.length === 0) {
    return NextResponse.json({ images, errors }, { status: 500 });
  }

  return withCredits(
    {
      // downgradeReason names our providers, so it is listed out here rather
      // than spread in: it belongs in the server log, not in a browser.
      images: images.map((i) => ({ id: i.id, name: i.name, tag: i.tag, url: i.url, engine: i.engine })),
      errors,
      ...(engineNotice ? { engineNotice } : {}),
    },
    session!,
    "ai",
    req,
    "ai-headshot"
  );
}
