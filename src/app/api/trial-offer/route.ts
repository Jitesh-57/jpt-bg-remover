import { NextRequest, NextResponse } from "next/server";
import { requestCountry, trialRuleFor } from "@/lib/free-trial.server";
import { CREDIT_COST } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trial-offer — the free trial this visitor would get by signing up now.
 *
 *   { offer: { credits, generations, country } }   a live trial covers their country
 *   { offer: null }                                no trial, or they already have an account
 *
 * Decided by trialRuleFor, the same function the signup grant uses, from
 * Vercel's geo header, so every "free" line on the site appears exactly where
 * a new account really is given credits and disappears the moment a country
 * is stopped in /admin/trials. Anyone with a session cookie already has an
 * account, and the trial is for new accounts only, so they get null.
 */

const TTL = 30_000;
const cache = new Map<string, { at: number; credits: number | null }>();

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  const signedIn = req.cookies.getAll().some((c) => /^sb-.*-auth-token/.test(c.name));
  const country = requestCountry(req);
  if (signedIn || !country) return NextResponse.json({ offer: null }, { headers });

  let hit = cache.get(country);
  if (!hit || Date.now() - hit.at > TTL) {
    const { rule, error } = await trialRuleFor(country).catch(() => ({ rule: null, error: "unreachable" }));
    // On a database error, say nothing rather than promise a trial that may not be granted.
    hit = { at: Date.now(), credits: error ? null : rule?.credits ?? null };
    if (!error) cache.set(country, hit);
  }

  const credits = hit.credits;
  if (!credits) return NextResponse.json({ offer: null }, { headers });
  return NextResponse.json({
    offer: { credits, generations: Math.max(1, Math.floor(credits / CREDIT_COST)), country },
  }, { headers });
}
