"use client";

import { beginGoogleSignIn } from "@/lib/auth-return";
import type { TrialOffer } from "@/lib/trial-offer";

/**
 * SignupNudge — the sign-up invitation a signed-out visitor sees a few seconds
 * after landing, with a before|after from the creative apps to show what one
 * free generation turns a selfie into.
 *
 * Three designs, one chosen later:
 *
 *   split   a centred dialog: the before|after wiping on the left, the offer
 *           and the sign-up buttons on the right
 *   card    a compact photo-first card: the before|after side by side on top
 *   corner  a small card in the bottom-right corner (a sheet on phones) that
 *           leaves the page usable
 *
 * The copy follows the visitor's offer: where a free trial is live it promises
 * the free first generation; anywhere else it never mentions a trial, only the
 * free account.
 */

export type NudgeVariant = "split" | "card" | "corner";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** An app's published before|after creative (before on the left, after on the right). */
const creative = (slug: string) => `${SUPA}/storage/v1/object/public/landing/creatives/${slug}-main.webp`;

const PICS: Record<NudgeVariant, { src: string; caption: string }> = {
  split: { src: creative("outfit-generator"), caption: "One selfie → an evening look" },
  card: { src: creative("ghibli-style"), caption: "Selfie → Ghibli art" },
  corner: { src: creative("professional-headshot"), caption: "Selfie → studio headshot" },
};

/** Each design's headline and line, so none repeats itself. */
function copyFor(offer: TrialOffer | null) {
  if (!offer) {
    return {
      badge: "Free account",
      split: { title: "Make photos like this", sub: "Create a free account to use 200+ AI photo apps and keep every result in one place." },
      card: { title: "Try it on your own photo", sub: "Create a free account and try 200+ AI photo apps — headshots, Ghibli, outfits and more." },
      corner: { title: "Make photos like this", sub: "Create a free account and try 200+ AI photo apps." },
      foot: "Free to join · no card needed",
    };
  }
  const one = offer.generations === 1;
  const gift = one ? "your first AI generation is on us" : `${offer.generations} AI generations are on us`;
  return {
    badge: "Free trial",
    split: {
      title: one ? "Your first AI photo is on us" : `${offer.generations} AI photos, on us`,
      sub: `Sign up free and get ${offer.credits} credits — enough for ${one ? "your first generation" : `${offer.generations} generations`}. Turn any selfie into a studio shoot in seconds.`,
    },
    card: { title: "Try it on your own photo", sub: `Sign up free — ${gift}.` },
    corner: { title: one ? "Your first generation is free" : `${offer.generations} free generations`, sub: "Turn a selfie into a pro headshot in seconds." },
    foot: "Free account · no card · 5-second sign-up",
  };
}

const G = (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
);

function GoogleButton({ label = "Continue with Google", compact = false, onClick }: { label?: string; compact?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="jpt-nudge-google" style={compact ? { padding: "10px 14px", fontSize: 13.5 } : undefined}>
      <span className="jpt-nudge-g">{G}</span>
      {label}
    </button>
  );
}

/** A before|after creative as a moving wipe: the after half sweeps over the before half. */
function Wipe({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <span className="jpt-nudge-wipe" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="jpt-nudge-half" />
      <span className="jpt-nudge-after">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="jpt-nudge-half" style={{ left: "-100%" }} />
      </span>
      <span className="jpt-nudge-line"><span className="jpt-nudge-knob">‹ ›</span></span>
    </span>
  );
}

export default function SignupNudge({ variant, offer, onClose, onGoogle, onEmail }: {
  variant: NudgeVariant;
  offer: TrialOffer | null;
  onClose: () => void;
  onGoogle?: () => void;
  onEmail?: () => void;
}) {
  const c = copyFor(offer);
  const pic = PICS[variant];
  const google = onGoogle ?? (() => void beginGoogleSignIn());
  const email = onEmail ?? (() => {});

  if (variant === "corner") {
    return (
      <div role="dialog" aria-label="Sign up free" className="jpt-nudge-corner">
        <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 8, right: 8 }}>×</button>
        <Wipe src={pic.src} style={{ width: 96, height: 124, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="jpt-nudge-badge">🎁 {c.badge}</span>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, paddingRight: 18 }}>{c.corner.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{c.corner.sub}</div>
          <GoogleButton label="Sign up free" compact onClick={google} />
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="jpt-nudge-backdrop" onClick={onClose}>
        <div role="dialog" aria-modal="true" aria-label="Sign up free" className="jpt-nudge-card" onClick={(e) => e.stopPropagation()}>
          <div style={{ position: "relative", aspectRatio: "3 / 2", background: "#111" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pic.src} alt="Before and after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <span className="jpt-nudge-caption">{pic.caption}</span>
          </div>
          <div style={{ position: "relative", padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 10, textAlign: "center", alignItems: "center" }}>
            {/* Below the picture, clear of its Before/After labels. */}
            <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 12, right: 12 }}>×</button>
            <span className="jpt-nudge-badge">🎁 {c.badge}</span>
            <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2, textWrap: "balance" }}>{c.card.title}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 330 }}>{c.card.sub}</div>
            <div style={{ width: "100%", marginTop: 6 }}><GoogleButton onClick={google} /></div>
            <button onClick={email} className="jpt-nudge-link">Use email instead</button>
            <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{c.foot}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jpt-nudge-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Sign up free" className="jpt-nudge-split" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 14, right: 14 }}>×</button>
        <div className="jpt-nudge-split-pic">
          <Wipe src={pic.src} style={{ position: "absolute", inset: 0 }} />
          <span className="jpt-nudge-caption">{pic.caption}</span>
        </div>
        <div className="jpt-nudge-split-body">
          <span className="jpt-nudge-badge" style={{ alignSelf: "flex-start" }}>🎁 {c.badge}</span>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.15, textWrap: "balance" }}>{c.split.title}</div>
          <div style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{c.split.sub}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 6px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            {["200+ AI photo apps — headshots, Ghibli, saree, outfits", "Every result saved to your library", "No card needed"].map((t) => (
              <li key={t} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ color: "var(--success)", fontWeight: 900 }}>✓</span><span>{t}</span>
              </li>
            ))}
          </ul>
          <GoogleButton onClick={google} />
          <button onClick={email} className="jpt-nudge-link">Sign up with email</button>
          <button onClick={onClose} className="jpt-nudge-link" style={{ color: "var(--text-faint)", fontWeight: 600 }}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
