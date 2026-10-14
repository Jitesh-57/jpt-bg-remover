"use client";

import { useEffect, useState } from "react";
import { PACKS, type Pack } from "@/lib/plans";
import { PLAY_BILLING_METHOD, playProductId } from "@/lib/play-billing";
import { trackEvent } from "@/lib/analytics";

/**
 * play-billing.client.ts — Google Play in-app purchases from the web app.
 *
 * The Android apps are Trusted Web Activities: this same page, running in
 * Chrome, inside an app installed from Play. There Chrome exposes the Digital
 * Goods API (prices, past purchases) and a Payment Request method for Play
 * Billing (the purchase sheet). Google Play's sheet opens over the app and
 * closes itself when the payment is done, so the buyer never leaves the app.
 *
 *   price list   getDigitalGoodsService(PLAY).getDetails([...product ids])
 *   purchase     new PaymentRequest([{ supportedMethods: PLAY, data: { sku } }]).show()
 *   credit       POST /api/play/verify — the server checks the token with
 *                Google, adds the credits once, and consumes the purchase
 *
 * In any other browser none of this exists and the apps sell through Razorpay
 * as the website does.
 */

interface ItemDetails { itemId: string; title: string; price: { currency: string; value: string } }
interface PurchaseDetails { itemId: string; purchaseToken: string }
interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
}
type WithDigitalGoods = Window & { getDigitalGoodsService?: (method: string) => Promise<DigitalGoodsService | null> };

/** A pack as the Play app sells it: Play's price, in the buyer's currency. */
export interface PlayPrice { amount: number; currency: string; label: string }

export interface PlayStore {
  service: DigitalGoodsService;
  /** By pack id. A pack missing here is not set up in Play Console and is not offered. */
  prices: Record<string, PlayPrice>;
}

const TWA_FLAG = "jpt-play-app";

/**
 * True inside the Android app. The app opens its start URL with
 * `?src=play`, and Chrome sets an android-app:// referrer for a TWA launch;
 * either is remembered for this tab only (a TWA shares storage with Chrome,
 * so anything longer-lived would leak into ordinary browsing).
 */
export function inPlayApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(TWA_FLAG)) return true;
    const fromPlay = new URLSearchParams(window.location.search).get("src") === "play"
      || document.referrer.startsWith("android-app://");
    if (fromPlay) sessionStorage.setItem(TWA_FLAG, "1");
    return fromPlay;
  } catch {
    return document.referrer.startsWith("android-app://");
  }
}

function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

/** Connects to Play Billing and reads the packs' prices; null outside the Play app. */
export async function connectPlay(): Promise<PlayStore | null> {
  const w = window as WithDigitalGoods;
  if (!w.getDigitalGoodsService || !("PaymentRequest" in window)) return null;
  try {
    const service = await w.getDigitalGoodsService(PLAY_BILLING_METHOD);
    if (!service) return null;
    const details = await service.getDetails(PACKS.map(playProductId));
    const prices: Record<string, PlayPrice> = {};
    for (const p of PACKS) {
      const d = details.find((x) => x.itemId === playProductId(p));
      if (!d) continue;
      const amount = Number(d.price.value);
      prices[p.id] = { amount, currency: d.price.currency, label: formatPrice(amount, d.price.currency) };
    }
    return { service, prices };
  } catch (e) {
    console.warn("[play] billing unavailable:", (e as Error).message);
    return null;
  }
}

export interface PlayResult { ok: boolean; text: string; credits?: number; cancelled?: boolean; pending?: boolean }

type VerifyBody = { success?: boolean; credits?: number; error?: string; pending?: boolean };

async function verify(app: string, productId: string, purchaseToken: string): Promise<{ res: Response; data: VerifyBody }> {
  const res = await fetch("/api/play/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app, productId, purchaseToken }),
  });
  const data = (await res.json().catch(() => ({}))) as VerifyBody;
  return { res, data };
}

/** Runs Google Play's purchase sheet for one pack and credits it. */
export async function buyOnPlay(app: string, pack: Pack): Promise<PlayResult> {
  const sku = playProductId(pack);
  trackEvent("play_purchase_start", { sku });
  let response: PaymentResponse;
  try {
    const request = new PaymentRequest(
      [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku } }],
      // Required by the Payment Request API; Play ignores it and charges its own price.
      { total: { label: "Total", amount: { currency: "USD", value: "0" } } },
    );
    response = await request.show();
  } catch (e) {
    // The sheet was closed without paying (AbortError), or Play refused to open it.
    const cancelled = (e as DOMException)?.name === "AbortError";
    trackEvent("play_purchase_closed", { sku, reason: (e as Error).name });
    return { ok: false, cancelled, text: cancelled ? "Payment cancelled." : "Google Play couldn't open the payment. Please try again." };
  }

  const token = (response.details as { purchaseToken?: string })?.purchaseToken;
  if (!token) {
    await response.complete("fail").catch(() => {});
    return { ok: false, text: "Google Play didn't confirm the purchase. If you were charged, reopen the app and it will be credited." };
  }

  try {
    const { res, data } = await verify(app, sku, token);
    if (res.ok && data.success) {
      await response.complete("success").catch(() => {});
      trackEvent("play_purchase_done", { sku });
      return { ok: true, text: "Purchase complete.", credits: data.credits };
    }
    await response.complete(data.pending ? "unknown" : "fail").catch(() => {});
    return { ok: false, pending: data.pending, text: data.error || "The purchase couldn't be confirmed. If you were charged, reopen the app and it will be credited." };
  } catch {
    // Unconsumed, so Play lists it again on the next launch and it is credited then.
    await response.complete("unknown").catch(() => {});
    return { ok: false, text: "Couldn't reach the server to add your credits. Reopen the app and they will be added." };
  }
}

/**
 * Credits any purchase that was paid but never confirmed — the app closed
 * mid-way, the network dropped, a pending payment cleared. The server credits
 * a purchase token once only, so asking again is safe. Returns the new balance
 * if anything was added.
 */
export async function recoverPlayPurchases(store: PlayStore, app: string): Promise<number | null> {
  let balance: number | null = null;
  try {
    for (const p of await store.service.listPurchases()) {
      const { res, data } = await verify(app, p.itemId, p.purchaseToken).catch(() => ({ res: null, data: {} as VerifyBody }));
      if (res?.ok && typeof data.credits === "number") balance = data.credits;
    }
  } catch (e) {
    console.warn("[play] could not list purchases:", (e as Error).message);
  }
  return balance;
}

/**
 * The Play store connection for this page: `undefined` while checking, `null`
 * outside the Play app (or when Play Billing is unavailable inside it — see
 * `inApp`), else the connected store.
 */
export function usePlayStore(): { store: PlayStore | null | undefined; inApp: boolean } {
  const [store, setStore] = useState<PlayStore | null | undefined>(undefined);
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(inPlayApp());
    let alive = true;
    void connectPlay().then((s) => { if (alive) setStore(s); });
    return () => { alive = false; };
  }, []);
  return { store, inApp };
}
