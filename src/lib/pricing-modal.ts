/**
 * pricing-modal.ts — raise the credit-pack modal from anywhere.
 *
 * Every page that charges credits needs the same response to a 402: show the
 * packs. Threading modal state through each one duplicated the wiring and was
 * missed in several places, so the modal is mounted once in the layout and
 * opened by an event instead.
 *
 *   import { openPricing } from "@/lib/pricing-modal";
 *   if (res.status === 402) openPricing("4x upscaling");
 */

export const PRICING_EVENT = "jpt:open-pricing";

export interface PricingRequest {
  /** What the user was trying to do, shown in the modal's heading. */
  reason?: string;
}

/** Opens the credit-pack modal. Safe to call during SSR (it does nothing). */
export function openPricing(reason?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PricingRequest>(PRICING_EVENT, { detail: { reason } }));
}

/**
 * True when this session cannot run an AI generation — no account, or not
 * enough credits. The gate the server enforces is the balance, so this mirrors
 * it rather than looking at the plan label.
 */
export function needsCredits(user: { credits?: number } | null | undefined, cost: number): boolean {
  return !user || (user.credits ?? 0) < cost;
}
