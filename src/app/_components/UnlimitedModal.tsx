"use client";

import { useState } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { persistAuthContext } from "@/lib/pending-image";
import { PACKS, CREDIT_COST, inrPerCredit, type Pack } from "@/lib/plans";
import { landingImg } from "@/lib/landing-images";

// Buy-credits modal. Shown when someone hits the credit wall on an AI tool.
// Kept at this filename/default export so existing callers don't change.

export const CREDITS_ENTRY_LABEL = `From ₹${PACKS[0].inr}`;
export const CREDITS_ENTRY_SUB = `${PACKS[0].credits} credits · never expire`;

interface Props {
  onClose: () => void;
  loggedIn: boolean;
  reason?: string; // e.g. "4× upscaling" or "batch processing"
  prefillUser?: { name?: string; email?: string };
  onSuccess?: () => void;
}

/** The shape Razorpay hands to a "payment.failed" listener. */
interface RazorpayFailure {
  error?: { description?: string; reason?: string; step?: string; code?: string };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => {
      open(): void;
      /** Razorpay reports a rejected payment here, not through ondismiss. */
      on?(event: "payment.failed", cb: (resp: RazorpayFailure) => void): void;
    };
  }
}

export default function UnlimitedModal({ onClose, loggedIn, reason, prefillUser, onSuccess }: Props) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [selected, setSelected] = useState<Pack>(PACKS.find((p) => p.popular) || PACKS[0]);
  // The left panel's image. Hidden on error, leaving the brand gradient, so a
  // missing creative costs nothing.
  const heroUrl = landingImg("pricing-hero.png");

  async function signInWithGoogle() {
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/editor";
    // Keep any in-progress upload across the OAuth round-trip.
    await persistAuthContext();
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  }

  async function handleBuy(p: Pack) {
    setLoadingPack(p.id);
    setStatusMsg(null);
    trackBuyButtonClicked(p.id, p.usd);
    trackBeginCheckout(p.id, p.usd);

    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p.id }),
      });
      const orderData = (await orderRes.json()) as { order_id?: string; amount?: number; currency?: string; error?: string };

      if (!orderRes.ok || !orderData.order_id) {
        trackPaymentFailed(p.id, orderData.error || "order_creation_failed");
        setStatusMsg({ text: orderData.error || "Failed to start checkout", ok: false });
        setLoadingPack(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Pixel Shine",
        description: `${p.credits} credits — ${p.label} pack`,
        // A literal hex, not var(--accent): Razorpay's checkout renders in its
        // own document and cannot resolve our CSS custom properties, so the
        // variable was silently ignored and checkout fell back to its default
        // blue.
        theme: { color: "#FF7A2F" },
        modal: {
          ondismiss() {
            trackPaymentFailed(p.id, "cancelled_by_user");
            setStatusMsg((prev) => prev && !prev.ok ? prev : { text: "Payment cancelled", ok: false });
            setLoadingPack(null);
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan: p.id }),
            });
            const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };
            if (verifyData.success) {
              setStatusMsg({ text: `🎉 ${p.credits} credits added.`, ok: true });
              trackPurchase(p.id, p.usd, 0);
              onSuccess?.();
            } else {
              trackPaymentFailed(p.id, verifyData.error || "verification_failed");
              setStatusMsg({ text: verifyData.error || "Verification failed", ok: false });
            }
          } catch {
            trackPaymentFailed(p.id, "verification_request_failed");
            setStatusMsg({ text: "Verification request failed", ok: false });
          }
          setLoadingPack(null);
        },
        prefill: { name: prefillUser?.name || "", email: prefillUser?.email || "" },
      });

      // See the pricing page: a rejected payment arrives here, and ondismiss
      // would otherwise relabel it "Payment cancelled".
      rzp.on?.("payment.failed", (resp: RazorpayFailure) => {
        const why = resp?.error?.description || resp?.error?.reason || "Payment failed";
        trackPaymentFailed(p.id, resp?.error?.reason || "payment_failed");
        console.error("[pricing-modal] razorpay payment.failed:", JSON.stringify(resp?.error || {}));
        setStatusMsg({ text: why, ok: false });
        setLoadingPack(null);
      });

      rzp.open();
    } catch (e) {
      trackPaymentFailed(p.id, String(e));
      setStatusMsg({ text: String(e), ok: false });
      setLoadingPack(null);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(6,6,9,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18, zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buy credits"
        className="jpt-pricing-modal"
        style={{
          background: "var(--surface)", borderRadius: 22, width: "100%", maxWidth: 940,
          maxHeight: "94vh", overflowY: "auto", overflowX: "hidden",
          boxShadow: "0 36px 90px rgba(0,0,0,0.55)", border: "1px solid var(--border-strong)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 3, width: 32, height: 32,
            borderRadius: "50%", background: "rgba(11,11,14,0.55)", border: "1px solid var(--border)",
            color: "var(--text)", fontSize: 18, lineHeight: 1, cursor: "pointer", fontFamily: "inherit",
            backdropFilter: "blur(6px)",
          }}
        >
          ×
        </button>

        {/* ── Left: what the money buys ──────────────────────────────────── */}
        <aside className="jpt-pricing-aside" style={{ position: "relative", minHeight: 420, overflow: "hidden", background: "var(--grad-strong)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroUrl}
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,11,14,0.25) 0%, rgba(11,11,14,0.88) 62%)" }} />
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "26px 24px 24px", gap: 14 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                Pay for what you use. No subscription.
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 6, lineHeight: 1.6 }}>
                Credits never expire, and nothing renews on its own.
              </div>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                `${selected.generations} AI generations with this pack`,
                "Nano Banana and GPT Image, both included",
                "Full resolution, no watermark, yours to use commercially",
                "Every free tool stays unlimited and free — no account needed",
                "Runs in the browser — nothing to install",
              ].map((line) => (
                <li key={line} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, color: "rgba(255,255,255,0.94)", lineHeight: 1.5 }}>
                  <span aria-hidden style={{ color: "var(--accent)", fontWeight: 900, flexShrink: 0 }}>✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Right: the packs ───────────────────────────────────────────── */}
        <div style={{ padding: "30px 28px 26px", minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "6px 13px", marginBottom: 18 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>One-time</span>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>no subscription</span>
          </div>

          <h2 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {reason ? `Credits needed for ${reason}` : "Choose a credit pack"}
          </h2>
          <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {CREDIT_COST} credits per AI generation. The free tools are unlimited either way.
          </p>

          {statusMsg && (
            <div
              style={{
                marginBottom: 14, padding: "11px 14px", borderRadius: 10,
                background: statusMsg.ok ? "var(--success-soft)" : "var(--danger-soft)",
                color: statusMsg.ok ? "var(--success)" : "var(--danger)",
                fontSize: 13.5, fontWeight: 600,
              }}
            >
              {statusMsg.text}
            </div>
          )}

          <div role="radiogroup" aria-label="Credit packs" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {PACKS.map((p) => {
              const on = selected.id === p.id;
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 13, width: "100%",
                    padding: "15px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit", minWidth: 0,
                    background: on ? "var(--accent-soft)" : "var(--surface-2)",
                    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                    boxShadow: on ? "0 10px 26px var(--accent-soft)" : "none",
                    transition: "border-color .15s var(--ease), background .15s var(--ease)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 19, height: 19, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${on ? "var(--accent)" : "var(--border-strong)"}`,
                      background: on ? "var(--accent)" : "transparent",
                      boxShadow: on ? "inset 0 0 0 3.5px var(--surface)" : "none",
                    }}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>₹{p.inr}</span>
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>≈ ${p.usd}</span>
                      {p.popular && (
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", color: "#fff", background: "var(--accent-fill)", borderRadius: 999, padding: "3px 8px" }}>
                          POPULAR
                        </span>
                      )}
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{p.blurb}</span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: on ? "var(--accent)" : "var(--text)" }}>
                      {p.credits} credits
                    </span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>
                      {p.generations} generations · ₹{inrPerCredit(p).toFixed(1)}/credit
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => (loggedIn ? handleBuy(selected) : signInWithGoogle())}
            disabled={loadingPack !== null}
            style={{
              width: "100%", padding: "15px", borderRadius: 13, border: "none",
              background: loadingPack ? "var(--surface-3)" : "var(--grad-strong)",
              color: loadingPack ? "var(--text-faint)" : "#fff",
              fontWeight: 800, fontSize: 16, fontFamily: "inherit",
              cursor: loadingPack ? "wait" : "pointer",
              boxShadow: loadingPack ? "none" : "var(--glow)",
            }}
          >
            {loadingPack
              ? "Opening checkout…"
              : loggedIn
                ? `Get ${selected.credits} credits — ₹${selected.inr}`
                : "Sign in to continue"}
          </button>

          <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--text-faint)", textAlign: "center", lineHeight: 1.6 }}>
            Charged once in INR via Razorpay. No stored card, no renewal.
          </p>
        </div>
      </div>
    </div>
  );
}
