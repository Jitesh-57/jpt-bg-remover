import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { readIntent } from "@/lib/ai-intent.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/intent — reads a request (or, with mode "analyze", a photo)
 * for the AI Studio. No credits are spent until the person presses Generate.
 *
 * Smart reading costs us a model call on fal, so it is free while an account
 * holds credits. An account without credits gets it for ONE photo (the first
 * it uploads, plus a few requests about that photo); after that it gets the
 * basic keyword reading, which costs nothing, and the studio asks it to buy
 * credits. The allowance is kept in the account's app_metadata, which only the server can change (user_metadata is editable from the browser).
 */
const FREE_INTENTS = 5;

function imageKey(src: string): string {
  const base = src.startsWith("http") ? src.split("?")[0] : src.slice(0, 4096);
  return createHash("sha1").update(base).digest("hex").slice(0, 20);
}

/** Whether this no-credit account may use smart reading for this call, recording the use if so. */
async function freeAllowance(userId: string, mode: "analyze" | "intent", image: string | null): Promise<boolean> {
  if (!image) return false;
  try {
    const admin = createAdminSupabase();
    const { data } = await admin.auth.admin.getUserById(userId);
    const meta = (data.user?.app_metadata || {}) as Record<string, unknown>;
    const key = imageKey(image);
    const used = typeof meta.studio_free_image === "string" ? meta.studio_free_image : "";
    const intents = typeof meta.studio_free_intents === "number" ? meta.studio_free_intents : 0;

    if (mode === "analyze") {
      if (used && used !== key) return false;          // their one free photo was a different one
      if (!used) await admin.auth.admin.updateUserById(userId, { app_metadata: { ...meta, studio_free_image: key, studio_free_intents: 0 } });
      return true;
    }
    if (used !== key || intents >= FREE_INTENTS) return false;
    await admin.auth.admin.updateUserById(userId, { app_metadata: { ...meta, studio_free_intents: intents + 1 } });
    return true;
  } catch (e) {
    console.error("[ai-intent] allowance check failed:", (e as Error).message);
    return false;
  }
}
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let body: { request?: unknown; tool?: unknown; history?: unknown; image?: unknown; mode?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 }); }

  const mode = body.mode === "analyze" ? "analyze" : "intent";
  const request = typeof body.request === "string" ? body.request : "";
  if (mode === "intent" && !request.trim()) return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });

  const image = typeof body.image === "string" && (/^https:\/\//.test(body.image) || /^data:image\/(png|jpeg|webp);base64,/.test(body.image)) ? body.image : null;
  const history = Array.isArray(body.history) ? body.history.filter((h): h is string => typeof h === "string").map((h) => h.slice(0, 300)) : [];
  const tool = typeof body.tool === "string" ? body.tool.slice(0, 80) : null;

  const paid = (session!.credits ?? 0) > 0;
  const smart = paid || (await freeAllowance(session!.userId, mode, image));
  const result = await readIntent({ request, tool, history, image, mode, basic: !smart });
  return NextResponse.json(result);
}
