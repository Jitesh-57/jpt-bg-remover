"use client";

import { useEffect, useMemo, useState } from "react";
import { PACKS, CREDIT_COST, inrPerCredit, type Pack } from "@/lib/plans";
import { buyPack } from "@/lib/checkout";
import { trackEvent } from "@/lib/analytics";

/**
 * The credit-pack screen for the /m/* mobile apps.
 *
 * Same packs and the same Razorpay flow as the site (lib/plans, lib/checkout),
 * laid out as an app paywall: packs counted in the app's own unit ("10 age
 * photos") rather than credits, the per-photo price and saving on each, one
 * pack pre-selected, and a pinned buy button. It is a screen inside the phone
 * frame, not the site's modal, so it looks right in the Android wrapper too.
 */

export interface PaywallProps {
  /** What one generation is called in this app, e.g. { one: "age photo", many: "age photos" }. */
  unit: { one: string; many: string };
  signedIn: boolean;
  balance: number | null;
  prefill?: { name?: string; email?: string };
  /** The photo waiting to be generated, if any, and what it will become. */
  next?: { photo: string; label: string } | null;
  onClose: () => void;
  onSignIn: () => void;
  /** Called with the new balance once a payment is verified. */
  onPurchased: (credits: number | null) => void;
  /** The success screen's main button (e.g. "Show me at 70"); omitted, it just closes. */
  onContinue?: () => void;
  continueLabel?: string;
}

const photosIn = (p: Pack) => Math.floor(p.credits / CREDIT_COST);
const perPhoto = (p: Pack) => inrPerCredit(p) * CREDIT_COST;
const money = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/** Display only: a phone set to Indian time doesn't need the dollar estimate. */
function looksIndian(): boolean {
  try { return /^Asia\/(Kolkata|Calcutta)$/.test(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { return false; }
}

function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function Paywall({ unit, signedIn, balance, prefill, next, onClose, onSignIn, onPurchased, onContinue, continueLabel }: PaywallProps) {
  const [selected, setSelected] = useState<Pack>(PACKS.find((p) => p.popular) || PACKS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bought, setBought] = useState<{ pack: Pack; credits: number | null } | null>(null);
  const [showUsd] = useState(() => !looksIndian());

  // The saving is measured against the smallest pack's per-credit price, so it is exact, not marketing.
  const base = inrPerCredit(PACKS[0]);
  const bestValue = useMemo(() => PACKS.reduce((a, b) => (inrPerCredit(b) < inrPerCredit(a) ? b : a)), []);
  const label = (n: number) => `${n} ${n === 1 ? unit.one : unit.many}`;

  useEffect(() => { trackEvent("m_paywall_view", { balance: balance ?? -1 }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buy = async () => {
    if (!signedIn) { onSignIn(); return; }
    setBusy(true);
    setError(null);
    const r = await buyPack(selected, prefill);
    setBusy(false);
    if (r.ok) {
      const credits = typeof r.credits === "number" ? r.credits : null;
      setBought({ pack: selected, credits });
      onPurchased(credits);
    } else if (!/cancel/i.test(r.text)) {
      setError(r.text);
    }
  };

  if (bought) {
    const total = bought.credits;
    return (
      <div className="mapp-pay">
        <div className="mapp-pay-done">
          <span className="mapp-pay-tick"><Check size={40} /></span>
          <h1 className="mapp-h1">{label(photosIn(bought.pack))} added</h1>
          <p className="mapp-sub">
            {total !== null ? `You now have ${total} credits — ${label(Math.floor(total / CREDIT_COST))}. ` : ""}They never expire.
          </p>
        </div>
        <footer className="mapp-cta">
          <button className="mapp-primary" onClick={onContinue ?? onClose}>{onContinue ? continueLabel : "Done"}</button>
          {onContinue && <button className="mapp-link" onClick={onClose}>Not now</button>}
        </footer>
      </div>
    );
  }

  const short = balance !== null && balance < CREDIT_COST;

  return (
    <div className="mapp-pay">
      <header className="mapp-pay-top">
        <button className="mapp-iconbtn" onClick={onClose} aria-label="Close">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {signedIn && balance !== null && <span className="mapp-pay-bal">{balance} credit{balance === 1 ? "" : "s"} left</span>}
      </header>

      <main className="mapp-scroll mapp-pay-body">
        <span className="mapp-pay-eyebrow">One-time · no subscription</span>
        <h1 className="mapp-h1">Get more {unit.many}</h1>
        <p className="mapp-sub">
          {short
            ? `Each ${unit.one} uses ${CREDIT_COST} credits and you have ${balance}. Pick a pack to keep going.`
            : `Each ${unit.one} uses ${CREDIT_COST} credits. Pay once, use them whenever you like.`}
        </p>

        {next && (
          <div className="mapp-pay-next">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.photo} alt="" />
            <div><strong>Your photo is ready</strong><span>{next.label}</span></div>
          </div>
        )}

        <div className="mapp-pay-packs" role="radiogroup" aria-label="Packs">
          {PACKS.map((p) => {
            const on = p.id === selected.id;
            const save = Math.floor((1 - inrPerCredit(p) / base) * 100);
            const badge = p.popular ? "Most popular" : p.id === bestValue.id ? "Best value" : null;
            return (
              <button key={p.id} role="radio" aria-checked={on} className={`mapp-pack${on ? " on" : ""}`} onClick={() => setSelected(p)}>
                {badge && <span className={`mapp-pack-badge${p.popular ? " hot" : ""}`}>{badge}</span>}
                <span className="mapp-pack-radio" aria-hidden>{on && <Check size={13} />}</span>
                <span className="mapp-pack-main">
                  <strong>{label(photosIn(p))}</strong>
                  <span>{p.credits} credits · ₹{money(perPhoto(p))} per photo</span>
                </span>
                <span className="mapp-pack-price">
                  <strong>₹{p.inr}</strong>
                  {save > 0 ? <em>Save {save}%</em> : showUsd ? <span>≈ ${p.usd}</span> : null}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mapp-pay-perks">
          <li><Check /> Pay once, no renewal</li>
          <li><Check /> Credits never expire</li>
          <li><Check /> 2K, no watermark</li>
          <li><Check /> Ready in under a minute</li>
        </ul>
      </main>

      <footer className="mapp-cta">
        {error && <div className="mapp-error" role="alert">{error}</div>}
        <button className="mapp-primary" onClick={() => void buy()} disabled={busy} aria-busy={busy}>
          {busy
            ? <><span className="mapp-spin" aria-hidden /> Opening secure checkout…</>
            : signedIn
              ? <>Get {label(photosIn(selected))} · ₹{selected.inr}</>
              : "Sign in with Google to buy"}
        </button>
        <p className="mapp-pay-fine">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Secure payment by Razorpay · charged once in INR{showUsd ? ` (≈ $${selected.usd})` : ""}
        </p>
      </footer>
    </div>
  );
}
