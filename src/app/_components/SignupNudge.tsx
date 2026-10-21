"use client";

import type { TrialOffer } from "@/lib/trial-offer";

/**
 * SignupNudge — the small sign-up card in the bottom corner (a bar along the
 * bottom on phones) that a signed-out visitor sees a few seconds after
 * landing. A selfie → studio headshot wipes beside the offer, to show what one
 * generation turns a photo into. It leaves the page usable: no backdrop, and
 * it never covers the page on a phone.
 *
 * The copy follows the visitor's offer: where a free trial is live it promises
 * the free first generation; anywhere else it never mentions a trial, only the
 * free account. When it shows, and how often, is SignupNudgeHost's business.
 */

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** The headshot app's published before|after (before on the left, after on the right). */
const PIC = SUPA ? `${SUPA}/storage/v1/object/public/landing/creatives/professional-headshot-main.webp` : "";

function copyFor(offer: TrialOffer | null) {
  if (!offer) return { badge: "Free account", title: "Make photos like this", sub: "Create a free account and try 200+ AI photo apps." };
  const one = offer.generations === 1;
  return {
    badge: "Free trial",
    title: one ? "Your first generation is free" : `${offer.generations} free generations`,
    sub: "Turn a selfie into a pro headshot in seconds.",
  };
}

const G = (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
);

/** The before|after as a moving wipe: the after half sweeps over the before half. */
function Wipe() {
  return (
    <span className="jpt-nudge-wipe" style={{ width: 96, height: 124, borderRadius: 12, flexShrink: 0 }}>
      {PIC && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PIC} alt="" className="jpt-nudge-half" />
          <span className="jpt-nudge-after">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PIC} alt="" className="jpt-nudge-half" style={{ left: "-100%" }} />
          </span>
          <span className="jpt-nudge-line"><span className="jpt-nudge-knob">‹ ›</span></span>
        </>
      )}
    </span>
  );
}

export default function SignupNudge({ offer, onClose, onGoogle }: { offer: TrialOffer | null; onClose: () => void; onGoogle: () => void }) {
  const c = copyFor(offer);
  return (
    <aside role="dialog" aria-label="Sign up free" className="jpt-nudge-corner">
      <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 8, right: 8 }}>×</button>
      <Wipe />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="jpt-nudge-badge">🎁 {c.badge}</span>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, paddingRight: 18 }}>{c.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{c.sub}</div>
        <button onClick={onGoogle} className="jpt-nudge-google" style={{ padding: "10px 14px", fontSize: 13.5 }}>
          <span className="jpt-nudge-g">{G}</span>
          Sign up free
        </button>
      </div>
    </aside>
  );
}
