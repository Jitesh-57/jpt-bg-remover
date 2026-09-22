import Link from "next/link";
import type { DashboardTool } from "@/lib/dashboard-catalog";

export default function ToolCard({ t }: { t: DashboardTool }) {
  return (
    <Link href={t.href} className="jpt-hover" style={{ display: "block", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
      <div style={{ aspectRatio: "4 / 3", background: "linear-gradient(135deg, var(--surface-2), var(--surface-3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{t.emoji}</div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>{t.name}</div>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "3px 8px", color: t.credits === 0 ? "var(--success)" : "var(--accent)", background: t.credits === 0 ? "var(--success-soft)" : "var(--accent-soft)" }}>
            {t.credits === 0 ? "Free" : `⚡${t.credits}`}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{t.blurb}</div>
      </div>
    </Link>
  );
}
