"use client";

interface PricingModalProps {
  onClose: () => void;
}

const plans = [
  {
    name: "Starter",
    price: "$5",
    credits: 50,
    transformations: "~25",
    popular: false,
  },
  {
    name: "Creator",
    price: "$10",
    credits: 100,
    transformations: "~50",
    popular: false,
  },
  {
    name: "Pro",
    price: "$25",
    credits: 300,
    transformations: "~150",
    popular: true,
  },
];

export default function PricingModal({ onClose }: PricingModalProps) {
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
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <h2 style={{ fontWeight: 900, fontSize: 26, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", margin: 0 }}>
            Pay once, use anytime. No subscriptions.
          </p>
        </div>

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

              <a
                href="/"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px 20px",
                  background: plan.popular ? "#fff" : "#6366F1",
                  color: plan.popular ? "#6366F1" : "#fff",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: plan.popular
                    ? "0 4px 12px rgba(255,255,255,0.25)"
                    : "0 4px 12px rgba(99,102,241,0.25)",
                }}
              >
                Get Started →
              </a>
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
