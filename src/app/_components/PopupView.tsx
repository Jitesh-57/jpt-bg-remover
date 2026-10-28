"use client";

import type { PopupDesign } from "@/lib/popups";

/**
 * PopupView — the card-style pop-up, in one of four designs, with whatever
 * words it is given. The sign-up popup (SignupNudge) and every pop-up made in
 * /admin/popups (CustomPopupHost) render through it.
 *
 *   split   a centred dialog: the picture on the left, the words, a tick list
 *           and the buttons on the right (stacked on phones)
 *   card    a centred card: the picture on top, the words below
 *   center  a small card in the middle: picture beside the words
 *   corner  the same small card in the bottom corner (a bar on phones), with no
 *           backdrop, so the page stays usable
 *
 * A before|after picture (two halves side by side) wipes between its halves;
 * any other picture is shown as it is.
 *
 * Marked `data-popup`, so a pop-up host can tell one is already up (see
 * popupOnScreen) and wait instead of stacking a second on top.
 */

/** Is a pop-up or dialog already showing? Hosts wait for it to close. */
export function popupOnScreen(): boolean {
  return !!document.querySelector('[data-popup], [aria-modal="true"]');
}

export interface PopupContent {
  /** What a screen reader announces the dialog as. */
  label: string;
  badge?: string;
  title: string;
  text?: string;
  bullets?: string[];
  image?: string;
  caption?: string;
  beforeAfter?: boolean;
  primary: { label: string; onClick: () => void; google?: boolean };
  secondary?: { label: string; onClick: () => void };
  /** The "Maybe later" link; the × closes either way. */
  dismiss?: string;
  foot?: string;
}

const G = (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
);

function Primary({ p, compact = false }: { p: PopupContent["primary"]; compact?: boolean }) {
  return (
    <button onClick={p.onClick} className="jpt-nudge-google" style={compact ? { padding: "10px 14px", fontSize: 13.5 } : undefined}>
      {p.google && <span className="jpt-nudge-g">{G}</span>}
      {p.label}
    </button>
  );
}

/** The picture: a before|after wipes between its halves; anything else is shown as it is. */
function Picture({ c, style }: { c: PopupContent; style?: React.CSSProperties }) {
  if (!c.image) return <span className="jpt-nudge-wipe" style={style} />;
  if (!c.beforeAfter) {
    return (
      <span className="jpt-nudge-wipe" style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }
  return (
    <span className="jpt-nudge-wipe" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.image} alt="" className="jpt-nudge-half" />
      <span className="jpt-nudge-after">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt="" className="jpt-nudge-half" style={{ left: "-100%" }} />
      </span>
      <span className="jpt-nudge-line"><span className="jpt-nudge-knob">‹ ›</span></span>
    </span>
  );
}

function Ticks({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 6px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
      {items.map((t, i) => (
        <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span style={{ color: "var(--success)", fontWeight: 900 }}>✓</span><span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** The small card's contents: in the corner, or the same card in the middle. */
function SmallCard({ c, big, onClose }: { c: PopupContent; big: boolean; onClose: () => void }) {
  return (
    <>
      <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 8, right: 8 }}>×</button>
      <Picture c={c} style={big ? { width: 128, height: 168, borderRadius: 14, flexShrink: 0 } : { width: 96, height: 124, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: big ? 8 : 6 }}>
        {c.badge && <span className="jpt-nudge-badge">{c.badge}</span>}
        <div style={{ fontSize: big ? 20 : 16, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.25, paddingRight: 18 }}>{c.title}</div>
        {c.text && <div style={{ fontSize: big ? 14 : 12.5, color: "var(--text-muted)", lineHeight: 1.45 }}>{c.text}</div>}
        <Primary p={c.primary} compact={!big} />
        {big && c.secondary && <button onClick={c.secondary.onClick} className="jpt-nudge-link">{c.secondary.label}</button>}
      </div>
    </>
  );
}

export default function PopupView({ design, content: c, onClose }: { design: PopupDesign; content: PopupContent; onClose: () => void }) {
  if (design === "corner") {
    return (
      <aside role="dialog" aria-label={c.label} className="jpt-nudge-corner" data-popup>
        <SmallCard c={c} big={false} onClose={onClose} />
      </aside>
    );
  }

  // The centred ones sit over a dimmed page; a click outside closes them.
  const dialog = (cls: string, body: React.ReactNode) => (
    <div className="jpt-nudge-backdrop" onClick={onClose} data-popup>
      <div role="dialog" aria-modal="true" aria-label={c.label} className={cls} onClick={(e) => e.stopPropagation()}>{body}</div>
    </div>
  );

  if (design === "center") return dialog("jpt-nudge-center", <SmallCard c={c} big onClose={onClose} />);

  if (design === "card") {
    return dialog("jpt-nudge-card", (
      <>
        <div style={{ position: "relative", aspectRatio: "3 / 2", background: "#111" }}>
          {c.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {c.caption && <span className="jpt-nudge-caption">{c.caption}</span>}
        </div>
        <div style={{ position: "relative", padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 10, textAlign: "center", alignItems: "center" }}>
          {/* Below the picture, clear of any labels in it. */}
          <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 12, right: 12 }}>×</button>
          {c.badge && <span className="jpt-nudge-badge">{c.badge}</span>}
          <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2, textWrap: "balance" }}>{c.title}</div>
          {c.text && <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 330 }}>{c.text}</div>}
          <div style={{ alignSelf: "stretch", textAlign: "left" }}><Ticks items={c.bullets} /></div>
          <div style={{ width: "100%", marginTop: 6 }}><Primary p={c.primary} /></div>
          {c.secondary && <button onClick={c.secondary.onClick} className="jpt-nudge-link">{c.secondary.label}</button>}
          {c.dismiss && <button onClick={onClose} className="jpt-nudge-link" style={{ color: "var(--text-faint)", fontWeight: 600 }}>{c.dismiss}</button>}
          {c.foot && <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{c.foot}</div>}
        </div>
      </>
    ));
  }

  return dialog("jpt-nudge-split", (
    <>
      <button onClick={onClose} aria-label="Close" className="jpt-nudge-x" style={{ top: 14, right: 14 }}>×</button>
      <div className="jpt-nudge-split-pic">
        <Picture c={c} style={{ position: "absolute", inset: 0 }} />
        {c.caption && <span className="jpt-nudge-caption">{c.caption}</span>}
      </div>
      <div className="jpt-nudge-split-body">
        {c.badge && <span className="jpt-nudge-badge" style={{ alignSelf: "flex-start" }}>{c.badge}</span>}
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1.15, textWrap: "balance" }}>{c.title}</div>
        {c.text && <div style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{c.text}</div>}
        <Ticks items={c.bullets} />
        <Primary p={c.primary} />
        {c.secondary && <button onClick={c.secondary.onClick} className="jpt-nudge-link">{c.secondary.label}</button>}
        {c.dismiss && <button onClick={onClose} className="jpt-nudge-link" style={{ color: "var(--text-faint)", fontWeight: 600 }}>{c.dismiss}</button>}
      </div>
    </>
  ));
}
