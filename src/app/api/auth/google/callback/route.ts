import { NextRequest, NextResponse } from "next/server";
import { setSession, FREE_CREDITS } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  let next = "/editor";
  try { next = Buffer.from(state || "", "base64").toString("utf8"); } catch {}

  // Google returned an error (user denied, etc.)
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
  console.log("[auth] Exchanging code, redirect_uri:", redirectUri);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("[auth] Token exchange failed:", tokenRes.status, errBody);
    return NextResponse.redirect(`${origin}/?error=token_failed&details=${encodeURIComponent(errBody.substring(0, 100))}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    error?: string;
  };

  if (tokens.error) {
    console.error("[auth] Token error:", tokens.error);
    return NextResponse.redirect(`${origin}/?error=${tokens.error}`);
  }

  // Fetch user profile
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    console.error("[auth] Failed to fetch user info:", userRes.status);
    return NextResponse.redirect(`${origin}/?error=userinfo_failed`);
  }

  const user = (await userRes.json()) as { email: string; name: string; picture?: string };

  const res = NextResponse.redirect(`${origin}${next}`);
  setSession(res, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || "",
    email: user.email,
    name: user.name,
    picture: user.picture,
    expires_at: Date.now() + (tokens.expires_in - 60) * 1000,
    credits: FREE_CREDITS,
  });

  console.log("[auth] ✓ Login successful for:", user.email);
  return res;
}
