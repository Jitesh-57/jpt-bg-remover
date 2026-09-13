"use client";

import { useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { readAuthReturn, clearAuthReturn } from "@/lib/auth-return";

/**
 * Puts the user back where they signed in from.
 *
 * Mounted once in the layout, so it runs on whatever page the OAuth round-trip
 * actually lands on. It does nothing at all unless a sign-in was started from
 * this browser in the last few minutes — see lib/auth-return.ts for why the
 * cookie the callback reads is not enough on its own.
 *
 * Two things can have gone wrong by the time we get here:
 *
 *   1. The browser is on the home page with a `code` in the URL. Supabase would
 *      not accept our redirect and fell back to the project's Site URL, so the
 *      code was never exchanged and the user is not signed in at all. Handing
 *      the code to /auth/callback finishes the sign-in properly.
 *   2. The session exists but the page is not the one they left. The cookie
 *      carrying the destination did not come back, so the callback used its
 *      default. We know the destination, so go there.
 */
export default function AuthReturn() {
  useEffect(() => {
    const target = readAuthReturn();
    if (!target) return;

    const params = new URLSearchParams(window.location.search);

    // (1) An unexchanged code that landed somewhere other than the callback.
    const code = params.get("code");
    if (code && !window.location.pathname.startsWith("/auth/callback")) {
      // The marker is left in place: after the callback runs, this component
      // mounts again on the destination and case (2) tidies up.
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(target)}`);
      return;
    }

    // Sign-in failed rather than went astray. Leave the user where they are so
    // the message is visible, and stop this from firing on the next page view.
    if (params.get("error")) { clearAuthReturn(); return; }

    // (2) Signed in, wrong page.
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return; // Still mid-flow, or they never finished.
      clearAuthReturn();
      // Compare paths only: the callback may have added params of its own, and
      // an exact match on the whole URL would bounce the user needlessly.
      const to = new URL(target, window.location.origin);
      if (to.pathname === window.location.pathname) return;
      // replace(), not assign(): Back should return to wherever they were
      // before signing in, not to the page we are redirecting away from.
      window.location.replace(to.pathname + to.search);
    }).catch(() => {});
  }, []);

  return null;
}
