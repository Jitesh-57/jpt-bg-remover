"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardUser } from "../_components/DashboardUser";
import MyPlans from "../_components/MyPlans";
import PlanPurchase from "@/app/_components/PlanPurchase";
import { CREDIT_COST } from "@/lib/plans";
import { onCreditsChanged } from "@/lib/credits";

interface LedgerItem {
  id: number; delta: number; balanceAfter: number; reason: string; tool?: string; note?: string; timestamp: number;
}

const REASON_LABEL: Record<string, string> = {
  purchase: "Pack purchase", subscription: "Monthly plan credits", expired: "Unused monthly credits expired",
  generation: "AI generation", refund: "Refund", signup_grant: "Welcome credit", admin_adjust: "Adjustment",
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
  const [monthly, setMonthly] = useState(0);
  const onTotals = useCallback((m: number) => setMonthly(m), []);

  const loadHistory = useCallback(() => {
    fetch("/api/credits/history").then((r) => r.json()).then((d: { items?: LedgerItem[] }) => setHistory(d.items ?? [])).catch(() => setHistory((h) => h ?? []));
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);
  // Every purchase or spend announces the new balance (lib/credits); the
  // history is refreshed with it so a new plan or pack shows at once.
  useEffect(() => onCreditsChanged((c) => { setCredits(c); loadHistory(); }), [loadHistory]);

  const filtered = (history ?? []).filter((i) =>
    filter === "all" || i.reason === filter || (filter === "purchase" && i.reason === "subscription"));
  const generationsLeft = Math.floor(credits / CREDIT_COST);
  const addon = Math.max(0, credits - monthly);

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem,2.6vw,1.8rem)", fontWeight: 900, margin: "0 0 24px", color: "var(--text)" }}>Credits</h1>

        {/* ── Block 1: balance ─────────────────────────────────────────── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 26px", marginBottom: 32, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)" }}>⚡ {credits} credits</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              ≈ {generationsLeft} generation{generationsLeft === 1 ? "" : "s"} at {CREDIT_COST} credits each
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 4 }}>
              {monthly > 0
                ? `${monthly} monthly (used first, refresh each renewal) · ${addon} add-on (never expire)`
                : "Add-on credits never expire"}
            </div>
          </div>
          <a href="#packs" style={{ padding: "12px 24px", borderRadius: 11, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Get credits</a>
        </div>

        <div style={{ marginBottom: 32 }}>
          <MyPlans onTotals={onTotals} />
        </div>

        {/* ── Block 2: plans and packs ─────────────────────────────────── */}
        <div id="packs" style={{ marginBottom: 40, scrollMarginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "var(--text)" }}>Get credits</h2>
          <PlanPurchase layout="grid" loggedIn prefillUser={{ name: user.name, email: user.email }} />
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
