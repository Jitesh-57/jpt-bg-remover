import { NextRequest, NextResponse } from "next/server";
import { falKeyShape, falProbe } from "@/lib/fal";

export const runtime = "nodejs";

/**
 * Tells you whether FAL_KEY works, without spending anything.
 *
 * "The image service rejected our credentials" is a 401 from fal, and from the
 * outside there is no way to tell a missing key from a wrong one from a key
 * that is right but arrived with a trailing newline. This probes fal with a
 * request id that cannot exist: a bad key answers 401, a good key answers 404
 * because the id is unknown. No generation happens either way, so checking is
 * free and can be repeated after every change.
 *
 *   GET /api/admin/fal-check?token=<ADMIN_IMAGE_TOKEN>
 *
 * The key is never returned — only its length and whether it is present, which
 * is enough to spot a truncated paste or an empty variable.
 */
const TOKEN = process.env.ADMIN_IMAGE_TOKEN || "jptblog2026";

export async function GET(req: NextRequest) {
  if ((req.nextUrl.searchParams.get("token") || "").trim() !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shape = falKeyShape();
  if (!shape.configured) {
    return NextResponse.json({
      ok: false,
      key: shape,
      verdict: "FAL_KEY is not set on this deployment.",
      fix: "Add FAL_KEY in the Vercel project's environment variables (fal.ai → Dashboard → Keys), then redeploy — environment changes only reach a new deployment.",
    });
  }

  let status = 0;
  let body = "";
  try {
    ({ status, body } = await falProbe());
  } catch (e) {
    return NextResponse.json({
      ok: false,
      key: shape,
      verdict: `Could not reach fal at all: ${(e as Error).message}`,
      fix: "This is a network problem from the deployment, not a key problem.",
    });
  }

  // 404 is the good answer: authenticated, and the request id is unknown.
  if (status === 404 || status === 400) {
    return NextResponse.json({ ok: true, key: shape, status, verdict: "FAL_KEY is valid and accepted." });
  }
  if (status === 401 || status === 403) {
    return NextResponse.json({
      ok: false, key: shape, status, body,
      verdict: "fal rejected this key.",
      fix: "Generate a fresh key at fal.ai → Dashboard → Keys and replace FAL_KEY, then redeploy. Paste the key alone — no quotes, no 'Key ' prefix, no trailing newline.",
    });
  }
  if (status === 402) {
    return NextResponse.json({
      ok: false, key: shape, status,
      verdict: "The key is valid but the fal account is out of credit.",
      fix: "Top up the balance at fal.ai → Billing.",
    });
  }
  return NextResponse.json({ ok: false, key: shape, status, body, verdict: "Unexpected response from fal." });
}
