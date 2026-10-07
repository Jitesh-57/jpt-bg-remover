"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTrialOffer, countryName, openTrialSignIn, type TrialOffer } from "@/lib/trial-offer";

/**
 * The signup free trial, told to the visitors who would actually get it.
 *
 * Each piece renders nothing until /api/trial-offer answers with a live offer
 * for this visitor's country (see lib/trial-offer.ts), so the word "free" next
 * to AI generations only ever appears where a new account is really credited,
 * and goes away when that country is stopped in /admin/trials.
 */

/** A small gift, drawn rather than an emoji, so it matches the rest of the UI. */
export function GiftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

/** Pages where the bar would be noise: the signed-in workspace, admin, auth round-trips. */
const NO_BAR = /^\/(app|admin|auth|invoices)(\/|$)/;
const DISMISS_KEY = "jpt-trial-bar-dismissed";

/**
 * The announcement bar above the navigation. Dismissed for the rest of the
 * browser session only, so a visitor who comes back is told again.
 */
export function TrialBar() {
  const offer = useTrialOffer();
  const pathname = usePathname() || "/";
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try { setHidden(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { setHidden(false); }
  }, []);

  if (!offer || hidden || NO_BAR.test(pathname)) return null;

  const dismiss = () => {
    setHidden(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div className="jpt-trial-bar" role="region" aria-label="Free trial offer">
      <div className="jpt-trial-bar-inner">
        <span className="jpt-trial-bar-icon"><GiftIcon size={15} /></span>
        <p className="jpt-trial-bar-text">
          <strong>Your first AI generation is on us.</strong>
          <span className="jpt-trial-bar-long"> Create a free account and get {offer.credits} credits, enough for {offer.generations} AI generation{offer.generations === 1 ? "" : "s"}. New accounts in {countryName(offer.country)}.</span>
        </p>
        <button type="button" className="jpt-trial-bar-cta" onClick={() => openTrialSignIn("bar")}>
          Claim it <span aria-hidden>→</span>
        </button>
        <button type="button" className="jpt-trial-bar-close" onClick={dismiss} aria-label="Dismiss offer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}

/**
 * An inline pill for section headers and pricing: "First AI generation free
 * for new accounts · Claim →". `align` centres it under a centred heading.
 */
export function TrialPill({ align = "center", source = "pill" }: { align?: "center" | "start"; source?: string }) {
  const offer = useTrialOffer();
  if (!offer) return null;
  return (
    <div style={{ display: "flex", justifyContent: align === "center" ? "center" : "flex-start", margin: "0 0 26px" }}>
      <button type="button" className="jpt-trial-pill" onClick={() => openTrialSignIn(source)}>
        <span className="jpt-trial-pill-icon"><GiftIcon size={14} /></span>
        <span>
          <strong>{offer.generations === 1 ? "Your first AI generation is free" : `Your first ${offer.generations} AI generations are free`}</strong>
          <span className="jpt-trial-pill-muted"> for new accounts</span>
        </span>
        <span className="jpt-trial-pill-cta">Claim <span aria-hidden>→</span></span>
      </button>
    </div>
  );
}

/** The trial, as the sign-in modal's heading block. Exported for NavBar. */
export function TrialModalHead({ offer }: { offer: TrialOffer }) {
  return (
    <div className="jpt-trial-modal-head">
      <span className="jpt-trial-modal-icon"><GiftIcon size={22} /></span>
      <div style={{ fontWeight: 800, fontSize: 21, color: "var(--text)", letterSpacing: "-0.01em", margin: "14px 0 6px" }}>
        Claim your free AI generation
      </div>
      <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.55 }}>
        Create your account and we add <strong style={{ color: "var(--text)" }}>{offer.credits} credits</strong>, enough for {offer.generations} AI generation{offer.generations === 1 ? "" : "s"}. No card needed.
      </p>
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
        One per person · new accounts in {countryName(offer.country)}
      </div>
    </div>
  );
}
