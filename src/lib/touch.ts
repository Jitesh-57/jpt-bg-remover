/**
 * touch.ts — the visitor and first-touch cookies, shared by the edge middleware
 * (which sets them) and lib/acquisition.server.ts (which reads them at signup).
 * Edge-safe: no Node APIs.
 */

export const VISITOR_COOKIE = "jpt_vid";
export const FIRST_TOUCH_COOKIE = "jpt_src";
export const LAST_TOUCH_COOKIE = "jpt_lsrc";

export const TOUCH_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;
export type TouchKey = (typeof TOUCH_KEYS)[number];

/** One visit's source, as stored in the jpt_src / jpt_lsrc cookies. */
export type Touch = Partial<Record<TouchKey, string>> & {
  /** External referrer URL, empty for direct visits. */
  r?: string;
  /** Landing path. */
  l?: string;
  /** When, in ms since the epoch. */
  t?: number;
};

/** Cookies are base64url JSON, so any referrer survives the cookie format. */
export function encodeTouch(t: Touch): string {
  const bytes = new TextEncoder().encode(JSON.stringify(t));
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
