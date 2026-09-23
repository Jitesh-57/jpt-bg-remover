import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminSupabase } from "@/lib/auth";

/**
 * free-trial.server.ts — the one-time signup credit grant, per country.
 *
 * The rules live in `trial_countries` (edited at /admin/trials) and the grant
 * itself is the `claim_signup_trial` database function, which does the check,
 * the one-time claim and the credit in a single transaction. This file only
 * decides whether to ask:
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

/** Grants the trial if this user qualifies. Returns the credits granted (0 when not). */
export async function claimSignupTrial(user: Pick<User, "id" | "email" | "created_at" | "email_confirmed_at">, req: NextRequest | Request): Promise<number> {
  try {
    if (!user.email || !user.email_confirmed_at) return 0;
    const created = Date.parse(user.created_at);
    if (!Number.isFinite(created) || Date.now() - created > TRIAL_WINDOW_MIN * 60_000) return 0;
    const country = requestCountry(req);
    if (!country) return 0;

    const { data, error } = await createAdminSupabase().rpc("claim_signup_trial", {
      p_user_id: user.id,
      p_email_key: emailKey(user.email),
      p_email: user.email,
      p_country: country,
    });
    if (error) {
      console.error("[free-trial] claim failed:", error.message);
      return 0;
    }
    const granted = typeof data === "number" ? data : 0;
    if (granted > 0) console.log(`[free-trial] +${granted} credits to ${user.id} (${country})`);
    return granted;
  } catch (e) {
    console.error("[free-trial] claim failed:", (e as Error).message);
    return 0;
  }
}

/** True when the account is new enough that claiming is worth a database call. */
export function isFreshSignup(user: Pick<User, "created_at">): boolean {
  const created = Date.parse(user.created_at);
  return Number.isFinite(created) && Date.now() - created <= TRIAL_WINDOW_MIN * 60_000;
}
