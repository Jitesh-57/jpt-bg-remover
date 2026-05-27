import { NextRequest, NextResponse } from "next/server";

// Basic scopes only — no Google verification required, all users can sign in instantly
const SCOPES = ["openid", "email", "profile"].join(" ");

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const next = new URL(req.url).searchParams.get("next") || "/";
  const state = Buffer.from(next).toString("base64");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
