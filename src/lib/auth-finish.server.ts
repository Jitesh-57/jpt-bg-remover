import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { claimSignupTrial, isFreshSignup, rememberCountry } from "@/lib/free-trial.server";
import { linkVisitor, recordAcquisition } from "@/lib/acquisition.server";

/**
 * Everything that happens once someone has a session, whichever way they got
 * it: the OAuth callback, or Google One Tap (/api/auth/onetap).
 *
 *   · the profile row, created on the first sign-in;
 *   · the one-time signup trial, where it applies;
 *   · where the account came from, and this browser's earlier visits;
 *   · two one-shot cookies for the page they land on: `jpt_trial` (free
 *     credits granted) and `jpt_signup` (a new account, for SignupWelcome to
 *     count once in GA and Google Ads).
 *
 * `supabase` must be the user's own session client: the profile insert goes
 * through row-level security as them.
 */
export async function finishSignIn(
  supabase: SupabaseClient,
  user: User,
  request: NextRequest,
  response: NextResponse,
): Promise<{ newAccount: boolean; granted: number }> {
  let newAccount = false;
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (!existing) {
    newAccount = true;
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0],
      picture: user.user_metadata?.avatar_url,
      // No free AI credits on signup. The pricing is explicit that AI has no
      // free tier, and the gate is balance-based, so granting 10 here handed
      // every new account five free generations billed to the fal balance.
      // The one-time trial below is the controlled way in (see /admin/trials).
      credits: 0,
    });
  } else {
    await supabase.from("profiles").update({
      email: user.email,
      picture: user.user_metadata?.avatar_url,
    }).eq("id", user.id);
  }
  // A new account from a country with a live free trial gets its one-time credits.
  // Where a new account came from (first touch, location, device), and this
  // browser's earlier anonymous activity, now that we know whose it is.
  const [granted] = await Promise.all([
    claimSignupTrial(user, request),
    rememberCountry(user.id, request),
    isFreshSignup(user) ? recordAcquisition(user, request) : Promise.resolve(),
    linkVisitor(user.id, request),
  ]);
  // Read once by SignupWelcome, which says "you got N free credits".
  if (granted > 0) response.cookies.set("jpt_trial", String(granted), { path: "/", maxAge: 600, httpOnly: false, sameSite: "lax" });
  // Read once by SignupWelcome, which records the signup in GA and sends the
  // Google Ads conversion — now that the account really exists.
  if (newAccount) {
    const method = String(user.app_metadata?.provider || "google").slice(0, 20);
    response.cookies.set("jpt_signup", method, { path: "/", maxAge: 600, httpOnly: false, sameSite: "lax" });
  }
  return { newAccount, granted };
}
