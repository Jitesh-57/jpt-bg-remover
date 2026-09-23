"use client";

/**
 * checkout.ts — the one Razorpay checkout flow, used by both /pricing and
 * /app/credits.
 *
 * Extracted rather than duplicated: this is the code that moves money, and
 * a payment flow copy-pasted into two places is two places a fix can miss.
 * Behaviour is unchanged from the original inline version in
 * src/app/pricing/page.tsx — same script-load, same create-order →
 * Razorpay → verify-payment sequence, same payment.failed handling.
 */

import { trackBeginCheckout, trackPurchase, trackBuyButtonClicked, trackPaymentFailed } from "@/lib/analytics";
import { explainPaymentFailure } from "@/lib/pricing-modal";
import type { Pack } from "@/lib/plans";

interface RazorpayFailure {
  error?: { description?: string; reason?: string; step?: string; code?: string };
}

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => {
      open(): void;
      on?(event: "payment.failed", cb: (resp: RazorpayFailure) => void): void;
    };
  }
}

export interface CheckoutResult {
  ok: boolean;
  text: string;
  credits?: number;
}

/** Buys one pack. Resolves once the flow is fully done (success, failure or cancel). */
export async function buyPack(p: Pack, prefill?: { name?: string; email?: string }): Promise<CheckoutResult> {
  trackBuyButtonClicked(p.id, p.usd);
  trackBeginCheckout(p.id, p.usd);

  try {
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("The payment window could not load. Check your connection and try again."));
        document.head.appendChild(s);
      });
    }

    const orderRes = await fetch("/api/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p.id }),
    });
    const orderData = (await orderRes.json()) as { order_id?: string; amount?: number; currency?: string; error?: string };

    if (!orderRes.ok || !orderData.order_id) {
      trackPaymentFailed(p.id, orderData.error || "order_creation_failed");
      return { ok: false, text: orderData.error || "Checkout could not be started. Please try again." };
    }

    return await new Promise<CheckoutResult>((resolve) => {
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Pixel Shine",
        description: `${p.credits} credits — ${p.label} pack`,
        // A literal hex, not var(--accent): Razorpay's checkout renders in its
        // own document and cannot resolve our CSS custom properties.
        theme: { color: "#FF7A2F" },
        modal: {
          ondismiss() {
            trackPaymentFailed(p.id, "cancelled_by_user");
            resolve({ ok: false, text: "Payment cancelled" });
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...response, plan: p.id }),
            });
            const data = (await verifyRes.json()) as { success?: boolean; error?: string; credits?: number };
            if (data.success) {
              trackPurchase(p.id, p.usd, 0);
              resolve({ ok: true, text: `🎉 ${p.credits} credits added. They're yours for good.`, credits: data.credits });
            } else {
              trackPaymentFailed(p.id, data.error || "verification_failed");
              resolve({ ok: false, text: data.error || "Verification failed" });
            }
          } catch {
            resolve({ ok: false, text: "Verification request failed" });
          }
        },
        prefill: { name: prefill?.name || "", email: prefill?.email || "" },
      });

      /*
        Razorpay reports a rejected payment through this event, not through
        the dismiss handler — without it, a specific rejection reason from
        Razorpay's own modal was replaced by a generic "Payment cancelled"
        the moment it closed.
      */
      rzp.on?.("payment.failed", (resp) => {
        const why = explainPaymentFailure(resp?.error?.description, resp?.error?.reason);
        trackPaymentFailed(p.id, resp?.error?.reason || "payment_failed");
        console.error("[checkout] razorpay payment.failed:", JSON.stringify(resp?.error || {}));
        resolve({ ok: false, text: why });
      });

      rzp.open();
    });
  } catch (e) {
    trackPaymentFailed(p.id, String(e));
    return { ok: false, text: String(e) };
  }
}
