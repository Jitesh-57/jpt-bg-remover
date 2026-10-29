import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { falEraseObject } from "@/lib/fal";
import { recordGeneration } from "@/lib/ledger";
import { storeImage } from "@/lib/store-image";
import { CREDIT_COST } from "@/lib/plans";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/object-remover — the AI Object Remover.
 *
 *   { imageUrl | dataUrl, mask }   mask: a PNG data URL, white where to remove, the photo's size
 *
 * The brushed area is removed by fal.ai (falEraseObject) and filled from its
 * surroundings. Costs CREDIT_COST, charged only when a result comes back, like
 * every AI tool. The result is stored and returned by URL: a full-size photo
 * as base64 would overrun the response size limit.
 */

const MAX_MASK = 6 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error; // 401 when not signed in

  const body = (await req.json().catch(() => ({}))) as { imageUrl?: string; dataUrl?: string; mask?: string };
  const src = body.imageUrl || body.dataUrl;
  if (!src || !(src.startsWith("https://") || src.startsWith("data:image/"))) {
    return NextResponse.json({ error: "No photo was received. Please pick an image and try again." }, { status: 400 });
  }
  if (!body.mask?.startsWith("data:image/png;base64,") || body.mask.length > MAX_MASK) {
    return NextResponse.json({ error: "Nothing is selected. Brush over what you want to remove and try again." }, { status: 400 });
  }

  const blocked = await checkEntitlement(session!, "ai", "object-remover");
  if (blocked) return blocked;

  const startedAt = Date.now();
  try {
    const result = await falEraseObject(src, body.mask, 240_000);
    const [resultUrl, sourceUrl] = await Promise.all([
      storeImage(result, "object-remover-result", session!.userId),
      storeImage(src, "object-remover-source", session!.userId),
    ]);
    await recordGeneration({
      userId: session!.userId,
      tool: "object-remover",
      label: "Object Remover",
      sourceUrl,
      resultUrl,
      model: "bria-eraser",
      creditsSpent: CREDIT_COST,
      status: "succeeded",
      durationMs: Date.now() - startedAt,
    });
    // The stored copy when there is one; the image itself only if storing failed.
    return withCredits(resultUrl ? { resultUrl } : { dataUrl: result }, session!, "ai", req, "object-remover");
  } catch (e) {
    // Nothing came back, so nothing is charged; the row is kept for the record.
    await recordGeneration({
      userId: session!.userId,
      tool: "object-remover",
      label: "Object Remover",
      sourceUrl: src.startsWith("http") ? src : null,
      model: "bria-eraser",
      creditsSpent: 0,
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
    });
    console.error("[object-remover]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
