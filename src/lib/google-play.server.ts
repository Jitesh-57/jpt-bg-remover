import crypto from "crypto";

/**
 * google-play.server.ts — checking Play purchases with Google.
 *
 * A purchase token from the app proves nothing on its own; it is checked with
 * the Google Play Developer API, as a service account linked to the Play
 * Console, before any credits are added. Plain fetch and a hand-signed JWT
 * rather than the googleapis package: two endpoints do not justify the weight.
 *
 * Needs GOOGLE_PLAY_SERVICE_ACCOUNT — the service account's JSON key, as
 * pasted from the downloaded file (or base64 of it). See docs/play-billing.md.
 */

interface ServiceAccount { client_email: string; private_key: string }

function serviceAccount(): ServiceAccount | null {
  const raw = (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT || "").trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    console.error("[google-play] GOOGLE_PLAY_SERVICE_ACCOUNT is not a valid service-account JSON key");
    return null;
  }
}

export function playConfigured(): boolean {
  return !!serviceAccount();
}

let cached: { token: string; until: number } | null = null;

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.until) return cached.token;
  const sa = serviceAccount();
  if (!sa) throw new Error("Google Play is not configured");
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signature = crypto.createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${head}.${claims}.${b64url(signature)}`,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`Google token request failed (${res.status}): ${body.error_description || ""}`);
  cached = { token: body.access_token, until: Date.now() + ((body.expires_in ?? 3600) - 120) * 1000 };
  return body.access_token;
}

const base = (pkg: string, productId: string, token: string) =>
  `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}` +
  `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`;

/** Google's record of a one-time product purchase. */
export interface ProductPurchase {
  /** 0 purchased, 1 cancelled, 2 pending. */
  purchaseState?: number;
  /** 0 not yet consumed, 1 consumed. */
  consumptionState?: number;
  orderId?: string;
  regionCode?: string;
  /** 0 test purchase (license tester), 1 promo code, 2 rewarded; absent for a real purchase. */
  purchaseType?: number;
}

export class PlayApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function getProductPurchase(pkg: string, productId: string, token: string): Promise<ProductPurchase> {
  const res = await fetch(base(pkg, productId, token), { headers: { Authorization: `Bearer ${await accessToken()}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } })?.error?.message || "";
    throw new PlayApiError(`Google Play purchase lookup failed (${res.status}): ${msg}`, res.status);
  }
  return body as ProductPurchase;
}

/** Marks the purchase used, so the same pack can be bought again. Implies acknowledgement. */
export async function consumeProductPurchase(pkg: string, productId: string, token: string): Promise<void> {
  const res = await fetch(`${base(pkg, productId, token)}:consume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PlayApiError(`Google Play consume failed (${res.status}): ${text.slice(0, 200)}`, res.status);
  }
}
