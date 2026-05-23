import { NextRequest, NextResponse } from "next/server";
import { setSession, FREE_CREDITS } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  let next = "/";
  try { next = Buffer.from(state || "", "base64").toString("utf8"); } catch {}

  if (!code) return NextResponse.redirect(`${origin}${next}?error=auth_failed`);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(`${origin}${next}?error=token_failed`);

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = (await userRes.json()) as { email: string; name: string; picture?: string };

  const res = NextResponse.redirect(`${origin}${next}`);
  setSession(res, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || "",
    email: user.email,
    name: user.name,
    picture: user.picture,
    expires_at: Date.now() + (tokens.expires_in - 60) * 1000,
    credits: FREE_CREDITS, // new users always start with 10 free credits
  });
  return res;
}
