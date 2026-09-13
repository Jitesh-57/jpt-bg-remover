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

/**
 * Turns a Razorpay failure into something the reader can act on.
 *
 * The website-mismatch rejection is the one worth special-casing: Razorpay
 * refuses it at payment_initiation with "Payment blocked as website does not
 * match registered website(s)", which tells a customer nothing and tells the
 * operator only half of what they need. The half that matters is the origin
 * the checkout actually ran on, because that is the exact string that has to
 * be registered — and it is not always the one in the address bar, since
 * Chrome hides "www." and a preview deployment has a different host entirely.
 */
export function explainPaymentFailure(description?: string, reason?: string): string {
  const text = `${description || ""} ${reason || ""}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (/website|risk_check_failed/i.test(text)) {
    return (
      `Payments are not enabled for ${origin || "this address"} yet. ` +
      `This site's address has to be registered on the Razorpay account ` +
      `(Account & Settings → Website and app details) before it can take payments.`
    );
  }
  return description || "Payment failed. Please try again.";
}
