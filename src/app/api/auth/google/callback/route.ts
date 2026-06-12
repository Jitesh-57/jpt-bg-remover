import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Redirect old callback URL to Supabase-based callback
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  let next = "/editor";
  try { next = Buffer.from(state || "", "base64").toString("utf8") || "/editor"; } catch {}
  const params = new URLSearchParams({ ...(code ? { code } : {}), next });
  return NextResponse.redirect(`${origin}/auth/callback?${params}`);
}
