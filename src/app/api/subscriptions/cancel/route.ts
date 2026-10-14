import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import { LIVE_STATUSES, planView, razorpayClient, type SubscriptionRow } from "@/lib/subscriptions.server";

export const runtime = "nodejs";

/**
 * Cancels one of the user's monthly plans.
 *
 * At the end of the paid month, not now: Razorpay takes no further payment,
 * and the credits already paid for stay usable until the month runs out.
 * A plan that has never been charged has nothing to run out, so it is
 * cancelled immediately.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { id } = await req.json().catch(() => ({})) as { id?: number };
  const db = createAdminSupabase();
  const { data: sub } = await db.from("subscriptions").select("*").eq("id", Number(id)).maybeSingle() as { data: SubscriptionRow | null };
  if (!sub || sub.user_id !== session!.userId) {
    return NextResponse.json({ error: "That plan could not be found." }, { status: 404 });
  }
  if (sub.cancel_at_cycle_end || !LIVE_STATUSES.includes(sub.status)) {
    return NextResponse.json({ ok: true, plan: planView(sub) });
  }

  const rzp = razorpayClient();
  if (!rzp) return NextResponse.json({ error: "Cancelling is unavailable for a moment. Please try again shortly." }, { status: 503 });

  // Only an active plan has a cycle to finish. A halted or pending one (its
  // renewal failed) is stopped now so Razorpay stops retrying the card; the
  // credits it already paid for still last until credits_expire_at either way.
  const atCycleEnd = !!sub.credits_expire_at && sub.status === "active";
  try {
    const remote = await rzp.subscriptions.cancel(sub.razorpay_subscription_id, atCycleEnd) as unknown as { status: string };
    const now = new Date().toISOString();
    const update = {
      status: atCycleEnd ? (remote?.status || sub.status) : "cancelled",
      cancel_at_cycle_end: atCycleEnd,
      cancelled_at: now,
      updated_at: now,
    };
    await db.from("subscriptions").update(update).eq("id", sub.id);
    return NextResponse.json({ ok: true, plan: planView({ ...sub, ...update }) });
  } catch (e) {
    const err = e as { error?: { description?: string } };
    console.error(`[subscriptions/cancel] ${sub.razorpay_subscription_id}:`, err?.error?.description || (e as Error).message);
    return NextResponse.json({ error: "The plan could not be cancelled just now. Nothing has changed — please try again in a moment." }, { status: 502 });
  }
}
