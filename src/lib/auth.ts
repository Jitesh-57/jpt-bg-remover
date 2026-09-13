/**
 * auth.ts — credit system.
 *
 * Pure credit model (see lib/plans.ts): credits are bought in one-time packs,
 * never expire, and are spent per AI generation. There is no free trial for AI
 * features and no subscription.
 *
 * Costs:
 *   resize / color-adjust / basic-upscale → 0 credits, unlimited, no account needed
 *   AI tools                              → CREDIT_COST credits, requires a balance
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * Credits a new account starts with: none.
 *
 * The AI tools have no free tier — they cost real money per generation and are
 * sold as credit packs. Granting 10 at signup handed every new account five
 * free generations billed to the fal balance, which is the opposite of the
 * pricing. The browser-based tools stay free and unlimited and never touch
 * this number.
 */
export const FREE_CREDITS = 0;
// Re-exported from plans.ts so the price of a generation is defined once.
export { CREDIT_COST } from "@/lib/plans";
import { CREDIT_COST } from "@/lib/plans";
import { recordCredits } from "@/lib/ledger";
export const BASIC_UPSCALE_COST = 1;
export const FREE_TOOLS = ["resize", "color-adjust"];

// AI tools are credits-only: no free trials. Free users hit the buy-credits
// prompt on their first AI request. The on-device tools stay free for everyone.
export const AI_TOOLS_PAID_ONLY = true;

export type Plan = "free" | "starter" | "creator" | "pro" | "unlimited";

// The one-time "Unlimited" purchase grants unlimited access for 30 days (no
// subscription). The expiry is stored in Supabase Auth user_metadata
// (unlimited_expires_at) to avoid a DB schema change. Once past, the effective
// plan falls back to "free".
export const UNLIMITED_DAYS = 30;

export function resolveUnlimited(
  profilePlan: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
): { plan: Plan; expiresAt: string | null } {
  const base = (profilePlan as Plan) || "free";
  if (base !== "unlimited") return { plan: base, expiresAt: null };
  const exp = metadata?.unlimited_expires_at;
  if (typeof exp === "string" && new Date(exp).getTime() > Date.now()) {
    return { plan: "unlimited", expiresAt: exp };
  }
  return { plan: "free", expiresAt: null }; // missing or expired → downgraded
}

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
  planExpiresAt?: string | null;
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

// ─── Sessions ────────────────────────────────────────────────────────────────

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

  // "unlimited" is only honoured while its 30-day window is still open.
  const { plan, expiresAt: planExpiresAt } = resolveUnlimited(profile?.plan, user.user_metadata);
  let credits: number;

  if (!profile) {
    // No profile row — create one now so future updates have a target.
    // Zero credits: AI generation is sold, never granted.
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

  return {
    session: {
      userId: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || user.email!.split("@")[0],
      picture: profile?.picture || user.user_metadata?.avatar_url,
      provider: (user.app_metadata?.provider || "email") as "google" | "email",
      credits,
      plan,
      planExpiresAt,
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

  // Pure credit model: anyone holding credits spends them, whatever their plan
  // label says. Keying off the balance rather than the plan means credits bought
  // under a legacy plan id still work, and a lapsed plan never strands them.
  if (session.credits >= CREDIT_COST) {
    const cost = CREDIT_COST;
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
    /*
      The spend is written down as well as applied.

      profiles.credits is only the current number; without a ledger there is no
      way to answer why it is that number, which is exactly the question a
      balance of 11 raised after a 5-credit pack was bought. Awaited so the row
      lands before the response, but it cannot fail the request — the credits
      have already been taken and the image has already been made.
    */
    await recordCredits({
      userId: session.userId,
      delta: -cost,
      balanceAfter: newCredits,
      reason: "generation",
      tool: toolId ?? null,
    });

    return NextResponse.json({ ...body, credits: newCredits });
  }

  /*
    No credits: the end of the line until they buy a pack.

    There is deliberately no branch below this. A five-tool free-trial system
    used to follow, unreachable because AI_TOOLS_PAID_ONLY is on — but
    "unreachable" is one constant away from "live", and the whole point of the
    pricing is that AI generation is never free. It is gone rather than
    disabled, so nothing can hand out generations that cost real money.
    The browser tools remain free and unlimited; they never reach this
    function with an "ai" toolType.
  */
  return NextResponse.json({
    error: session.credits > 0
      ? `You need ${CREDIT_COST} credits for this. Top up to continue.`
      : "AI features run on credits. Grab a pack to start — from ₹166, and they never expire.",
    upgradeRequired: true,
    credits: session.credits,
  }, { status: 402 });
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

  // Balance first, exactly as withCredits does. This preflight used to branch
  // on the plan label, which refused anyone whose plan still read "free" even
  // when they were holding credits: the 402 said "You need 2 credits" while
  // its own payload reported a balance of 10, because the charge path is a
  // pure credit model and this check was not. Credits are credits.
  if (session.credits >= CREDIT_COST) return null;

  if (session.plan !== "free") {
    return NextResponse.json({
      error: "No credits remaining. Purchase more to continue.",
      credits: session.credits,
      upgradeRequired: false,
    }, { status: 402 });
  }

  // No credits: the packs are the only way forward. See withCredits for why
  // there is no trial branch here either.
  return NextResponse.json({
    error: session.credits > 0
      ? `You need ${CREDIT_COST} credits for this. Top up to continue.`
      : "AI features run on credits. Grab a pack to start — from ₹166, and they never expire.",
    upgradeRequired: true,
    credits: session.credits,
  }, { status: 402 });
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
