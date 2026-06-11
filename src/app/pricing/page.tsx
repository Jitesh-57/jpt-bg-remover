export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$5",
      credits: 50,
      transformations: "~25",
      popular: false,
      accent: "#6366F1",
      bg: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)",
      border: "#c7d2fe",
    },
    {
      name: "Creator",
      price: "$10",
      credits: 100,
      transformations: "~50",
      popular: false,
      accent: "#6366F1",
      bg: "linear-gradient(135deg, #f8f7ff 0%, #eef2ff 100%)",
      border: "#c7d2fe",
    },
    {
      name: "Pro",
      price: "$25",
      credits: 300,
      transformations: "~150",
      popular: true,
      accent: "#fff",
      bg: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      border: "#6366F1",
    },
  ];

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
              boxShadow: plan.popular
                ? "0 20px 60px rgba(99,102,241,0.35)"
                : "0 4px 24px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              transform: plan.popular ? "scale(1.04)" : "none",
            }}
          >
            {plan.popular && (
              <div style={{
                position: "absolute",
                top: -16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#F59E0B",
                color: "#fff",
                fontWeight: 800,
                fontSize: 12,
                borderRadius: 20,
                padding: "5px 16px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
              }}>
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
              <div style={{
                background: plan.popular ? "rgba(255,255,255,0.15)" : "#fff",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 16,
              }}>
                <div style={{ fontWeight: 800, fontSize: 28, color: plan.popular ? "#fff" : "#6366F1" }}>
                  {plan.credits}
                </div>
                <div style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.8)" : "#6B7280", fontWeight: 500 }}>
                  AI Credits
                </div>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                  <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                  {plan.transformations} AI transformations
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                  <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                  Background removal
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                  <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                  AI image editing
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151" }}>
                  <span style={{ color: plan.popular ? "#A5F3C0" : "#10B981", fontWeight: 700, fontSize: 16 }}>✓</span>
                  Pro upscaling
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.9)" : "#374151", fontWeight: 600 }}>
                  <span style={{ color: plan.popular ? "#FCD34D" : "#F59E0B", fontWeight: 700, fontSize: 16 }}>★</span>
                  Credits never expire
                </li>
              </ul>
            </div>

            <a
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px 24px",
                background: plan.popular ? "#fff" : "#6366F1",
                color: plan.popular ? "#6366F1" : "#fff",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: plan.popular
                  ? "0 4px 16px rgba(255,255,255,0.3)"
                  : "0 4px 16px rgba(99,102,241,0.3)",
                transition: "opacity 0.15s",
              }}
            >
              Get Started →
            </a>
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
