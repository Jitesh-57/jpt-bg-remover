/**
 * auth.ts — Credit system with daily reset for free users and paid plans
 *
 * Plans:
 *   free     → 10 daily credits (auto-reset every 24h), basic tools only
 *   starter  → 50 paid credits, all tools
 *   creator  → 100 paid credits, all tools
 *   pro      → 300 paid credits, all tools
 *
 * Costs:
 *   resize / color-adjust  → 0 credits (always free)
 *   basic-upscale          → 1 credit  (free & paid users)
 *   AI tools               → 2 credits (paid users only)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const FREE_CREDITS = 10;
export const DAILY_FREE_CREDITS = 10;
export const CREDIT_COST = 2;
export const BASIC_UPSCALE_COST = 1;
export const FREE_TOOLS = ["resize", "color-adjust"];

export type Plan = "free" | "starter" | "creator" | "pro";

export interface ProfileRow {
  credits: number;
  plan: Plan;
  daily_credits_reset_at: string | null;
  name: string;
  picture?: string;
}

export interface KVUser {
  email: string; name: string; picture?: string;
  provider: "google" | "email"; passwordHash?: string;
  credits: number; createdAt: number;
}

export interface SessionPayload {
  userId: string; email: string; name: string; picture?: string;
  provider: "google" | "email"; credits: number; plan: Plan;
  iat: number; exp: number;
}
export type GoogleSession = SessionPayload;

export const ecAvailable = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const SESSION_COOKIE = "jpt-sess";

// ─── Supabase clients ─────────────────────────────────────────────────────────

function createRequestSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
}

export function createAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    // Without the service role key, DB writes are blocked by RLS — credits won't save!
    console.error("[auth] SUPABASE_SERVICE_ROLE_KEY is not set. Credit updates will fail silently.");
  }
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── Daily credit reset ───────────────────────────────────────────────────────

async function maybeResetDailyCredits(
  userId: string,
  profile: ProfileRow,
  admin: ReturnType<typeof createAdminSupabase>
): Promise<number> {
  if (profile.plan !== "free") return profile.credits;

  const now = Date.now();

  // If daily_credits_reset_at is null, just stamp it now — don't reset credits
  if (!profile.daily_credits_reset_at) {
    await admin.from("profiles").upsert({
      id: userId, daily_credits_reset_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return profile.credits;
  }

  const resetAt = new Date(profile.daily_credits_reset_at).getTime();
  const hoursSince = (now - resetAt) / 3_600_000;

  if (hoursSince >= 24) {
    await admin.from("profiles").upsert({
      id: userId, credits: DAILY_FREE_CREDITS, daily_credits_reset_at: new Date().toISOString(),
    }, { onConflict: "id" });
    return DAILY_FREE_CREDITS;
  }
  return profile.credits;
}

// ─── checkAuth ────────────────────────────────────────────────────────────────

export async function checkAuth(req: NextRequest): Promise<
  { session: null; error: NextResponse } | { session: GoogleSession; error: null }
> {
  if (!ecAvailable) {
    return { session: null, error: NextResponse.json({ error: "Auth not configured." }, { status: 503 }) };
  }

  const supabase = createRequestSupabase(req);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return { session: null, error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  const admin = createAdminSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan, daily_credits_reset_at, name, picture")
    .eq("id", user.id)
    .single() as { data: ProfileRow | null };

  const plan: Plan = (profile?.plan as Plan) || "free";
  let credits: number;

  if (!profile) {
    // No profile row — create one now so future updates have a target
    credits = DAILY_FREE_CREDITS;
    await admin.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email!.split("@")[0],
      picture: user.user_metadata?.avatar_url || null,
      credits: DAILY_FREE_CREDITS,
      plan: "free",
      daily_credits_reset_at: new Date().toISOString(),
    }, { onConflict: "id" });
  } else {
    credits = profile.credits ?? 0;
    credits = await maybeResetDailyCredits(user.id, { ...profile, plan, credits }, admin);
  }

  return {
    session: {
      userId: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email!.split("@")[0],
      picture: profile?.picture || user.user_metadata?.avatar_url,
      provider: (user.app_metadata?.provider || "email") as "google" | "email",
      credits,
      plan,
      iat: 0, exp: 0,
    },
    error: null,
  };
}

// ─── withCredits ──────────────────────────────────────────────────────────────
//
//  toolType:
//    "free"  → no credit charge, no plan restriction
//    "basic" → 1 credit, free users OK
//    "ai"    → 2 credits, PAID users only

export async function withCredits(
  body: object,
  session: GoogleSession,
  toolType: "free" | "basic" | "standard" | "ai" = "ai",
  req?: NextRequest
): Promise<NextResponse> {
  if (toolType === "free") {
    return NextResponse.json({ ...body, credits: session.credits });
  }

  const cost = toolType === "ai" || toolType === "standard" ? CREDIT_COST : BASIC_UPSCALE_COST;

  if (toolType === "ai" && session.plan === "free") {
    return NextResponse.json({
      error: "This feature requires a paid plan. Upgrade to use AI transformations.",
      upgradeRequired: true,
      credits: session.credits,
    }, { status: 403 });
  }

  if (session.credits < cost) {
    return NextResponse.json({
      error: session.plan === "free"
        ? "Daily credits used up. They'll reset in 24 hours, or upgrade for more."
        : "No credits remaining. Purchase more to continue.",
      credits: session.credits,
      upgradeRequired: session.plan === "free",
    }, { status: 402 });
  }

  const newCredits = Math.max(0, session.credits - cost);

  // Upsert so it always writes even if the profile row doesn't exist yet
  const admin = createAdminSupabase();
  const { error: adminErr } = await admin
    .from("profiles")
    .upsert({ id: session.userId, credits: newCredits }, { onConflict: "id" });

  if (adminErr && req) {
    console.warn("[withCredits] admin upsert failed, retrying with user auth:", adminErr.message);
    const userClient = createRequestSupabase(req);
    const { error: userErr } = await userClient
      .from("profiles")
      .upsert({ id: session.userId, credits: newCredits }, { onConflict: "id" });
    if (userErr) {
      console.error("[withCredits] user-auth upsert also failed:", userErr.message);
    }
  }

  return NextResponse.json({ ...body, credits: newCredits });
}

// ─── Legacy stubs ─────────────────────────────────────────────────────────────

export async function getKVUser(_email: string): Promise<KVUser | null> { return null; }
export async function upsertKVUser(data: Omit<KVUser, "createdAt" | "credits"> & { credits?: number }): Promise<KVUser> {
  return { ...data, credits: data.credits ?? FREE_CREDITS, createdAt: Date.now(), passwordHash: data.passwordHash };
}
export async function updateKVCredits(_email: string, _credits: number): Promise<void> {}
export function makeToken(_payload: object): string { return ""; }
export function readToken(_req: NextRequest): SessionPayload | null { return null; }
export function setSessionCookie(_res: NextResponse, _payload: object): void {}
export function clearSessionCookie(_res: NextResponse): void {}
