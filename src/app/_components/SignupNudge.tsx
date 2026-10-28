"use client";

import type { TrialOffer } from "@/lib/trial-offer";

/**
 * SignupNudge — the sign-up invitation a signed-out visitor sees a few seconds
 * after landing, with a before|after from the creative apps to show what one
 * generation turns a photo into.
 *
 *   corner  the small card in the bottom corner (a bar along the bottom on
 *           phones). It leaves the page usable: no backdrop.
 *   center  the same card, in the middle of the screen over a dimmed page
 *   split   a centred dialog: the before|after wiping on the left, the offer,
 *           what an account gets and both sign-up buttons on the right
 *   card    a centred photo-first card: the before|after on top, the offer below
 *
 * The three centred ones are options for review (/nudge-preview); `corner` is
 * the one visitors get until one is chosen (SignupNudgeHost).
 *
 * The copy follows the visitor's offer: where a free trial is live it promises
 * the free first generation; anywhere else it never mentions a trial, only the
 * free account. When it shows, and how often, is SignupNudgeHost's business.
 */

export type NudgeVariant = "corner" | "center" | "split" | "card";
export const NUDGE_VARIANTS: NudgeVariant[] = ["corner", "center", "split", "card"];

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/** An app's published before|after creative (before on the left, after on the right). */
const creative = (slug: string) => (SUPA ? `${SUPA}/storage/v1/object/public/landing/creatives/${slug}-main.webp` : "");

const PICS: Record<NudgeVariant, { src: string; caption: string }> = {
  corner: { src: creative("professional-headshot"), caption: "Selfie → studio headshot" },
  center: { src: creative("professional-headshot"), caption: "Selfie → studio headshot" },
  split: { src: creative("outfit-generator"), caption: "One selfie → an evening look" },
  card: { src: creative("ghibli-style"), caption: "Selfie → Ghibli art" },
};

/** Each design's headline and line, so none repeats itself. */
function copyFor(offer: TrialOffer | null) {
  if (!offer) {
    return {
      badge: "Free account",
      small: { title: "Make photos like this", sub: "Create a free account and try 200+ AI photo apps." },
      split: { title: "Make photos like this", sub: "Create a free account to use 200+ AI photo apps and keep every result in one place." },
      card: { title: "Try it on your own photo", sub: "Create a free account and try 200+ AI photo apps — headshots, Ghibli, outfits and more." },
      foot: "Free to join · no card needed",
    };
  }
  const one = offer.generations === 1;
  const gift = one ? "your first AI generation is on us" : `${offer.generations} AI generations are on us`;
  return {
    badge: "Free trial",
    small: { title: one ? "Your first generation is free" : `${offer.generations} free generations`, sub: "Turn a selfie into a pro headshot in seconds." },
    split: {
      title: one ? "Your first AI photo is on us" : `${offer.generations} AI photos, on us`,
      sub: `Sign up free and get ${offer.credits} credits — enough for ${one ? "your first generation" : `${offer.generations} generations`}. Turn any selfie into a studio shoot in seconds.`,
    },
    card: { title: "Try it on your own photo", sub: `Sign up free — ${gift}.` },
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

/** The before|after as a moving wipe: the after half sweeps over the before half. */
function Wipe({ src, style }: { src: string; style?: React.CSSProperties }) {
  return (
    <span className="jpt-nudge-wipe" style={style}>
      {src && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="jpt-nudge-half" />
          <span className="jpt-nudge-after">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="jpt-nudge-half" style={{ left: "-100%" }} />
          </span>
          <span className="jpt-nudge-line"><span className="jpt-nudge-knob">‹ ›</span></span>
        </>
      )}
    </span>
  );
}

/** The small card's contents: the corner card, and the same card in the middle. */
function SmallCard({ variant, offer, onClose, onGoogle }: { variant: "corner" | "center"; offer: TrialOffer | null; onClose: () => void; onGoogle: () => void }) {
  const c = copyFor(offer);
  const big = variant === "center";
  return (
    <>
      <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 8, right: 8 }}>×</button>
      <Wipe src={PICS[variant].src} style={big ? { width: 128, height: 168, borderRadius: 14, flexShrink: 0 } : { width: 96, height: 124, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: big ? 8 : 6 }}>
        <span className="jpt-nudge-badge">🎁 {c.badge}</span>
        <div style={{ fontSize: big ? 20 : 16, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, paddingRight: 18 }}>{c.small.title}</div>
        <div style={{ fontSize: big ? 14 : 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{c.small.sub}</div>
        <GoogleButton label="Sign up free" compact={!big} onClick={onGoogle} />
      </div>
    </>
  );
}

export default function SignupNudge({ variant = "corner", offer, onClose, onGoogle, onEmail }: {
  variant?: NudgeVariant;
  offer: TrialOffer | null;
  onClose: () => void;
  onGoogle: () => void;
  onEmail: () => void;
}) {
  const c = copyFor(offer);
  const pic = PICS[variant];

  if (variant === "corner") {
    return (
      <aside role="dialog" aria-label="Sign up free" className="jpt-nudge-corner">
        <SmallCard variant="corner" offer={offer} onClose={onClose} onGoogle={onGoogle} />
      </aside>
    );
  }

  // The centred ones sit over a dimmed page; a click outside closes them.
  const dialog = (cls: string, body: React.ReactNode) => (
    <div className="jpt-nudge-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Sign up free" className={cls} onClick={(e) => e.stopPropagation()}>{body}</div>
    </div>
  );

  if (variant === "center") {
    return dialog("jpt-nudge-center", <SmallCard variant="center" offer={offer} onClose={onClose} onGoogle={onGoogle} />);
  }

  if (variant === "card") {
    return dialog("jpt-nudge-card", (
      <>
        <div style={{ position: "relative", aspectRatio: "3 / 2", background: "#111" }}>
          {pic.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pic.src} alt="Before and after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <span className="jpt-nudge-caption">{pic.caption}</span>
        </div>
        <div style={{ position: "relative", padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 10, textAlign: "center", alignItems: "center" }}>
          {/* Below the picture, clear of its Before/After labels. */}
          <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 12, right: 12 }}>×</button>
          <span className="jpt-nudge-badge">🎁 {c.badge}</span>
          <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2, textWrap: "balance" }}>{c.card.title}</div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 330 }}>{c.card.sub}</div>
          <div style={{ width: "100%", marginTop: 6 }}><GoogleButton onClick={onGoogle} /></div>
          <button onClick={onEmail} className="jpt-nudge-link">Use email instead</button>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{c.foot}</div>
        </div>
      </>
    ));
  }

  return dialog("jpt-nudge-split", (
    <>
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
        <GoogleButton onClick={onGoogle} />
        <button onClick={onEmail} className="jpt-nudge-link">Sign up with email</button>
        <button onClick={onClose} className="jpt-nudge-link" style={{ color: "var(--text-faint)", fontWeight: 600 }}>Maybe later</button>
      </div>
    </>
  ));
}
