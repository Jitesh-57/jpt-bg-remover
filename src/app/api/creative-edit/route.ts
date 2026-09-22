import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editImage, generateFromText } from "@/lib/ai-image";
import { recordGeneration } from "@/lib/ledger";
import { storeImage } from "@/lib/store-image";
import { CREDIT_COST } from "@/lib/plans";
import { userMessage } from "@/lib/user-message";
import { isTextOnlyApp } from "@/lib/app-options";

export const runtime = "nodejs";
/**
 * 300s, not 60.
 *
 * A nano-banana edit often takes longer than a minute, and the queue poll was
 * budgeted at 55s inside a 60s function. Past that the platform returned a
 * gateway error whose body is not JSON, so the client's `res.json()` threw and
 * the user was told "Network error. Please try again." for a generation that
 * was simply still running.
 */
export const maxDuration = 300;

/**
 * AI app generation endpoint.
 *
 * Credits-only: every generation costs CREDIT_COST, whichever app it came from.
 * The caller picks the model (nano-banana or gpt-image) and an aspect ratio.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error; // 401 when not signed in

  const { dataUrl, imageUrl, prompt, slug, model, aspectRatio, preset } = (await req.json()) as {
    dataUrl?: string;
    imageUrl?: string;
    prompt?: string;
    slug?: string;
    model?: string;
    aspectRatio?: string;
    preset?: string;
  };
  const src = imageUrl || dataUrl;
  if (!prompt) {
    return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "Something went wrong opening this app. Please reload the page and try again." }, { status: 400 });
  }
  // Every app but the handful that generate from a description alone needs a
  // photo to work on — those still get the original message.
  if (!src && !isTextOnlyApp(slug)) {
    return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });
  }

  const blocked = await checkEntitlement(session!, "ai", `creative:${slug}`);
  if (blocked) return blocked;

  const startedAt = Date.now();
  try {
    /*
      raw, because buildPrompt() already produced a complete instruction —
      including how much of the frame this app is allowed to rebuild. Wrapping
      it in "Edit this image: …" contradicted that, and told the model to do
      the smallest thing instead.

      No `src` only happens for the text-only apps (enforced above) — those
      have nothing to edit, so this generates from the description alone.
    */
    const result = src
      ? await editImage(src, prompt, model, aspectRatio, { budgetMs: 240_000, raw: true })
      : await generateFromText(prompt, { model, aspect_ratio: aspectRatio, budgetMs: 240_000 });

    /*
      Both ends of the generation are stored, not just the response.

      The route used to hand back a data URL and keep nothing, so there was no
      "generated URL" to record and the original was never linked to its result.
      Storing the output gives the row something to point at; the input is
      already a URL when the client uploaded it first, and is stored here when
      it arrived as bytes. A text-only app never had an input photo, so there
      is nothing to store on that side.

      Sequential rather than parallel with the response on purpose: these are
      awaited so the row exists before the browser is told the generation
      succeeded, and a failure in either only logs.
    */
    const [resultUrl, sourceUrl] = await Promise.all([
      storeImage(result, `${slug}-result`, session!.userId),
      src ? storeImage(src, `${slug}-source`, session!.userId) : Promise.resolve(null),
    ]);

    await recordGeneration({
      userId: session!.userId,
      tool: "creative",
      appSlug: slug,
      sourceUrl,
      resultUrl,
      model: model || null,
      prompt,
      preset: preset || null,
      aspectRatio: aspectRatio || null,
      creditsSpent: CREDIT_COST,
      status: "succeeded",
      durationMs: Date.now() - startedAt,
    });

    return withCredits({ dataUrl: result, resultUrl }, session!, "ai", req, `creative:${slug}`);
  } catch (e) {
    /*
      A failure is worth a row too. This is the case that costs money at the
      provider without producing anything, and it is precisely what the old
      client-side saver could never capture: nothing came back to save.
      No credits are charged — withCredits is never reached.
    */
    await recordGeneration({
      userId: session!.userId,
      tool: "creative",
      appSlug: slug,
      sourceUrl: src?.startsWith("http") ? src : null,
      model: model || null,
      prompt,
      preset: preset || null,
      aspectRatio: aspectRatio || null,
      creditsSpent: 0,
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
    });

    console.error("[creative-edit]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
