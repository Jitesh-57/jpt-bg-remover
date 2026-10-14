import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveUnlimited } from "@/lib/auth";
import { claimSignupTrial, isFreshSignup, rememberCountry } from "@/lib/free-trial.server";
import { monthlyBuckets, sumBuckets } from "@/lib/credit-buckets.server";
import { linkVisitor, recordAcquisition } from "@/lib/acquisition.server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ authenticated: false, error: "Supabase not configured" });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ authenticated: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, picture, credits, plan")
    .eq("id", user.id)
    .single() as { data: { name?: string; picture?: string; credits?: number; plan?: string } | null };

  /*
    Email sign-ups confirm by link and may never pass through /auth/callback,
    so a brand-new account is also offered its free trial here. Only for the
    first hour of an account's life; the claim itself is once-only.
  */
  const trial = isFreshSignup(user)
    ? (await Promise.all([claimSignupTrial(user, req), rememberCountry(user.id, req), recordAcquisition(user, req), linkVisitor(user.id, req)]))[0]
    : 0;
  const baseCredits = (profile ? (profile.credits ?? 0) : 0) + trial;
  // Monthly-plan credits, readable through the user's own session (RLS: read own).
  const monthlyCredits = sumBuckets(await monthlyBuckets(supabase, user.id));
  const credits = baseCredits + monthlyCredits;
  // Honour "unlimited" only while its 30-day window is open, else fall to free.
  const { plan, expiresAt: planExpiresAt } = resolveUnlimited(profile?.plan, user.user_metadata);

  const res = NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0],
    picture: profile?.picture || user.user_metadata?.avatar_url,
    credits,
    baseCredits,
    monthlyCredits,
    plan,
    planExpiresAt,
    ...(trial > 0 ? { trialGranted: trial } : {}),
  });
  if (trial > 0) res.cookies.set("jpt_trial", String(trial), { path: "/", maxAge: 600, httpOnly: false, sameSite: "lax" });
  return res;
}
