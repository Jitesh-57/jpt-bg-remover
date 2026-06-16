import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { checkAuth } from "@/lib/auth";

export const runtime = "nodejs";

const PLANS: Record<string, { amountPaise: number; credits: number; planName: string }> = {
  starter: { amountPaise: 500,  credits: 50,  planName: "starter" },
  creator: { amountPaise: 1000, credits: 100, planName: "creator" },
  pro:     { amountPaise: 2500, credits: 300, planName: "pro"     },
};

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { plan } = await req.json() as { plan?: string };
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { amountPaise, credits, planName } = PLANS[plan];
  if (amountPaise < 100) {
    return NextResponse.json({ error: "Amount too low" }, { status: 400 });
  }

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `${session!.userId.slice(0, 8)}-${planName}-${Date.now()}`,
      notes: {
        userId: session!.userId,
        plan: planName,
        credits: String(credits),
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planName,
      credits,
    });
  } catch (e) {
    console.error("[create-order]", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
