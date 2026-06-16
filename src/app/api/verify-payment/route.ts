import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, { credits: number }> = {
  starter: { credits: 50 },
  creator: { credits: 100 },
  pro:     { credits: 300 },
};

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

  // Record the purchase for audit
  void admin.from("purchases").insert({
    user_id: session!.userId,
    razorpay_order_id,
    razorpay_payment_id,
    plan,
    credits_added: planCredits,
    amount_paise: planCredits === 50 ? 500 : planCredits === 100 ? 1000 : 2500,
  }); // non-blocking, table may not exist yet

  return NextResponse.json({ success: true, plan, credits: newCredits });
}
