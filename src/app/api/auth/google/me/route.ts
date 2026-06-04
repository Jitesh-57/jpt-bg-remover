import { NextRequest, NextResponse } from "next/server";
import { readToken, getKVUser, FREE_CREDITS, ecAvailable } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = readToken(req);
  if (!token) return NextResponse.json({ authenticated: false });

  // Get fresh credits from KV if available
  let credits = token.credits;
  if (ecAvailable) {
    const kv = await getKVUser(token.email);
    if (kv) credits = kv.credits;
  }

  return NextResponse.json({
    authenticated: true,
    email:   token.email,
    name:    token.name,
    picture: token.picture,
    credits: credits ?? FREE_CREDITS,
    kvEnabled: ecAvailable,
  });
}
