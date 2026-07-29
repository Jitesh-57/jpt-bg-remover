import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkAuth, createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";

const PLAN_CREDITS: Record<string, { credits: number; amountPaise: number }> = {
  starter:   { credits: 50,     amountPaise: 49900  },
  creator:   { credits: 100,    amountPaise: 99900  },
  pro:       { credits: 300,    amountPaise: 249900 },
  unlimited: { credits: 999999, amountPaise: 41500  },
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

  // The "Unlimited" purchase is a one-time, 30-day pass (no subscription). Store
  // the expiry in Supabase Auth user_metadata so it needs no DB schema change;
  // the auth layer downgrades to "free" once it passes.
  let expiresAt: string | undefined;
  if (plan === "unlimited") {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const { data } = await admin.auth.admin.getUserById(session!.userId);
      const md = data?.user?.user_metadata || {};
      await admin.auth.admin.updateUserById(session!.userId, {
        user_metadata: { ...md, unlimited_expires_at: expiresAt },
      });
    } catch (e) {
      console.error("[verify-payment] could not set unlimited expiry:", (e as Error).message);
    }
  }

  // Record the purchase for audit
  void admin.from("purchases").insert({
    user_id: session!.userId,
    razorpay_order_id,
    razorpay_payment_id,
    plan,
    credits_added: planCredits,
    amount_paise: PLAN_CREDITS[plan].amountPaise,
  }); // non-blocking, table may not exist yet

  return NextResponse.json({ success: true, plan, credits: newCredits, expiresAt });
}
