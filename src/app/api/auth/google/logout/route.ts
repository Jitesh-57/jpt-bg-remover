import { NextResponse } from "next/server";
import { GOOGLE_COOKIE } from "@/lib/google-drive";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GOOGLE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
