"use client";

import { useEffect } from "react";
import Script from "next/script";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { createSupabaseClient } from "@/lib/supabase";
import { SHELL_HTML } from "./shell";

declare global {
  interface Window {
    lpSignIn?: () => void;
    lpSignOut?: () => Promise<void>;
  }
}

/*
  LaunchPilot is a plain-JS app (public/launchpilot/app.js) so the same code
  runs here and in the standalone and desktop versions. This component gives
  it the page, the site's Google sign-in, and a scoped stylesheet.
*/
export default function LaunchPilotClient() {
  useEffect(() => {
    window.lpSignIn = () => { void beginGoogleSignIn("/launchpilot"); };
    window.lpSignOut = async () => {
      try { await createSupabaseClient().auth.signOut(); } catch {}
      await fetch("/api/auth/google/logout", { method: "POST" }).catch(() => {});
      window.location.reload();
    };
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" />
      <link rel="stylesheet" href="/launchpilot/styles.css" />
      <div className="lp-root" dangerouslySetInnerHTML={{ __html: SHELL_HTML }} />
      <Script src="/launchpilot/app.js" strategy="afterInteractive" />
    </>
  );
}
