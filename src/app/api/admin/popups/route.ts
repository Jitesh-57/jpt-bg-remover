import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { cleanPopups, readPopupsNow, writePopups } from "@/lib/popups.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/popups — the pop-up settings (lib/popups.ts).
 *
 *   GET                   the saved settings, uncached
 *   POST { doc }          replace them with admin's copy, cleaned (popups.server.ts)
 *
 * ?token= on every call. Pictures are uploaded through /api/admin/page-edits
 * (action "upload"), which stores a WebP and returns its address.
 */

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json(await readPopupsNow());
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { doc?: unknown } | null;
  if (!body?.doc) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const doc = cleanPopups(body.doc);
  const saved = await writePopups(doc);
  return saved.ok ? NextResponse.json(doc) : NextResponse.json({ error: saved.error }, { status: 502 });
}
