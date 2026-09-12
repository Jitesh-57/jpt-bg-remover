"use client";

import { useState } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { persistAuthContext } from "@/lib/pending-image";
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
        position: "fixed", inset: 0, background: "rgba(11,26,20,0.58)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18, zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buy credits"
        style={{
          background: "var(--surface)", borderRadius: 22, width: "100%", maxWidth: 620,
          maxHeight: "92vh", overflowY: "auto", overflowX: "hidden",
          boxShadow: "0 36px 90px rgba(11,26,20,0.34)", border: "1px solid var(--border)",
        }}
      >
        {/* Gradient header */}
        <div style={{ position: "relative", background: "var(--grad-strong)", padding: "30px 28px 26px", textAlign: "center" }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: 17,
              lineHeight: 1, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ×
          </button>
          <div style={{ fontSize: 30, marginBottom: 8 }}>✨</div>
          <h2 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            {reason ? `Credits needed for ${reason}` : "Get AI credits"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>
            {CREDIT_COST} credits per generation · one-time payment · never expire
          </p>
        </div>

        <div style={{ padding: "24px 26px 26px" }}>
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

          {/* All three packs, side by side on desktop and stacked on phones */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))",
              gap: 11, marginBottom: 20,
            }}
          >
            {PACKS.map((p) => {
              const on = selected.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  aria-pressed={on}
                  style={{
                    position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 3, padding: "20px 12px 16px", borderRadius: 15, cursor: "pointer",
                    fontFamily: "inherit", textAlign: "center", minWidth: 0,
                    background: on ? "var(--accent-soft)" : "var(--surface-2)",
                    border: `2px solid ${on ? "var(--accent)" : "var(--border)"}`,
                    boxShadow: on ? "0 10px 28px rgba(15,157,107,0.18)" : "none",
                    transition: "border-color .15s var(--ease), background .15s var(--ease)",
                  }}
                >
                  {p.popular && (
                    <span
                      style={{
                        position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                        background: "var(--grad-strong)", color: "#fff", fontSize: 9.5, fontWeight: 800,
                        borderRadius: 20, padding: "3px 9px", letterSpacing: "0.06em",
                        textTransform: "uppercase", whiteSpace: "nowrap",
                      }}
                    >
                      Popular
                    </span>
                  )}
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {p.label}
                  </span>
                  <span style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    ${p.usd}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>{p.credits} credits</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{p.generations} generations</span>
                </button>
              );
            })}
          </div>

          {loggedIn ? (
            <button
              onClick={() => handleBuy(selected)}
              disabled={loadingPack !== null}
              style={{
                width: "100%", padding: "15px", border: "none", borderRadius: 13,
                background: loadingPack ? "var(--text-faint)" : "var(--grad-strong)",
                color: "#fff", fontWeight: 800, fontSize: 16.5, fontFamily: "inherit",
                cursor: loadingPack ? "not-allowed" : "pointer",
                boxShadow: loadingPack ? "none" : "0 10px 26px rgba(15,157,107,0.32)",
              }}
            >
              {loadingPack ? "Processing…" : `Get ${selected.credits} credits — $${selected.usd} →`}
            </button>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, background: "var(--surface)",
                  color: "var(--text-muted)", border: "1.5px solid var(--border)", fontWeight: 800,
                  fontSize: 15, fontFamily: "inherit", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
                Sign in to buy credits
              </button>
              <p style={{ fontSize: 12.5, color: "var(--text-faint)", textAlign: "center", margin: "11px 0 0" }}>
                Your uploaded image is kept while you sign in.
              </p>
            </>
          )}

          <p style={{ fontSize: 12.5, color: "var(--text-faint)", textAlign: "center", margin: "15px 0 0", lineHeight: 1.6 }}>
            No subscription · no auto-renew · the free browser tools stay free
          </p>
        </div>
      </div>
    </div>
  );
}
