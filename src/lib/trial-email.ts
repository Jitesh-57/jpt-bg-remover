/**
 * trial-email.ts — which email addresses can receive the signup free trial.
 *
 * Only the big consumer providers. A free trial is worth farming, and the
 * cheap way to farm it is a fresh inbox per account: temporary-mail services,
 * or free providers anyone can sign up to in seconds (Zoho and the like).
 * Gmail, Outlook, Yahoo and iCloud each make a new inbox cost something, and
 * emailKey (free-trial.server) already folds Gmail's dots and "+tags" so one
 * inbox is one trial.
 *
 * Everyone else can still sign up and buy credits; they just don't get the
 * free ones. An allow-list rather than a block-list: new temporary-mail
 * domains appear daily, and a block-list is always behind.
 */

/** For copy: who qualifies. */
export const TRIAL_PROVIDERS_LABEL = "Gmail, Outlook, Yahoo or iCloud";

const EXACT = new Set([
  "gmail.com", "googlemail.com",
  "icloud.com", "me.com", "mac.com",
  "ymail.com", "rocketmail.com",
  "msn.com",
]);

/** The big brands' country domains: yahoo.co.in, hotmail.co.uk, outlook.in, live.fr … */
const BRAND = /^(outlook|hotmail|live|yahoo)\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;

/** The address's domain, lowercased; "" when there isn't one. */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at < 0 ? "" : email.slice(at + 1).trim().toLowerCase();
}

/** True when this address can receive the free trial. */
export function trialEmailOk(email: string): boolean {
  const domain = emailDomain(email);
  return EXACT.has(domain) || BRAND.test(domain);
}
