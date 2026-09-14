/**
 * user-message.ts — the last thing between an internal failure and a customer.
 *
 * Almost every route ended its catch block with
 * `error: e instanceof Error ? e.message : String(e)`, and almost every screen
 * rendered that string as-is. So a customer who pressed Generate could be told
 * "The image service is out of credit: User is locked. Reason: Exhausted
 * balance. Top up your balance at fal.ai/dashboard/billing", or
 * "FAL_KEY is not configured", or "imageUrl required".
 *
 * Those sentences are for whoever runs the site. They name our providers, hand
 * out an attack surface, and tell a paying customer to go top up somebody
 * else's balance — while never answering the only question they have, which is
 * whether they lost anything and whether to try again.
 *
 * `userMessage()` answers that question and nothing else. The technical text
 * stays where it belongs: `console.error` on the server, which is what the
 * routes here still log.
 *
 * Isomorphic on purpose — no server-only imports — so a route and the screen
 * that renders its response agree on the wording.
 */

/** What a failure with no better explanation says. */
export const GENERIC_ERROR =
  "Something went wrong. Please try again in a moment.";

/**
 * Nothing here spends a credit before the image exists: `withCredits` runs on
 * the success path only, so a failed generation has cost the customer nothing
 * and saying so is accurate, not reassurance.
 */
const PROVIDER_UNAVAILABLE =
  "AI tools are temporarily unavailable. No credits were used — please try again shortly.";
const BUSY =
  "The service is busy right now. No credits were used — please wait a minute and try again.";
const TIMEOUT =
  "That took longer than expected and was stopped. No credits were used — please try again.";
const REJECTED =
  "The AI could not work with this photo or wording. Try a different photo, or change the prompt slightly.";
const NETWORK =
  "Could not reach the server. Check your connection and try again.";
const TOO_LARGE =
  "That image is too large. Please use a file under 4MB.";
const SIGNED_OUT =
  "Please sign in to continue.";
const BAD_REQUEST =
  "Something about that request was not right. Please reload the page and try again.";

/**
 * Words that mean the message was written for an operator.
 *
 * A message that mentions a vendor, a credential, an environment variable or a
 * field name is never shown, whatever else it says — including when the
 * wording around it looks friendly, which the fal billing errors did.
 */
const OPERATOR_ONLY =
  /\b(fal|fal\.ai|fal_key|gemini|nano.?banana|gpt.image|pixelbin|supabase|razorpay|postgres|psql|sql|vercel|cloudinary|openai|s3|bucket|api[_ ]?key|secret|token|env|environment variable|dashboard|service role|webhook|stack|traceback|undefined|null|nan|econn|enotfound|etimedout|socket|dns|prisma|rls|schema|column|relation)\b/i;

/**
 * Shapes only a developer produces: JSON, stack frames, code identifiers, and
 * a bare HTTP status in brackets — "(502)" is a fact about our infrastructure,
 * not an answer to anything the reader asked.
 */
const LOOKS_LIKE_CODE =
  /[{}<>[\]]|https?:\/\/|\bat\s+\w+\s*\(|\w+Error\b|\b[a-z]+[A-Z]\w*\b|_\w|\.\w+\(|\(\d{3}\)/;

interface Signals {
  /** Everything we know about the failure, lowercased, for matching only. */
  text: string;
  status: number;
}

function signals(err: unknown): Signals {
  const parts: string[] = [];
  let status = 0;

  if (typeof err === "string") parts.push(err);
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; detail?: unknown; error?: unknown; status?: unknown; statusCode?: unknown; name?: unknown };
    for (const v of [e.message, e.detail, e.error, e.name]) {
      if (typeof v === "string") parts.push(v);
    }
    const s = Number(e.status ?? e.statusCode);
    if (Number.isFinite(s)) status = s;
  }

  return { text: parts.join(" ").toLowerCase(), status };
}

/**
 * True when a message is safe to show as written.
 *
 * Deliberately conservative: a sentence has to read like something a person
 * wrote for a customer — plain words, sane length, no vendor names, no code —
 * or it is replaced. Wrongly generalising a good message costs a little
 * precision; wrongly showing a bad one puts our provider's billing page in
 * front of a customer.
 */
function isCustomerReady(message: string): boolean {
  const m = message.trim();
  if (m.length < 8 || m.length > 200) return false;
  if (!/\s/.test(m)) return false;
  if (!/^[A-Z“"']/.test(m)) return false;
  if (OPERATOR_ONLY.test(m)) return false;
  if (LOOKS_LIKE_CODE.test(m)) return false;
  return true;
}

/**
 * The sentence to show a customer for this failure.
 *
 * `fallback` covers the case where the caller knows what the user was doing
 * ("Sign-in failed…") better than this can infer it.
 */
export function userMessage(err: unknown, fallback: string = GENERIC_ERROR): string {
  const { text, status } = signals(err);
  if (!text && !status) return fallback;

  // Ordered by how wrong it would be to report the other thing. Billing and
  // credentials come first because fal's "exhausted balance" body also matches
  // the throttle pattern, and telling a customer to wait for a balance that
  // nobody is topping up is a dead end.
  if (
    status === 401 || status === 402 || status === 403 ||
    /exhausted balance|user is locked|out of credit|insufficient (funds|balance|credit)|top ?up|rejected our key|not configured|unauthori[sz]ed|forbidden|invalid api key|authentication failed/.test(text)
  ) {
    // A signed-out *customer* is a different thing from a rejected provider
    // key, and only the user-facing one is actionable by them.
    if (/not signed in|sign in|session expired|token expired|not authenticated/.test(text)) return SIGNED_OUT;
    return PROVIDER_UNAVAILABLE;
  }

  if (status === 429 || /rate.?limit|too many requests|quota|concurren|is busy/.test(text)) return BUSY;
  if (status === 408 || status === 504 || /timed? ?out|took too long|took longer/.test(text)) return TIMEOUT;
  if (status === 413 || /too large|payload|file size|entity too large/.test(text)) return TOO_LARGE;
  if (status === 422 || /content.?polic|content checker|could not generate|did not generate|no image in response|returned no image|nsfw|safety/.test(text)) return REJECTED;
  if (/failed to fetch|network ?error|load failed|fetch failed|offline|connection|econnreset/.test(text)) return NETWORK;
  if (status === 400 || /required|invalid json|must be/.test(text)) return BAD_REQUEST;
  if (status >= 500) return GENERIC_ERROR;

  // Nothing matched: show the original only if it was written for a customer.
  const original = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return isCustomerReady(original) ? original.trim() : fallback;
}

/**
 * The technical text, for `console.error` — never for a response body.
 *
 * A failure that is hidden from the customer still has to be diagnosable, so
 * the logging call sites keep the real thing.
 */
export function operatorDetail(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
