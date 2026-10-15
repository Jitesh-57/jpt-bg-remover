import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { PACK_BY_ID, PACKS, inrPaise, type Pack } from "@/lib/plans";
import { recordCredits } from "@/lib/ledger";
import { rememberPurchaseCountry } from "@/lib/free-trial.server";
import { claimPurchase } from "@/lib/purchases.server";
import { razorpayClient } from "@/lib/subscriptions.server";

export const runtime = "nodejs";

const NOT_CONFIRMED = "The payment could not be confirmed. If money left your account, contact support and it will be sorted out.";

type RzpOrder = { id: string; amount: number; notes?: Record<string, string | number | null> };

/**
 * What the order says was bought. The order is ours (create-order wrote the
 * buyer, the pack and the price into it), so it is the authority, not the
 * browser: the signature only proves the payment belongs to the order, and a
 * pack id taken from the request would let a ₹166 payment claim the 35-credit
 * pack. An order with no pack noted is matched by the amount actually charged.
 */
function packForOrder(order: RzpOrder): Pack | undefined {
  const noted = PACK_BY_ID[String(order.notes?.plan || "")];
  if (noted && !noted.monthly) return noted;
  return PACKS.find((p) => inrPaise(p) === order.amount);
}

async function fetchOrder(orderId: string): Promise<RzpOrder | null> {
  const rzp = razorpayClient();
  if (!rzp) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await rzp.orders.fetch(orderId) as unknown as RzpOrder;
    } catch (e) {
      const why = (e as { error?: { description?: string } })?.error?.description || (e as Error)?.message;
      console.warn(`[verify-payment] order ${orderId} not fetched (attempt ${attempt + 1}):`, why);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await req.json() as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: NOT_CONFIRMED }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: NOT_CONFIRMED }, { status: 400 });
  }

  const order = await fetchOrder(razorpay_order_id);
  if (!order) {
    return NextResponse.json({ error: "Your payment went through, but it could not be confirmed just now. Reload in a minute — if the credits are still missing, contact support." }, { status: 502 });
  }
  const buyer = String(order.notes?.userId || "");
  const pack = packForOrder(order);
  if ((buyer && buyer !== session!.userId) || !pack) {
    console.error(`[verify-payment] order ${order.id} refused for ${session!.userId}: buyer ${buyer || "none"}, pack ${pack?.id || "none"}, amount ${order.amount}`);
    return NextResponse.json({ error: NOT_CONFIRMED }, { status: 400 });
  }
  const plan = pack.id;
  const planCredits = pack.credits;

  /*
    Claim the payment before any credits move: the unique payment id makes a
    replayed confirmation find it taken, where it used to add the credits again.
    The claim is also the purchase row the buyer's invoice is rendered from, so
    it carries the invoice number.

    If the row cannot be written for any other reason the credits still land:
    the money has moved, and refusing would tell the buyer their payment failed
    when it did not. That is logged loudly, with the payment id, so the row can
    be reconstructed.
  */
  const now = new Date();
  const claim = await claimPurchase({
    user_id: session!.userId,
    razorpay_order_id,
    razorpay_payment_id,
    plan,
    credits_added: planCredits,
    amount_paise: order.amount,
  }, now);
  if (claim.status === "duplicate") {
    return NextResponse.json({ success: true, plan, credits: session!.credits, alreadyApplied: true });
  }
  if (claim.status === "failed") {
    console.error(
      `[verify-payment] purchase row NOT saved for payment ${razorpay_payment_id} ` +
      `(user ${session!.userId}, plan ${plan}): ${claim.error}`
    );
  }
  const purchaseId = claim.status === "claimed" ? claim.id : null;
  const invoiceNo = claim.status === "claimed" ? claim.invoiceNo : null;

  // Add-on credits go to the never-expiring balance (profiles.credits); the
  // total reported back also counts any monthly-plan credits.
  const newBase = (session!.baseCredits ?? session!.credits) + planCredits;
  const newCredits = session!.credits + planCredits;

  const admin = createAdminSupabase();
  const { error: dbErr } = await admin.from("profiles").upsert({
    id: session!.userId,
    plan,
    credits: newBase,
    daily_credits_reset_at: null, // paid users don't reset daily
  }, { onConflict: "id" });

  if (dbErr) {
    console.error("[verify-payment] DB update failed:", dbErr.message);
    // Release the claim, or a retry would find the payment taken and never credit it.
    if (claim.status === "claimed") {
      await admin.from("purchases").delete().eq("razorpay_payment_id", razorpay_payment_id);
    }
    return NextResponse.json({ error: "Your payment went through, but the credits have not landed yet. Reload in a minute — if they are still missing, contact support." }, { status: 500 });
  }

  // Credits never expire, so nothing time-based is written here.

  if (purchaseId !== null) await rememberPurchaseCountry(purchaseId, session!.userId, req);

  /*
    And the credits arriving, as a ledger entry.

    profiles.credits is only ever the current number. Without this there is no
    way to answer where a balance came from — which is the question an account
    showing 11 credits after a 5-credit pack raised, and which nothing in the
    data could answer at the time.
  */
  await recordCredits({
    userId: session!.userId,
    delta: planCredits,
    balanceAfter: newCredits,
    reason: "purchase",
    purchaseId,
    note: `${plan} · ${razorpay_payment_id}${invoiceNo ? ` · ${invoiceNo}` : ""}`,
  });

  return NextResponse.json({ success: true, plan, credits: newCredits, invoiceNo });
}
