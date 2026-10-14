import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { PACK_BY_ID } from "@/lib/plans";
import { PLAY_APPS, PLAY_PRODUCTS } from "@/lib/play-billing";
import { playConfigured, getProductPurchase, consumeProductPurchase, PlayApiError } from "@/lib/google-play.server";
import { recordCredits } from "@/lib/ledger";

export const runtime = "nodejs";

/**
 * POST /api/play/verify — credit a Google Play in-app purchase.
 *
 *   { app: "age-progression", productId: "credits_20", purchaseToken }
 *
 * Called by the Android app straight after Play's purchase sheet closes, and
 * again on every launch for any purchase Play still lists as unconsumed (see
 * recoverPlayPurchases). Exactly-once by construction:
 *
 *   1. the token is checked with Google — purchased, not cancelled or pending
 *   2. it is claimed by inserting its play_purchases row (unique token); a
 *      token already claimed by this account is reported as done, unchanged
 *   3. the credits are added and written to the ledger
 *   4. the purchase is consumed, so the pack can be bought again; if that
 *      fails, the next launch retries it and step 2 stops a second credit
 *
 * Unconsumed purchases are refunded by Google after three days, so step 4 is
 * retried rather than left: the buyer keeps what they paid for either way.
 */

const SORRY = "The purchase couldn't be confirmed. If you were charged, reopen the app and it will be credited, or contact support.";

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { app, productId, purchaseToken } = (await req.json().catch(() => ({}))) as {
    app?: string; productId?: string; purchaseToken?: string;
  };
  const pkg = app ? PLAY_APPS[app] : undefined;
  const pack = productId ? PACK_BY_ID[PLAY_PRODUCTS[productId]] : undefined;
  if (!pkg || !pack || !productId || !purchaseToken || purchaseToken.length > 4096) {
    return NextResponse.json({ error: SORRY }, { status: 400 });
  }
  if (!playConfigured()) {
    console.error("[play/verify] GOOGLE_PLAY_SERVICE_ACCOUNT is not set; a Play purchase is waiting to be credited");
    return NextResponse.json({ error: "In-app purchases are being set up. Your payment is safe — reopen the app later and it will be credited." }, { status: 503 });
  }

  const admin = createAdminSupabase();
  const userId = session!.userId;

  // 1. Google's word on it.
  let purchase;
  try {
    purchase = await getProductPurchase(pkg, productId, purchaseToken);
  } catch (e) {
    console.error("[play/verify]", (e as Error).message);
    const status = e instanceof PlayApiError && (e.status === 400 || e.status === 404) ? 400 : 502;
    return NextResponse.json({ error: SORRY }, { status });
  }
  if (purchase.purchaseState === 2) {
    return NextResponse.json({ pending: true, error: "Your payment is still processing. The credits will be added as soon as Google Play confirms it." }, { status: 202 });
  }
  if (purchase.purchaseState !== 0) {
    return NextResponse.json({ error: "This purchase was cancelled, so no credits were added." }, { status: 400 });
  }

  const consume = async () => {
    try {
      await consumeProductPurchase(pkg, productId, purchaseToken);
      await admin.from("play_purchases").update({ consumed: true }).eq("purchase_token", purchaseToken);
    } catch (e) {
      // Not fatal: still listed by Play, so the next launch retries it.
      console.error(`[play/verify] consume failed for ${purchase.orderId || "?"}:`, (e as Error).message);
    }
  };

  // 2. Claim the token. The unique index makes this the exactly-once point.
  const { error: claimErr } = await admin.from("play_purchases").insert({
    user_id: userId,
    package_name: pkg,
    product_id: productId,
    purchase_token: purchaseToken,
    order_id: purchase.orderId ?? null,
    credits_added: pack.credits,
    region: purchase.regionCode ?? null,
    test_purchase: purchase.purchaseType === 0,
  });

  if (claimErr) {
    if (claimErr.code !== "23505") {
      console.error("[play/verify] could not record the purchase:", claimErr.message);
      return NextResponse.json({ error: SORRY }, { status: 500 });
    }
    // Already credited. To this account: report the balance and finish consuming.
    const { data: row } = await admin.from("play_purchases").select("user_id, consumed").eq("purchase_token", purchaseToken).single() as
      { data: { user_id: string; consumed: boolean } | null };
    if (row?.user_id !== userId) {
      return NextResponse.json({ error: "This purchase was already used by another account." }, { status: 409 });
    }
    if (!row.consumed && purchase.consumptionState !== 1) await consume();
    return NextResponse.json({ success: true, already: true, credits: session!.credits });
  }

  // A consumed token we have no row for was not credited by us; never credit it now.
  if (purchase.consumptionState === 1) {
    await admin.from("play_purchases").delete().eq("purchase_token", purchaseToken);
    return NextResponse.json({ error: SORRY }, { status: 400 });
  }

  // 3. The credits.
  // Add-on credits go to the never-expiring balance; the total reported back
  // also counts any monthly-plan credits.
  const newBase = (session!.baseCredits ?? session!.credits) + pack.credits;
  const newCredits = session!.credits + pack.credits;
  const { error: dbErr } = await admin.from("profiles").upsert({
    id: userId,
    plan: pack.id,
    credits: newBase,
    daily_credits_reset_at: null,
  }, { onConflict: "id" });
  if (dbErr) {
    // Release the claim so the next attempt can credit it.
    await admin.from("play_purchases").delete().eq("purchase_token", purchaseToken);
    console.error("[play/verify] credit update failed:", dbErr.message);
    return NextResponse.json({ error: "Your payment went through, but the credits have not landed yet. Reopen the app in a minute and they will be added." }, { status: 500 });
  }

  await recordCredits({
    userId,
    delta: pack.credits,
    balanceAfter: newCredits,
    reason: "purchase",
    note: `google_play · ${productId} · ${purchase.orderId || "no order id"}${purchase.purchaseType === 0 ? " · test" : ""}`,
  });

  // 4. Consume, so it can be bought again.
  await consume();

  return NextResponse.json({ success: true, credits: newCredits });
}
