import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { monthlyBuckets, sumBuckets } from "@/lib/credit-buckets.server";
import { applyCharge, razorpayClient, type SubscriptionRow } from "@/lib/subscriptions.server";

export const runtime = "nodejs";

const UNCONFIRMED = "The payment could not be confirmed. If money left your account, your plan will appear within a few minutes — otherwise contact support.";

/**
 * Confirms the first month of a plan, straight after Checkout.
 *
 * The webhook would credit the same payment a moment later; doing it here as
 * well means the credits are there when the popup closes rather than whenever
 * the webhook lands. applyCharge() claims the payment id, so whichever of the
 * two arrives second adds nothing.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await req.json().catch(() => ({})) as {
    razorpay_payment_id?: string; razorpay_subscription_id?: string; razorpay_signature?: string;
  };
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return NextResponse.json({ error: UNCONFIRMED }, { status: 400 });
  }

  // Razorpay signs a subscription payment as payment_id|subscription_id.
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: UNCONFIRMED }, { status: 400 });
  }

  const db = createAdminSupabase();
  const { data: sub } = await db.from("subscriptions").select("*")
    .eq("razorpay_subscription_id", razorpay_subscription_id).maybeSingle() as { data: SubscriptionRow | null };
  if (!sub || sub.user_id !== session!.userId) {
    return NextResponse.json({ error: UNCONFIRMED }, { status: 400 });
  }

  const rzp = razorpayClient();
  if (!rzp) return NextResponse.json({ error: UNCONFIRMED }, { status: 503 });

  try {
    const [payment, remote] = await Promise.all([
      rzp.payments.fetch(razorpay_payment_id) as unknown as Promise<{ amount: number; order_id?: string | null; status: string }>,
      rzp.subscriptions.fetch(razorpay_subscription_id) as unknown as Promise<{ status: string; current_start?: number | null; current_end?: number | null }>,
    ]);
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json({ error: UNCONFIRMED }, { status: 400 });
    }

    await applyCharge(sub, {
      paymentId: razorpay_payment_id,
      orderId: payment.order_id ?? null,
      amountPaise: payment.amount,
      periodStart: remote.current_start,
      periodEnd: remote.current_end,
      status: remote.status === "authenticated" ? "active" : remote.status,
    });
  } catch (e) {
    console.error(`[subscriptions/verify] ${razorpay_subscription_id} / ${razorpay_payment_id}:`, (e as Error).message);
    return NextResponse.json({
      error: "Your payment went through, but the plan's credits have not landed yet. Reload in a minute — if they are still missing, contact support.",
    }, { status: 500 });
  }

  const { data: prof } = await db.from("profiles").select("credits").eq("id", session!.userId).maybeSingle() as { data: { credits: number } | null };
  const credits = (prof?.credits ?? 0) + sumBuckets(await monthlyBuckets(db, session!.userId));
  return NextResponse.json({ success: true, credits });
}
