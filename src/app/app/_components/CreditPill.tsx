"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { openPricing } from "@/lib/pricing-modal";
import { onCreditsChanged } from "@/lib/credits";
import { CREDIT_COST } from "@/lib/plans";

/**
 * The credit balance, shown in the header on every authenticated screen —
 * C3's single most important header component. Colour and copy shift with
 * how close the account is to zero; clicking it opens the same detail/buy
 * popover regardless of state.
 */
export default function CreditPill({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const tone = credits === 0 ? "danger" : credits <= 9 ? "warn" : "neutral";
  const colors = {
    neutral: { bg: "var(--surface-2)", fg: "var(--text)", border: "var(--border)" },
    warn:    { bg: "var(--warn)",      fg: "#1A1200",      border: "var(--warn)" },
    danger:  { bg: "var(--danger)",    fg: "#2A0508",      border: "var(--danger)" },
  }[tone];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999,
          background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}`,
          fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer",
        }}
      >
        ⚡ {credits}
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, width: 260, zIndex: 200,
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
            boxShadow: "var(--shadow-lg)", padding: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>⚡ {credits} credits</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
            {credits > 0 ? `≈ ${Math.floor(credits / CREDIT_COST)} more generation${Math.floor(credits / CREDIT_COST) === 1 ? "" : "s"}` : "Enough for 0 more generations"}
            {" · Credits never expire"}
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
          <Link href="/app/credits" onClick={() => setOpen(false)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13.5, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
            Credit history <span style={{ color: "var(--text-faint)" }}>›</span>
          </Link>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0 12px" }} />
          <button
            onClick={() => { setOpen(false); openPricing("Buy credits"); }}
            style={{
              width: "100%", padding: "11px", borderRadius: 11, border: "none",
              background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14,
              fontFamily: "inherit", cursor: "pointer",
            }}
          >
            Buy credits
          </button>
        </div>
      )}
    </div>
  );
}
