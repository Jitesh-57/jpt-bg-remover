import { NextRequest, NextResponse } from "next/server";
import { checkAuth, checkEntitlement, withCredits } from "@/lib/auth";
import { editWithImages } from "@/lib/multi-edit.server";
import { recordGeneration } from "@/lib/ledger";
import { storeImage } from "@/lib/store-image";
import { CREDIT_COST } from "@/lib/plans";
import { userMessage } from "@/lib/user-message";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_NOTE = 1500;

function buildPrompt(note: string): string {
  return [
    "You are given two images.",
    "IMAGE 1 is the REFERENCE: copy its composition, pose, framing, camera angle, outfit and styling, background and setting, lighting, colour grade and overall mood.",
    "IMAGE 2 is the PERSON: the result must show this exact person — keep their face, facial features, skin tone, hair and identity exactly as in image 2. Do not use the face or identity of anyone in image 1.",
    "Recreate the reference photo as if this person had been photographed in it.",
    "The result must look like a real photograph: natural skin texture, realistic light and shadow, sharp photographic detail — not a painting, illustration or composite.",
    note ? `Additional instructions from the user: ${note}` : "",
  ].filter(Boolean).join(" ");
}

/** Recreate a reference photo with the user's own face. Costs the same as any AI generation. */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let body: { reference?: unknown; person?: unknown; prompt?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Something went wrong sending your request. Please try again." }, { status: 400 }); }

  const reference = typeof body.reference === "string" ? body.reference : "";
  const person = typeof body.person === "string" ? body.person : "";
  const note = typeof body.prompt === "string" ? body.prompt.trim().slice(0, MAX_NOTE) : "";
  const valid = (s: string) => /^https:\/\//.test(s) || /^data:image\/(png|jpeg|webp);base64,/.test(s);
  if (!valid(reference)) return NextResponse.json({ error: "Add a reference image first — upload one or paste a link." }, { status: 400 });
  if (!valid(person)) return NextResponse.json({ error: "Add your photo so the result shows you." }, { status: 400 });

  const blocked = await checkEntitlement(session!, "ai", "recreate");
  if (blocked) return blocked;

  const prompt = buildPrompt(note);
  const startedAt = Date.now();
  try {
    const { dataUrl, engine } = await editWithImages([reference, person], prompt, "gpt-image");
    const [resultUrl, sourceUrl] = await Promise.all([
      storeImage(dataUrl, "recreate-result", session!.userId),
      person.startsWith("http") ? Promise.resolve(person) : storeImage(person, "recreate-source", session!.userId),
    ]);
    await recordGeneration({
      userId: session!.userId,
      tool: "recreate",
      label: note ? `Recreate — ${note.slice(0, 40)}` : "Recreate",
      sourceUrl,
      resultUrl,
      model: engine,
      prompt,
      creditsSpent: CREDIT_COST,
      status: "succeeded",
      durationMs: Date.now() - startedAt,
    });
    return withCredits({ dataUrl, resultUrl }, session!, "ai", req, "recreate");
  } catch (e) {
    await recordGeneration({
      userId: session!.userId,
      tool: "recreate",
      label: "Recreate",
      prompt,
      creditsSpent: 0,
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
    });
    console.error("[recreate]", e);
    return NextResponse.json({ error: userMessage(e) }, { status: 500 });
  }
}
