import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FREE_CREDITS } from "@/lib/auth";

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
    .select("name, picture, credits, plan, daily_credits_reset_at")
    .eq("id", user.id)
    .single() as { data: { name?: string; picture?: string; credits?: number; plan?: string; daily_credits_reset_at?: string } | null };

  // Auto-reset daily credits for free users
  // Only fall back to FREE_CREDITS when profile row doesn't exist yet (brand-new user)
  let credits = profile ? (profile.credits ?? 0) : FREE_CREDITS;
  const plan = profile?.plan || "free";
  if (plan === "free" && profile?.daily_credits_reset_at) {
    const hoursSince = (Date.now() - new Date(profile.daily_credits_reset_at).getTime()) / 3_600_000;
    if (hoursSince >= 24) credits = FREE_CREDITS; // will be reset on next API call
  }

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0],
    picture: profile?.picture || user.user_metadata?.avatar_url,
    credits,
    plan,
  });
}
