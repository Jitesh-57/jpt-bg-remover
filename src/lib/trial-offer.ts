"use client";

import { useEffect, useState } from "react";

/**
 * trial-offer.ts — the signup free trial, as the browser sees it.
 *
 * Every "free" line about AI generations reads from here and renders nothing
 * until /api/trial-offer has answered, so a visitor from a country without a
 * live trial never sees the word, not even for a frame, and stopping a country
 * in /admin/trials takes the copy away for everyone there on their next page
 * load. Signed-in visitors always get null: the trial is for new accounts.
 */

export interface TrialOffer {
  credits: number;
  generations: number;
  country: string;
}

let pending: Promise<TrialOffer | null> | null = null;

function load(): Promise<TrialOffer | null> {
  if (!pending) {
    pending = fetch("/api/trial-offer", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { offer: null }))
      .then((d: { offer?: TrialOffer | null }) => d.offer ?? null)
      .catch(() => null);
  }
  return pending;
}

/** The live offer for this visitor, or null (unknown yet, none, or signed in). One request per page. */
export function useTrialOffer(): TrialOffer | null {
  const [offer, setOffer] = useState<TrialOffer | null>(null);
  useEffect(() => {
    let alive = true;
    void load().then((o) => { if (alive) setOffer(o); });
    // Signing in mid-page ends the offer without a reload.
    const off = () => { pending = Promise.resolve(null); setOffer(null); };
    window.addEventListener("jpt:signed-in", off);
    return () => { alive = false; window.removeEventListener("jpt:signed-in", off); };
  }, []);
  return offer;
}

/** "1 free AI generation" / "3 free AI generations". */
export function generationsLabel(o: TrialOffer): string {
  return `${o.generations} free AI generation${o.generations === 1 ? "" : "s"}`;
}

/** The visitor's country by name, from the browser ("India"), falling back to the code. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

/** Opens the site's sign-in modal on its "create account" side, headed with the trial. */
export function openTrialSignIn(source: string): void {
  window.dispatchEvent(new CustomEvent("jpt:open-signin", { detail: { intent: "trial", source } }));
}
