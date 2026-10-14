import { createAdminSupabase } from "@/lib/auth";
import { FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE, VISITOR_COOKIE, type Touch } from "@/lib/touch";

/**
 * acquisition.server.ts — where an account came from.
 *
 * The middleware stamps every new visitor with first-party cookies on their
 * first page view (see src/middleware.ts and lib/touch.ts):
 *
 *   jpt_vid   a random visitor id, which /api/track puts on every event
 *   jpt_src   the first touch: external referrer, landing page, UTM tags and
 *             ad click ids, set once and never overwritten
 *   jpt_lsrc  the latest visit that carried UTM tags (overwritten each time)
 *
 * At signup this turns them, plus Vercel's location headers and the browser's
 * user agent, into one public.user_acquisition row, and links the visitor's
 * anonymous events to the new account. Best effort throughout: nothing here
 * may slow down or break a sign-in.
 */

export { VISITOR_COOKIE, FIRST_TOUCH_COOKIE, LAST_TOUCH_COOKIE } from "@/lib/touch";

export function decodeTouch(value: string | undefined | null): Touch | null {
  if (!value) return null;
  try {
    const json = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const t = JSON.parse(json) as Touch;
    return t && typeof t === "object" ? t : null;
  } catch {
    return null;
  }
}

/** Reads a cookie from any Request — NextRequest or the plain kind. */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) {
      try { return decodeURIComponent(part.slice(i + 1)); } catch { return part.slice(i + 1); }
    }
  }
  return undefined;
}

/** Coarse device, browser and OS from a user-agent string. Good enough to group by, not to fingerprint. */
export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const s = ua || "";
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s) ? "tablet"
    : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s) ? "mobile"
    : s ? "desktop" : "unknown";
  const os = /Windows NT/i.test(s) ? "Windows"
    : /iPhone|iPad|iPod/i.test(s) ? "iOS"
    : /Mac OS X|Macintosh/i.test(s) ? "macOS"
    : /Android/i.test(s) ? "Android"
    : /CrOS/i.test(s) ? "ChromeOS"
    : /Linux/i.test(s) ? "Linux"
    : "other";
  const browser = /Edg\//i.test(s) ? "Edge"
    : /OPR\/|Opera/i.test(s) ? "Opera"
    : /SamsungBrowser/i.test(s) ? "Samsung Internet"
    : /FxiOS|Firefox\//i.test(s) ? "Firefox"
    : /CriOS|Chrome\//i.test(s) ? "Chrome"
    : /Safari\//i.test(s) ? "Safari"
    : "other";
  return { device, browser, os };
}

const hostOf = (url: string | undefined): string | null => {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
};

const clip = (v: unknown, n: number): string | null => (typeof v === "string" && v ? v.slice(0, n) : null);

/** Vercel URL-encodes the city header ("New%20Delhi"). */
const header = (req: Request, name: string, n = 80): string | null => {
  const v = req.headers.get(name);
  if (!v) return null;
  try { return decodeURIComponent(v).slice(0, n); } catch { return v.slice(0, n); }
};

/** The user_acquisition row for a signup, from the request's cookies and headers. */
export function acquisitionRow(userId: string, req: Request, signedUpAt?: string) {
  const first = decodeTouch(readCookie(req, FIRST_TOUCH_COOKIE)) || {};
  const last = decodeTouch(readCookie(req, LAST_TOUCH_COOKIE));
  const ua = req.headers.get("user-agent") || "";
  const { device, browser, os } = parseUserAgent(ua);
  const lastDiffers = !!last && (last.utm_source !== first.utm_source || last.utm_campaign !== first.utm_campaign);
  return {
    user_id: userId,
    visitor_id: clip(readCookie(req, VISITOR_COOKIE), 64),
    first_seen_at: first.t ? new Date(first.t).toISOString() : null,
    signed_up_at: signedUpAt || new Date().toISOString(),
    referrer: clip(first.r, 300),
    referrer_host: hostOf(first.r),
    landing_path: clip(first.l, 200),
    utm_source: clip(first.utm_source, 100),
    utm_medium: clip(first.utm_medium, 100),
    utm_campaign: clip(first.utm_campaign, 150),
    utm_term: clip(first.utm_term, 150),
    utm_content: clip(first.utm_content, 150),
    gclid: clip(first.gclid, 200),
    fbclid: clip(first.fbclid, 200),
    last_utm_source: lastDiffers ? clip(last!.utm_source, 100) : null,
    last_utm_medium: lastDiffers ? clip(last!.utm_medium, 100) : null,
    last_utm_campaign: lastDiffers ? clip(last!.utm_campaign, 150) : null,
    country: header(req, "x-vercel-ip-country", 2),
    region: header(req, "x-vercel-ip-country-region"),
    city: header(req, "x-vercel-ip-city"),
    device,
    browser,
    os,
    language: clip((req.headers.get("accept-language") || "").split(",")[0], 20),
    user_agent: clip(ua, 400),
  };
}

/**
 * Records where a new account came from. Called once, at signup. The first
 * row wins, so a second call (the me route after the callback) changes nothing.
 */
export async function recordAcquisition(user: { id: string; created_at?: string }, req: Request): Promise<void> {
  try {
    const row = acquisitionRow(user.id, req, user.created_at);
    await createAdminSupabase().from("user_acquisition").upsert(row, { onConflict: "user_id", ignoreDuplicates: true });
  } catch (e) {
    console.warn("[acquisition] not recorded:", (e as Error).message);
  }
}

/**
 * Gives this browser's anonymous events to the account that just signed in, so
 * what someone did before signing up shows in their history.
 */
export async function linkVisitor(userId: string, req: Request): Promise<void> {
  const vid = readCookie(req, VISITOR_COOKIE);
  if (!vid) return;
  try {
    await createAdminSupabase().from("user_events").update({ user_id: userId })
      .eq("visitor_id", vid.slice(0, 64)).is("user_id", null);
  } catch (e) {
    console.warn("[acquisition] visitor not linked:", (e as Error).message);
  }
}
