import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { MONTHLY_BY_ID, inrPaise } from "@/lib/plans";
import { operatorDetail } from "@/lib/user-message";
import { SubscriptionsUnavailable, noteSubscriptionOrders, razorpayClient, razorpayPlanId } from "@/lib/subscriptions.server";

export const runtime = "nodejs";

const NOT_READY = "Monthly plans aren't available just yet. You have not been charged — a one-time pack works in the meantime.";

/**
 * Starts a monthly plan: a Razorpay subscription for the chosen plan, which
 * Checkout then opens for the customer to pay the first month.
 *
 * Someone may hold several plans at once, so an existing plan is no reason to
 * refuse another.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { plan: planId } = await req.json().catch(() => ({})) as { plan?: string };
  const plan = planId ? MONTHLY_BY_ID[planId] : undefined;
  if (!plan) {
    return NextResponse.json({ error: "That plan is no longer available. Please reload the page and pick a plan." }, { status: 400 });
  }

  const rzp = razorpayClient();
  if (!rzp) {
    console.error("[subscriptions/create] Razorpay keys missing");
    return NextResponse.json({ error: NOT_READY }, { status: 503 });
  }

  try {
    const razorpayPlan = await razorpayPlanId(rzp, plan);
    const sub = await rzp.subscriptions.create({
      plan_id: razorpayPlan,
      // Razorpay needs an end. 120 months is "until cancelled" in practice.
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { userId: session!.userId, plan: plan.id, credits: String(plan.credits) },
    });

    const { error: dbErr } = await createAdminSupabase().from("subscriptions").insert({
      user_id: session!.userId,
      plan: plan.id,
      razorpay_subscription_id: sub.id,
      razorpay_plan_id: razorpayPlan,
      status: sub.status || "created",
      credits_per_cycle: plan.credits,
      amount_paise: inrPaise(plan),
    });
    if (dbErr) {
      // Without the row the payment could still be matched by the webhook (the
      // subscription carries userId and plan in its notes), but refusing here
      // is safer than taking money we cannot yet account for.
      console.error("[subscriptions/create] row not saved:", dbErr.message);
      await rzp.subscriptions.cancel(sub.id, false).catch(() => {});
      return NextResponse.json({ error: NOT_READY }, { status: 503 });
    }

    // Razorpay raises the first month's invoice, and its order, with the
    // subscription. Note the buyer on it now, so an order left unpaid is still
    // identifiable; capped so the checkout never waits long on it.
    await Promise.race([
      noteSubscriptionOrders(rzp, {
        user_id: session!.userId, plan: plan.id, credits_per_cycle: plan.credits, razorpay_subscription_id: sub.id,
      }),
      new Promise((r) => setTimeout(r, 2500)),
    ]);

    return NextResponse.json({ subscription_id: sub.id, plan: plan.id, amount: inrPaise(plan), credits: plan.credits });
  } catch (e) {
    if (e instanceof SubscriptionsUnavailable) {
      console.error("[subscriptions/create] not set up:", e.message);
      return NextResponse.json({ error: NOT_READY }, { status: 503 });
    }
    const err = e as { statusCode?: number; error?: { description?: string } };
    console.error("[subscriptions/create]", err?.error?.description || operatorDetail(e), JSON.stringify(err ?? {}));
    // Razorpay answers this way when Subscriptions is not enabled on the account.
    if (/subscription|not enabled|feature/i.test(err?.error?.description || "")) {
      return NextResponse.json({ error: NOT_READY }, { status: 503 });
    }
    return NextResponse.json({ error: "Checkout could not be started. You have not been charged — please try again in a moment." }, { status: 500 });
  }
}
