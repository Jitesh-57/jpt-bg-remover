import { NextRequest, NextResponse } from "next/server";
import { getToken, saveToDrive, setSession, getSession } from "@/lib/google-drive";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: false });
  const s = getSession(req);
  const token = await getToken(req, res);
  if (!token || !s) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (token !== s.access_token) setSession(res, { ...s, access_token: token });

  const { dataUrl, name, meta } = (await req.json()) as {
    dataUrl: string;
    name: string;
    meta?: Record<string, string>;
  };

  if (!dataUrl || !name) return NextResponse.json({ error: "dataUrl and name required" }, { status: 400 });

  const file = await saveToDrive(token, dataUrl, name, meta || {});
  if (!file) return NextResponse.json({ error: "Drive save failed" }, { status: 500 });

  const okRes = NextResponse.json({ ok: true, id: file.id, name: file.name });
  const s2 = getSession(req);
  if (token !== s2?.access_token) setSession(okRes, { ...s!, access_token: token });
  return okRes;
}
