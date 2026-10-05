import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { readDocs, writeDocs, type Docs } from "@/lib/launchpilot/store.server";
import { aiAvailable } from "@/lib/launchpilot/ai.server";

export const dynamic = "force-dynamic";

/** The signed-in user's LaunchPilot data. 401 when signed out. */
export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;
  try {
    const { docs } = await readDocs(session.userId);
    return NextResponse.json({ user: { name: session.name, email: session.email, picture: session.picture || null }, docs, aiAvailable: aiAvailable() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

const MAX_BYTES = 4 * 1024 * 1024;

/** Replaces the user's data with the posted documents. */
export async function PUT(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Your data is too large to save (over 4 MB)." }, { status: 413 });
  let body: { docs?: Docs };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body.docs || typeof body.docs !== "object" || Array.isArray(body.docs)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    await writeDocs(session.userId, body.docs);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
