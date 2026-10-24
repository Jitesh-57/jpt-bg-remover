"use client";

import { useEffect } from "react";
import { CREDIT_COST, ENTRY_PACK, formatInr } from "@/lib/plans";
import BeforeAfterWipe from "./BeforeAfterWipe";
import PlanPurchase, { type PlanTab } from "./PlanPurchase";

// The pricing popup. Shown when someone hits the credit wall on an AI tool,
// or opens it from the nav. Kept at this filename/default export so existing
// callers (PricingModal, PricingModalHost) don't change.

export const CREDITS_ENTRY_LABEL = `From ₹${formatInr(ENTRY_PACK.inr)}`;
export const CREDITS_ENTRY_SUB = "Monthly plans or one-time packs";

interface Props {
  onClose: () => void;
  loggedIn: boolean;
  reason?: string; // e.g. "4× upscaling" or "batch processing"
  prefillUser?: { name?: string; email?: string };
  onSuccess?: () => void;
  /** Which list opens first. Monthly unless the caller asks for add-ons. */
  tab?: PlanTab;
}

/** The pop-up's heading. The navbar's Buy credits asks for "more AI credits", which reads wrong after "Credits needed for". */
function title(reason?: string): string {
  if (!reason) return "Unlock every AI tool";
  if (reason === "more AI credits") return "Buy more AI credits";
  return `Credits needed for ${reason}`;
}

export default function UnlimitedModal({ onClose, loggedIn, reason, prefillUser, onSuccess, tab }: Props) {
  // Escape closes, like every other dialog on the site.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="jpt-pricing-backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Plans and credits"
        className="jpt-pricing-modal"
      >
        <button onClick={onClose} aria-label="Close" className="jpt-pricing-close">×</button>

        {/* ── Left: what the money buys ──────────────────────────────────── */}
        <aside className="jpt-pricing-aside">
          <BeforeAfterWipe
            before="/pricing/before.webp"
            after="/pricing/after.webp"
            alt="Before: an office selfie. After: the same person in a styled outdoor fashion shoot."
            className="jpt-pricing-wipe"
          />
          <div className="jpt-pricing-caption">
            <div className="jpt-pricing-caption-title">One selfie → a full styled shoot</div>
            <div className="jpt-pricing-caption-sub">Made with Pixel Shine AI · {CREDIT_COST} credits</div>
          </div>
        </aside>

        {/* ── Right: the plans ───────────────────────────────────────────── */}
        <div className="jpt-pricing-main">
          <h2 className="jpt-pricing-title">{title(reason)}</h2>
          <p className="jpt-pricing-sub">
            {CREDIT_COST} credits per AI generation · full resolution, no watermark · the free tools stay free.
          </p>
          <PlanPurchase
            layout="list"
            loggedIn={loggedIn}
            prefillUser={prefillUser}
            initialTab={tab}
            onSuccess={() => { if (onSuccess) setTimeout(onSuccess, 1800); }}
          />
        </div>
      </div>
    </div>
  );
}
