import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { readIntent } from "@/lib/ai-intent.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/intent — reads a request (or, with mode "analyze", a photo)
 * for the AI Studio. Free: no credits are spent until the person presses
 * Generate. Signed-in only, so it can't be used as an open AI endpoint.
 */
export async function POST(req: NextRequest) {
  const { error } = await checkAuth(req);
  if (error) return error;

  let body: { request?: unknown; tool?: unknown; history?: unknown; image?: unknown; mode?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 }); }

  const mode = body.mode === "analyze" ? "analyze" : "intent";
  const request = typeof body.request === "string" ? body.request : "";
  if (mode === "intent" && !request.trim()) return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });

  const image = typeof body.image === "string" && (/^https:\/\//.test(body.image) || /^data:image\/(png|jpeg|webp);base64,/.test(body.image)) ? body.image : null;
  const history = Array.isArray(body.history) ? body.history.filter((h): h is string => typeof h === "string").map((h) => h.slice(0, 300)) : [];
  const tool = typeof body.tool === "string" ? body.tool.slice(0, 80) : null;

  const result = await readIntent({ request, tool, history, image, mode });
  return NextResponse.json(result);
}
