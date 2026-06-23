import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Always use the actual request origin so the PKCE verifier cookie and the
  // OAuth redirect target live on the same domain (preview vs production safe).
  const origin = url.origin;
  const next = url.searchParams.get("next") || "/editor";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(`${origin}/?error=auth_not_configured`);
  }

  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => pendingCookies.push(c));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Minimal scopes — only email + profile. No Drive, no other permissions.
      // This prevents Google from showing the scary "access your Google Drive" screen.
      scopes: "email profile",
      queryParams: { access_type: "online", prompt: "select_account" },
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("[auth/google] OAuth error:", error?.message);
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }

  // Apply PKCE verifier cookie onto the actual redirect response
  const response = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  // Remember where to land after the OAuth round-trip.
  response.cookies.set("jpt_auth_next", next, { path: "/", maxAge: 600, httpOnly: true, sameSite: "lax" });
  return response;
}
