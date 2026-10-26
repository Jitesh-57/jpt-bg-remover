"use client";

/**
 * checkout.ts — the Razorpay checkout flows: buyPack() for one-time add-on
 * packs and subscribe() for monthly plans. Used by the pricing popup, /pricing
 * and /app/credits.
 *
 * Extracted rather than duplicated: this is the code that moves money, and
 * a payment flow copy-pasted into two places is two places a fix can miss.
 * The create-order → Razorpay → verify-payment sequence and the
 * payment.failed handling are those of the original inline version in
 * src/app/pricing/page.tsx; the script now loads ahead of time
 * (prepareCheckout) and alongside the order rather than before it.
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

/*
  Hides the phone-number field in Razorpay's checkout. Razorpay only honours
  this once it has turned on "optional contact" for the merchant account (a
  support request, not a dashboard setting); until then it ignores the flag
  and keeps asking for the number, so this is safe to ship either way. Some
  UPI and card flows, and recurring mandates, may still ask for it.
*/
const HIDE_CONTACT = { contact: true };

// One load shared by everyone who asks, so preparing early and clicking
// early never fetch the script twice. A failed load is forgotten, so the next
// click tries again.
let razorpayLoad: Promise<void> | null = null;

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  razorpayLoad ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      razorpayLoad = null;
      s.remove();
      reject(new Error("The payment window could not load. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return razorpayLoad;
}

let prepared = false;

/**
 * Gets checkout ready before anyone clicks Buy Now, so the payment window
 * opens as soon as they do. Called when the plans are on screen (PlanPurchase).
 *
 * After a click, the wait used to be: download Razorpay's script, then create
 * the order, then open Razorpay's window, each starting only when the last had
 * finished. Now the connections to Razorpay are already open, its script is
 * already loaded, and the two checkout functions are already awake; what is
 * left is the order itself, and the script load runs alongside it if this
 * hasn't finished yet.
 */
export function prepareCheckout(): void {
  if (prepared || typeof window === "undefined") return;
  prepared = true;
  for (const href of ["https://checkout.razorpay.com", "https://api.razorpay.com"]) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
  loadRazorpay().catch(() => { /* tried again on the click */ });
  for (const url of ["/api/create-order", "/api/subscriptions/create"]) {
    fetch(url, { method: "GET", cache: "no-store" }).catch(() => { /* only a warm-up */ });
  }
}

/** Buys one pack. Resolves once the flow is fully done (success, failure or cancel). */
export async function buyPack(p: Pack, prefill?: { name?: string; email?: string }): Promise<CheckoutResult> {
  if (p.monthly) return subscribe(p, prefill);
  trackBuyButtonClicked(p.id, p.usd);
  trackBeginCheckout(p.id, p.usd);

  try {
    // The script and the order load side by side, not one after the other.
    const [, orderRes] = await Promise.all([
      loadRazorpay(),
      fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p.id }),
      }),
    ]);
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
        hidden: HIDE_CONTACT,
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

/**
 * Starts a monthly plan: /api/subscriptions/create makes the Razorpay
 * subscription, Checkout takes the first month's payment and saves the card or
 * UPI mandate for renewals, and /api/subscriptions/verify grants the month's
 * credits. Same shape and failure handling as buyPack.
 */
export async function subscribe(p: Pack, prefill?: { name?: string; email?: string }): Promise<CheckoutResult> {
  trackBuyButtonClicked(p.id, p.usd);
  trackBeginCheckout(p.id, p.usd);

  try {
    // The script and the subscription load side by side, not one after the other.
    const [, res] = await Promise.all([
      loadRazorpay(),
      fetch("/api/subscriptions/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p.id }),
      }),
    ]);
    const data = (await res.json()) as { subscription_id?: string; error?: string };
    if (!res.ok || !data.subscription_id) {
      trackPaymentFailed(p.id, data.error || "subscription_creation_failed");
      return { ok: false, text: data.error || "Checkout could not be started. Please try again." };
    }

    return await new Promise<CheckoutResult>((resolve) => {
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name: "Pixel Shine",
        description: `${p.label} plan — ${p.credits} credits every month`,
        theme: { color: "#FF7A2F" },
        modal: {
          ondismiss() {
            trackPaymentFailed(p.id, "cancelled_by_user");
            resolve({ ok: false, text: "Payment cancelled. You have not been charged." });
          },
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/subscriptions/verify", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response),
            });
            const v = (await verifyRes.json()) as { success?: boolean; error?: string; credits?: number };
            if (v.success) {
              trackPurchase(p.id, p.usd, 0);
              resolve({ ok: true, text: `🎉 You're on the ${p.label} plan — ${p.credits} credits added for this month.`, credits: v.credits });
            } else {
              trackPaymentFailed(p.id, v.error || "verification_failed");
              resolve({ ok: false, text: v.error || "Verification failed" });
            }
          } catch {
            resolve({ ok: false, text: "Verification request failed" });
          }
        },
        prefill: { name: prefill?.name || "", email: prefill?.email || "" },
        hidden: HIDE_CONTACT,
      });

      rzp.on?.("payment.failed", (resp) => {
        const why = explainPaymentFailure(resp?.error?.description, resp?.error?.reason);
        trackPaymentFailed(p.id, resp?.error?.reason || "payment_failed");
        console.error("[checkout] razorpay subscription payment.failed:", JSON.stringify(resp?.error || {}));
        resolve({ ok: false, text: why });
      });

      rzp.open();
    });
  } catch (e) {
    trackPaymentFailed(p.id, String(e));
    return { ok: false, text: String(e) };
  }
}
