"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { openPricing } from "@/lib/pricing-modal";
import { onCreditsChanged } from "@/lib/credits";
import { CREDIT_COST } from "@/lib/plans";

export default function CreditPill({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const tone = credits === 0 ? "danger" : credits <= 9 ? "warn" : "neutral";
  const color = tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn)" : "var(--accent)";
  const gens = Math.floor(credits / CREDIT_COST);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${credits} credits`}
        className="jpt-lift"
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999,
          background: "var(--surface)", color: "var(--text)", border: `1px solid ${tone === "neutral" ? "var(--border)" : color}`,
          fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer",
        }}
      >
        <Icon name="zap" size={15} style={{ color }} />
        {credits}
      </button>
      {open && (
        <div className="jpt-a-pop" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 270, zIndex: 300, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 16, transformOrigin: "top right" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Balance</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Icon name="zap" size={22} style={{ color }} />
            <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{credits}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>credits</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
            {gens > 0 ? `Enough for ${gens} AI generation${gens === 1 ? "" : "s"}` : "Not enough for an AI generation"} · never expire
          </div>
          <button
            onClick={() => { setOpen(false); openPricing("Buy credits"); }}
            style={{ width: "100%", marginTop: 14, padding: "11px", borderRadius: 11, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}
          >
            Buy credits
          </button>
          <Link href="/app/credits" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>
            View credit history <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
