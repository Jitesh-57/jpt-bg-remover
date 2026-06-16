"use client";

import { useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const plans = [
  { name: "Starter", planKey: "starter", price: "₹499",  credits: 50,  transformations: "~25",  popular: false, accent: "#6366F1", bg: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)", border: "#c7d2fe" },
  { name: "Creator", planKey: "creator", price: "₹999",  credits: 100, transformations: "~50",  popular: false, accent: "#6366F1", bg: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)", border: "#c7d2fe" },
  { name: "Pro",     planKey: "pro",     price: "₹2499", credits: 300, transformations: "~150", popular: true,  accent: "#fff",    bg: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",  border: "#6366F1" },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleBuy(planKey: string) {
    setLoading(planKey);
    setStatusMsg(null);

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
        body: JSON.stringify({ plan: planKey }),
      });
      const orderData = await orderRes.json() as {
        order_id?: string; amount?: number; currency?: string; credits?: number; error?: string;
      };

      if (!orderRes.ok || !orderData.order_id) {
        setStatusMsg({ text: orderData.error || "Failed to create order", ok: false });
        setLoading(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JPT AI",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan — ${orderData.credits} credits`,
        theme: { color: "#6366F1" },
        modal: {
          ondismiss() {
            setStatusMsg({ text: "Payment cancelled", ok: false });
            setLoading(null);
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan: planKey }),
            });
            const data = await verifyRes.json() as { success?: boolean; credits?: number; error?: string };
            if (data.success) {
              setStatusMsg({ text: `🎉 Payment successful! You now have ${data.credits} credits.`, ok: true });
            } else {
              setStatusMsg({ text: data.error || "Verification failed", ok: false });
            }
          } catch {
            setStatusMsg({ text: "Verification request failed", ok: false });
          }
          setLoading(null);
        },
        prefill: {},
      });

      rzp.open();
    } catch (e) {
      setStatusMsg({ text: String(e), ok: false });
      setLoading(null);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 13, borderRadius: 20, padding: "6px 16px", marginBottom: 20, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Pricing
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: "#6B7280", margin: 0, fontWeight: 400 }}>
          Pay once, use anytime. No subscriptions.
        </p>
      </div>

      {statusMsg && (
        <div style={{
          marginBottom: 32,
          padding: "14px 24px",
          borderRadius: 12,
          background: statusMsg.ok ? "#ECFDF5" : "#FEF2F2",
          color: statusMsg.ok ? "#065F46" : "#991B1B",
          fontSize: 15,
          fontWeight: 600,
          maxWidth: 480,
          textAlign: "center",
        }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", maxWidth: 1000, width: "100%" }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              position: "relative",
              background: plan.bg,
              border: `2px solid ${plan.border}`,
              borderRadius: 20,
              padding: "36px 32px",
              minWidth: 260,
              maxWidth: 300,
              flex: "1 1 260px",
              boxShadow: plan.popular ? "0 20px 60px rgba(99,102,241,0.35)" : "0 4px 24px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              transform: plan.popular ? "scale(1.04)" : "none",
            }}
          >
            {plan.popular && (
              <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", background: "#F59E0B", color: "#fff", fontWeight: 800, fontSize: 12, borderRadius: 20, padding: "5px 16px", letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: "0 2px 8px rgba(245,158,11,0.4)" }}>
                ⭐ Most Popular
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: plan.popular ? "rgba(255,255,255,0.75)" : "#6366F1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {plan.name}
              </span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: plan.popular ? "#fff" : "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {plan.price}
              </span>
            </div>

            <div style={{ marginBottom: 28, flex: 1 }}>
              <div style={{ background: plan.popular ? "rgba(255,255,255,0.15)" : "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: plan.popular ? "#fff" : "#6366F1" }}>{plan.credits}</div>
                <div style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.8)" : "#6B7280", fontWeight: 500 }}>AI Credits</div>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                  <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                  {plan.transformations} AI transformations
                </li>
                {["Background removal", "AI image editing", "Pro upscaling"].map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                    <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                    {f}
                  </li>
                ))}
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151", fontWeight: 600 }}>
                  <span style={{ color: plan.popular ? "#FCD34D" : "#F59E0B", fontWeight: 700, fontSize: 16 }}>★</span>
                  Credits never expire
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleBuy(plan.planKey)}
              disabled={loading !== null}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "14px 24px",
                background: loading === plan.planKey ? "#9CA3AF" : plan.popular ? "#fff" : "#6366F1",
                color: plan.popular ? "#6366F1" : "#fff",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 15,
                border: "none",
                cursor: loading !== null ? "not-allowed" : "pointer",
                boxShadow: plan.popular ? "0 4px 16px rgba(255,255,255,0.3)" : "0 4px 16px rgba(99,102,241,0.3)",
                transition: "opacity 0.15s",
              }}
            >
              {loading === plan.planKey ? "Processing…" : "Buy Now →"}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
        <p style={{ margin: "0 0 8px" }}>All plans include access to all AI tools. Credits are shared across tools.</p>
        <p style={{ margin: 0 }}>Questions? <a href="mailto:support@jptai.com" style={{ color: "#6366F1", fontWeight: 600, textDecoration: "none" }}>Contact us</a></p>
      </div>
    </main>
  );
}
