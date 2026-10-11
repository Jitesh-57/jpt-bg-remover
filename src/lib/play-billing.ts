import { PACKS, type Pack, type PlanId } from "@/lib/plans";

/**
 * play-billing.ts — what the Play Store apps sell, shared by client and server.
 *
 * Inside an Android app installed from Google Play, credits are bought through
 * Google Play's own in-app purchase sheet (Play policy for digital goods), not
 * Razorpay. The packs are the same three as everywhere else; each is a
 * one-time, consumable in-app product in Play Console, under the product IDs
 * below, in every app that sells it. Play sets the price the buyer sees, in
 * their currency, so these files never quote one.
 *
 * Setup and testing: docs/play-billing.md.
 */

export const PLAY_BILLING_METHOD = "https://play.google.com/billing";

/** Play Console product ID for a pack: credits_5, credits_20, credits_50. */
export const playProductId = (p: Pack): string => `credits_${p.credits}`;

export const PLAY_PRODUCTS: Record<string, PlanId> =
  Object.fromEntries(PACKS.map((p) => [playProductId(p), p.id]));

/**
 * Each Play Store app (one per tool) and its Android package name — the
 * applicationId it is built with, which Google's purchase API is keyed by. A
 * package name is permanent once an app is published.
 */
export const PLAY_APPS: Record<string, string> = {
  "age-progression": "io.sjpt.ageprogression",
};
