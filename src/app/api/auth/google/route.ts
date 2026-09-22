import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/**
 * Only rewrites to the canonical domain when the request is already on a
 * variant of it (www vs apex) — that's the one case where Supabase's
 * allowlist needs the un-ambiguous form. Any other host (a Vercel preview,
 * localhost) keeps its own origin, or the OAuth round-trip would always
 * land on production and a preview build could never be signed into.
 */
function resolveAuthOrigin(url: URL): string {
  const canonical = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!canonical) return url.origin;
  try {
    const canonicalHost = new URL(canonical).hostname.replace(/^www\./, "");
    const requestHost = url.hostname.replace(/^www\./, "");
    return requestHost === canonicalHost ? canonical : url.origin;
  } catch {
    return url.origin;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = resolveAuthOrigin(url);
  const next = url.searchParams.get("next") || "/app";

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
