import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editImage } from "@/lib/ai-image";
import { recordGeneration } from "@/lib/ledger";
import { storeImage } from "@/lib/store-image";
import { CREDIT_COST } from "@/lib/plans";
import { userMessage } from "@/lib/user-message";
import { ASPECT_RATIOS, MODELS } from "@/lib/app-presets";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PROMPT = 2000;
const MODEL_IDS = new Set<string>(MODELS.map((m) => m.id));
const RATIOS = new Set<string>(ASPECT_RATIOS);

/** The dashboard's AI Image Editor: one photo plus an instruction. Saved to My Creations. */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let body: { image?: unknown; prompt?: unknown; model?: unknown; aspectRatio?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Something went wrong sending your request. Please try again." }, { status: 400 }); }

  const image = typeof body.image === "string" ? body.image : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!/^https:\/\//.test(image) && !/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
    return NextResponse.json({ error: "Upload a photo to edit first." }, { status: 400 });
  }
  if (!prompt) return NextResponse.json({ error: "Describe the edit you want." }, { status: 400 });
  if (prompt.length > MAX_PROMPT) return NextResponse.json({ error: `Keep the description under ${MAX_PROMPT} characters.` }, { status: 400 });
  const model = typeof body.model === "string" && MODEL_IDS.has(body.model) ? body.model : MODELS[0].id;
  const aspectRatio = typeof body.aspectRatio === "string" && RATIOS.has(body.aspectRatio) ? body.aspectRatio : undefined;

  const blocked = await checkEntitlement(session!, "ai", "ai-edit");
  if (blocked) return blocked;

  const startedAt = Date.now();
  const label = prompt.length > 60 ? `${prompt.slice(0, 57)}…` : prompt;
  try {
    const result = await editImage(image, prompt, model, aspectRatio, { budgetMs: 240_000 });
    const [resultUrl, sourceUrl] = await Promise.all([
      storeImage(result, "ai-edit-result", session!.userId),
      image.startsWith("http") ? Promise.resolve(image) : storeImage(image, "ai-edit-source", session!.userId),
    ]);
    await recordGeneration({
      userId: session!.userId, tool: "ai-edit", label, sourceUrl, resultUrl, model, prompt,
      aspectRatio: aspectRatio ?? null, creditsSpent: CREDIT_COST, status: "succeeded", durationMs: Date.now() - startedAt,
    });
    return withCredits({ dataUrl: result, resultUrl }, session!, "ai", req, "ai-edit");
  } catch (e) {
    await recordGeneration({
      userId: session!.userId, tool: "ai-edit", label, model, prompt, aspectRatio: aspectRatio ?? null,
      creditsSpent: 0, status: "failed", error: e instanceof Error ? e.message : String(e), durationMs: Date.now() - startedAt,
    });
    console.error("[edit-image]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
