/**
 * auth.ts — Trial system for free users, credit system for paid plans
 *
 * Plans:
 *   free     → 5 lifetime free trials total, max ONE trial per distinct tool/app,
 *              plus unlimited free basic (non-AI) upscale and resize/adjust
 *   starter  → 50 paid credits, all tools
 *   creator  → 100 paid credits, all tools
 *   pro      → 300 paid credits, all tools
 *
 * Costs (paid plans only — free plan uses the trial system below):
 *   resize / color-adjust / basic-upscale → 0 credits (always free, everyone)
 *   AI tools                              → 2 credits (paid users only)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export const FREE_CREDITS = 10;
export const DAILY_FREE_CREDITS = 10;
export const CREDIT_COST = 2;
export const BASIC_UPSCALE_COST = 1;
export const FREE_TOOLS = ["resize", "color-adjust"];
export const FREE_TRIAL_LIMIT = 5;

// When true, AI (Gemini) tools are paid-plan-only and free users get the
// upgrade popup. Used as a temporary switch while Gemini billing was inactive.
// Billing is now on the paid tier, so the normal 5-free-trial system is back on.
export const AI_TOOLS_PAID_ONLY = false;

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
  trialToolsUsed: string[]; trialsRemaining: number;
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

// ─── Free-trial tracking (replaces the old daily-credit grant) ───────────────
//
// Free-plan users get FREE_TRIAL_LIMIT (5) lifetime trials, max one per distinct
// toolId, tracked in Supabase Auth user_metadata.trial_tools_used (a string[]).
// This avoids a DB schema change, same approach as the old single-trial flag.

async function getUserMetadata(
  admin: ReturnType<typeof createAdminSupabase>,
  userId: string
): Promise<Record<string, unknown>> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.user_metadata || {};
  } catch {
    return {};
  }
}

export async function getTrialToolsUsed(
  admin: ReturnType<typeof createAdminSupabase>,
  userId: string
): Promise<string[]> {
  const metadata = await getUserMetadata(admin, userId);
  const used = metadata.trial_tools_used;
  return Array.isArray(used) ? used.filter((t): t is string => typeof t === "string") : [];
}

async function markTrialToolUsed(
  admin: ReturnType<typeof createAdminSupabase>,
  userId: string,
  toolId: string
): Promise<void> {
  try {
    const currentMetadata = await getUserMetadata(admin, userId);
    const trialToolsUsed = Array.isArray(currentMetadata.trial_tools_used)
      ? (currentMetadata.trial_tools_used as unknown[]).filter((t): t is string => typeof t === "string")
      : [];
    if (trialToolsUsed.includes(toolId)) return; // already recorded, avoid duplicate
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...currentMetadata, trial_tools_used: [...trialToolsUsed, toolId] },
    });
  } catch (e) {
    console.warn("[auth] could not record trial usage:", (e as Error).message);
  }
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
    .select("credits, plan, name, picture")
    .eq("id", user.id)
    .single() as { data: ProfileRow | null };

  const plan: Plan = (profile?.plan as Plan) || "free";
  let credits: number;

  if (!profile) {
    // No profile row — create one now so future updates have a target.
    // Free-plan users no longer get a daily credit grant; their free usage
    // is governed by the trial system (see getTrialToolsUsed/withCredits).
    credits = 0;
    await admin.from("profiles").upsert({
      id: user.id,
      name: user.user_metadata?.name || user.email!.split("@")[0],
      picture: user.user_metadata?.avatar_url || null,
      credits: 0,
      plan: "free",
    }, { onConflict: "id" });
  } else {
    credits = profile.credits ?? 0;
  }

  const trialToolsUsedRaw = user.user_metadata?.trial_tools_used;
  const trialToolsUsed: string[] = Array.isArray(trialToolsUsedRaw)
    ? trialToolsUsedRaw.filter((t): t is string => typeof t === "string")
    : [];

  return {
    session: {
      userId: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email!.split("@")[0],
      picture: profile?.picture || user.user_metadata?.avatar_url,
      provider: (user.app_metadata?.provider || "email") as "google" | "email",
      credits,
      plan,
      trialToolsUsed,
      trialsRemaining: Math.max(0, FREE_TRIAL_LIMIT - trialToolsUsed.length),
      iat: 0, exp: 0,
    },
    error: null,
  };
}

// ─── withCredits ──────────────────────────────────────────────────────────────
//
//  toolType:
//    "free"            → no charge, no plan restriction (resize, color-adjust)
//    "basic"           → always free, unlimited, no plan restriction (normal upscale)
//    "ai" / "standard" → paid plans: 2 credits from their purchased balance.
//                        free plan: governed by the 5-distinct-tool trial system
//                        — requires `toolId` to identify which tool/app this is.

export async function withCredits(
  body: object,
  session: GoogleSession,
  toolType: "free" | "basic" | "standard" | "ai" = "ai",
  req?: NextRequest,
  toolId?: string
): Promise<NextResponse> {
  if (toolType === "free" || toolType === "basic") {
    return NextResponse.json({ ...body, credits: session.credits });
  }

  // Paid plans: unchanged — deduct from their purchased credit balance.
  if (session.plan !== "free") {
    const cost = CREDIT_COST;
    if (session.credits < cost) {
      return NextResponse.json({
        error: "No credits remaining. Purchase more to continue.",
        credits: session.credits,
        upgradeRequired: false,
      }, { status: 402 });
    }
    const newCredits = Math.max(0, session.credits - cost);
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
      if (userErr) console.error("[withCredits] user-auth upsert also failed:", userErr.message);
    }
    return NextResponse.json({ ...body, credits: newCredits });
  }

  // Paid-only mode: free users get the upgrade popup instead of a free trial.
  if (AI_TOOLS_PAID_ONLY) {
    return NextResponse.json({
      error: "AI tools are currently available on paid plans only. Upgrade to continue.",
      upgradeRequired: true,
      credits: session.credits,
    }, { status: 403 });
  }

  // Free plan: gated by the 5-distinct-tool trial system.
  if (!toolId) {
    console.error("[withCredits] missing toolId for free-plan ai/standard request");
    return NextResponse.json({
      error: "This feature requires a paid plan. Upgrade to use AI transformations.",
      upgradeRequired: true,
      credits: session.credits,
    }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const trialToolsUsed = await getTrialToolsUsed(admin, session.userId);

  if (trialToolsUsed.includes(toolId)) {
    return NextResponse.json({
      error: "You've already used your free trial for this tool. Upgrade to keep using it.",
      upgradeRequired: true,
      trialUsed: true,
      credits: session.credits,
      trialsRemaining: Math.max(0, FREE_TRIAL_LIMIT - trialToolsUsed.length),
    }, { status: 403 });
  }

  if (trialToolsUsed.length >= FREE_TRIAL_LIMIT) {
    return NextResponse.json({
      error: `You've used all ${FREE_TRIAL_LIMIT} free trials. Upgrade to a paid plan to keep creating.`,
      upgradeRequired: true,
      trialUsed: true,
      credits: session.credits,
      trialsRemaining: 0,
    }, { status: 403 });
  }

  await markTrialToolUsed(admin, session.userId, toolId);

  return NextResponse.json({
    ...body,
    credits: session.credits,
    trial: true,
    trialsRemaining: Math.max(0, FREE_TRIAL_LIMIT - (trialToolsUsed.length + 1)),
  });
}

// ─── checkEntitlement ─────────────────────────────────────────────────────────
//
// Read-only preflight for the same gate withCredits enforces — call this
// BEFORE running the (slow, costly) AI generation so trial-exhausted/
// no-credits users get an instant rejection instead of waiting out a full
// generation only to be blocked afterwards. Mirrors withCredits' checks but
// never mutates credits/trial state; withCredits still runs after a
// successful generation to actually charge/record the trial.

export async function checkEntitlement(
  session: GoogleSession,
  toolType: "free" | "basic" | "standard" | "ai" = "ai",
  toolId?: string
): Promise<NextResponse | null> {
  if (toolType === "free" || toolType === "basic") return null;

  if (session.plan !== "free") {
    if (session.credits < CREDIT_COST) {
      return NextResponse.json({
        error: "No credits remaining. Purchase more to continue.",
        credits: session.credits,
        upgradeRequired: false,
      }, { status: 402 });
    }
    return null;
  }

  // Paid-only mode: free users get the upgrade popup instead of a free trial.
  if (AI_TOOLS_PAID_ONLY) {
    return NextResponse.json({
      error: "AI tools are currently available on paid plans only. Upgrade to continue.",
      upgradeRequired: true,
      credits: session.credits,
    }, { status: 403 });
  }

  if (!toolId) {
    return NextResponse.json({
      error: "This feature requires a paid plan. Upgrade to use AI transformations.",
      upgradeRequired: true,
      credits: session.credits,
    }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const trialToolsUsed = await getTrialToolsUsed(admin, session.userId);

  if (trialToolsUsed.includes(toolId)) {
    return NextResponse.json({
      error: "You've already used your free trial for this tool. Upgrade to keep using it.",
      upgradeRequired: true,
      trialUsed: true,
      credits: session.credits,
      trialsRemaining: Math.max(0, FREE_TRIAL_LIMIT - trialToolsUsed.length),
    }, { status: 403 });
  }

  if (trialToolsUsed.length >= FREE_TRIAL_LIMIT) {
    return NextResponse.json({
      error: `You've used all ${FREE_TRIAL_LIMIT} free trials. Upgrade to a paid plan to keep creating.`,
      upgradeRequired: true,
      trialUsed: true,
      credits: session.credits,
      trialsRemaining: 0,
    }, { status: 403 });
  }

  return null;
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
