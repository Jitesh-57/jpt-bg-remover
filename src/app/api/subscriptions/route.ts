import { NextRequest, NextResponse } from "next/server";
import { checkAuth, createAdminSupabase } from "@/lib/auth";
import {
  LIVE_STATUSES, expireLapsed, planView, razorpayClient, syncFromRazorpay, type SubscriptionRow,
} from "@/lib/subscriptions.server";

export const runtime = "nodejs";

/**
 * The signed-in user's monthly plans, for Settings and the credits page.
 *
 * Also the safety net under the webhook: a live plan whose paid month has run
 * out is checked against Razorpay first, so a renewal whose webhook never
 * arrived is credited the next time the customer looks.
 */
export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const db = createAdminSupabase();
  const load = async () => {
    const { data, error: dbErr } = await db.from("subscriptions").select("*")
      .eq("user_id", session!.userId).neq("status", "created")
      .order("created_at", { ascending: false }) as { data: SubscriptionRow[] | null; error: { message: string } | null };
    return dbErr ? null : (data || []);
  };

  let rows = await load();
  if (rows === null) return NextResponse.json({ plans: [], available: false });

  const due = rows.filter((r) =>
    LIVE_STATUSES.includes(r.status) && (!r.credits_expire_at || new Date(r.credits_expire_at).getTime() <= Date.now())
  ).slice(0, 3);
  const rzp = due.length ? razorpayClient() : null;
  if (rzp && due.length) {
    await Promise.all(due.map((r) => syncFromRazorpay(r, rzp).catch((e) =>
      console.warn(`[subscriptions] sync ${r.razorpay_subscription_id}:`, (e as Error).message))));
  }
  await expireLapsed(session!.userId).catch(() => {});
  if (due.length) rows = (await load()) || rows;

  const plans = rows.map(planView).filter((p) => !p.ended || p.creditsLeft > 0);
  return NextResponse.json({ plans, available: true });
}
