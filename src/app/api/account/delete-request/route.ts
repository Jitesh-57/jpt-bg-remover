import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/account/delete-request — the signed-in user asks for their account
 * and everything in it to be deleted.
 *
 *   { source: "age-progression" }   where the request was made
 *
 * Google Play requires an app that creates accounts to offer this inside the
 * app, and on a web page (/delete-account). The request is recorded as an
 * `account_delete_request` row in public.user_events against the account,
 * and deleted by hand within 30 days (docs/play-store.md has the query).
 * Asking twice is harmless: the latest row is the one that counts.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { source } = (await req.json().catch(() => ({}))) as { source?: unknown };
  const { error: dbError } = await createAdminSupabase().from("user_events").insert({
    user_id: session.userId,
    name: "account_delete_request",
    path: req.headers.get("referer")?.slice(0, 300) ?? null,
    props: { source: typeof source === "string" ? source.slice(0, 64) : "web" },
  });
  if (dbError) {
    console.error("[delete-request] not stored:", dbError.message);
    return NextResponse.json({ error: "We couldn't record the request. Please email support@sjpt.io." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
