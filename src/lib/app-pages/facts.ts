import { CREDIT_COST, PACKS } from "@/lib/plans";

/**
 * Prices as the pages state them, read from lib/plans.ts so the copy changes
 * when the prices do. Whether a free trial is running is not here: it differs
 * by country and can be switched off, so the pages show it through
 * TrialCallout / TrialLine instead of saying it in the text.
 */
export const COST = `${CREDIT_COST} credits`;
export const PACK_FROM = `$${Math.min(...PACKS.map((p) => p.usd))}`;
