"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrialPill } from "./TrialOffer";
import PlanPurchase from "./PlanPurchase";
import { CREDIT_COST } from "@/lib/plans";

/**
 * Shared pricing section for the tool landing pages.
 *
 * The plans and packs come from lib/plans.ts through PlanPurchase — the same
 * cards and checkout as /pricing and the pricing popup — so re-pricing a plan
 * updates every page that renders this.
 */
export default function PricingSection({ toolName }: { toolName?: string }) {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { authenticated?: boolean; name?: string; email?: string } | null) => {
        if (d?.authenticated) setUser({ name: d.name, email: d.email });
      })
      .catch(() => {});
  }, []);

  return (
    <section style={{ padding: "84px 24px", background: "var(--surface)" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Pricing
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Monthly plans or one-time credits.
          </h2>
          <p style={{ fontSize: 16.5, color: "var(--text-muted)", margin: "0 auto", maxWidth: 640, lineHeight: 1.65 }}>
            {toolName ? `${toolName} and every other browser tool are free and unlimited.` : "The browser tools are free and unlimited."}{" "}
            Credits are only for the AI features — {CREDIT_COST} credits per generation. Go monthly for the lowest price per
            credit and cancel any time, or buy an add-on whose credits never expire.
          </p>
        </div>
        <div style={{ marginTop: 22 }}><TrialPill source="pricing" /></div>

        <div style={{ marginTop: 28 }}>
          <PlanPurchase layout="grid" loggedIn={!!user} prefillUser={user ?? undefined} />
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-faint)", margin: "18px 0 0" }}>
          <Link href="/pricing" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
            See full pricing and questions
          </Link>
        </p>
      </div>
    </section>
  );
}
