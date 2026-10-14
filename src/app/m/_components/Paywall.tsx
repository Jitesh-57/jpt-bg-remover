"use client";

import { useEffect, useMemo, useState } from "react";
import { PACKS, CREDIT_COST, type Pack } from "@/lib/plans";
import { buyPack } from "@/lib/checkout";
import { buyOnPlay, type PlayStore } from "@/lib/play-billing.client";
import { trackEvent } from "@/lib/analytics";

/**
 * The credit-pack screen for the /m/* mobile apps.
 *
 * Laid out as an app paywall: packs counted in the app's own unit ("10 age
 * photos") rather than credits, the per-photo price and saving on each, one
 * pack pre-selected, and a pinned buy button. It is a screen inside the phone
 * frame, not the site's modal.
 *
 * Two ways to pay, same packs (lib/plans):
 *   · inside the Android app from Google Play — Google Play Billing, at the
 *     prices set in Play Console (lib/play-billing.client); Play's own sheet
 *     opens over the app and closes when the payment is done
 *   · anywhere else — Razorpay, in rupees, as on the website (lib/checkout)
 * Inside the Play app Razorpay is never offered: Play requires its own billing
 * for digital goods, so if Play Billing can't be reached the screen says so.
 */

export interface PaywallProps {
  /** What one generation is called in this app, e.g. { one: "age photo", many: "age photos" }. */
  unit: { one: string; many: string };
  signedIn: boolean;
  balance: number | null;
  prefill?: { name?: string; email?: string };
  /** The photo waiting to be generated, if any, and what it will become. */
  next?: { photo: string; label: string } | null;
  /**
   * Google Play, when running inside the Play app: the app's key in PLAY_APPS,
   * whether this is the Play app, and the store (undefined while connecting,
   * null when Play Billing is unavailable).
   */
  play?: { app: string; inApp: boolean; store: PlayStore | null | undefined };
  onClose: () => void;
  onSignIn: () => void;
  /** Called with the new balance once a payment is verified. */
  onPurchased: (credits: number | null) => void;
  /** The success screen's main button (e.g. "Show me at 70"); omitted, it just closes. */
  onContinue?: () => void;
  continueLabel?: string;
}

/** A pack with the price this buyer pays, in whichever currency they pay it. */
interface Offer { pack: Pack; amount: number; currency: string; label: string }

const photosIn = (p: Pack) => Math.floor(p.credits / CREDIT_COST);

function format(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : undefined, {
      style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

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

export default function Paywall({ unit, signedIn, balance, prefill, next, play, onClose, onSignIn, onPurchased, onContinue, continueLabel }: PaywallProps) {
  const viaPlay = !!play?.store;
  const [selectedId, setSelectedId] = useState<string>((PACKS.find((p) => p.popular) || PACKS[0]).id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bought, setBought] = useState<{ pack: Pack; credits: number | null } | null>(null);
  const [showUsd] = useState(() => !looksIndian());

  // Play's prices when buying through Play (only the packs set up there), else rupees.
  const offers: Offer[] = useMemo(() => {
    if (play?.store) {
      return PACKS.flatMap((pack) => {
        const pr = play.store!.prices[pack.id];
        return pr ? [{ pack, amount: pr.amount, currency: pr.currency, label: pr.label }] : [];
      });
    }
    return PACKS.map((pack) => ({ pack, amount: pack.inr, currency: "INR", label: format(pack.inr, "INR") }));
  }, [play?.store]);

  const selected = offers.find((o) => o.pack.id === selectedId) ?? offers[0];
  // Savings are measured against the smallest pack's per-credit price, so they are exact, not marketing.
  const baseRate = offers[0] ? offers[0].amount / offers[0].pack.credits : 0;
  const bestValue = offers.reduce<Offer | null>((a, b) => (!a || b.amount / b.pack.credits < a.amount / a.pack.credits ? b : a), null);
  const label = (n: number) => `${n} ${n === 1 ? unit.one : unit.many}`;

  useEffect(() => { trackEvent("m_paywall_view", { balance: balance ?? -1, store: play?.inApp ? "play" : "razorpay" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buy = async () => {
    if (!signedIn) { onSignIn(); return; }
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const r = viaPlay && play
      ? await buyOnPlay(play.app, selected.pack)
      : await buyPack(selected.pack, prefill);
    setBusy(false);
    if (r.ok) {
      const credits = typeof r.credits === "number" ? r.credits : null;
      setBought({ pack: selected.pack, credits });
      onPurchased(credits);
    } else if ("pending" in r && r.pending) {
      setNotice(r.text);
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
  // Inside the Play app, only Play Billing may sell: wait for it, or say it's unavailable.
  const playWaiting = !!play?.inApp && play.store === undefined;
  const playMissing = !!play?.inApp && (play.store === null || (play.store !== undefined && offers.length === 0));

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

        {playWaiting ? (
          <div className="mapp-pay-wait"><span className="mapp-spin" aria-hidden /> Loading prices from Google Play…</div>
        ) : playMissing ? (
          <div className="mapp-card">
            <strong>Purchases aren&apos;t available right now</strong>
            <p className="mapp-sub">Make sure Google Play is up to date and you&apos;re signed in to it, then try again.</p>
          </div>
        ) : (
          <div className="mapp-pay-packs" role="radiogroup" aria-label="Packs">
            {offers.map((o) => {
              const on = o.pack.id === selected?.pack.id;
              const save = baseRate ? Math.floor((1 - o.amount / o.pack.credits / baseRate) * 100) : 0;
              // Only a badge that is true of the prices actually shown: Play may price the packs differently.
              const badge = o.pack.id === bestValue?.pack.id && offers.length > 1 ? "Best value" : null;
              return (
                <button key={o.pack.id} role="radio" aria-checked={on} className={`mapp-pack${on ? " on" : ""}`} onClick={() => setSelectedId(o.pack.id)}>
                  {badge && <span className="mapp-pack-badge hot">{badge}</span>}
                  <span className="mapp-pack-radio" aria-hidden>{on && <Check size={13} />}</span>
                  <span className="mapp-pack-main">
                    <strong>{label(photosIn(o.pack))}</strong>
                    <span>{o.pack.credits} credits · {format(o.amount / o.pack.credits * CREDIT_COST, o.currency)} per photo</span>
                  </span>
                  <span className="mapp-pack-price">
                    <strong>{o.label}</strong>
                    {save > 0 ? <em>Save {save}%</em> : !viaPlay && showUsd ? <span>≈ ${o.pack.usd}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <ul className="mapp-pay-perks">
          <li><Check /> Pay once, no renewal</li>
          <li><Check /> Credits never expire</li>
          <li><Check /> 2K, no watermark</li>
          <li><Check /> Ready in a minute</li>
        </ul>
      </main>

      <footer className="mapp-cta">
        {error && <div className="mapp-error" role="alert">{error}</div>}
        {notice && <div className="mapp-note" role="status">{notice}</div>}
        <button className="mapp-primary" onClick={() => void buy()} disabled={busy || playWaiting || playMissing || !selected} aria-busy={busy}>
          {busy
            ? <><span className="mapp-spin" aria-hidden /> {viaPlay ? "Opening Google Play…" : "Opening secure checkout…"}</>
            : !signedIn
              ? "Sign in with Google to buy"
              : selected && !playMissing
                ? <>Get {label(photosIn(selected.pack))} · {selected.label}</>
                : "Get credits"}
        </button>
        <p className="mapp-pay-fine">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          {viaPlay || play?.inApp
            ? "Secure payment by Google Play · one-time purchase"
            : <>Secure payment by Razorpay · charged once in INR{showUsd && selected ? ` (≈ $${selected.pack.usd})` : ""}</>}
        </p>
      </footer>
    </div>
  );
}
