/**
 * analytics.ts — GA4 + Google Ads event helpers and UTM capture.
 *
 * Events are pushed straight to window.dataLayer (GTM's native mechanism),
 * not via window.gtag — this works even though GA4 is loaded through GTM
 * rather than a direct gtag.js include, and it's what GTM's own snippet
 * already expects.
 *
 * IMPORTANT — no PII: GA4's terms prohibit sending personally identifiable
 * information (email, name, phone, address) as event/user parameters. Every
 * event here sends `user_id` (the internal Supabase UUID) and `user_plan`,
 * never email or name. If you need to look up a specific user's activity,
 * cross-reference user_id against your own database — don't put PII in GA4.
 *
 * Configure via env (optional):
 *   NEXT_PUBLIC_GOOGLE_ADS_ID          → Google Ads conversion ID, e.g. "AW-1234567890"
 *   NEXT_PUBLIC_GADS_PURCHASE_LABEL    → conversion label for a completed purchase
 *   NEXT_PUBLIC_GADS_SIGNUP_LABEL      → conversion label for a sign-up
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || "";
const SIGNUP_LABEL = process.env.NEXT_PUBLIC_GADS_SIGNUP_LABEL || "";

export const analyticsEnabled = !!GA_ID || !!GOOGLE_ADS_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: [string, ...unknown[]]) => void;
  }
}

// ─── Current user context (non-PII only) ──────────────────────────────────

let currentUser: { id: string; plan: string } | null = null;

/** Call once the signed-in user (or sign-out) is known, so every event carries it. */
export function setAnalyticsUser(user: { id: string; plan: string } | null) {
  currentUser = user;
}

function getCountry(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|; )jpt_country=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// ─── First-party copy (/api/track) ─────────────────────────────────────────
//
// Every event is also queued for our own database (public.user_events), so
// what people do sits next to their account rather than only in GA. Sent in
// small batches with sendBeacon, which survives the page closing and never
// delays anything on screen. The server attaches the account, the visitor id
// cookie and the country; no email or name is ever sent.

const TRACK_URL = "/api/track";
const FLUSH_AT = 10;
const FLUSH_MS = 10_000;
type Queued = { n: string; p: string; d: Record<string, unknown>; t: number };
let queue: Queued[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("jpt_sid");
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem("jpt_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Sends whatever is queued. Safe to call any time; does nothing when empty. */
export function flushEvents(): void {
  if (typeof window === "undefined" || !queue.length) return;
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  const now = Date.now();
  while (queue.length) {
    const batch = queue.splice(0, 20);
    const body = JSON.stringify({ s: sessionId(), e: batch.map((q) => ({ n: q.n, p: q.p, d: q.d, a: now - q.t })) });
    try {
      const sent = navigator.sendBeacon?.(TRACK_URL, new Blob([body], { type: "application/json" }));
      if (!sent) void fetch(TRACK_URL, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    } catch { /* analytics never breaks the page */ }
  }
}

function enqueue(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    window.addEventListener("pagehide", flushEvents);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushEvents(); });
  }
  queue.push({ n: name, p: window.location.pathname, d: params, t: Date.now() });
  if (queue.length >= FLUSH_AT) flushEvents();
  else if (!flushTimer) flushTimer = setTimeout(flushEvents, FLUSH_MS);
}

/** A page view for our own records only (GA counts its own page views). */
export function recordPageView(path: string): void {
  enqueue("page_view", { path });
}

// ─── Core event push ───────────────────────────────────────────────────────

/** Fire a GA4 custom/standard event, auto-attaching user/country/UTM/page context. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  enqueue(name, params);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: name,
    user_id: currentUser?.id || "guest",
    user_plan: currentUser?.plan || "anonymous",
    country: getCountry(),
    page_path: window.location.pathname,
    page_location: window.location.href,
    ...getUtm(),
    ...params,
  });
}

/** Track a client-side SPA page view (call on route change). */
export function trackPageView(url: string) {
  trackEvent("page_view", { page_path: url });
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

// ─── Image upload / transform / generate funnel ────────────────────────────
//
// "Transform" = an AI edit applied to an existing uploaded image
//               (AI Edit, Remove BG, Upscale Pro, Creative Apps).
// "Generate"  = a new image generated from a prompt/template
//               (Generate Background, text-to-image).
// Pick whichever matches the tool when instrumenting a new call site.

export function trackImageUploaded(tool: string, extra: Record<string, unknown> = {}) {
  trackEvent("Image_Uploaded", { tool, ...extra });
}

export function trackImageUploadFailed(tool: string, reason: string) {
  trackEvent("Image_Upload_Failed", { tool, reason });
}

export function trackTransformButtonClicked(tool: string) {
  trackEvent("Transformed_Button_Clicked", { tool });
}

export function trackImageTransformed(tool: string) {
  trackEvent("Image_Transformed", { tool });
}

export function trackImageTransformedFailed(tool: string, reason: string) {
  trackEvent("Image_Transformed_Failed", { tool, reason });
}

export function trackGenerateButtonClicked(tool: string) {
  trackEvent("Generate_Button_Clicked", { tool });
}

export function trackImageGenerated(tool: string) {
  trackEvent("Image_Generated", { tool });
}

export function trackImageGenerationFailed(tool: string, reason: string) {
  trackEvent("Image_Generation_Failed", { tool, reason });
}

// ─── Download ───────────────────────────────────────────────────────────────

/** Suggested addition: track when a user downloads a result. */
export function trackDownloadButtonClicked(tool: string) {
  trackEvent("Download_Button_Clicked", { tool });
}

// ─── Sign-in funnel ─────────────────────────────────────────────────────────

/** Suggested addition: track when the sign-in modal/flow is opened. */
export function trackSignInClicked(method: string) {
  trackEvent("Sign_In_Clicked", { method });
}

/**
 * Fire once, when a new account has actually been created.
 *
 * This used to run when the Google button was pressed — before the sign-in
 * had happened, and for returning users too — so GA's signups and the Google
 * Ads signup conversion counted clicks. It now runs from SignupWelcome, on
 * the first page load after the auth callback created the profile, or after
 * an email signup that signed the person straight in.
 */
export function trackSignUpCompleted(method: string) {
  trackEvent("sign_up", { method });
  trackEvent("Sign_In_Completed", { method, is_new_user: true });
  if (GOOGLE_ADS_ID && SIGNUP_LABEL) {
    gtagConversion(`${GOOGLE_ADS_ID}/${SIGNUP_LABEL}`);
  }
}

/** A returning user signed in. Not a signup, and not an Ads conversion. */
export function trackSignInCompleted(method: string) {
  trackEvent("Sign_In_Completed", { method, is_new_user: false });
}

/** Suggested addition: track a failed sign-in attempt (e.g. wrong password). */
export function trackSignInFailed(method: string, reason: string) {
  trackEvent("Sign_In_Failed", { method, reason });
}

// ─── Payment funnel ─────────────────────────────────────────────────────────

export function trackPaymentPopupTriggered(reason: string) {
  trackEvent("Payment_PopUp_Triggered", { reason });
}

export function trackBuyButtonClicked(plan: string, valueInr: number) {
  trackEvent("Buy_Button_Clicked", { plan, value: valueInr, currency: "INR" });
}

/** Fire when a user clicks a plan's buy button (checkout intent). */
export function trackBeginCheckout(plan: string, valueInr: number) {
  trackEvent("Checkout_Initiated", { currency: "INR", value: valueInr, plan });
}

/** Fire when a user completes a paid plan purchase. */
export function trackPurchase(plan: string, valueInr: number, credits: number) {
  // Standard GA4 ecommerce event name (for GA4's built-in monetization reports)...
  trackEvent("purchase", { currency: "INR", value: valueInr, transaction_plan: plan, credits });
  // ...and the named funnel event you asked for.
  trackEvent("Payment_Finish", { currency: "INR", value: valueInr, plan, credits });
  if (GOOGLE_ADS_ID && PURCHASE_LABEL) {
    gtagConversion(`${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`, { value: valueInr, currency: "INR" });
  }
}

/** Suggested addition: track a failed or abandoned payment. */
export function trackPaymentFailed(plan: string, reason: string) {
  trackEvent("Payment_Failed", { plan, reason });
}

// ─── Tool usage (generic) ──────────────────────────────────────────────────

/** Fire when a user runs a tool (background removal, upscale, etc.). */
export function trackToolUse(tool: string) {
  trackEvent("tool_use", { tool });
}

// ─── Google Ads conversions ─────────────────────────────────────────────────
//
// Conversions still go through gtag(), since that's the Google Ads-specific
// API surface — GTM's Google Tag exposes window.gtag once it has loaded.
function gtagConversion(sendTo: string, extra: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: sendTo, ...extra });
}
