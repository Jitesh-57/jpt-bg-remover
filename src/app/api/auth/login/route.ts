import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ecAvailable, getKVUser, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!ecAvailable) {
    return NextResponse.json(
      { error: "Email sign-in is not yet configured. Please use Google Sign-in." },
      { status: 503 }
    );
  }

  const { email, password } = await req.json() as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await getKVUser(email);
  if (!user || user.provider !== "email" || !user.passwordHash) {
    // Constant-time delay to prevent user enumeration
    await bcrypt.hash("dummy", 10);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

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
  console.log("[auth] ✓ Email login:", user.email);
  return res;
}
