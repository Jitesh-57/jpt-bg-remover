"use client";

import Link from "next/link";
import { PACKS, CREDIT_COST } from "@/lib/plans";

/**
 * Shared pricing section for the tool landing pages.
 *
 * Reads the packs from lib/plans.ts — prices and credits are never hardcoded
 * here, so re-pricing a pack updates every page that renders this.
 */
export default function PricingSection({ toolName }: { toolName?: string }) {
  return (
    <section style={{ padding: "84px 24px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Pricing
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Simple pricing. Pay only for what you use.
          </h2>
          <p style={{ fontSize: 16.5, color: "var(--text-muted)", margin: "0 auto", maxWidth: 620, lineHeight: 1.65 }}>
            {toolName ? `${toolName} and every other browser tool are free and unlimited.` : "The browser tools are free and unlimited."}{" "}
            Credits are only for the AI features — {CREDIT_COST} credits per generation, one-time payment, and they never expire.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
            gap: 18,
            maxWidth: 880,
            margin: "40px auto 0",
            alignItems: "stretch",
          }}
        >
          {PACKS.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex", flexDirection: "column", background: "var(--surface)",
                border: `${p.popular ? 2 : 1}px solid ${p.popular ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 18, padding: "28px 24px 24px", position: "relative",
                boxShadow: p.popular ? "0 18px 50px rgba(15,157,107,0.16)" : "none",
              }}
            >
              {p.popular && (
                <div
                  style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 11,
                    borderRadius: 20, padding: "4px 13px", letterSpacing: "0.06em",
                    textTransform: "uppercase", whiteSpace: "nowrap",
                  }}
                >
                  Most popular
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                {p.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1 }}>${p.usd}</span>
                <span style={{ fontSize: 13.5, color: "var(--text-faint)", fontWeight: 600 }}>one time</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{p.credits} credits</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2 }}>≈ {p.generations} AI generations</div>
              <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <Link
                  href="/pricing"
                  style={{
                    display: "block", textAlign: "center", padding: "12px", borderRadius: 11,
                    background: p.popular ? "var(--grad-strong)" : "var(--surface-3)",
                    color: p.popular ? "#fff" : "var(--accent-strong)",
                    fontWeight: 800, fontSize: 15, textDecoration: "none",
                  }}
                >
                  Get {p.credits} credits
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-faint)", margin: "22px 0 0" }}>
          No subscription · no auto-renew · credits never expire ·{" "}
          <Link href="/pricing" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
            See full pricing
          </Link>
        </p>
      </div>
    </section>
  );
}
