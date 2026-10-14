import Razorpay from "razorpay";
import { createAdminSupabase } from "@/lib/auth";
import { MONTHLY_BY_ID, PACK_BY_ID, formatInr, inrPaise, type Pack } from "@/lib/plans";
import { recordCredits } from "@/lib/ledger";
import { financialYear, invoiceNumber } from "@/lib/invoice";
import { monthlyBuckets, sumBuckets } from "@/lib/credit-buckets.server";

/**
 * subscriptions.server.ts — monthly plans, on Razorpay Subscriptions.
 *
 * The life of a plan:
 *
 *   create   /api/subscriptions/create makes a Razorpay subscription (and the
 *            Razorpay plan behind it, the first time a price is sold) and a
 *            `created` row here.
 *   pay      Razorpay Checkout opens with the subscription id. The first month
 *            is charged straight away; /api/subscriptions/verify checks the
 *            signature and applyCharge() grants the month's credits.
 *   renew    Razorpay charges the card each month and sends
 *            `subscription.charged` to /api/razorpay/webhook → applyCharge().
 *            If a webhook is ever missed, syncFromRazorpay() finds the paid
 *            invoice the next time the user's plans are listed.
 *   cancel   /api/subscriptions/cancel asks Razorpay to cancel at the end of
 *            the paid month. Nothing more is charged; the month's credits stay
 *            usable until it ends.
 *
 * Every charge goes through applyCharge(), which claims the payment in
 * public.purchases (unique razorpay_payment_id) before it moves any credits.
 * That is what makes the checkout handler and the webhook — which both see the
 * first payment — safe to run in either order, or twice.
 */

export class SubscriptionsUnavailable extends Error {}

export function razorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export interface SubscriptionRow {
  id: number;
  user_id: string;
  plan: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
  status: string;
  credits_per_cycle: number;
  amount_paise: number;
  credits_remaining: number;
  credits_expire_at: string | null;
  current_start: string | null;
  current_end: string | null;
  cancel_at_cycle_end: boolean;
  cancelled_at: string | null;
  created_at: string;
}

/** Statuses in which a plan is still the customer's, and may still renew. */
export const LIVE_STATUSES = ["authenticated", "active", "pending", "halted", "paused"];

const iso = (unix?: number | null): string | null => (unix ? new Date(unix * 1000).toISOString() : null);

/** One calendar month after `from`, for the rare charge that arrives without its period. */
function monthAfter(from: Date): string {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

/**
 * The Razorpay plan for a monthly pack, created the first time it is sold.
 *
 * Keyed by price as well as id, so changing a price in lib/plans.ts makes a
 * new Razorpay plan and existing subscribers stay on the one they agreed to.
 */
export async function razorpayPlanId(rzp: Razorpay, plan: Pack): Promise<string> {
  const db = createAdminSupabase();
  const key = `${plan.id}:${inrPaise(plan)}:INR`;
  const read = async () => {
    const { data, error } = await db.from("razorpay_plans").select("razorpay_plan_id").eq("key", key).maybeSingle() as
      { data: { razorpay_plan_id: string } | null; error: { message: string } | null };
    if (error) throw new SubscriptionsUnavailable(`razorpay_plans: ${error.message}`);
    return data?.razorpay_plan_id ?? null;
  };

  const known = await read();
  if (known) return known;

  const created = await rzp.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `Pixel Shine ${plan.label} — ${plan.credits} credits a month`,
      amount: inrPaise(plan),
      currency: "INR",
      description: `${plan.credits} AI credits every month (${plan.generations} generations).`,
    },
    notes: { plan: plan.id, credits: String(plan.credits) },
  });
  await db.from("razorpay_plans").upsert({ key, razorpay_plan_id: created.id }, { onConflict: "key", ignoreDuplicates: true });
  // Two first sales at once: both made a plan, one was stored. Use that one.
  return (await read()) || created.id;
}

/** The user's spendable total after a change: add-on balance + live monthly credits. */
async function totalCredits(userId: string): Promise<number> {
  const db = createAdminSupabase();
  const { data } = await db.from("profiles").select("credits").eq("id", userId).maybeSingle() as { data: { credits: number } | null };
  return (data?.credits ?? 0) + sumBuckets(await monthlyBuckets(db, userId));
}

/** Invoice number for a new purchase row: sequential within the Indian financial year. */
async function nextInvoiceNo(now: Date): Promise<string | null> {
  try {
    const db = createAdminSupabase();
    const fy = financialYear(now);
    const yearStart = new Date(Date.UTC(Number(fy.slice(0, 4)), 3, 1)).toISOString();
    const { count } = await db.from("purchases").select("id", { count: "exact", head: true }).gte("created_at", yearStart);
    return invoiceNumber((count ?? 0) + 1, now);
  } catch (e) {
    console.warn("[subscriptions] could not number the invoice:", (e as Error).message);
    return null;
  }
}

export interface Charge {
  paymentId: string;
  orderId?: string | null;
  amountPaise: number;
  /** The paid period, from Razorpay (unix seconds). */
  periodStart?: number | null;
  periodEnd?: number | null;
  /** The subscription's status as Razorpay reports it with this charge. */
  status?: string | null;
}

/**
 * Grants one paid month. Exactly once per payment.
 *
 * Returns false, and moves nothing, when the payment was already applied.
 * Throws when the claim cannot be written for any other reason, so a webhook
 * caller answers 500 and Razorpay retries.
 */
export async function applyCharge(sub: SubscriptionRow, charge: Charge): Promise<boolean> {
  const db = createAdminSupabase();
  const now = new Date();
  const invoiceNo = await nextInvoiceNo(now);

  // 1. Claim the payment. The unique payment id is the lock.
  const { data: purchase, error: claimErr } = await db.from("purchases").insert({
    user_id: sub.user_id,
    razorpay_order_id: charge.orderId ?? null,
    razorpay_payment_id: charge.paymentId,
    razorpay_subscription_id: sub.razorpay_subscription_id,
    plan: sub.plan,
    credits_added: sub.credits_per_cycle,
    amount_paise: charge.amountPaise,
    ...(invoiceNo ? { invoice_no: invoiceNo } : {}),
  }).select("id").single() as { data: { id: number } | null; error: { code?: string; message: string } | null };

  if (claimErr) {
    if (claimErr.code === "23505" && /payment/i.test(claimErr.message)) return false; // already applied
    if (claimErr.code === "23505") {
      // The invoice number collided with a concurrent purchase: claim without one.
      const retry = await db.from("purchases").insert({
        user_id: sub.user_id,
        razorpay_order_id: charge.orderId ?? null,
        razorpay_payment_id: charge.paymentId,
        razorpay_subscription_id: sub.razorpay_subscription_id,
        plan: sub.plan,
        credits_added: sub.credits_per_cycle,
        amount_paise: charge.amountPaise,
      }).select("id").single() as { data: { id: number } | null; error: { code?: string; message: string } | null };
      if (retry.error?.code === "23505") return false;
      if (retry.error) throw new Error(`purchase claim failed: ${retry.error.message}`);
      return grant(sub, charge, retry.data?.id ?? null, now);
    }
    throw new Error(`purchase claim failed: ${claimErr.message}`);
  }

  return grant(sub, charge, purchase?.id ?? null, now);
}

async function grant(sub: SubscriptionRow, charge: Charge, purchaseId: number | null, now: Date): Promise<boolean> {
  const db = createAdminSupabase();

  // 2. Last month's leftover lapses: monthly credits reset, they do not carry over.
  const { data: fresh } = await db.from("subscriptions").select("credits_remaining").eq("id", sub.id).single() as
    { data: { credits_remaining: number } | null };
  const leftover = fresh?.credits_remaining ?? 0;

  const expireAt = iso(charge.periodEnd) || monthAfter(now);
  const { error } = await db.from("subscriptions").update({
    credits_remaining: sub.credits_per_cycle,
    credits_expire_at: expireAt,
    current_start: iso(charge.periodStart) || now.toISOString(),
    current_end: expireAt,
    status: charge.status || "active",
    updated_at: now.toISOString(),
  }).eq("id", sub.id);
  if (error) throw new Error(`subscription ${sub.id} not credited: ${error.message}`);

  const total = await totalCredits(sub.user_id);
  if (leftover > 0) {
    await recordCredits({
      userId: sub.user_id, delta: -leftover, balanceAfter: total - sub.credits_per_cycle,
      reason: "expired", note: `${sub.plan} · unused monthly credits · ${sub.razorpay_subscription_id}`,
    });
  }
  // 3. And the new month's credits, as a ledger entry pointing at the purchase.
  await recordCredits({
    userId: sub.user_id, delta: sub.credits_per_cycle, balanceAfter: total,
    reason: "subscription", purchaseId,
    note: `${sub.plan} · ${charge.paymentId} · until ${expireAt.slice(0, 10)}`,
  });
  return true;
}

/**
 * Brings a row up to date with Razorpay, and applies any paid month we never
 * heard about. The safety net under the webhook: called when the user's plans
 * are listed and a live plan's month has run out.
 */
export async function syncFromRazorpay(sub: SubscriptionRow, rzp: Razorpay): Promise<void> {
  const db = createAdminSupabase();
  const remote = await rzp.subscriptions.fetch(sub.razorpay_subscription_id) as unknown as {
    status: string; current_start?: number | null; current_end?: number | null;
  };

  // Paid invoices we have no purchase row for, oldest first.
  const res = await rzp.invoices.all({ subscription_id: sub.razorpay_subscription_id, count: 24 } as never) as unknown as {
    items?: { payment_id?: string | null; status: string; amount_paid?: number; amount?: number; order_id?: string | null; billing_start?: number | null; billing_end?: number | null; paid_at?: number | null }[];
  };
  const paid = (res.items || []).filter((i) => i.status === "paid" && i.payment_id)
    .sort((a, b) => (a.paid_at ?? 0) - (b.paid_at ?? 0));
  if (paid.length) {
    const { data: known } = await db.from("purchases").select("razorpay_payment_id")
      .in("razorpay_payment_id", paid.map((i) => i.payment_id!)) as { data: { razorpay_payment_id: string }[] | null };
    const seen = new Set((known || []).map((k) => k.razorpay_payment_id));
    for (const inv of paid) {
      if (seen.has(inv.payment_id!)) continue;
      await applyCharge(sub, {
        paymentId: inv.payment_id!, orderId: inv.order_id ?? null,
        amountPaise: inv.amount_paid ?? inv.amount ?? sub.amount_paise,
        periodStart: inv.billing_start, periodEnd: inv.billing_end, status: remote.status,
      });
    }
  }

  await db.from("subscriptions").update({
    status: remote.status,
    current_start: iso(remote.current_start) ?? sub.current_start,
    current_end: iso(remote.current_end) ?? sub.current_end,
    updated_at: new Date().toISOString(),
  }).eq("id", sub.id);
}

/**
 * Writes off monthly credits whose month has ended, so the ledger shows where
 * they went. Spending already ignores them (monthlyBuckets filters on
 * credits_expire_at); this only zeroes the row and records the movement.
 */
export async function expireLapsed(userId: string): Promise<void> {
  const db = createAdminSupabase();
  const { data } = await db.from("subscriptions").select("id, plan, credits_remaining, razorpay_subscription_id")
    .eq("user_id", userId).gt("credits_remaining", 0).lte("credits_expire_at", new Date().toISOString()) as
    { data: { id: number; plan: string; credits_remaining: number; razorpay_subscription_id: string }[] | null };
  for (const row of data || []) {
    const { data: done } = await db.from("subscriptions").update({ credits_remaining: 0, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("credits_remaining", row.credits_remaining).select("id") as { data: { id: number }[] | null };
    if (!done?.length) continue;
    await recordCredits({
      userId, delta: -row.credits_remaining, balanceAfter: await totalCredits(userId),
      reason: "expired", note: `${row.plan} · unused monthly credits · ${row.razorpay_subscription_id}`,
    });
  }
}

/** What the settings page shows for one plan. */
export interface PlanView {
  id: number;
  plan: string;
  label: string;
  credits: number;
  inr: string;
  status: string;
  creditsLeft: number;
  /** The paid month runs until this date. */
  activeUntil: string | null;
  /** The next charge, or null when none is coming. */
  renewsOn: string | null;
  cancelling: boolean;
  /** No longer the customer's: cancelled and past its month, completed, or expired. */
  ended: boolean;
}

export function planView(row: SubscriptionRow): PlanView {
  const pack = MONTHLY_BY_ID[row.plan] || PACK_BY_ID[row.plan];
  const now = Date.now();
  const expires = row.credits_expire_at ? new Date(row.credits_expire_at).getTime() : 0;
  const live = LIVE_STATUSES.includes(row.status);
  const ended = !live && !(expires > now);
  return {
    id: row.id,
    plan: row.plan,
    label: pack?.label || row.plan,
    credits: row.credits_per_cycle,
    inr: formatInr(Math.round(row.amount_paise / 100)),
    status: row.status,
    creditsLeft: expires > now ? row.credits_remaining : 0,
    activeUntil: row.credits_expire_at,
    renewsOn: live && !row.cancel_at_cycle_end && row.status !== "halted" ? (row.current_end || row.credits_expire_at) : null,
    cancelling: row.cancel_at_cycle_end || (row.status === "cancelled" && expires > now),
    ended,
  };
}
