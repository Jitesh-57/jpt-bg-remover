import { NextRequest, NextResponse } from "next/server";
import { getSession, FREE_CREDITS } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    email: s.email,
    name: s.name,
    picture: s.picture,
    credits: s.credits ?? FREE_CREDITS,
  });
}
