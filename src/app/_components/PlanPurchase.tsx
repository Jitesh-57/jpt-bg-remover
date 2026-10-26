"use client";

import { useEffect, useState } from "react";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { buyPack, prepareCheckout } from "@/lib/checkout";
import { publishCredits } from "@/lib/credits";
import { CREDIT_COST, MONTHLY_PLANS, PACKS, formatInr, inrPerCredit, type Pack } from "@/lib/plans";

/**
 * PlanPurchase — choose a monthly plan or a one-time add-on pack, and pay.
 *
 * One component for every place that sells credits, so the prices, the
 * wording about renewals and the checkout behave the same everywhere:
 *
 *   layout="list"  the pricing popup: a radio list and one buy button
 *   layout="grid"  /pricing and /app/credits: cards, each with its own button
 *
 * Monthly plans go through subscribe(), add-ons through buyPack() — both in
 * lib/checkout.ts; buyPack() hands a monthly plan to subscribe() itself.
 */

export type PlanTab = "monthly" | "addons";

const cheapest = (list: Pack[]) => Math.min(...list.map(inrPerCredit));
/** How much less a credit costs on the best monthly plan than on the best add-on. */
export const MONTHLY_SAVING = Math.round((1 - cheapest(MONTHLY_PLANS) / cheapest(PACKS)) * 100);

const FINE_PRINT: Record<PlanTab, string> = {
  monthly: "Renews monthly · cancel anytime in Settings, no further charges · monthly credits refresh each renewal and don't carry over",
  addons: "One-time payment · no renewal · these credits never expire",
};

export function PlanTabs({ tab, onTab }: { tab: PlanTab; onTab: (t: PlanTab) => void }) {
  return (
    <div className="jpt-plan-tabs" role="tablist" aria-label="Plan type">
      <button type="button" role="tab" aria-selected={tab === "monthly"} className={tab === "monthly" ? "on" : ""} onClick={() => onTab("monthly")}>
        Monthly
        {MONTHLY_SAVING > 0 && <span className="jpt-plan-save">Save up to {MONTHLY_SAVING}%</span>}
      </button>
      <button type="button" role="tab" aria-selected={tab === "addons"} className={tab === "addons" ? "on" : ""} onClick={() => onTab("addons")}>
        Add-on credits
      </button>
    </div>
  );
}

/**
 * Dollars first for visitors outside India.
 *
 * Checkout charges rupees either way (see lib/plans.ts), but "₹1,494" means
 * little to someone in the US. Read after mount from the country cookie the
 * middleware sets, so the server-rendered page and the first client render
 * agree, and India — the default — never flickers.
 */
function useDollarsFirst(): boolean {
  const [usd, setUsd] = useState(false);
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )jpt_country=([A-Z]{2})/);
    setUsd(!!m && m[1] !== "IN");
  }, []);
  return usd;
}

function Price({ p, big, dollarsFirst }: { p: Pack; big?: boolean; dollarsFirst?: boolean }) {
  return (
    <span className="jpt-plan-price">
      <span className={big ? "jpt-plan-amount big" : "jpt-plan-amount"}>{dollarsFirst ? `$${p.usd}` : `₹${formatInr(p.inr)}`}</span>
      {p.monthly && <span className="jpt-plan-per">/mo</span>}
      <span className="jpt-plan-usd">{dollarsFirst ? `charged as ₹${formatInr(p.inr)}` : `≈ $${p.usd}`}</span>
    </span>
  );
}

export default function PlanPurchase({
  layout = "list", loggedIn, prefillUser, initialTab = "monthly", onSuccess,
}: {
  layout?: "list" | "grid";
  loggedIn: boolean;
  prefillUser?: { name?: string; email?: string };
  initialTab?: PlanTab;
  onSuccess?: (credits?: number) => void;
}) {
  const [tab, setTab] = useState<PlanTab>(initialTab);
  const dollarsFirst = useDollarsFirst();
  const list = tab === "monthly" ? MONTHLY_PLANS : PACKS;
  const defaultFor = (l: Pack[]) => (l.find((p) => p.popular) || l[0]).id;
  const [picked, setPicked] = useState<Record<PlanTab, string>>({ monthly: defaultFor(MONTHLY_PLANS), addons: defaultFor(PACKS) });
  const selected = list.find((p) => p.id === picked[tab]) || list[0];
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  // The plans are on screen, so a click may be seconds away: have the payment
  // window ready for it. Signed-out visitors sign in first, so they wait.
  useEffect(() => { if (loggedIn) prepareCheckout(); }, [loggedIn]);

  async function buy(p: Pack) {
    if (!loggedIn) { await beginGoogleSignIn(); return; }
    setBusy(p.id);
    setStatus(null);
    const r = await buyPack(p, prefillUser);
    setBusy(null);
    setStatus({ text: r.text, ok: r.ok });
    if (r.ok) {
      if (typeof r.credits === "number") publishCredits(r.credits);
      onSuccess?.(r.credits);
    }
  }

  // One plain action for every plan and pack: the price is already on the
  // selected row, and the line under the button says whether it renews.
  const label = (p: Pack) => !loggedIn
    ? "Sign in to continue"
    : busy === p.id
      ? "Opening checkout…"
      : "Buy Now";

  const statusBox = status && (
    <div className={`jpt-plan-status ${status.ok ? "ok" : "err"}`} role="status">{status.text}</div>
  );

  if (layout === "grid") {
    return (
      <div className="jpt-plan-grid-wrap">
        <div style={{ display: "flex", justifyContent: "center" }}><PlanTabs tab={tab} onTab={(t) => { setTab(t); setStatus(null); }} /></div>
        {statusBox}
        <div className="jpt-plan-grid">
          {list.map((p) => (
            <div key={p.id} className={`jpt-plan-card${p.popular ? " featured" : ""}`}>
              <div className="jpt-plan-card-top">
                <span className="jpt-plan-name">{p.label}</span>
                {p.badge && <span className="jpt-plan-badge">{p.badge}</span>}
              </div>
              <Price p={p} big dollarsFirst={dollarsFirst} />
              <div className="jpt-plan-credits">
                <strong>{p.credits} credits{p.monthly ? " every month" : ""}</strong>
                <span>{p.generations} AI generations · ₹{inrPerCredit(p).toFixed(1)} per credit</span>
              </div>
              <p className="jpt-plan-blurb">{p.blurb}</p>
              <button type="button" className="jpt-plan-buy" disabled={busy !== null} onClick={() => buy(p)}>
                {label(p)}
              </button>
            </div>
          ))}
        </div>
        <p className="jpt-plan-fine">{FINE_PRINT[tab]}. {CREDIT_COST} credits per AI generation; the free tools stay free.</p>
      </div>
    );
  }

  return (
    <div className="jpt-plan-list-wrap">
      <PlanTabs tab={tab} onTab={(t) => { setTab(t); setStatus(null); }} />
      {statusBox}
      <div className="jpt-plan-list" role="radiogroup" aria-label={tab === "monthly" ? "Monthly plans" : "Add-on credit packs"}>
        {list.map((p) => {
          const on = p.id === selected.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`jpt-plan-row${on ? " on" : ""}`}
              onClick={() => setPicked((s) => ({ ...s, [tab]: p.id }))}
            >
              <span className="jpt-plan-dot" aria-hidden />
              <span className="jpt-plan-row-main">
                <span className="jpt-plan-row-title">
                  <span className="jpt-plan-name">{p.label}</span>
                  {p.badge && <span className="jpt-plan-badge">{p.badge}</span>}
                </span>
                <span className="jpt-plan-row-sub">
                  {p.credits} credits{p.monthly ? " / month" : ""} · {p.generations} generations
                </span>
              </span>
              <span className="jpt-plan-row-price">
                <Price p={p} dollarsFirst={dollarsFirst} />
                <span className="jpt-plan-unit">₹{inrPerCredit(p).toFixed(1)} per credit</span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="jpt-plan-buy big" disabled={busy !== null} onClick={() => buy(selected)}>
        {label(selected)}
      </button>
      <p className="jpt-plan-fine">{FINE_PRINT[tab]}.</p>
      <p className="jpt-plan-secure">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Secure checkout by Razorpay · UPI, cards and netbanking · charged in INR
      </p>
    </div>
  );
}
