import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { FREE_CREDITS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Auth not configured. Please use Google Sign-in." }, { status: 503 });
  }

  const { email, password, name } = await req.json() as { email?: string; password?: string; name?: string };
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data.user) {
    return NextResponse.json({ error: "Signup failed" }, { status: 400 });
  }

  // Create profile with credits using admin client
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
      credits: FREE_CREDITS,
    }, { onConflict: "id", ignoreDuplicates: true });
  }

  console.log("[auth] ✓ Email signup:", data.user.email);
  return NextResponse.json({
    ok: true,
    email: data.user.email,
    name: displayName,
    credits: FREE_CREDITS,
  });
}
