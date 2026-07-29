"use client";

import UnlimitedModal from "./UnlimitedModal";

interface PricingModalProps {
  onClose: () => void;
  onPurchaseSuccess?: (plan: string, newCredits: number) => void;
  prefillUser?: { name?: string; email?: string };
  notice?: string;
}

// The app now sells a single one-time "Unlimited" plan everywhere. This keeps
// the old PricingModal API (used by the nav, batch editor, headshot and
// creative apps) but renders the single-plan UnlimitedModal underneath.
export default function PricingModal({ onClose, onPurchaseSuccess, prefillUser }: PricingModalProps) {
  return (
    <UnlimitedModal
      onClose={onClose}
      loggedIn={!!prefillUser?.email}
      prefillUser={prefillUser}
      onSuccess={() => onPurchaseSuccess?.("unlimited", 999999)}
    />
  );
}
