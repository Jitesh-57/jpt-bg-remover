"use client";

import { useCallback, useEffect, useState } from "react";
import { PRICING_EVENT, type PricingRequest } from "@/lib/pricing-modal";
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
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  const onOpen = useCallback((e: Event) => {
    const detail = (e as CustomEvent<PricingRequest>).detail;
    setReason(detail?.reason);
    setOpen(true);
    // Read the session lazily: knowing whether to show "Sign in to continue"
    // or the buy button only matters once the modal is actually open.
    fetch("/api/auth/google/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.email ? { name: d.name, email: d.email } : null))
      .catch(() => {});
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
      prefillUser={user ?? undefined}
      onSuccess={() => setOpen(false)}
    />
  );
}
