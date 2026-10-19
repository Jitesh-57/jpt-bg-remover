"use client";

import { useCallback, useEffect, useState } from "react";
import { PRICING_EVENT, type PricingRequest } from "@/lib/pricing-modal";
import { trackEvent } from "@/lib/analytics";
import UnlimitedModal from "./UnlimitedModal";

/**
 * Mounts the credit-pack modal once, for the whole app.
 *
 * Any code can raise it with openPricing() — see lib/pricing-modal.ts. That
 * replaces per-page modal state, which had to be wired into every page that
 * charges credits and was missing from several of them.
 */
export default function PricingModalHost() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [tab, setTab] = useState<PricingRequest["tab"]>();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  const onOpen = useCallback((e: Event) => {
    const detail = (e as CustomEvent<PricingRequest>).detail;
    setReason(detail?.reason);
    // Read the session lazily: knowing whether to show "Sign in to continue"
    // or the buy button only matters once the modal is actually open.
    const me = fetch("/api/auth/google/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string; name?: string; plan?: string } | null) => {
        setUser(d?.email ? { name: d.name, email: d.email } : null);
        return d;
      })
      .catch(() => null);

    const show = (t: PricingRequest["tab"]) => {
      setTab(t);
      setOpen(true);
      trackEvent("paywall_shown", { reason: detail?.reason || "", tab: t || "monthly", path: window.location.pathname });
    };
    if (detail?.tab) { show(detail.tab); return; }
    /*
      Someone who has never bought anything and wanted one result used to be
      shown the ₹1,494-a-month plan first. They now see the one-time packs,
      with the smallest selected. Buyers keep the monthly plans up front.
      Waits briefly for the account, never longer than a moment.
    */
    void Promise.race([me, new Promise((r) => setTimeout(() => r(null), 1200))]).then((d) => {
      const plan = (d as { plan?: string } | null)?.plan;
      show(plan && plan !== "free" ? undefined : "addons");
    });
  }, []);

  useEffect(() => {
    window.addEventListener(PRICING_EVENT, onOpen);
    return () => window.removeEventListener(PRICING_EVENT, onOpen);
  }, [onOpen]);

  if (!open) return null;
  return (
    <UnlimitedModal
      onClose={() => setOpen(false)}
      loggedIn={!!user?.email}
      reason={reason}
      tab={tab}
      prefillUser={user ?? undefined}
      onSuccess={() => setOpen(false)}
    />
  );
}
