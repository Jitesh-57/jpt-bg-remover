/**
 * plans.ts — the single source of truth for what we sell.
 *
 * Pure credit model: three one-time packs, no subscriptions, no expiry.
 * Credits are added to the buyer's balance and stay there until spent.
 * Every AI generation costs CREDIT_COST credits. Free (on-device) tools
 * never touch this balance.
 *
 * Prices are set in USD. Razorpay charges this account in INR, so the INR
 * amount is derived from USD_TO_INR below — change that one constant to
 * re-peg every pack.
 */

export const USD_TO_INR = 83;

export type PlanId = "pack5" | "pack20" | "pack50";

export type Pack = {
  id: PlanId;
  credits: number;
  usd: number;
  /** Generations this pack buys, at CREDIT_COST credits each. */
  generations: number;
  label: string;
  blurb: string;
  popular?: boolean;
};

/** Credits burned per AI generation. */
export const CREDIT_COST = 2;

const pack = (id: PlanId, usd: number, credits: number, label: string, blurb: string, popular = false): Pack => ({
  id, usd, credits, label, blurb, popular,
  generations: Math.floor(credits / CREDIT_COST),
});

export const PACKS: Pack[] = [
  pack("pack5",  2,  5,  "Starter", "Try the AI tools on a few images."),
  pack("pack20", 5,  20, "Creator", "The sweet spot for a full project.", true),
  pack("pack50", 10, 50, "Studio",  "Best value per credit."),
];

export const PACK_BY_ID: Record<string, Pack> =
  Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** Razorpay works in paise (1/100 of a rupee). */
export const inrPaise = (p: Pack): number => Math.round(p.usd * USD_TO_INR) * 100;

export const usdPerCredit = (p: Pack): number => p.usd / p.credits;

/** Legacy plan ids that may still exist on older profiles. Not for sale. */
export const LEGACY_PLAN_IDS = ["starter", "creator", "pro", "unlimited"];
