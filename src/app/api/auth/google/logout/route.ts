import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  // Also clear old cookie name for backward compat
  res.cookies.set("g-sess", "", { maxAge: 0, path: "/" });
  return res;
}
