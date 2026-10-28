"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { trackSignInClicked } from "@/lib/analytics";
import { usePopup } from "@/lib/popups.client";

/**
 * Google One Tap: "Continue as <name>" in the corner, for visitors already
 * signed in to Google. One tap and they have an account — no redirect, no
 * page change, and an upload in progress stays where it is.
 *
 * Off unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set. That must be the same Google
 * OAuth client Supabase's Google provider uses (or one listed in its
 * "Authorized Client IDs"), with this site's origin allowed in Google Cloud.
 *
 * Shown only where people arrive from search and are about to want an
 * account: the home page, the AI apps and the prompt library.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SHOW_ON = (p: string) => p === "/" || p.startsWith("/creative") || p.startsWith("/prompts");

type GoogleId = {
  initialize: (o: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
};
const gis = (): GoogleId | undefined =>
  (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.defer = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error("script"));
    document.head.appendChild(s);
  });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function OneTap() {
  const pathname = usePathname() || "/";
  // Switched on and off in /admin/popups ("Google One Tap"); Google writes its words.
  const p = usePopup("one-tap");

  useEffect(() => {
    if (!CLIENT_ID || !SHOW_ON(pathname) || !p.ready || !p.enabled) return;
    let cancelled = false;
    // Not the instant the page opens: give the page a moment to be read first.
    const timer = setTimeout(async () => {
      try {
        const { data } = await createSupabaseClient().auth.getSession();
        if (data.session || cancelled) return;
        // Google gets the hash; Supabase gets the raw value and checks they match.
        const raw = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
        const hashed = await sha256Hex(raw);
        await loadScript("https://accounts.google.com/gsi/client");
        const g = gis();
        if (!g || cancelled) return;
        g.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          context: "signup",
          itp_support: true,
          use_fedcm_for_prompt: true,
          cancel_on_tap_outside: false,
          callback: async ({ credential }: { credential?: string }) => {
            if (!credential) return;
            trackSignInClicked("one_tap");
            const { persistAuthContext } = await import("@/lib/pending-image");
            await persistAuthContext();
            const res = await fetch("/api/auth/onetap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential, nonce: raw }),
            });
            if (res.ok) window.location.reload();
          },
        });
        g.prompt();
      } catch { /* One Tap is a bonus; the normal sign-in buttons still work */ }
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      try { gis()?.cancel(); } catch { /* not loaded */ }
    };
  }, [pathname, p.ready, p.enabled]);

  return null;
}
