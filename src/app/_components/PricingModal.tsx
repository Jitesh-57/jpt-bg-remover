"use client";

import { useState } from "react";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";

interface PricingModalProps {
  onClose: () => void;
  onPurchaseSuccess?: (plan: string, newCredits: number) => void;
  prefillUser?: { name?: string; email?: string };
  notice?: string;
}

const plans = [
  { name: "Starter", planKey: "starter", price: "₹499", credits: 50,  transformations: "~25", popular: false },
  { name: "Creator", planKey: "creator", price: "₹999", credits: 100, transformations: "~50", popular: false },
  { name: "Pro",     planKey: "pro",     price: "₹2499", credits: 300, transformations: "~150", popular: true  },
];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

export default function PricingModal({ onClose, onPurchaseSuccess, prefillUser, notice }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleBuy(planKey: string) {
    setLoading(planKey);
    setStatusMsg(null);
    const planValue = Number((plans.find(p => p.planKey === planKey)?.price || "0").replace(/[^0-9]/g, ""));
    trackBeginCheckout(planKey, planValue);

    try {
      // Load Razorpay checkout.js if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay script"));
          document.head.appendChild(s);
        });
      }

      // Step 1: Create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const orderData = await orderRes.json() as {
        order_id?: string; amount?: number; currency?: string;
        credits?: number; error?: string;
      };

      if (!orderRes.ok || !orderData.order_id) {
        setStatusMsg({ text: orderData.error || "Failed to create order", ok: false });
        setLoading(null);
        return;
      }

      // Step 2: Open Razorpay modal
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
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify signature + assign credits
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey,
              }),
            });
            const verifyData = await verifyRes.json() as {
              success?: boolean; credits?: number; error?: string;
            };

            if (verifyData.success) {
              setStatusMsg({ text: `🎉 Payment successful! ${verifyData.credits} credits added.`, ok: true });
              trackPurchase(planKey, planValue, verifyData.credits!);
              onPurchaseSuccess?.(planKey, verifyData.credits!);
            } else {
              setStatusMsg({ text: verifyData.error || "Verification failed", ok: false });
            }
          } catch {
            setStatusMsg({ text: "Verification request failed", ok: false });
          }
          setLoading(null);
        },
        prefill: { name: prefillUser?.name || "", email: prefillUser?.email || "" },
      });

      rzp.open();
    } catch (e) {
      setStatusMsg({ text: String(e), ok: false });
      setLoading(null);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 860,
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {notice && (
          <div style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 14,
            background: "linear-gradient(135deg,#EEF2FF,#FAF5FF)",
            border: "1px solid #C7D2FE",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🎁</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#4338CA", lineHeight: 1.5 }}>{notice}</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <h2 style={{ fontWeight: 900, fontSize: 26, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", margin: 0 }}>
            Pay once, use anytime. No subscriptions.
          </p>
          <div style={{ display: "inline-block", marginTop: 12, padding: "6px 14px", background: "#EEF2FF", color: "#4338CA", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            ⚡ Each AI generation uses 2 credits
          </div>
        </div>

        {statusMsg && (
          <div style={{
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 10,
            background: statusMsg.ok ? "#ECFDF5" : "#FEF2F2",
            color: statusMsg.ok ? "#065F46" : "#991B1B",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "center",
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
          {plans.map(plan => (
            <div
              key={plan.name}
              style={{
                position: "relative",
                background: plan.popular
                  ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                  : "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)",
                border: `2px solid ${plan.popular ? "#6366F1" : "#c7d2fe"}`,
                borderRadius: 16,
                padding: "28px 24px",
                minWidth: 220,
                flex: "1 1 220px",
                boxShadow: plan.popular
                  ? "0 12px 40px rgba(99,102,241,0.3)"
                  : "0 4px 16px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#F59E0B",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 11,
                  borderRadius: 20,
                  padding: "4px 14px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  ⭐ Most Popular
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: plan.popular ? "rgba(255,255,255,0.7)" : "#6366F1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: plan.popular ? "#fff" : "#111827", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.75)" : "#6B7280", marginBottom: 20 }}>
                {plan.credits} credits · {plan.transformations} AI uses
              </div>

              <ul style={{ listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {["Background removal", "AI image editing", "Pro upscaling", "Credits never expire"].map(feature => (
                  <li key={feature} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                    <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan.planKey)}
                disabled={loading !== null}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  padding: "12px 20px",
                  background: loading === plan.planKey
                    ? "#9CA3AF"
                    : plan.popular ? "#fff" : "#6366F1",
                  color: plan.popular ? "#6366F1" : "#fff",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  border: "none",
                  cursor: loading !== null ? "not-allowed" : "pointer",
                  boxShadow: plan.popular
                    ? "0 4px 12px rgba(255,255,255,0.25)"
                    : "0 4px 12px rgba(99,102,241,0.25)",
                  transition: "opacity 0.15s",
                }}
              >
                {loading === plan.planKey ? "Processing…" : "Buy Now →"}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            background: "none",
            border: "none",
            color: "#9CA3AF",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
