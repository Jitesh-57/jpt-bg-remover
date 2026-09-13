import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { PACKS, inrPaise } from "@/lib/plans";
import { financialYear, invoiceNumber } from "@/lib/invoice";
import { recordCredits } from "@/lib/ledger";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, { credits: number; amountPaise: number }> =
  Object.fromEntries(PACKS.map((p) => [p.id, { credits: p.credits, amountPaise: inrPaise(p) }]));

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
    await req.json() as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      plan?: string;
    };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  if (!PLAN_CREDITS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Verify HMAC-SHA256 signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Assign plan + add credits to user profile
  const { credits: planCredits } = PLAN_CREDITS[plan];
  const newCredits = session!.credits + planCredits;

  const admin = createAdminSupabase();
  const { error: dbErr } = await admin.from("profiles").upsert({
    id: session!.userId,
    plan,
    credits: newCredits,
    daily_credits_reset_at: null, // paid users don't reset daily
  }, { onConflict: "id" });

  if (dbErr) {
    console.error("[verify-payment] DB update failed:", dbErr.message);
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }

  // Credits never expire, so nothing time-based is written here.

  /*
    Record the purchase, and give it an invoice number.

    Awaited, unlike before: this row is the only record that the payment
    happened, and it is what the buyer's invoice is rendered from. Firing it
    off unawaited meant a purchase could complete with nothing written down.

    It still cannot fail the request. The credits are already in the account
    and the money has already moved; refusing here would tell the buyer their
    payment failed when it did not. A failure is logged loudly instead, with
    the payment id, so the row can be reconstructed.

    Numbering: sequential within the Indian financial year, which is the
    convention a buyer's accountant expects. Derived from the count of rows
    already in this year — fine at this volume, and the unique index in
    docs/invoices.md turns a race into a visible error rather than two
    customers holding the same invoice number.
  */
  const now = new Date();
  const fy = financialYear(now);
  let invoiceNo: string | null = null;
  try {
    const yearStart = new Date(Date.UTC(Number(fy.slice(0, 4)), 3, 1)).toISOString();
    const { count } = await admin
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yearStart);
    invoiceNo = invoiceNumber((count ?? 0) + 1, now);
  } catch (e) {
    console.warn("[verify-payment] could not number the invoice:", (e as Error).message);
  }

  const { data: purchaseRow, error: purchaseErr } = await admin.from("purchases").insert({
    user_id: session!.userId,
    razorpay_order_id,
    razorpay_payment_id,
    plan,
    credits_added: planCredits,
    amount_paise: PLAN_CREDITS[plan].amountPaise,
    ...(invoiceNo ? { invoice_no: invoiceNo } : {}),
  }).select("id").single() as { data: { id: number } | null; error: { message: string } | null };
  if (purchaseErr) {
    console.error(
      `[verify-payment] purchase row NOT saved for payment ${razorpay_payment_id} ` +
      `(user ${session!.userId}, plan ${plan}): ${purchaseErr.message}`
    );
  }

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
    purchaseId: purchaseRow?.id ?? null,
    note: `${plan} · ${razorpay_payment_id}${invoiceNo ? ` · ${invoiceNo}` : ""}`,
  });

  return NextResponse.json({ success: true, plan, credits: newCredits, invoiceNo });
}
