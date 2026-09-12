/**
 * plans.ts — the single source of truth for what we sell.
 *
 * Pure credit model: three one-time packs, no subscriptions, no expiry.
 * Credits are added to the buyer's balance and stay there until spent.
 * Every AI generation costs CREDIT_COST credits. Free (on-device) tools
 * never touch this balance.
 *
 * Razorpay charges this account in INR, so the rupee figure is the price:
 * it is what the customer is actually billed, and it is written out per pack
 * below rather than derived from a USD peg. A hardcoded rate drifts, and a
 * page that says one number while the checkout charges another is worse than
 * a page that only quotes one currency. The USD figure is kept as an
 * approximate, clearly-marked equivalent for non-Indian visitors.
 *
 * To change a price, edit `inr` here. Nothing else needs touching — the order
 * route, every pricing surface and the analytics all read it from here.
 */

export type PlanId = "pack5" | "pack20" | "pack50";

export type Pack = {
  id: PlanId;
  credits: number;
  /** The amount charged, in rupees. Authoritative. */
  inr: number;
  /** Approximate equivalent, for display to non-Indian visitors only. */
  usd: number;
  /** Generations this pack buys, at CREDIT_COST credits each. */
  generations: number;
  label: string;
  blurb: string;
  popular?: boolean;
};

/** Credits burned per AI generation. */
export const CREDIT_COST = 2;

const pack = (id: PlanId, inr: number, usd: number, credits: number, label: string, blurb: string, popular = false): Pack => ({
  id, inr, usd, credits, label, blurb, popular,
  generations: Math.floor(credits / CREDIT_COST),
});

export const PACKS: Pack[] = [
  pack("pack5",  166, 2,  5,  "Starter", "Try the AI tools on a few images."),
  pack("pack20", 415, 5,  20, "Creator", "The sweet spot for a full project.", true),
  pack("pack50", 830, 10, 50, "Studio",  "Best value per credit."),
];

export const PACK_BY_ID: Record<string, Pack> =
  Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** Razorpay works in paise (1/100 of a rupee). */
export const inrPaise = (p: Pack): number => p.inr * 100;

export const inrPerCredit = (p: Pack): number => p.inr / p.credits;

/** Legacy plan ids that may still exist on older profiles. Not for sale. */
export const LEGACY_PLAN_IDS = ["starter", "creator", "pro", "unlimited"];
