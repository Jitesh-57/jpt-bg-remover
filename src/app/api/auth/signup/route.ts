import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ecAvailable,
  getKVUser,
  upsertKVUser,
  setSessionCookie,
  FREE_CREDITS,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!ecAvailable) {
    return NextResponse.json(
      { error: "Email sign-up is not yet configured. Please use Google Sign-in." },
      { status: 503 }
    );
  }

  const { email, password, name } = await req.json() as {
    email?: string; password?: string; name?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await getKVUser(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await upsertKVUser({
    email,
    name:         name?.trim() || email.split("@")[0],
    provider:     "email",
    passwordHash,
    credits:      FREE_CREDITS,
  });

  const res = NextResponse.json({
    ok:      true,
    email:   user.email,
    name:    user.name,
    credits: user.credits,
  });
  setSessionCookie(res, {
    email:    user.email,
    name:     user.name,
    provider: "email",
    credits:  user.credits,
  });
  console.log("[auth] ✓ Email signup:", user.email);
  return res;
}
