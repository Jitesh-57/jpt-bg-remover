import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/auth";
import { recordCredits } from "@/lib/ledger";
import { WORLDWIDE } from "@/lib/trial-batches";

/**
 * free-trial.server.ts — the one-time signup credit grant, per country.
 *
 * The rules live in `trial_countries` (edited at /admin/trials) and the grant
 * the one-time claim is trial_grants' primary key (see claimSignupTrial).
 * A grant is only attempted for:
 *
 *   · a new account: created within the last TRIAL_WINDOW_MIN minutes, so
 *     existing users never get it when a country is switched on;
 *   · a confirmed email, so a made-up address can't collect credits;
 *   · a country from Vercel's own geo header. Never from a cookie or the
 *     request body, which the visitor controls.
 *
 * Never throws: a failed grant must not break signing in.
 */

const TRIAL_WINDOW_MIN = 60;

/** One inbox, one key: lowercase, no "+tag", and no dots for Gmail (which ignores them). */
export function emailKey(email: string): string {
  const [local0, domain0 = ""] = email.trim().toLowerCase().split("@");
  let domain = domain0;
  let local = local0.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** The visitor's country, as Vercel's edge saw it. Empty when unknown (e.g. local dev). */
export function requestCountry(req: NextRequest | Request): string {
  const c = (req.headers.get("x-vercel-ip-country") || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "";
}

type Why =
  | "granted" | "no-email" | "email-unconfirmed" | "not-new" | "no-country"
  | "no-live-rule" | "already-claimed" | "error";

export interface TrialAttempt { at: string; why: Why; country: string; email: string; credits?: number; detail?: string }

const LOG_PATH = "overrides/trial-log.json";
const LOG_KEEP = 40;

/** "jitesh@gmail.com" → "ji…@gmail.com": enough to recognise a test account, not to harvest one. */
function mask(email: string): string {
  const [l, d = ""] = email.split("@");
  return `${l.slice(0, 2)}…@${d}`;
}

/**
 * Keeps the last few sign-up checks, with the reason each one did or didn't
 * get a trial, so /admin/trials can show why instead of the grant failing
 * silently. Best effort: a lost log line never affects the sign-in.
 */
async function logAttempt(a: TrialAttempt): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return;
  try {
    const url = `${base}/storage/v1/object/landing/${LOG_PATH}`;
    const auth = { apikey: key, Authorization: `Bearer ${key}` };
    const cur = await fetch(`${base}/storage/v1/object/authenticated/landing/${LOG_PATH}?t=${Date.now()}`, { headers: auth, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
    const list: TrialAttempt[] = Array.isArray(cur) ? cur : [];
    // /api/auth/google/me asks on every page load in an account's first hour:
    // one line per person and outcome per hour is enough.
    const hourAgo = Date.now() - 3_600_000;
    if (list.some((x) => x.email === a.email && x.why === a.why && Date.parse(x.at) > hourAgo)) return;
    await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json", "x-upsert": "true", "Cache-Control": "no-store" },
      body: JSON.stringify([a, ...list].slice(0, LOG_KEEP)),
    });
  } catch { /* best effort */ }
}

export async function readTrialLog(): Promise<TrialAttempt[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return [];
  try {
    const r = await fetch(`${base}/storage/v1/object/authenticated/landing/${LOG_PATH}?t=${Date.now()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
    });
    const d = r.ok ? await r.json() : [];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

/**
 * Grants the trial if this user qualifies. Returns the credits granted (0 when not).
 *
 * Done as separate steps rather than one database function: the function also
 * wrote the credit ledger, and anything wrong there (a missing table, a
 * constraint) rolled the whole grant back without a trace. Here the one-time
 * claim is still enforced by the database — trial_grants' primary key — and
 * the ledger line is written afterwards, best effort.
 */
export async function claimSignupTrial(user: Pick<User, "id" | "email" | "created_at" | "email_confirmed_at">, req: NextRequest | Request): Promise<number> {
  const country = requestCountry(req);
  const email = user.email || "";
  const note = (why: Why, extra: Partial<TrialAttempt> = {}) =>
    logAttempt({ at: new Date().toISOString(), why, country: country || "?", email: email ? mask(email) : "—", ...extra });

  try {
    const created = Date.parse(user.created_at);
    if (!Number.isFinite(created) || Date.now() - created > TRIAL_WINDOW_MIN * 60_000) return 0; // existing account: not logged, it's every sign-in
    if (!email) { await note("no-email"); return 0; }
    if (!user.email_confirmed_at) { await note("email-unconfirmed"); return 0; }
    if (!country) { await note("no-country"); return 0; }

    const db = createAdminSupabase();

    // The country's own rule wins, live or stopped; the worldwide rule covers every country without one.
    const { data: rules, error: ruleErr } = await db.from("trial_countries").select("country, credits, live").in("country", [country, WORLDWIDE]) as
      { data: { country: string; credits: number; live: boolean }[] | null; error: { message: string } | null };
    if (ruleErr) { await note("error", { detail: `rules: ${ruleErr.message}` }); return 0; }
    const rule = rules?.find((r) => r.country === country) ?? rules?.find((r) => r.country === WORLDWIDE);
    if (!rule || !rule.live || !(rule.credits > 0)) { await note("no-live-rule"); return 0; }
    const credits = rule.credits;

    // Already had it (the common case on later page loads): nothing to do or log.
    const { data: had } = await db.from("trial_grants").select("user_id").eq("user_id", user.id).maybeSingle();
    if (had) return 0;

    // The once-only gate: a second insert for this inbox or this account fails on the key.
    const { error: claimErr } = await db.from("trial_grants").insert({
      email_key: emailKey(email), user_id: user.id, email, country, credits,
    });
    if (claimErr) {
      const dup = /duplicate|unique|23505/i.test(`${claimErr.message} ${(claimErr as { code?: string }).code ?? ""}`);
      await note(dup ? "already-claimed" : "error", dup ? {} : { detail: `claim: ${claimErr.message}` });
      return 0;
    }

    // Add the credits. The profile may not exist yet on the very first sign-in.
    const { data: prof } = await db.from("profiles").select("credits").eq("id", user.id).maybeSingle() as { data: { credits: number | null } | null };
    const balance = (prof?.credits ?? 0) + credits;
    const { error: credErr } = prof
      ? await db.from("profiles").update({ credits: balance }).eq("id", user.id)
      : await db.from("profiles").upsert({ id: user.id, email, credits: balance, plan: "free" }, { onConflict: "id" });
    if (credErr) {
      // Give the slot back so the person can get the trial on their next sign-in.
      await db.from("trial_grants").delete().eq("user_id", user.id);
      await note("error", { detail: `credits: ${credErr.message}` });
      return 0;
    }

    await recordCredits({ userId: user.id, delta: credits, balanceAfter: balance, reason: "signup_grant", note: `Free trial: ${country}${rule.country === WORLDWIDE ? " (worldwide)" : ""}` });
    await note("granted", { credits });
    console.log(`[free-trial] +${credits} credits to ${user.id} (${country})`);
    return credits;
  } catch (e) {
    await note("error", { detail: (e as Error).message });
    console.error("[free-trial] claim failed:", (e as Error).message);
    return 0;
  }
}

/** True when the account is new enough that claiming is worth a database call. */
export function isFreshSignup(user: Pick<User, "created_at">): boolean {
  const created = Date.parse(user.created_at);
  return Number.isFinite(created) && Date.now() - created <= TRIAL_WINDOW_MIN * 60_000;
}

/**
 * Remembers where an account signed up from (the first country seen) and
 * where it last signed in from, for the "Which countries buy" table.
 * Best effort and never throws: a missing table must not break signing in.
 */
export async function rememberCountry(userId: string, req: NextRequest | Request): Promise<void> {
  const country = requestCountry(req);
  if (!country || !userId) return;
  try {
    const db = createAdminSupabase();
    const now = new Date().toISOString();
    await db.from("user_countries").upsert({ user_id: userId, signup_country: country, last_country: country }, { onConflict: "user_id", ignoreDuplicates: true });
    await db.from("user_countries").update({ last_country: country, last_seen: now }).eq("user_id", userId);
  } catch { /* best effort */ }
}

/** The country a purchase was paid from. Best effort, like rememberCountry. */
export async function rememberPurchaseCountry(purchaseId: number, userId: string, req: NextRequest | Request): Promise<void> {
  const country = requestCountry(req);
  if (!country || !purchaseId) return;
  try {
    await createAdminSupabase().from("purchase_countries").upsert({ purchase_id: purchaseId, user_id: userId, country }, { onConflict: "purchase_id", ignoreDuplicates: true });
  } catch { /* best effort */ }
}
