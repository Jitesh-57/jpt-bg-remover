import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editImage, generateFromText } from "@/lib/ai-image";
import { editWithImages } from "@/lib/multi-edit.server";
import { recordGeneration } from "@/lib/ledger";
import { storeImage } from "@/lib/store-image";
import { CREDIT_COST } from "@/lib/plans";
import { userMessage } from "@/lib/user-message";
import { ASPECT_RATIOS, MODELS } from "@/lib/app-presets";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PROMPT = 4000;
const MODEL_IDS = new Set<string>(MODELS.map((m) => m.id));
const RATIOS = new Set<string>(ASPECT_RATIOS);

const REFERENCE_AND_SUBJECT_NOTE =
  "You are given two images. IMAGE 1 is the REFERENCE: match its composition, pose, framing, camera angle, styling, setting, lighting and colour grade, following the prompt above. IMAGE 2 is the SUBJECT: the result must show this exact subject. If it is a person, keep their face, facial features, skin tone, hair and identity exactly the same. If it is a product or object, keep its shape, colours, materials, text and branding exactly the same. Do not reuse the person or product from image 1. The result must look like a real photograph.";

const REFERENCE_NOTE =
  "The provided image is a visual REFERENCE: match its composition, styling, lighting and mood while following the prompt above. Produce a new, realistic photograph.";

const SUBJECT_NOTE =
  "Use the subject of the provided photo as the subject of this image. If it is a person, keep their face, facial features, skin tone, hair and identity exactly the same. If it is a product or object, keep its shape, colours, materials, text and branding exactly the same. The result must look like a real photograph.";

/**
 * Create Image. Text-to-image by default; with the user's photo attached, the
 * same prompt is rendered around that photo's subject instead — how a
 * community prompt gets recreated with your own face or product.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let body: { prompt?: unknown; model?: unknown; aspectRatio?: unknown; image?: unknown; reference?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong sending your request. Please try again." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Describe the image you want to create." }, { status: 400 });
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json({ error: `That description is too long — keep it under ${MAX_PROMPT} characters.` }, { status: 400 });
  }
  const model = typeof body.model === "string" && MODEL_IDS.has(body.model) ? body.model : MODELS[0].id;
  const aspectRatio = typeof body.aspectRatio === "string" && RATIOS.has(body.aspectRatio) ? body.aspectRatio : "1:1";
  const isImage = (v: unknown): v is string => typeof v === "string" && (/^https:\/\//.test(v) || /^data:image\/(png|jpeg|webp);base64,/.test(v));
  const image = isImage(body.image) ? body.image : null;
  if (body.image && !image) return NextResponse.json({ error: "Your image couldn't be read. Try adding it again." }, { status: 400 });
  // Passed to the image provider as-is and never fetched by this server.
  const reference = isImage(body.reference) ? body.reference : null;
  if (body.reference && !reference) return NextResponse.json({ error: "The reference image couldn't be read. Remove it and try again." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "create-image");
  if (blocked) return blocked;

  const startedAt = Date.now();
  const label = prompt.length > 60 ? `${prompt.slice(0, 57)}…` : prompt;
  try {
    const result =
      reference && image ? (await editWithImages([reference, image], `${prompt}\n\n${REFERENCE_AND_SUBJECT_NOTE}`, model)).dataUrl
      : reference ? (await editWithImages([reference], `${prompt}\n\n${REFERENCE_NOTE}`, model)).dataUrl
      : image ? await editImage(image, `${prompt}\n\n${SUBJECT_NOTE}`, model, aspectRatio, { budgetMs: 240_000, raw: true })
      : await generateFromText(prompt, { model, aspect_ratio: aspectRatio, budgetMs: 240_000 });
    const [resultUrl, sourceUrl] = await Promise.all([
      storeImage(result, "create-image-result", session!.userId),
      !image ? Promise.resolve(null) : image.startsWith("http") ? Promise.resolve(image) : storeImage(image, "create-image-source", session!.userId),
    ]);

    await recordGeneration({
      userId: session!.userId,
      tool: "create-image",
      label,
      sourceUrl,
      resultUrl,
      model,
      prompt,
      aspectRatio,
      creditsSpent: CREDIT_COST,
      status: "succeeded",
      durationMs: Date.now() - startedAt,
    });

    return withCredits({ dataUrl: result, resultUrl }, session!, "ai", req, "create-image");
  } catch (e) {
    await recordGeneration({
      userId: session!.userId,
      tool: "create-image",
      label,
      model,
      prompt,
      aspectRatio,
      creditsSpent: 0,
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
    });
    console.error("[create-image]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
