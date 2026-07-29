"use client";

import { useState, useEffect } from "react";
import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { UNLIMITED_PRICE_LABEL, UNLIMITED_PRICE_SUB } from "@/app/_components/UnlimitedModal";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const GRAD = "linear-gradient(135deg,#6366F1,#8B5CF6)";

const FEATURES = [
  "Unlimited transformations for 30 days",
  "Unlimited 4× AI upscaling",
  "Unlimited batch processing",
  "Access to every tool on JPT AI",
  "No watermark · no credits, no caps",
  "One-time payment — no subscription, no auto-renew",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [prefillUser, setPrefillUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/me").then(r => r.json()).then((d: { authenticated?: boolean; name?: string; email?: string; plan?: string }) => {
      if (d.authenticated) { setLoggedIn(true); setPrefillUser({ name: d.name, email: d.email }); }
    }).catch(() => {});
  }, []);

  function signInWithGoogle() {
    window.location.href = `/api/auth/google?next=${encodeURIComponent("/pricing")}`;
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
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
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
              body: JSON.stringify({ ...response, plan: "unlimited" }),
            });
            const data = await verifyRes.json() as { success?: boolean; error?: string };
            if (data.success) {
              setStatusMsg({ text: "🎉 You're Unlimited! Every tool is unlocked.", ok: true });
              trackPurchase("unlimited", 415, 0);
            } else {
              trackPaymentFailed("unlimited", data.error || "verification_failed");
              setStatusMsg({ text: data.error || "Verification failed", ok: false });
            }
          } catch {
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
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 620 }}>
        <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 13, borderRadius: 20, padding: "6px 16px", marginBottom: 20, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          One plan · everything unlocked
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          Go Unlimited for {UNLIMITED_PRICE_LABEL}
        </h1>
        <p style={{ fontSize: 18, color: "#6B7280", margin: 0 }}>
          One payment unlocks every tool with unlimited transformations for 30 days. No subscription, no auto-renew, no credits to count.
        </p>
      </div>

      {statusMsg && (
        <div style={{ marginBottom: 28, padding: "14px 24px", borderRadius: 12, background: statusMsg.ok ? "#ECFDF5" : "#FEF2F2", color: statusMsg.ok ? "#065F46" : "#991B1B", fontSize: 15, fontWeight: 600, maxWidth: 480, textAlign: "center" }}>
          {statusMsg.text}
        </div>
      )}

      {/* Single plan card */}
      <div style={{ position: "relative", background: "#fff", border: "2px solid #C7D2FE", borderRadius: 24, padding: "40px 36px", maxWidth: 420, width: "100%", boxShadow: "0 24px 70px rgba(99,102,241,0.22)" }}>
        <div style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", background: "#F59E0B", color: "#fff", fontWeight: 800, fontSize: 12, borderRadius: 20, padding: "5px 16px", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          ✨ Unlimited
        </div>

        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Unlimited</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>{UNLIMITED_PRICE_LABEL}</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>{UNLIMITED_PRICE_SUB}</div>
        </div>

        <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {FEATURES.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 15, color: "#374151", fontWeight: 600 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#ECFDF5", color: "#10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        {loggedIn ? (
          <button
            onClick={handleBuy}
            disabled={loading}
            className="jpt-hover"
            style={{ width: "100%", padding: "16px", background: loading ? "#9CA3AF" : GRAD, color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 17, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
          >
            {loading ? "Processing…" : `Get Unlimited — ${UNLIMITED_PRICE_LABEL} →`}
          </button>
        ) : (
          <>
            <button
              onClick={signInWithGoogle}
              className="jpt-hover"
              style={{ width: "100%", padding: "15px", background: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, fontWeight: 800, fontSize: 15.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
              Continue with Google to unlock
            </button>
            <p style={{ fontSize: 12.5, color: "#9AA1B4", textAlign: "center", margin: "12px 0 0" }}>
              Sign in so your Unlimited access is saved to your account.
            </p>
          </>
        )}
      </div>

      <div style={{ marginTop: 40, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
        <p style={{ margin: 0 }}>Questions? <a href="mailto:support@jptai.com" style={{ color: "#6366F1", fontWeight: 600, textDecoration: "none" }}>Contact us</a></p>
      </div>
    </main>
  );
}
