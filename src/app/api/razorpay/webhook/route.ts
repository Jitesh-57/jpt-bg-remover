import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminSupabase } from "@/lib/auth";
import { PACK_BY_ID, inrPaise } from "@/lib/plans";
import { applyCharge, type SubscriptionRow } from "@/lib/subscriptions.server";

export const runtime = "nodejs";

/**
 * Razorpay webhooks, for monthly plans.
 *
 * Set up in Razorpay → Settings → Webhooks: this URL, the subscription.*
 * events, and a secret that also goes into RAZORPAY_WEBHOOK_SECRET. See
 * docs/subscriptions.md.
 *
 *   subscription.charged   a month was paid → applyCharge() grants its credits
 *   everything else        the plan's status and period are kept in step
 *
 * Answers 500 when something could not be written, so Razorpay retries; the
 * charge is claimed by payment id, so a retry never credits twice.
 */

interface RzpSubscription {
  id: string; status: string; plan_id?: string;
  current_start?: number | null; current_end?: number | null;
  notes?: Record<string, string> | string[];
}
interface RzpPayment { id: string; amount: number; order_id?: string | null; status?: string }

const iso = (unix?: number | null) => (unix ? new Date(unix * 1000).toISOString() : null);

function validSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Our row for a Razorpay subscription — or, if creating it failed earlier, one rebuilt from the notes it carries. */
async function findOrAdopt(remote: RzpSubscription): Promise<SubscriptionRow | null> {
  const db = createAdminSupabase();
  const { data } = await db.from("subscriptions").select("*").eq("razorpay_subscription_id", remote.id).maybeSingle() as
    { data: SubscriptionRow | null };
  if (data) return data;

  const notes = (Array.isArray(remote.notes) ? {} : remote.notes || {}) as Record<string, string>;
  // Any monthly plan ever sold, not only today's: a subscription started on a
  // plan that has since been replaced still renews on it.
  const found = PACK_BY_ID[notes.plan || ""];
  const plan = found?.monthly ? found : undefined;
  if (!plan || !notes.userId) return null;
  const { data: made, error } = await db.from("subscriptions").insert({
    user_id: notes.userId,
    plan: plan.id,
    razorpay_subscription_id: remote.id,
    razorpay_plan_id: remote.plan_id || "",
    status: remote.status,
    credits_per_cycle: plan.credits,
    amount_paise: inrPaise(plan),
  }).select("*").single() as { data: SubscriptionRow | null; error: { message: string } | null };
  if (error) {
    // Another delivery adopted it first.
    const { data: again } = await db.from("subscriptions").select("*").eq("razorpay_subscription_id", remote.id).maybeSingle() as
      { data: SubscriptionRow | null };
    return again;
  }
  return made;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { subscription?: { entity?: RzpSubscription }; payment?: { entity?: RzpPayment } } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }

  const name = event.event || "";
  const remote = event.payload?.subscription?.entity;
  if (!name.startsWith("subscription.") || !remote?.id) return NextResponse.json({ ok: true, ignored: name });

  try {
    const sub = await findOrAdopt(remote);
    if (!sub) {
      console.warn(`[razorpay/webhook] ${name} for unknown subscription ${remote.id}`);
      return NextResponse.json({ ok: true, ignored: "unknown subscription" });
    }

    if (name === "subscription.charged") {
      const payment = event.payload?.payment?.entity;
      if (!payment?.id) return NextResponse.json({ ok: true, ignored: "no payment" });
      const applied = await applyCharge(sub, {
        paymentId: payment.id,
        orderId: payment.order_id ?? null,
        amountPaise: payment.amount,
        periodStart: remote.current_start,
        periodEnd: remote.current_end,
        status: remote.status,
      });
      return NextResponse.json({ ok: true, applied });
    }

    const db = createAdminSupabase();
    const { error } = await db.from("subscriptions").update({
      status: remote.status,
      current_start: iso(remote.current_start) ?? sub.current_start,
      current_end: iso(remote.current_end) ?? sub.current_end,
      ...(remote.status === "cancelled" && !sub.cancelled_at ? { cancelled_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", sub.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[razorpay/webhook] ${name} ${remote.id}:`, (e as Error).message);
    return NextResponse.json({ error: "not processed" }, { status: 500 });
  }
}
