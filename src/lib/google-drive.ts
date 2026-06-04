/**
 * google-drive.ts — re-exports auth helpers + keeps Drive utilities
 * All auth logic now lives in src/lib/auth.ts
 */

export {
  SESSION_COOKIE,
  FREE_CREDITS,
  CREDIT_COST,
  makeToken,
  readToken as getSession,
  setSessionCookie,
  clearSessionCookie,
  checkAuth,
  withCredits,
  getKVUser,
  upsertKVUser,
  updateKVCredits,
  ecAvailable,
  type GoogleSession,
  type SessionPayload,
  type KVUser,
} from "./auth";

import { NextRequest, NextResponse } from "next/server";

// ── Legacy alias ──────────────────────────────────────────────────────────────
export const GOOGLE_COOKIE = "jpt-sess";

/** @deprecated use setSessionCookie from auth.ts */
export function setSession(res: NextResponse, _s: object): void {
  // no-op — legacy callers upgraded; kept so old imports don't crash
  void res; void _s;
}

/** @deprecated use checkAuth from auth.ts */
export function hasCredits(): boolean { return true; }

/** @deprecated */
export function deductCredits<T>(s: T): T { return s; }

// ─── Google Drive helpers (kept for history / optional save-to-drive) ─────────

const FOLDER_NAME = "JPT AI";

export async function getToken(req: NextRequest): Promise<string | null> {
  // Google Drive access tokens are no longer stored in sessions.
  // Return null so Drive routes fail gracefully.
  void req;
  return null;
}

export async function getDriveFolderId(token: string): Promise<string> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`
  );
  const sr = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
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

export async function saveToDrive(
  token: string,
  dataUrl: string,
  name: string,
  meta: Record<string, string>
): Promise<{ id: string; name: string } | null> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mimeType, b64] = match;
    const buffer   = Buffer.from(b64, "base64");
    const folderId = await getDriveFolderId(token);
    const boundary = `b_${Date.now()}`;
    const metaJson = JSON.stringify({
      name: `${name}.${mimeType.includes("png") ? "png" : "jpg"}`,
      parents: [folderId],
      description: JSON.stringify({ ...meta, savedAt: Date.now() }),
    });
    const textPart = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const endPart = Buffer.from(`\r\n--${boundary}--`);
    const body    = Buffer.concat([textPart, buffer, endPart]);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as { id: string; name: string };
  } catch { return null; }
}
