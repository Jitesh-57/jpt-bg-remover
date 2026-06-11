import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { FREE_CREDITS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Auth not configured. Please use Google Sign-in." }, { status: 503 });
  }

  const { email, password } = await req.json() as { email?: string; password?: string };
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const cookiesToApply: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(list) {
          list.forEach(({ name, value, options }) => cookiesToApply.push({ name, value, options }));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, credits")
    .eq("id", data.user.id)
    .single();

  const finalResponse = NextResponse.json({
    ok: true,
    email: data.user.email,
    name: profile?.name || data.user.email?.split("@")[0],
    credits: profile?.credits ?? FREE_CREDITS,
  });
  cookiesToApply.forEach(({ name, value, options }) => finalResponse.cookies.set(name, value, options));
  return finalResponse;
}
