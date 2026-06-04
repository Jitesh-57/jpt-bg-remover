import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, upsertKVUser, FREE_CREDITS } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const code   = url.searchParams.get("code");
  const state  = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  let next = "/editor";
  try { next = Buffer.from(state || "", "base64").toString("utf8") || "/editor"; } catch {}

  if (oauthError) {
    console.error("[auth] Google OAuth error:", oauthError);
    return NextResponse.redirect(`${origin}/?error=${oauthError}`);
  }
  if (!code) {
    console.error("[auth] No code received");
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  // Exchange code for tokens
  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      code,
      grant_type:    "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[auth] Token exchange failed:", tokenRes.status, err);
    return NextResponse.redirect(`${origin}/?error=token_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    expires_in:   number;
    error?:       string;
  };
  if (tokens.error) return NextResponse.redirect(`${origin}/?error=${tokens.error}`);

  // Fetch profile
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) return NextResponse.redirect(`${origin}/?error=userinfo_failed`);

  const profile = await userRes.json() as { email: string; name: string; picture?: string };

  // Upsert in KV (if available) and get credit count
  const kvUser = await upsertKVUser({
    email:    profile.email,
    name:     profile.name,
    picture:  profile.picture,
    provider: "google",
  });
  const credits = kvUser?.credits ?? FREE_CREDITS;

  const res = NextResponse.redirect(`${origin}${next}`);
  setSessionCookie(res, {
    email:    profile.email,
    name:     profile.name,
    picture:  profile.picture,
    provider: "google",
    credits,
  });

  console.log("[auth] ✓ Google login:", profile.email, "credits:", credits);
  return res;
}
