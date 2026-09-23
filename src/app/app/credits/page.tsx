"use client";

import { useEffect, useState } from "react";
import { useDashboardUser } from "../_components/DashboardUser";
import { PACKS, CREDIT_COST, inrPerCredit, type Pack } from "@/lib/plans";
import { buyPack } from "@/lib/checkout";
import { publishCredits } from "@/lib/credits";

interface LedgerItem {
  id: number; delta: number; balanceAfter: number; reason: string; tool?: string; note?: string; timestamp: number;
}

const REASON_LABEL: Record<string, string> = {
  purchase: "Pack purchase", generation: "AI generation", refund: "Refund",
  signup_grant: "Welcome credit", admin_adjust: "Adjustment",
};

function describe(item: LedgerItem): string {
  if (item.reason === "generation" && item.tool) return `AI generation — ${item.tool}`;
  return REASON_LABEL[item.reason] || item.reason;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CreditsPage() {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [history, setHistory] = useState<LedgerItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "purchase" | "generation" | "refund">("all");
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/credits/history").then((r) => r.json()).then((d: { items?: LedgerItem[] }) => setHistory(d.items ?? [])).catch(() => setHistory([]));
  }, []);

  const handleBuy = async (p: Pack) => {
    setLoadingPack(p.id);
    setStatus(null);
    const result = await buyPack(p, { name: user.name, email: user.email });
    if (result.ok && typeof result.credits === "number") {
      setCredits(result.credits);
      publishCredits(result.credits);
      // Refresh history so the new purchase row shows immediately.
      fetch("/api/credits/history").then((r) => r.json()).then((d: { items?: LedgerItem[] }) => setHistory(d.items ?? [])).catch(() => {});
    }
    setStatus({ text: result.text, ok: result.ok });
    setLoadingPack(null);
  };

  const filtered = (history ?? []).filter((i) => filter === "all" || i.reason === filter);
  const generationsLeft = Math.floor(credits / CREDIT_COST);

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem,2.6vw,1.8rem)", fontWeight: 900, margin: "0 0 24px", color: "var(--text)" }}>Credits</h1>

        {/* ── Block 1: balance ─────────────────────────────────────────── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 26px", marginBottom: 32, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)" }}>⚡ {credits} credits</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              ≈ {generationsLeft} generation{generationsLeft === 1 ? "" : "s"} at {CREDIT_COST} credits each · Credits never expire
            </div>
          </div>
          <a href="#packs" style={{ padding: "12px 24px", borderRadius: 11, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Buy credits</a>
        </div>

        {status && (
          <div style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 11, background: status.ok ? "var(--success-soft)" : "var(--danger-soft)", color: status.ok ? "var(--success)" : "var(--danger)", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
            {status.text}
          </div>
        )}

        {/* ── Block 2: packs ───────────────────────────────────────────── */}
        <div id="packs" style={{ marginBottom: 40, scrollMarginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "var(--text)" }}>Buy credits</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 16 }}>
            {PACKS.map((p) => (
              <div key={p.id} style={{ position: "relative", background: "var(--surface)", border: `1px solid ${p.popular ? "var(--accent-border)" : "var(--border)"}`, borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {p.popular && <span style={{ position: "absolute", top: -11, left: 20, background: "var(--grad-strong)", color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "3px 10px" }}>★ Most popular</span>}
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{p.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>₹{p.inr} <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-faint)" }}>(~${p.usd})</span></div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{p.credits} credits · ~{p.generations} generations</div>
                <div style={{ fontSize: 11.5, color: "var(--accent)", fontWeight: 700 }}>₹{inrPerCredit(p).toFixed(1)} per credit</div>
                <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "4px 0 6px", lineHeight: 1.5, flex: 1 }}>{p.blurb}</p>
                <button
                  onClick={() => handleBuy(p)}
                  disabled={loadingPack === p.id}
                  style={{ padding: "11px", borderRadius: 11, border: "none", background: p.popular ? "var(--grad-strong)" : "var(--surface-2)", color: p.popular ? "#fff" : "var(--text)", fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: loadingPack === p.id ? "wait" : "pointer" }}
                >
                  {loadingPack === p.id ? "Opening…" : "Buy"}
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginTop: 16 }}>
            One-time payment · No subscription, no auto-renew · Credits never expire · Packs stack onto your balance.
          </p>
        </div>

        {/* ── Block 3: history ─────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text)" }}>Credit history</h2>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ padding: "8px 10px", borderRadius: 9, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
              <option value="all">All activity</option>
              <option value="purchase">Purchased</option>
              <option value="generation">Used</option>
              <option value="refund">Refunded</option>
            </select>
          </div>

          {history === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 46, borderRadius: 10, background: "var(--surface-2)" }} />)}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, color: "var(--text-muted)", fontSize: 13.5 }}>No credit activity yet.</div>
          ) : (
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              {filtered.map((item, i) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--surface)", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{describe(item)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{formatDate(item.timestamp)}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: item.delta > 0 ? "var(--success)" : "var(--text)" }}>{item.delta > 0 ? "+" : ""}{item.delta}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>balance {item.balanceAfter}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
