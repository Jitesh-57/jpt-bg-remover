"use client";

import { useCallback, useEffect, useState } from "react";
import { openPricing } from "@/lib/pricing-modal";
import { onCreditsChanged } from "@/lib/credits";

/** One plan, as /api/subscriptions describes it (PlanView in lib/subscriptions.server.ts). */
interface PlanView {
  id: number;
  plan: string;
  label: string;
  credits: number;
  inr: string;
  status: string;
  creditsLeft: number;
  activeUntil: string | null;
  renewsOn: string | null;
  cancelling: boolean;
  ended: boolean;
}

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * "Your plans" — the user's monthly plans, with Cancel.
 *
 * Cancelling is confirmed inside the card rather than with confirm(): it stops
 * future charges at Razorpay, the month already paid for runs to its end, and
 * the card then says until when.
 */
export default function MyPlans({ onTotals }: { onTotals?: (monthly: number) => void }) {
  const [plans, setPlans] = useState<PlanView[] | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/subscriptions", { cache: "no-store" });
      const d = (await r.json()) as { plans?: PlanView[] };
      const list = d.plans || [];
      setPlans(list);
      onTotals?.(list.reduce((n, p) => n + p.creditsLeft, 0));
    } catch {
      setPlans([]);
    }
  }, [onTotals]);

  useEffect(() => { load(); }, [load]);
  // A plan bought from the popup on this page shows up without a reload.
  useEffect(() => onCreditsChanged(() => { load(); }), [load]);

  async function cancel(id: number) {
    setBusy(id);
    setError(null);
    try {
      const r = await fetch("/api/subscriptions/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      const d = (await r.json()) as { ok?: boolean; plan?: PlanView; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error || "The plan could not be cancelled just now.");
      setPlans((list) => (list || []).map((p) => (p.id === id && d.plan ? d.plan : p)));
      setConfirming(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="jpt-myplans">
      <div className="jpt-myplans-head">
        <div>
          <div className="jpt-myplans-title">Your plans</div>
          <div className="jpt-myplans-sub">Monthly plans renew automatically. Cancel any time — you keep this month&apos;s credits until it ends.</div>
        </div>
        <button type="button" className="jpt-myplans-add" onClick={() => openPricing(undefined, "monthly")}>Add a plan</button>
      </div>

      {error && <div className="jpt-plan-status err" role="alert">{error}</div>}

      {plans === null ? (
        <div className="jpt-myplans-empty">Loading your plans…</div>
      ) : plans.length === 0 ? (
        <div className="jpt-myplans-empty">
          No monthly plan yet. A plan gives you fresh credits every month, for less per credit than a one-time pack.
        </div>
      ) : (
        <ul className="jpt-myplans-list">
          {plans.map((p) => (
            <li key={p.id} className="jpt-myplans-item">
              <div className="jpt-myplans-row">
                <div style={{ minWidth: 0 }}>
                  <div className="jpt-myplans-name">
                    {p.label} <span className="jpt-myplans-price">₹{p.inr}/month · {p.credits} credits</span>
                  </div>
                  <div className="jpt-myplans-meta">
                    {p.ended
                      ? <>Ended · {p.creditsLeft} credits left until {day(p.activeUntil)}</>
                      : p.cancelling
                        ? <><span className="jpt-myplans-pill warn">Cancelled</span> Active until {day(p.activeUntil)} · no further charges · {p.creditsLeft} credits left</>
                        : p.status === "halted" || p.status === "pending"
                          ? <><span className="jpt-myplans-pill warn">Payment failed</span> Razorpay will retry the renewal · {p.creditsLeft} credits left</>
                          : <><span className="jpt-myplans-pill ok">Active</span> {p.creditsLeft} of {p.credits} credits left · renews {day(p.renewsOn)}</>}
                  </div>
                </div>
                {!p.ended && !p.cancelling && confirming !== p.id && (
                  <button type="button" className="jpt-myplans-cancel" onClick={() => { setConfirming(p.id); setError(null); }}>
                    Cancel plan
                  </button>
                )}
              </div>
              {confirming === p.id && (
                <div className="jpt-myplans-confirm">
                  <p>
                    Cancel the {p.label} plan? You won&apos;t be charged again. Your {p.creditsLeft} remaining credits
                    stay usable until {day(p.activeUntil)}.
                  </p>
                  <div className="jpt-myplans-confirm-actions">
                    <button type="button" className="jpt-myplans-cancel solid" disabled={busy === p.id} onClick={() => cancel(p.id)}>
                      {busy === p.id ? "Cancelling…" : "Yes, cancel plan"}
                    </button>
                    <button type="button" className="jpt-myplans-keep" disabled={busy === p.id} onClick={() => setConfirming(null)}>
                      Keep plan
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
