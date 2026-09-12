"use client";

import { useState } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { PACKS, CREDIT_COST, type Pack } from "@/lib/plans";

// Buy-credits modal. Shown when someone hits the credit wall on an AI tool.
// Kept at this filename/default export so existing callers don't change.

export const CREDITS_ENTRY_LABEL = `From $${PACKS[0].usd}`;
export const CREDITS_ENTRY_SUB = `${PACKS[0].credits} credits · never expire`;

interface Props {
  onClose: () => void;
  loggedIn: boolean;
  reason?: string; // e.g. "4× upscaling" or "batch processing"
  prefillUser?: { name?: string; email?: string };
  onSuccess?: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

export default function UnlimitedModal({ onClose, loggedIn, reason, prefillUser, onSuccess }: Props) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [selected, setSelected] = useState<Pack>(PACKS.find((p) => p.popular) || PACKS[0]);

  function signInWithGoogle() {
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/editor";
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
        name: "JPT AI",
        description: `${p.credits} credits — ${p.label} pack`,
        theme: { color: "#0F9D6B" },
        modal: {
          ondismiss() {
            trackPaymentFailed(p.id, "cancelled_by_user");
            setStatusMsg({ text: "Payment cancelled", ok: false });
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
        position: "fixed", inset: 0, background: "rgba(11,26,20,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18, zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20,
          padding: "28px 26px 24px", width: "100%", maxWidth: 460, maxHeight: "90vh",
          overflowY: "auto", boxShadow: "0 30px 80px rgba(11,26,20,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {reason ? `Credits needed for ${reason}` : "Top up your credits"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 22, lineHeight: 1, cursor: "pointer", color: "var(--text-faint)", padding: 0, fontFamily: "inherit" }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: "0 0 18px", fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          AI tools run on credits — {CREDIT_COST} per generation. Pay once, they never expire.
          The browser tools stay free.
        </p>

        {statusMsg && (
          <div
            style={{
              marginBottom: 16, padding: "11px 15px", borderRadius: 10,
              background: statusMsg.ok ? "var(--success-soft)" : "var(--danger-soft)",
              color: statusMsg.ok ? "var(--accent-strong)" : "var(--danger)",
              fontSize: 14, fontWeight: 600,
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
          {PACKS.map((p) => {
            const on = selected.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "13px 15px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", width: "100%",
                  background: on ? "var(--accent-soft)" : "var(--surface-2)",
                  border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>
                    {p.credits} credits
                    {p.popular && (
                      <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 800, color: "var(--accent-strong)", background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: 20, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Popular
                      </span>
                    )}
                  </span>
                  <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                    ≈ {p.generations} generations
                  </span>
                </span>
                <span style={{ fontSize: 20, fontWeight: 900, color: on ? "var(--accent-strong)" : "var(--text)", flexShrink: 0 }}>
                  ${p.usd}
                </span>
              </button>
            );
          })}
        </div>

        {loggedIn ? (
          <button
            onClick={() => handleBuy(selected)}
            disabled={loadingPack !== null}
            style={{
              width: "100%", padding: "15px", border: "none", borderRadius: 12,
              background: loadingPack ? "var(--text-faint)" : "var(--grad-strong)",
              color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "inherit",
              cursor: loadingPack ? "not-allowed" : "pointer",
            }}
          >
            {loadingPack ? "Processing…" : `Get ${selected.credits} credits — $${selected.usd}`}
          </button>
        ) : (
          <>
            <button
              onClick={signInWithGoogle}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, background: "var(--surface)",
                color: "var(--text-muted)", border: "1.5px solid var(--border)", fontWeight: 800,
                fontSize: 15, fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
              Sign in to buy credits
            </button>
            <p style={{ fontSize: 12.5, color: "var(--text-faint)", textAlign: "center", margin: "11px 0 0" }}>
              Sign in so your credits are saved to your account.
            </p>
          </>
        )}

        <p style={{ fontSize: 12.5, color: "var(--text-faint)", textAlign: "center", margin: "14px 0 0" }}>
          One-time payment · no subscription · credits never expire
        </p>
      </div>
    </div>
  );
}
