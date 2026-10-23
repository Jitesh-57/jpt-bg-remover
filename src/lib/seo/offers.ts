import { MONTHLY_PLANS, PACKS } from "@/lib/plans";

/**
 * The price of an AI page, as its SoftwareApplication structured data states it:
 * free to start, then the credit packs and plans. A flat "price: 0" would tell
 * search engines the AI features are free for good, which they are not. INR,
 * because the packs are charged in rupees through Razorpay, so that is the
 * currency the offer is actually made in. Prices come from lib/plans.ts.
 */
export const APP_OFFERS = {
  "@type": "AggregateOffer",
  priceCurrency: "INR",
  lowPrice: "0",
  highPrice: String(Math.max(...PACKS.map((p) => p.inr), ...MONTHLY_PLANS.map((p) => p.inr))),
  offerCount: String(PACKS.length + MONTHLY_PLANS.length + 1),
};
