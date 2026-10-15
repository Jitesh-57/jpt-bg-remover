import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-token";
import { noteSubscriptionOrders, razorpayClient } from "@/lib/subscriptions.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Writes userId, plan and credits into the notes of every monthly plan's
 * Razorpay orders, for the orders made before new ones were noted as they were
 * created (see noteSubscriptionOrders). Re-runnable: noting an order again
 * writes the same values.
 *
 *   GET /api/admin/note-orders?token=…          how many subscriptions it would visit
 *   GET /api/admin/note-orders?token=…&apply=1  write the notes
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const rzp = razorpayClient();
  if (!rzp) return NextResponse.json({ error: "Razorpay keys are not set for this deployment." }, { status: 503 });

  const { data, error } = await createAdminSupabase()
    .from("subscriptions")
    .select("user_id, plan, credits_per_cycle, razorpay_subscription_id")
    .order("created_at", { ascending: false })
    .limit(300) as {
      data: { user_id: string; plan: string; credits_per_cycle: number; razorpay_subscription_id: string }[] | null;
      error: { message: string } | null;
    };
  if (error) return NextResponse.json({ error: `subscriptions not readable: ${error.message}` }, { status: 500 });

  const subs = (data || []).filter((s) => s.razorpay_subscription_id);
  if (req.nextUrl.searchParams.get("apply") !== "1") {
    return NextResponse.json({ dryRun: true, subscriptions: subs.length, next: "Add &apply=1 to write the notes." });
  }

  let noted = 0;
  for (let i = 0; i < subs.length; i += 5) {
    const counts = await Promise.all(subs.slice(i, i + 5).map((s) => noteSubscriptionOrders(rzp, s)));
    noted += counts.reduce((a, b) => a + b, 0);
  }
  return NextResponse.json({ subscriptions: subs.length, ordersNoted: noted });
}
