"use client";

import { useState } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";

// Single "Unlimited" plan — one-time unlock for unlimited transformations and
// access to every tool. Priced in INR (~$5) so it works with the existing
// Razorpay (INR) setup out of the box.
export const UNLIMITED_PRICE_LABEL = "₹415";
export const UNLIMITED_PRICE_SUB = "≈ $5 · one-time";

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

const FEATURES = [
  "Unlimited 4× upscaling",
  "Unlimited batch processing",
  "Access to every tool",
  "No watermark · no limits",
  "One-time payment — no subscription",
];

export default function UnlimitedModal({ onClose, loggedIn, reason, prefillUser, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function signInWithGoogle() {
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/editor";
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  }

  async function handleBuy() {
    setLoading(true);
    setStatusMsg(null);
    trackBuyButtonClicked("unlimited", 415);
    trackBeginCheckout("unlimited", 415);

    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay script"));
          document.head.appendChild(s);
        });
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "unlimited" }),
      });
      const orderData = await orderRes.json() as { order_id?: string; amount?: number; currency?: string; error?: string };

      if (!orderRes.ok || !orderData.order_id) {
        trackPaymentFailed("unlimited", orderData.error || "order_creation_failed");
        setStatusMsg({ text: orderData.error || "Failed to start checkout", ok: false });
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JPT AI",
        description: "Unlimited — all tools, unlimited transformations",
        theme: { color: "#6366F1" },
        modal: {
          ondismiss() {
            trackPaymentFailed("unlimited", "cancelled_by_user");
            setStatusMsg({ text: "Payment cancelled", ok: false });
            setLoading(false);
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: "unlimited",
              }),
            });
            const verifyData = await verifyRes.json() as { success?: boolean; error?: string };
            if (verifyData.success) {
              setStatusMsg({ text: "🎉 You're Unlimited! Enjoy every tool.", ok: true });
              trackPurchase("unlimited", 415, 0);
              onSuccess?.();
            } else {
              trackPaymentFailed("unlimited", verifyData.error || "verification_failed");
              setStatusMsg({ text: verifyData.error || "Verification failed", ok: false });
            }
          } catch {
            trackPaymentFailed("unlimited", "verification_request_failed");
            setStatusMsg({ text: "Verification request failed", ok: false });
          }
          setLoading(false);
        },
        prefill: { name: prefillUser?.name || "", email: prefillUser?.email || "" },
      });

      rzp.open();
    } catch (e) {
      trackPaymentFailed("unlimited", String(e));
      setStatusMsg({ text: String(e), ok: false });
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, maxWidth: 420, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.35)", overflow: "hidden" }}>
        {/* header */}
        <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", padding: "30px 30px 26px", color: "#fff", position: "relative", textAlign: "center" }}>
          <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", fontSize: 17, lineHeight: 1 }}>×</button>
          <div style={{ fontSize: 34, marginBottom: 8 }}>✨</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>Go Unlimited</div>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.9)" }}>
            {reason ? `${reason.charAt(0).toUpperCase() + reason.slice(1)} is a Pro feature.` : "Unlock every tool."}
          </p>
        </div>

        <div style={{ padding: "26px 30px 30px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>{UNLIMITED_PRICE_LABEL}</span>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{UNLIMITED_PRICE_SUB}</div>
          </div>

          <ul style={{ listStyle: "none", margin: "0 0 22px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151", fontWeight: 600 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#ECFDF5", color: "#10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {statusMsg && (
            <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: 10, background: statusMsg.ok ? "#ECFDF5" : "#FEF2F2", color: statusMsg.ok ? "#065F46" : "#991B1B", fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>
              {statusMsg.text}
            </div>
          )}

          {loggedIn ? (
            <button
              onClick={handleBuy}
              disabled={loading}
              className="jpt-hover"
              style={{ width: "100%", padding: "15px", background: loading ? "#9CA3AF" : "linear-gradient(120deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 22px rgba(99,102,241,0.35)" }}
            >
              {loading ? "Processing…" : `Get Unlimited — ${UNLIMITED_PRICE_LABEL} →`}
            </button>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="jpt-hover"
                style={{ width: "100%", padding: "14px", background: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
                Continue with Google to unlock
              </button>
              <p style={{ fontSize: 12, color: "#9AA1B4", textAlign: "center", margin: "12px 0 0" }}>
                Sign in so your Unlimited access is saved to your account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
