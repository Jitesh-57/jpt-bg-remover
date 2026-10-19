/**
 * plans.ts — the single source of truth for what we sell.
 *
 * Two kinds of thing:
 *
 *   PACKS          one-time add-on credit packs. Credits land in the buyer's
 *                  balance (profiles.credits) and never expire.
 *   MONTHLY_PLANS  Razorpay subscriptions. Each paid month grants the plan's
 *                  credits, which last until that month ends: the next renewal
 *                  resets them rather than adding to them. Someone can hold
 *                  several plans at once; each is its own subscription.
 *
 * Every AI generation costs CREDIT_COST credits, spent from monthly credits
 * first (see lib/subscriptions.server.ts). Free (on-device) tools never touch
 * either balance.
 *
 * Razorpay charges this account in INR, so the rupee figure is the price:
 * it is what the customer is actually billed, and it is written out per plan
 * below rather than derived from a USD peg. A hardcoded rate drifts, and a
 * page that says one number while the checkout charges another is worse than
 * a page that only quotes one currency. The USD figure is the approximate,
 * clearly-marked equivalent the prices were set in (₹83 to the dollar).
 *
 * To change a price, edit `inr` here. Nothing else needs touching — the order
 * and subscription routes, every pricing surface and the analytics read it
 * from here. A changed monthly price gets a new Razorpay plan automatically;
 * existing subscribers stay on the price they signed up at.
 */

export type PlanId =
  | "addon6" | "addon18" | "addon40" | "addon90"
  | "monthly24" | "monthly64" | "monthly100" | "monthly150"
  // No longer sold on the site; kept so old invoices, orders and subscriptions
  // still resolve, and because the Play Store still sells the addon* ones.
  | "addon5" | "addon15" | "addon25" | "addon35" | "monthly20" | "monthly40"
  | "pack5" | "pack20" | "pack50";

export type Pack = {
  id: PlanId;
  credits: number;
  /** The amount charged, in rupees. Authoritative. For a monthly plan, per month. */
  inr: number;
  /** Approximate equivalent, for display to non-Indian visitors only. */
  usd: number;
  /** Generations this pack buys, at CREDIT_COST credits each. */
  generations: number;
  label: string;
  blurb: string;
  popular?: boolean;
  /** Short badge text on the card ("Most popular", "Best value"). */
  badge?: string;
  /** A Razorpay subscription that renews every month. */
  monthly?: boolean;
};

/** Credits burned per AI generation. */
export const CREDIT_COST = 2;

const pack = (
  id: PlanId, inr: number, usd: number, credits: number, label: string, blurb: string,
  extra: Partial<Pick<Pack, "popular" | "badge" | "monthly">> = {},
): Pack => ({
  id, inr, usd, credits, label, blurb, ...extra,
  generations: Math.floor(credits / CREDIT_COST),
});

/*
  The ladder: the more you buy, the less each credit costs, and every pack is
  an even number of credits, because a result costs CREDIT_COST = 2 — an odd
  pack always left one credit nobody could spend.

  It used to run the other way (Mini ₹33 a credit, Large ₹71), so the biggest
  pack was the worst deal on the page that showed the per-credit price. No
  rung goes below the cheapest rate already on sale (Studio, ₹13.8 a credit),
  so the margin on a generation is never thinner than it was.
*/

/** One-time add-on packs. Credits never expire. */
export const PACKS: Pack[] = [
  pack("addon6",  166,  2,  6,  "Mini",   "Three AI results to try it out.", { popular: true, badge: "Start here" }),
  pack("addon18", 415,  5,  18, "Small",  "Enough for a handful of looks."),
  pack("addon40", 830,  10, 40, "Medium", "A full set of edits in one go."),
  pack("addon90", 1660, 20, 90, "Large",  "The lowest price per credit for a one-time pack.", { badge: "Best value" }),
];

/** Monthly subscriptions. Credits refresh every renewal; cancel any time. */
export const MONTHLY_PLANS: Pack[] = [
  pack("monthly24",  415,  5,  24,  "Starter", "Try the AI tools every month.", { monthly: true }),
  pack("monthly64",  996,  12, 64,  "Creator", "Regular edits for your feed.", { monthly: true }),
  pack("monthly100", 1494, 18, 100, "Pro",     "Room for a full shoot every month.", { monthly: true, popular: true, badge: "Recommended" }),
  pack("monthly150", 2075, 25, 150, "Studio",  "The lowest price per credit.", { monthly: true, badge: "Best value" }),
];

/**
 * The packs the Google Play listing sells (credits_5 … credits_35 in Play
 * Console). Play prices live in Play Console, not here, so the Android app
 * keeps selling these until matching products are set up there.
 */
export const PLAY_PACKS: Pack[] = [
  pack("addon5",  166,  2,  5,  "Mini",   "A quick top-up for a couple of edits.", { popular: true }),
  pack("addon15", 830,  10, 15, "Small",  "Enough for a handful of looks."),
  pack("addon25", 1660, 20, 25, "Medium", "A full set of edits in one go."),
  pack("addon35", 2490, 30, 35, "Large",  "The biggest one-time top-up."),
];

/** What used to be sold. Not for sale; only looked up for old invoices, orders and subscriptions. */
export const LEGACY_PACKS: Pack[] = [
  pack("monthly20", 415, 5,  20, "Starter", "Previous Starter plan.", { monthly: true }),
  pack("monthly40", 996, 12, 40, "Creator", "Previous Creator plan.", { monthly: true }),
  pack("pack5",  166, 2,  5,  "Starter", "Legacy pack."),
  pack("pack20", 415, 5,  20, "Creator", "Legacy pack."),
  pack("pack50", 830, 10, 50, "Studio",  "Legacy pack."),
];

/** One-time packs on sale, by id. What /api/create-order will sell. */
export const ADDON_BY_ID: Record<string, Pack> =
  Object.fromEntries(PACKS.map((p) => [p.id, p]));

/** Monthly plans on sale, by id. What /api/subscriptions/create will sell. */
export const MONTHLY_BY_ID: Record<string, Pack> =
  Object.fromEntries(MONTHLY_PLANS.map((p) => [p.id, p]));

/** Anything ever sold, by id — for invoices and purchase history. */
export const PACK_BY_ID: Record<string, Pack> =
  Object.fromEntries([...PACKS, ...MONTHLY_PLANS, ...PLAY_PACKS, ...LEGACY_PACKS].map((p) => [p.id, p]));

/** Razorpay works in paise (1/100 of a rupee). */
export const inrPaise = (p: Pack): number => p.inr * 100;

export const inrPerCredit = (p: Pack): number => p.inr / p.credits;

/** Rupees with Indian digit grouping: 1494 → "1,494". */
export const formatInr = (n: number): string => n.toLocaleString("en-IN");

/** The cheapest way in, for "From ₹…" lines. */
export const ENTRY_PACK: Pack = PACKS[0];

/** Legacy plan ids that may still exist on older profiles. Not for sale. */
export const LEGACY_PLAN_IDS = ["starter", "creator", "pro", "unlimited"];
