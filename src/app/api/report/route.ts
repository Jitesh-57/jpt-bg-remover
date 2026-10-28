import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/report — flag an AI result as offensive or wrong.
 *
 *   { app: "age-progression", reason: "offensive", image: "https://…", age: 70 }
 *
 * Google Play's policy for AI-generated content requires an app to let people
 * report a result without leaving it. Each report is an `ai_content_report`
 * row in public.user_events against the account (docs/play-store.md has the
 * query). Stored here, not through trackEvent, so the picture's address never
 * goes to Google Analytics.
 */

const REASONS = new Set(["offensive", "sexual", "violent", "wrong", "other"]);
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { app?: unknown; reason?: unknown; image?: unknown; age?: unknown };
  const reason = typeof body.reason === "string" && REASONS.has(body.reason) ? body.reason : "other";
  // Only a stored result's address; a data: URL is the picture itself.
  const image = clip(body.image, 600);
  const { error: dbError } = await createAdminSupabase().from("user_events").insert({
    user_id: session.userId,
    name: "ai_content_report",
    path: req.headers.get("referer")?.slice(0, 300) ?? null,
    props: {
      app: clip(body.app, 64),
      reason,
      image: image?.startsWith("https://") ? image : null,
      age: typeof body.age === "number" ? body.age : null,
    },
  });
  if (dbError) {
    console.error("[report] not stored:", dbError.message);
    return NextResponse.json({ error: "The report didn't go through. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
