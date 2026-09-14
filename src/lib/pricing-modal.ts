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
 * Turns a Razorpay failure into something the customer can act on.
 *
 * The website-mismatch rejection is the one worth special-casing: Razorpay
 * refuses it at payment_initiation with "Payment blocked as website does not
 * match registered website(s)". That is a configuration problem on our side —
 * the customer did nothing wrong, cannot fix it, and should not be reading
 * instructions about our payment account's settings. So they are told their
 * card was not charged and to come back, and the part that names the exact
 * origin to register is written to the console, where the operator will find
 * it. The origin matters because it is not always the address in the bar:
 * Chrome hides "www." and a preview deployment has a different host entirely.
 */
export function explainPaymentFailure(description?: string, reason?: string): string {
  const text = `${description || ""} ${reason || ""}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (/website|risk_check_failed/i.test(text)) {
    console.error(
      `[payments] Razorpay refused the payment because ${origin || "this origin"} is not a registered website ` +
      `on the account. Add it under Account & Settings → Website and app details.`
    );
    return "Payments are temporarily unavailable. You have not been charged — please try again a little later.";
  }
  if (description) console.warn("[payments] Razorpay:", description, reason || "");

  /*
    Card declines are classified here rather than through userMessage(), which
    reads "insufficient funds" as our own provider running out of credit — true
    of an image API, exactly backwards for a customer's bank.
  */
  if (/insufficient/i.test(text)) {
    return "The payment was declined for insufficient funds. Nothing was charged — try another card.";
  }
  if (/declin|denied|blocked|invalid card|expired/i.test(text)) {
    return "Your bank declined the payment. Nothing was charged — try another card or payment method.";
  }
  if (/cancel|dismiss/i.test(text)) {
    return "Payment cancelled. You have not been charged.";
  }
  return "The payment did not go through. You have not been charged — please try again.";
}
