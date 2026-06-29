import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FREE_TRIAL_LIMIT } from "@/lib/auth";

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

  const credits = profile ? (profile.credits ?? 0) : 0;
  const plan = profile?.plan || "free";

  const trialToolsUsedRaw = user.user_metadata?.trial_tools_used;
  const trialToolsUsed: string[] = Array.isArray(trialToolsUsedRaw)
    ? trialToolsUsedRaw.filter((t): t is string => typeof t === "string")
    : [];

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0],
    picture: profile?.picture || user.user_metadata?.avatar_url,
    credits,
    plan,
    trialToolsUsed,
    trialsRemaining: Math.max(0, FREE_TRIAL_LIMIT - trialToolsUsed.length),
  });
}
