import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { readIntent } from "@/lib/ai-intent.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/intent — reads a request (or, with mode "analyze", a photo)
 * for the AI Studio. No credits are spent until the person presses Generate.
 *
 * Smart reading costs us a model call on fal, so it is free while an account
 * holds credits. An account without credits gets ONE photo analysis and ONE
 * try on a suggestion or request, ever; after that the studio asks it to buy
 * credits. mode "pick" spends that try for a suggestion the page answers
 * itself (a Recommended card). The allowance is kept in the account's
 * app_metadata, which only the server can change (user_metadata is editable
 * from the browser).
 *
 * GET /api/ai/intent tells the page what is left, so it can skip the scan and
 * show the unlock card straight away.
 */
const FREE_TRIES = 1;

type Allowance = { analyze: boolean; tries: number };

async function readAllowance(userId: string): Promise<{ meta: Record<string, unknown>; left: Allowance }> {
  const admin = createAdminSupabase();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = (data.user?.app_metadata || {}) as Record<string, unknown>;
  const analyzed = typeof meta.studio_free_image === "string" && !!meta.studio_free_image;
  const used = typeof meta.studio_free_intents === "number" ? meta.studio_free_intents : 0;
  return { meta, left: { analyze: !analyzed, tries: Math.max(0, FREE_TRIES - used) } };
}

/** Whether this no-credit account may use smart reading for this call, recording the use if so. */
async function freeAllowance(userId: string, mode: "analyze" | "intent" | "pick"): Promise<boolean> {
  try {
    const { meta, left } = await readAllowance(userId);
    const admin = createAdminSupabase();
    if (mode === "analyze") {
      if (!left.analyze) return false;
      await admin.auth.admin.updateUserById(userId, { app_metadata: { ...meta, studio_free_image: new Date().toISOString() } });
      return true;
    }
    if (left.tries <= 0) return false;
    const used = typeof meta.studio_free_intents === "number" ? meta.studio_free_intents : 0;
    await admin.auth.admin.updateUserById(userId, { app_metadata: { ...meta, studio_free_intents: used + 1 } });
    return true;
  } catch (e) {
    console.error("[ai-intent] allowance check failed:", (e as Error).message);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;
  if ((session!.credits ?? 0) > 0) return NextResponse.json({ paid: true, analyze: true, tries: -1 });
  try {
    const { left } = await readAllowance(session!.userId);
    return NextResponse.json({ paid: false, ...left });
  } catch {
    return NextResponse.json({ paid: false, analyze: false, tries: 0 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  let body: { request?: unknown; tool?: unknown; history?: unknown; image?: unknown; mode?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 }); }

  const mode = body.mode === "analyze" ? "analyze" : body.mode === "pick" ? "pick" : "intent";
  const paid = (session!.credits ?? 0) > 0;

  if (mode === "pick") {
    const ok = paid || (await freeAllowance(session!.userId, "pick"));
    return NextResponse.json(ok ? { ok: true } : { ok: false, locked: true });
  }
  const request = typeof body.request === "string" ? body.request : "";
  if (mode === "intent" && !request.trim()) return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });

  const image = typeof body.image === "string" && (/^https:\/\//.test(body.image) || /^data:image\/(png|jpeg|webp);base64,/.test(body.image)) ? body.image : null;
  const history = Array.isArray(body.history) ? body.history.filter((h): h is string => typeof h === "string").map((h) => h.slice(0, 300)) : [];
  const tool = typeof body.tool === "string" ? body.tool.slice(0, 80) : null;

  const smart = paid || (await freeAllowance(session!.userId, mode));
  if (!smart) return NextResponse.json({ locked: true, understood: [], prompt: "", suggestions: [], detected: [], recommended: [] });
  const result = await readIntent({ request, tool, history, image, mode, basic: !smart });
  return NextResponse.json(result);
}
