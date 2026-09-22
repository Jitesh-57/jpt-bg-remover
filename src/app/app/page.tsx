"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboardUser } from "./_components/DashboardUser";
import ToolCard from "./_components/ToolCard";
import { FLAGSHIP_TOOLS, UTILITY_TOOLS, aiCategories, categoryMeta, type CategoryId, type DashboardTool } from "@/lib/dashboard-catalog";
import { CREDIT_COST } from "@/lib/plans";
import { openPricing } from "@/lib/pricing-modal";

interface RecentCreation {
  id: number; tool: string; category: string; label: string;
  thumb?: string; imageUrl?: string; appSlug?: string; timestamp: number;
}

interface DashboardPayload {
  recentCreations: RecentCreation[];
  creationsCount: number;
  categories: { id: CategoryId; label: string; emoji: string; count: number }[];
  popularTools: DashboardTool[];
}

function greeting(): string {
  const h = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" });
  const hour = Number(h);
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const cardStyle: React.CSSProperties = { display: "block", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" };

export default function DashboardHome() {
  const user = useDashboardUser();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [category, setCategory] = useState<CategoryId | "popular">("popular");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DashboardPayload | null) => setData(d && Array.isArray(d.recentCreations) ? d : null))
      .catch(() => setData(null));
  }, []);

  const categories = aiCategories();
  const activeTools = category === "popular" ? (data?.popularTools ?? []) : (categories.find((c) => c.id === category)?.tools.slice(0, 12) ?? []);
  const creationsCount = data?.creationsCount ?? null;
  const showOnboarding = creationsCount === 0;

  const generationsLeft = Math.floor(user.credits / CREDIT_COST);
  const creditTone = user.credits === 0 ? "danger" : user.credits <= 9 ? "warn" : "neutral";

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* ── Section 1: greeting + credit status ──────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 28 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,1.9rem)", fontWeight: 900, margin: 0, color: "var(--text)" }}>{greeting()}, {user.name.split(" ")[0]}</h1>

          {user.credits === 0 && !user.hasPurchased ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 16px" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Packs start at ₹166 for 5 credits · no subscription, credits never expire</span>
              <button onClick={() => openPricing("Try an AI tool")} style={{ padding: "9px 16px", borderRadius: 999, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>Buy credits</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: creditTone === "danger" ? "var(--danger)" : creditTone === "warn" ? "var(--warn)" : "var(--text-muted)" }}>
                {creditTone === "danger" ? "You're out of credits." : creditTone === "warn" ? `Running low — ${generationsLeft} generation${generationsLeft === 1 ? "" : "s"} left.` : `⚡ ${user.credits} credits · ≈${generationsLeft} generations`}
              </span>
              <button onClick={() => openPricing("Buy credits")} style={{ padding: "9px 16px", borderRadius: 999, border: creditTone === "neutral" ? "1px solid var(--border-strong)" : "none", background: creditTone === "neutral" ? "transparent" : "var(--grad-strong)", color: creditTone === "neutral" ? "var(--text)" : "#fff", fontWeight: 800, fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>Buy credits</button>
            </div>
          )}
        </div>

        {/* ── Section 7: getting started (new accounts) ────────────────── */}
        {showOnboarding && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 22px", marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Get started</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/ai-editor" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>☐ Upload your first photo <span style={{ color: "var(--accent)" }}>→</span></Link>
              <Link href="/app/tools/free" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>☐ Try a free tool <span style={{ color: "var(--accent)" }}>→</span></Link>
              <Link href="/app/credits" style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>☐ Add credits to unlock AI tools <span style={{ color: "var(--accent)" }}>→</span></Link>
            </div>
          </div>
        )}

        {/* ── Section 2: continue where you left off ────────────────────── */}
        {data && data.recentCreations.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--text)" }}>Continue where you left off</h2>
              <Link href="/app/library" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>View all ›</Link>
            </div>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
              {data.recentCreations.map((c) => (
                <Link key={c.id} href="/app/library" className="jpt-hover" style={{ ...cardStyle, flex: "0 0 160px", width: 160 }}>
                  <div style={{ aspectRatio: "4 / 5", background: "var(--surface-2)", position: "relative" }}>
                    {(c.imageUrl || c.thumb) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl || c.thumb} alt={c.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🖼️</div>
                    )}
                  </div>
                  <div style={{ padding: "9px 11px 11px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{timeAgo(c.timestamp)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 3: quick start ────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 14px", color: "var(--text)" }}>Quick start</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14 }}>
            {FLAGSHIP_TOOLS.map((t) => (
              <Link key={t.slug} href={t.href} className="jpt-hover" style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: 16, padding: "18px 18px", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 26 }}>{t.emoji}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 999, padding: "3px 8px" }}>⚡{t.credits}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.sub}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 4: free tools ─────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--text)" }}>Free tools — unlimited, no credits</h2>
            <Link href="/app/tools/free" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>See all free tools ›</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 100%), 1fr))", gap: 10 }}>
            {UTILITY_TOOLS.map((t) => (
              <Link key={t.slug} href={t.href} className="jpt-hover" style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 13px", textDecoration: "none" }}>
                <span style={{ fontSize: 18 }}>{t.emoji}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 5: AI tools catalog ───────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 14px", color: "var(--text)" }}>AI tools</h2>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 16 }}>
            <button onClick={() => setCategory("popular")} style={chip(category === "popular")}>✨ Popular</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={chip(category === c.id)}>{c.emoji} {c.label} <span style={{ opacity: 0.6 }}>({c.tools.length})</span></button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
            {activeTools.map((t) => <ToolCard key={t.slug} t={t} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href={category === "popular" ? "/app/tools" : `/app/tools/${category}`} className="jpt-btn jpt-btn-ghost" style={{ textDecoration: "none" }}>
              {category === "popular" ? `Browse all tools →` : `See all ${categoryMeta(category).label.toLowerCase()} →`}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function chip(on: boolean): React.CSSProperties {
  return {
    flexShrink: 0, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
    background: on ? "var(--accent-soft)" : "var(--surface-2)",
    color: on ? "var(--accent-strong)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
  };
}
