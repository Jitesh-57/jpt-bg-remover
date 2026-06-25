/**
 * analytics.ts — GA4 + Google Ads event helpers and UTM capture.
 *
 * Configure via env (all optional — tracking is a no-op until set):
 *   NEXT_PUBLIC_GA_ID                  → GA4 measurement ID, e.g. "G-XXXXXXXXXX"
 *   NEXT_PUBLIC_GOOGLE_ADS_ID          → Google Ads conversion ID, e.g. "AW-1234567890"
 *   NEXT_PUBLIC_GADS_PURCHASE_LABEL    → conversion label for a completed purchase
 *   NEXT_PUBLIC_GADS_SIGNUP_LABEL      → conversion label for a sign-up
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || "";
const SIGNUP_LABEL = process.env.NEXT_PUBLIC_GADS_SIGNUP_LABEL || "";

export const analyticsEnabled = !!GA_ID || !!GOOGLE_ADS_ID;

type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

function gtag(...args: GtagArgs) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

/** Fire a GA4 custom/standard event. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  gtag("event", name, params);
}

/** Track a client-side SPA page view (call on route change). */
export function trackPageView(url: string) {
  if (GA_ID) gtag("config", GA_ID, { page_path: url });
}

// ─── UTM capture ────────────────────────────────────────────────────────────

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"] as const;
const UTM_STORAGE = "jpt_utm";

/** Read UTM params from the current URL and persist them for later attribution. */
export function captureUtm() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) found[k] = v;
    }
    if (Object.keys(found).length) {
      found.landing_page = window.location.pathname;
      found.captured_at = new Date().toISOString();
      localStorage.setItem(UTM_STORAGE, JSON.stringify(found));
    }
  } catch {
    /* ignore storage / parse errors */
  }
}

/** Retrieve the persisted UTM attribution, if any. */
export function getUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(UTM_STORAGE) || "{}");
  } catch {
    return {};
  }
}

// ─── Conversion events ────────────────────────────────────────────────────────

/** Fire when a user completes a paid plan purchase. */
export function trackPurchase(plan: string, valueInr: number, credits: number) {
  const utm = getUtm();
  trackEvent("purchase", {
    currency: "INR",
    value: valueInr,
    transaction_plan: plan,
    credits,
    ...utm,
  });
  if (GOOGLE_ADS_ID && PURCHASE_LABEL) {
    gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`,
      value: valueInr,
      currency: "INR",
    });
  }
}

/** Fire when a user clicks a plan's buy button (checkout intent). */
export function trackBeginCheckout(plan: string, valueInr: number) {
  trackEvent("begin_checkout", { currency: "INR", value: valueInr, transaction_plan: plan, ...getUtm() });
}

/** Fire when a user signs up / first authenticates. */
export function trackSignUp(method: string) {
  trackEvent("sign_up", { method, ...getUtm() });
  if (GOOGLE_ADS_ID && SIGNUP_LABEL) {
    gtag("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${SIGNUP_LABEL}` });
  }
}

/** Fire when a user runs a tool (background removal, upscale, etc.). */
export function trackToolUse(tool: string) {
  trackEvent("tool_use", { tool, ...getUtm() });
}
