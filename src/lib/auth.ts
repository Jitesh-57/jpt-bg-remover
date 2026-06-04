/**
 * auth.ts — Central auth + user store
 *
 * Session: signed HMAC-SHA256 token in httpOnly cookie "jpt-sess"
 *
 * User storage: Vercel Edge Config
 *   - Read:  EDGE_CONFIG env var (via @vercel/edge-config SDK — ultra-fast)
 *   - Write: Vercel REST API PATCH /v1/edge-config/{id}/items
 *   - Keys:  "user:{email}" → KVUser JSON object
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const SESSION_COOKIE = "jpt-sess";
export const FREE_CREDITS    = 10;
export const CREDIT_COST     = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KVUser {
  email:         string;
  name:          string;
  picture?:      string;
  provider:      "google" | "email";
  passwordHash?: string;
  credits:       number;
  createdAt:     number;
}

export interface SessionPayload {
  email:    string;
  name:     string;
  picture?: string;
  provider: "google" | "email";
  credits:  number;
  iat:      number;
  exp:      number;
}

// Backward-compat alias used by AI routes
export type GoogleSession = SessionPayload;

// ─── Edge Config helpers ──────────────────────────────────────────────────────

const EC_ID    = process.env.EDGE_CONFIG_ID;
const EC_TOKEN = process.env.VERCEL_WRITE_TOKEN;
const EC_TEAM  = process.env.VERCEL_TEAM_ID;

// The EDGE_CONFIG env var contains the full URL with read token — use it for reads
const EC_READ_URL = process.env.EDGE_CONFIG; // e.g. https://edge-config.vercel.com/ecfg_...?token=...

export const ecAvailable = !!(EC_ID && EC_READ_URL);

/**
 * Edge Config keys must match [a-zA-Z0-9_-].
 * Encode arbitrary strings as "u_" + base64url (no padding).
 */
function ecKey(raw: string): string {
  return "u_" + Buffer.from(raw).toString("base64url");
}

/** Read a single item from Edge Config REST API */
async function ecGet<T>(key: string): Promise<T | null> {
  if (!EC_ID) return null;
  const token = EC_READ_URL?.split("token=")[1];
  if (!token) return null;
  try {
    const r = await fetch(
      `https://edge-config.vercel.com/${EC_ID}/item/${encodeURIComponent(key)}?token=${token}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

/** Write / upsert items in Edge Config via Vercel REST API */
async function ecSet(key: string, value: unknown): Promise<boolean> {
  if (!EC_ID || !EC_TOKEN) return false;
  try {
    const url = EC_TEAM
      ? `https://api.vercel.com/v1/edge-config/${EC_ID}/items?teamId=${EC_TEAM}`
      : `https://api.vercel.com/v1/edge-config/${EC_ID}/items`;
    const r = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${EC_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [{ operation: "upsert", key, value }] }),
    });
    return r.ok;
  } catch { return false; }
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

export async function getKVUser(email: string): Promise<KVUser | null> {
  return ecGet<KVUser>(ecKey(`user:${email.toLowerCase()}`));
}

export async function upsertKVUser(
  data: Omit<KVUser, "createdAt" | "credits"> & { credits?: number }
): Promise<KVUser> {
  const existing = await getKVUser(data.email);
  const user: KVUser = {
    email:        data.email.toLowerCase(),
    name:         data.name  || existing?.name  || data.email.split("@")[0],
    picture:      data.picture ?? existing?.picture,
    provider:     data.provider || existing?.provider || "email",
    passwordHash: data.passwordHash !== undefined ? data.passwordHash : existing?.passwordHash,
    credits:      existing?.credits ?? data.credits ?? FREE_CREDITS,
    createdAt:    existing?.createdAt || Date.now(),
  };
  await ecSet(ecKey(`user:${user.email}`), user);
  return user;
}

export async function updateKVCredits(email: string, credits: number): Promise<void> {
  const user = await getKVUser(email);
  if (user) await ecSet(ecKey(`user:${email.toLowerCase()}`), { ...user, credits });
}

// ─── Token signing ────────────────────────────────────────────────────────────

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify<T>(token: string): T | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  try {
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T;
  } catch { return null; }
}

// ─── Session cookie ───────────────────────────────────────────────────────────

export function makeToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000);
  return sign({ ...payload, iat: now, exp: now + 60 * 60 * 24 * 60 });
}

export function readToken(req: NextRequest): SessionPayload | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const p = verify<SessionPayload>(raw);
  if (!p || p.exp < Math.floor(Date.now() / 1000)) return null;
  return p;
}

export function setSessionCookie(
  res: NextResponse,
  payload: Omit<SessionPayload, "iat" | "exp">
): void {
  res.cookies.set(SESSION_COOKIE, makeToken(payload), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 60,
    path:     "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}

// ─── checkAuth / withCredits (used by every AI route) ────────────────────────

export async function checkAuth(req: NextRequest): Promise<
  { session: null; error: NextResponse } | { session: GoogleSession; error: null }
> {
  const token = readToken(req);
  if (!token) {
    return { session: null, error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  // Fetch fresh credits from Edge Config if available
  let credits = token.credits;
  if (ecAvailable) {
    const u = await getKVUser(token.email);
    if (u) credits = u.credits;
  }

  if (credits < CREDIT_COST) {
    return {
      session: null,
      error: NextResponse.json({ error: "No credits remaining.", credits: 0 }, { status: 402 }),
    };
  }

  return { session: { ...token, credits }, error: null };
}

export async function withCredits(
  body: object,
  session: GoogleSession,
  cost = CREDIT_COST
): Promise<NextResponse> {
  const newCredits = Math.max(0, session.credits - cost);

  // Persist in Edge Config
  if (ecAvailable) await updateKVCredits(session.email, newCredits);

  // Refresh cookie so client sees updated credits
  const res = NextResponse.json({ ...body, credits: newCredits });
  setSessionCookie(res, { ...session, credits: newCredits });
  return res;
}
