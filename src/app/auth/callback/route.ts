import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { finishSignIn } from "@/lib/auth-finish.server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // `next` is carried in a cookie (set in /api/auth/google) so the OAuth
  // redirect URL stays clean and matches Supabase's allow-list. Fall back to
  // the query param for backwards-compat, then the dashboard.
  const raw = request.cookies.get("jpt_auth_next")?.value
    || url.searchParams.get("next")
    || "/app";
  const origin = url.origin;
  /*
    `next` can arrive in the query string, so it is attacker-controllable, and
    it is about to be resolved against this origin. Anything that is not a
    single-slash absolute path — another origin, a protocol-relative "//host" —
    would turn the sign-in link into an open redirect, so it is discarded.
  */
  const next = /^\/(?!\/)/.test(raw) ? raw : "/app";

  /*
    Failures land on the page they came from, not on the home page.

    Every error here used to redirect to "/?error=…", which is most of the
    reason signing in could dump someone on the home page: a lost cookie or a
    stale code and the page they were working on was gone, upload and all. The
    destination is known either way, so the error is carried to it instead.
  */
  const back = (reason: string) => {
    const to = new URL(next, origin);
    to.searchParams.set("error", reason);
    return NextResponse.redirect(to.toString());
  };

  if (!code) return back("no_code");

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete("jpt_auth_next");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return back(error.message);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) await finishSignIn(supabase, user, request, response);

  return response;
}
