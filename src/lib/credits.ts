"use client";

/**
 * credits.ts — one balance, shown in more than one place.
 *
 * The header, the editor and each app workspace all fetch the balance once on
 * mount and then keep their own copy. That was tolerable while the number was
 * only used to decide whether to offer the packs; it is not, now that the
 * header prints the figure beside the user's name. A generation started in the
 * workspace would leave the header advertising credits that had already been
 * spent, and a wrong balance in the chrome is worse than none.
 *
 * Every AI route already returns the new balance as `credits`, so nothing needs
 * re-fetching — whoever receives it announces it, and everyone displaying it
 * listens. A plain CustomEvent on window, the same approach the pricing modal
 * uses, because this is one number and it never needs to outlive the tab.
 */

const EVENT = "jpt:credits";

/** Announce the balance a route just returned. Ignores anything not a number. */
export function publishCredits(credits: unknown): void {
  if (typeof credits !== "number" || !Number.isFinite(credits)) return;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: Math.max(0, Math.trunc(credits)) }));
}

/** Listen for balance changes. Returns the unsubscribe function. */
export function onCreditsChanged(fn: (credits: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => fn((e as CustomEvent<number>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
