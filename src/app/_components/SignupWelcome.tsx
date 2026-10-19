"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { trackSignUpCompleted } from "@/lib/analytics";

/**
 * The moment after signing up, on whatever page the person lands.
 *
 * Two one-shot cookies from the auth callback (and /api/auth/google/me, which
 * can grant the trial a moment later):
 *
 *   jpt_signup  a new account was created: record the signup in GA and send
 *               the Google Ads conversion, once.
 *   jpt_trial   free credits were granted: say so. /app and /m announce it in
 *               their own shells, so this one stays out of their way — it
 *               exists for everyone who signed up from an AI app page and was
 *               sent straight back there, who were never told.
 */
function takeCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!m) return null;
  document.cookie = `${name}=; path=/; max-age=0`;
  return decodeURIComponent(m[1]);
}

export default function SignupWelcome() {
  const pathname = usePathname() || "/";
  const [credits, setCredits] = useState(0);
  const ownToast = pathname.startsWith("/app") || pathname.startsWith("/m/");

  useEffect(() => {
    const method = takeCookie("jpt_signup");
    if (method) trackSignUpCompleted(method);
  }, [pathname]);

  useEffect(() => {
    if (ownToast) return;
    // The trial can be granted by the account check that runs just after the
    // page loads, so look again shortly rather than only once.
    const look = () => {
      const n = Number(takeCookie("jpt_trial") || 0);
      if (n > 0) setCredits(n);
    };
    look();
    const timers = [1500, 4000].map((ms) => setTimeout(look, ms));
    return () => timers.forEach(clearTimeout);
  }, [ownToast, pathname]);

  useEffect(() => {
    if (!credits) return;
    const t = setTimeout(() => setCredits(0), 10000);
    return () => clearTimeout(t);
  }, [credits]);

  if (!credits) return null;
  const results = Math.max(1, Math.floor(credits / 2));
  return (
    <div style={{ position: "fixed", left: 16, right: 16, bottom: "calc(24px + env(safe-area-inset-bottom, 0px))", zIndex: 1200, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        role="status"
        className="jpt-a-pop"
        onClick={() => setCredits(0)}
        style={{ pointerEvents: "auto", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14.5, padding: "13px 20px", borderRadius: 14, boxShadow: "var(--glow)", cursor: "pointer", textAlign: "center", maxWidth: 460 }}
      >
        🎁 Welcome! You got {credits} free credits — {results === 1 ? "your first AI result is on us" : `${results} AI results on us`}. Hit Generate.
      </div>
    </div>
  );
}
