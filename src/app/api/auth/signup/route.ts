import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { FREE_CREDITS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Email sign-in is unavailable right now. Please continue with Google." }, { status: 503 });
  }

  const { email, password, name } = await req.json() as { email?: string; password?: string; name?: string };
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Please enter your email address and password." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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

  const displayName = name?.trim() || email.trim().split("@")[0];
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: displayName } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    /*
      Supabase's own wording is fine for the handful of rules a person can act
      on, and unhelpful for everything else ("Database error saving new user",
      "Unable to validate email address: invalid format"). The first kind is
      passed through; the rest becomes one sentence, with the real text logged.
    */
    const detail = error.message;
    console.error("[signup]", detail);
    const actionable = /password|email address|rate limit|already/i.test(detail) && !/database|internal|unexpected/i.test(detail);
    return NextResponse.json({
      error: actionable ? detail : "That account could not be created. Please check your details and try again.",
    }, { status: 400 });
  }
  if (!data.user) {
    return NextResponse.json({ error: "That account could not be created. Please try again." }, { status: 400 });
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    await admin.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      name: displayName,
      // No free AI credits — see FREE_CREDITS. This route granted 10, which
      // is five free generations for anyone who signs up with an email
      // address, while the Google path had already been set to zero.
      credits: FREE_CREDITS,
    }, { onConflict: "id", ignoreDuplicates: true });
  }

  // If no session, Supabase requires email confirmation before login
  if (!data.session) {
    return NextResponse.json({ ok: true, needsConfirmation: true, email: data.user.email });
  }

  const finalResponse = NextResponse.json({
    ok: true,
    email: data.user.email,
    name: displayName,
    credits: FREE_CREDITS,
  });
  cookiesToApply.forEach(({ name, value, options }) => finalResponse.cookies.set(name, value, options));
  return finalResponse;
}
