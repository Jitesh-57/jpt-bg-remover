/**
 * auth.ts — Supabase-based auth + credit management
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const FREE_CREDITS = 10;
export const CREDIT_COST = 2;
export const FREE_TOOLS = ["resize", "color-adjust", "basic-upscale"];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KVUser {
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "email";
  passwordHash?: string;
  credits: number;
  createdAt: number;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "email";
  credits: number;
  iat: number;
  exp: number;
}

export type GoogleSession = SessionPayload;

// ─── Supabase availability ────────────────────────────────────────────────────

export const ecAvailable = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Legacy alias — kept for backward compat
export const SESSION_COOKIE = "jpt-sess";

// ─── Server-side Supabase clients ─────────────────────────────────────────────

function createRequestSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

function createAdminSupabase() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── checkAuth / withCredits ──────────────────────────────────────────────────

export async function checkAuth(req: NextRequest): Promise<
  { session: null; error: NextResponse } | { session: GoogleSession; error: null }
> {
  if (!ecAvailable) {
    return { session: null, error: NextResponse.json({ error: "Auth not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." }, { status: 503 }) };
  }

  const supabase = createRequestSupabase(req);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    return { session: null, error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, name, picture")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits ?? FREE_CREDITS;

  return {
    session: {
      userId: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email!.split("@")[0],
      picture: profile?.picture || user.user_metadata?.avatar_url,
      provider: (user.app_metadata?.provider || "email") as "google" | "email",
      credits,
      iat: 0,
      exp: 0,
    },
    error: null,
  };
}

export async function withCredits(
  body: object,
  session: GoogleSession,
  cost = CREDIT_COST
): Promise<NextResponse> {
  if (session.credits < cost) {
    return NextResponse.json({ error: "No credits remaining.", credits: session.credits }, { status: 402 });
  }
  const newCredits = Math.max(0, session.credits - cost);

  if (ecAvailable && session.userId) {
    try {
      const admin = createAdminSupabase();
      await admin.from("profiles").update({ credits: newCredits }).eq("id", session.userId);
    } catch (e) {
      console.error("[withCredits] update failed:", e);
    }
  }

  return NextResponse.json({ ...body, credits: newCredits });
}

// ─── Legacy stubs (kept for google-drive.ts re-exports) ──────────────────────

export async function getKVUser(_email: string): Promise<KVUser | null> { return null; }
export async function upsertKVUser(data: Omit<KVUser, "createdAt" | "credits"> & { credits?: number }): Promise<KVUser> {
  return { ...data, credits: data.credits ?? FREE_CREDITS, createdAt: Date.now(), passwordHash: data.passwordHash };
}
export async function updateKVCredits(_email: string, _credits: number): Promise<void> {}
export function makeToken(_payload: object): string { return ""; }
export function readToken(_req: NextRequest): SessionPayload | null { return null; }
export function setSessionCookie(_res: NextResponse, _payload: object): void {}
export function clearSessionCookie(_res: NextResponse): void {}
