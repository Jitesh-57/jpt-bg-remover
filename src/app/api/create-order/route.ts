import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { checkAuth } from "@/lib/auth";

export const runtime = "nodejs";

const PLANS: Record<string, { amountPaise: number; credits: number; planName: string }> = {
  starter: { amountPaise: 49900,  credits: 50,  planName: "starter" },
  creator: { amountPaise: 99900,  credits: 100, planName: "creator" },
  pro:     { amountPaise: 249900, credits: 300, planName: "pro"     },
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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[create-order] Razorpay keys missing", { hasId: !!keyId, hasSecret: !!keySecret });
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
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
    // Razorpay errors carry a nested .error.description with the real reason
    const err = e as { statusCode?: number; error?: { description?: string; code?: string } };
    const detail = err?.error?.description || (e as Error).message || "Failed to create order";
    console.error("[create-order]", JSON.stringify(err) || e);
    return NextResponse.json({ error: `Failed to create order: ${detail}` }, { status: 500 });
  }
}
