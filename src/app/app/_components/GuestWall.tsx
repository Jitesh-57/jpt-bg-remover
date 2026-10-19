"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { loadPendingContext } from "@/lib/pending-image";
import { useTrialOffer } from "@/lib/trial-offer";
import { CREATE_PROMPT_KEY } from "@/lib/prompts/handoff";
import { trackEvent } from "@/lib/analytics";
import SignInModal from "@/app/_components/SignInModal";
import Icon from "./Icon";

/**
 * What a signed-out visitor sees on /app/*.
 *
 * This used to be a bare "Sign in to your studio" with one Google button, and
 * it is where the home page's "Generate Now" and most of its tiles land — so
 * someone who had just typed a prompt and picked a photo met a wall that said
 * nothing about either. Now it shows what they were making (it is kept through
 * the sign-in and waiting for them on the other side), says what an account
 * gets them, and offers email as well as Google.
 */
export default function GuestWall({ pathname, brand }: { pathname: string; brand: React.ReactNode }) {
  const offer = useTrialOffer();
  const [prompt, setPrompt] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    // Read without consuming: the studio takes them after sign-in.
    try {
      const raw = sessionStorage.getItem(CREATE_PROMPT_KEY);
      const p = raw ? (JSON.parse(raw) as { prompt?: string }).prompt : "";
      if (typeof p === "string") setPrompt(p);
    } catch { /* nothing saved */ }
    void loadPendingContext().then((ctx) => { if (ctx?.image) setPhoto(ctx.image); }).catch(() => {});
    trackEvent("app_signin_wall", { path: pathname });
  }, [pathname]);

  const hasWork = !!prompt || !!photo;
  const next = pathname || "/app";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div className="jpt-a-glow" aria-hidden style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)", top: "50%", left: "50%", marginTop: -310, marginLeft: -310 }} />
      <div className="jpt-a-up" style={{ position: "relative", textAlign: "center", width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 22, padding: "32px 28px", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>{brand}</div>

        {hasWork && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: 10, marginBottom: 18 }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your photo" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Saved for you</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {prompt || "Your photo is ready to edit."}
              </div>
            </div>
          </div>
        )}

        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          {hasWork ? "Create a free account to make it" : "Sign in to your studio"}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 22px" }}>
          {offer
            ? <><strong style={{ color: "var(--text)" }}>Free trial:</strong> new accounts get {offer.credits} free credits — your first AI result is on us.</>
            : "Create images, run 200+ AI apps and keep every result in one place."}
        </p>

        <button
          onClick={() => { trackEvent("Sign_In_Clicked", { method: "google", from: "app_wall" }); void beginGoogleSignIn(next); }}
          style={{ width: "100%", padding: "13px 28px", borderRadius: 12, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)" }}
        >
          Continue with Google
        </button>
        <button
          onClick={() => { trackEvent("Sign_In_Clicked", { method: "email", from: "app_wall" }); setEmailOpen(true); }}
          style={{ width: "100%", marginTop: 10, padding: "12px 28px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontWeight: 700, fontSize: 14.5, fontFamily: "inherit", cursor: "pointer" }}
        >
          Use email instead
        </button>
        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 12 }}>Free to join · no card needed</div>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 13, color: "var(--text-faint)", textDecoration: "none" }}>
          <Icon name="globe" size={14} /> Back to Pixel Shine
        </Link>
      </div>
      {emailOpen && <SignInModal onClose={() => setEmailOpen(false)} nextPath={next} startWithEmail />}
    </div>
  );
}
