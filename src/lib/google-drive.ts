import { NextRequest, NextResponse } from "next/server";

export const GOOGLE_COOKIE = "g-sess";
export const FREE_CREDITS = 10;
export const CREDIT_COST = 2;

export interface GoogleSession {
  access_token: string;
  refresh_token: string;
  email: string;
  name: string;
  picture?: string;
  expires_at: number;
  credits: number; // starts at FREE_CREDITS
}

export function getSession(req: NextRequest): GoogleSession | null {
  const v = req.cookies.get(GOOGLE_COOKIE)?.value;
  if (!v) return null;
  try {
    const s = JSON.parse(Buffer.from(v, "base64").toString("utf8")) as GoogleSession;
    if (s.credits === undefined) s.credits = FREE_CREDITS;
    return s;
  } catch { return null; }
}

export function setSession(res: NextResponse, s: GoogleSession): void {
  res.cookies.set(GOOGLE_COOKIE, Buffer.from(JSON.stringify(s)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
}

export async function getToken(req: NextRequest, res?: NextResponse): Promise<string | null> {
  let s = getSession(req);
  if (!s) return null;
  if (Date.now() < s.expires_at) return s.access_token;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: s.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) return null;
  const d = (await r.json()) as { access_token: string; expires_in: number };
  s = { ...s, access_token: d.access_token, expires_at: Date.now() + (d.expires_in - 60) * 1000 };
  if (res) setSession(res, s);
  return s.access_token;
}

// ── Credit helpers ─────────────────────────────────────────────────────────────

export function hasCredits(session: GoogleSession, cost = CREDIT_COST): boolean {
  return (session.credits ?? FREE_CREDITS) >= cost;
}

export function deductCredits(session: GoogleSession, cost = CREDIT_COST): GoogleSession {
  return { ...session, credits: Math.max(0, (session.credits ?? FREE_CREDITS) - cost) };
}

/** Call at the start of every transformation route. Returns error response or null. */
export function checkAuth(req: NextRequest): { session: null; error: NextResponse } | { session: GoogleSession; error: null } {
  const session = getSession(req);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  if (!hasCredits(session)) {
    return { session: null, error: NextResponse.json({ error: "No credits remaining. You've used all your free credits.", credits: 0 }, { status: 402 }) };
  }
  return { session, error: null };
}

/** Wrap a successful transformation result with updated cookie + credits. */
export function withCredits(body: object, session: GoogleSession, cost = CREDIT_COST): NextResponse {
  const updated = deductCredits(session, cost);
  const res = NextResponse.json({ ...body, credits: updated.credits });
  setSession(res, updated);
  return res;
}

// ── Google Drive (kept for backwards compat but no longer actively used) ────────

const FOLDER_NAME = "JPT AI";

export async function getDriveFolderId(token: string): Promise<string> {
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const sr = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sd = (await sr.json()) as { files: { id: string }[] };
  if (sd.files?.length) return sd.files[0].id;

  const cr = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const cd = (await cr.json()) as { id: string };
  return cd.id;
}

export async function saveToDrive(token: string, dataUrl: string, name: string, meta: Record<string, string>): Promise<{ id: string; name: string } | null> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mimeType, b64] = match;
    const buffer = Buffer.from(b64, "base64");
    const folderId = await getDriveFolderId(token);

    const boundary = `b_${Date.now()}`;
    const metaJson = JSON.stringify({
      name: `${name}.${mimeType.includes("png") ? "png" : "jpg"}`,
      parents: [folderId],
      description: JSON.stringify({ ...meta, savedAt: Date.now() }),
    });
    const textPart = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const endPart = Buffer.from(`\r\n--${boundary}--`);
    const body = Buffer.concat([textPart, buffer, endPart]);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body }
    );
    if (!res.ok) return null;
    return (await res.json()) as { id: string; name: string };
  } catch { return null; }
}
