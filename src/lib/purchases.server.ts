import Razorpay from "razorpay";
import { financialYear, invoiceNumber, type Purchase } from "@/lib/invoice";
import { PACK_BY_ID } from "@/lib/plans";

/**
 * purchases.server.ts — who bought what, read from Razorpay.
 *
 * The `purchases` table is where verify-payment writes a sale, and until it is
 * created every buyer sees "Purchase history is not available yet" in place of
 * the invoice they paid for. Worse, it is also what tells a paid balance apart
 * from a granted one, so its absence blocks the credit cleanup too.
 *
 * Razorpay is the system of record for a payment in a way our own table never
 * is: the money moved there. create-order already writes the buyer's id, the
 * plan and the credit count into the order's notes, so every sale can be
 * reconstructed from the gateway with nothing stored locally at all. That is
 * what this does — the table becomes an optimisation rather than a prerequisite.
 *
 * Server-only: it uses the Razorpay secret. Never import it into a client
 * component.
 */

interface RzpOrder {
  id: string;
  amount: number;
  status: string;
  created_at: number;
  notes?: Record<string, string | number | null>;
}

interface RzpPayment {
  id: string;
  status: string;
  amount: number;
  created_at: number;
}

function client(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

/**
 * Every paid order, oldest first.
 *
 * Fetched in full rather than filtered by user, because the invoice number has
 * to be sequential across all customers within the financial year — a per-user
 * count would hand the same number to two different buyers. At this volume that
 * is a handful of requests; the page cap stops it growing without bound.
 */
const PAGE = 100;
const MAX_PAGES = 10;

async function allPaidOrders(rzp: Razorpay): Promise<RzpOrder[]> {
  const out: RzpOrder[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await rzp.orders.all({ count: PAGE, skip: page * PAGE }) as unknown as { items?: RzpOrder[] };
    const items = res?.items || [];
    out.push(...items.filter((o) => o.status === "paid"));
    if (items.length < PAGE) break;
  }
  return out.sort((a, b) => a.created_at - b.created_at);
}

/**
 * The purchases Razorpay knows about for one user.
 *
 * Returns [] rather than throwing when the gateway is unreachable or
 * unconfigured: this backs a page that must still render, and a missing
 * receipt is not worth a 500.
 */
export async function razorpayPurchases(userId: string): Promise<Purchase[]> {
  const rzp = client();
  if (!rzp) return [];

  let orders: RzpOrder[];
  try {
    orders = await allPaidOrders(rzp);
  } catch (e) {
    console.error("[purchases] could not list Razorpay orders:", (e as Error).message);
    return [];
  }

  // Sequence numbers are assigned over every buyer's orders, then only this
  // user's are kept — so the number a customer sees matches the one the books
  // would give it.
  const seqByFy = new Map<string, number>();
  const mine: { order: RzpOrder; invoiceNo: string }[] = [];

  for (const order of orders) {
    const when = new Date(order.created_at * 1000);
    const fy = financialYear(when);
    const seq = (seqByFy.get(fy) ?? 0) + 1;
    seqByFy.set(fy, seq);
    if (String(order.notes?.userId || "") === userId) {
      mine.push({ order, invoiceNo: invoiceNumber(seq, when) });
    }
  }

  const rows: Purchase[] = [];
  for (const { order, invoiceNo } of mine) {
    let payment: RzpPayment | undefined;
    try {
      const res = await rzp.orders.fetchPayments(order.id) as unknown as { items?: RzpPayment[] };
      payment = (res?.items || []).find((p) => p.status === "captured")
        || (res?.items || []).find((p) => p.status === "authorized");
    } catch (e) {
      console.warn(`[purchases] no payments for order ${order.id}:`, (e as Error).message);
    }
    // A paid order always has one; without its id there is nothing to address
    // the invoice by, so it is skipped rather than shown as a broken link.
    if (!payment) continue;

    const plan = String(order.notes?.plan || "");
    const noted = Number(order.notes?.credits);
    rows.push({
      user_id: userId,
      razorpay_order_id: order.id,
      razorpay_payment_id: payment.id,
      plan,
      credits_added: Number.isFinite(noted) ? noted : (PACK_BY_ID[plan]?.credits ?? 0),
      amount_paise: payment.amount ?? order.amount,
      invoice_no: invoiceNo,
      created_at: new Date(order.created_at * 1000).toISOString(),
    });
  }

  return rows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

/**
 * What each account has actually paid for: total credits bought, and the id of
 * the most recent pack.
 *
 * One pass over every paid order rather than a lookup per user, so checking a
 * few hundred profiles costs the same handful of requests as checking one.
 * Returns null when Razorpay cannot be reached or is not configured — which the
 * caller must treat as "unknown", never as "nobody has paid", because acting on
 * the second would clear balances people bought.
 */
export async function purchasedByUser(): Promise<Map<string, { credits: number; plan: string }> | null> {
  const rzp = client();
  if (!rzp) return null;

  let orders: RzpOrder[];
  try {
    orders = await allPaidOrders(rzp);
  } catch (e) {
    console.error("[purchases] could not list Razorpay orders:", (e as Error).message);
    return null;
  }

  const out = new Map<string, { credits: number; plan: string }>();
  for (const order of orders) {
    const userId = String(order.notes?.userId || "");
    if (!userId) continue;
    const plan = String(order.notes?.plan || "");
    const noted = Number(order.notes?.credits);
    const credits = Number.isFinite(noted) ? noted : (PACK_BY_ID[plan]?.credits ?? 0);
    const prev = out.get(userId);
    // Orders arrive oldest first, so the last plan seen is the latest one.
    out.set(userId, { credits: (prev?.credits ?? 0) + credits, plan: plan || prev?.plan || "" });
  }
  return out;
}

/** True if this account has ever paid for anything. */
export async function hasPaid(userId: string): Promise<boolean> {
  return (await razorpayPurchases(userId)).length > 0;
}

/**
 * Merges what the table has with what Razorpay has, keyed by payment id.
 *
 * The table wins where both hold the same payment — it carries the invoice
 * number that was issued at the time, and re-deriving one could disagree with a
 * receipt the customer already has. Razorpay fills in everything the table is
 * missing, which is every sale when the table does not exist and any sale whose
 * row failed to write.
 */
export function mergePurchases(fromTable: Purchase[], fromGateway: Purchase[]): Purchase[] {
  const byPayment = new Map<string, Purchase>();
  for (const p of fromGateway) byPayment.set(p.razorpay_payment_id, p);
  for (const p of fromTable) byPayment.set(p.razorpay_payment_id, p);
  return Array.from(byPayment.values()).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}
