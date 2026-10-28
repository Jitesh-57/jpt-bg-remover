"use client";

import { useEffect } from "react";
import { CREDIT_COST, ENTRY_PACK, formatInr } from "@/lib/plans";
import { usePopup } from "@/lib/popups.client";
import type { PopupText } from "@/lib/popups";
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
function title(p: PopupText, reason?: string): string {
  if (!reason) return p.t("title");
  if (reason === "more AI credits") return p.t("buyTitle");
  return p.t("neededTitle", { reason });
}

export default function UnlimitedModal({ onClose, loggedIn, reason, prefillUser, onSuccess, tab }: Props) {
  // Its words are in /admin/popups ("Pricing popup"); it can't be switched off.
  const p = usePopup("pricing");
  const cost = { cost: CREDIT_COST };
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
            <div className="jpt-pricing-caption-title">{p.t("caption", cost)}</div>
            <div className="jpt-pricing-caption-sub">{p.t("captionSub", cost)}</div>
          </div>
        </aside>

        {/* ── Right: the plans ───────────────────────────────────────────── */}
        <div className="jpt-pricing-main">
          <h2 className="jpt-pricing-title">{title(p, reason)}</h2>
          <p className="jpt-pricing-sub">
            {p.t("sub", cost)}
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
