import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { claimSignupTrial } from "@/lib/free-trial.server";

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
  if (user) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!existing) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0],
        picture: user.user_metadata?.avatar_url,
        // No free AI credits on signup. The pricing is explicit that AI has no
        // free tier, and the gate is balance-based, so granting 10 here handed
        // every new account five free generations billed to the fal balance.
        // The free on-device tools need no credits and are unaffected.
        credits: 0,
      });
    } else {
      await supabase.from("profiles").update({
        email: user.email,
        picture: user.user_metadata?.avatar_url,
      }).eq("id", user.id);
    }
    // A new account from a country with a live free trial gets its one-time credits.
    const granted = await claimSignupTrial(user, request);
    // Read once by the dashboard to say "you got N free credits".
    if (granted > 0) response.cookies.set("jpt_trial", String(granted), { path: "/", maxAge: 600, httpOnly: false, sameSite: "lax" });
  }

  return response;
}
