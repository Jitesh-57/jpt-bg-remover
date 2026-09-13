/**
 * invoice.ts — the receipt a buyer gets for a credit pack.
 *
 * Razorpay's Checkout flow (Orders + the checkout modal) does not produce an
 * invoice; its Invoices API is a different product, where Razorpay raises the
 * document and emails a payment link. We take the payment first and issue the
 * document ourselves, which is the right way round for a self-serve purchase.
 *
 * Everything identifying the seller comes from the environment rather than
 * being written into the code, because a receipt carries legal identity: a
 * business name, an address, and — where the seller is registered — a GSTIN.
 * Inventing any of those would put false particulars on a document a customer
 * may file. Unset fields are omitted rather than guessed, and the tax block
 * only appears when a GSTIN is configured.
 */

import { PACK_BY_ID, type Pack } from "@/lib/plans";

export interface Seller {
  name: string;
  address?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  /** Percent, e.g. 18. Only meaningful alongside a GSTIN. */
  gstRate?: number;
  /** The state the seller is registered in, for place-of-supply. */
  state?: string;
}

const trimmed = (v: string | undefined) => {
  const t = (v || "").trim();
  return t || undefined;
};

export function seller(): Seller {
  const rate = Number(process.env.INVOICE_GST_RATE || "");
  return {
    name: trimmed(process.env.INVOICE_SELLER_NAME) || "Pixel Shine",
    address: trimmed(process.env.INVOICE_SELLER_ADDRESS),
    email: trimmed(process.env.INVOICE_SELLER_EMAIL),
    gstin: trimmed(process.env.INVOICE_SELLER_GSTIN),
    pan: trimmed(process.env.INVOICE_SELLER_PAN),
    gstRate: Number.isFinite(rate) && rate > 0 ? rate : undefined,
    state: trimmed(process.env.INVOICE_SELLER_STATE),
  };
}

/**
 * The Indian financial year a date falls in, as "2026-27".
 *
 * Invoice numbering restarts each financial year, which runs April to March —
 * so a January payment belongs to the year that began the previous April.
 */
export function financialYear(d: Date): string {
  const y = d.getUTCFullYear();
  const startYear = d.getUTCMonth() >= 3 ? y : y - 1; // months are 0-based; 3 = April
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** e.g. "PS/2026-27/0007". */
export function invoiceNumber(seq: number, when: Date): string {
  const prefix = trimmed(process.env.INVOICE_NUMBER_PREFIX) || "PS";
  return `${prefix}/${financialYear(when)}/${String(seq).padStart(4, "0")}`;
}

export interface Purchase {
  id?: string | number;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  plan: string;
  credits_added: number;
  amount_paise: number;
  invoice_no?: string | null;
  created_at?: string;
}

export interface Buyer {
  name?: string;
  email?: string;
}

export interface InvoiceLine {
  description: string;
  qty: number;
  /** Rupees. */
  rate: number;
  amount: number;
}

export interface Invoice {
  number: string;
  date: Date;
  seller: Seller;
  buyer: Buyer;
  paymentId: string;
  orderId: string;
  lines: InvoiceLine[];
  /** Rupees. What the customer was charged. */
  total: number;
  /**
   * Present only when a GSTIN is configured.
   *
   * The listed price is what the customer pays, so it is treated as inclusive
   * and the tax is backed out of it — charging the rate on top would mean
   * billing more than the page quoted.
   */
  tax?: { rate: number; taxable: number; amount: number; cgst: number; sgst: number };
}

export function buildInvoice(p: Purchase, buyer: Buyer): Invoice {
  const pack: Pack | undefined = PACK_BY_ID[p.plan];
  const total = p.amount_paise / 100;
  const date = p.created_at ? new Date(p.created_at) : new Date();
  const s = seller();

  const description = pack
    ? `${pack.label} credit pack — ${pack.credits} AI credits (${pack.generations} generations)`
    : `Credit pack — ${p.credits_added} AI credits`;

  const invoice: Invoice = {
    number: p.invoice_no || invoiceNumber(0, date),
    date,
    seller: s,
    buyer,
    paymentId: p.razorpay_payment_id,
    orderId: p.razorpay_order_id,
    lines: [{ description, qty: 1, rate: total, amount: total }],
    total,
  };

  if (s.gstin && s.gstRate) {
    const taxable = round2((total * 100) / (100 + s.gstRate));
    const amount = round2(total - taxable);
    /*
      The halves are split so they add back to the whole.

      Rounding each half independently loses a paisa whenever the tax is an odd
      number of them: ₹415 at 18% gives ₹63.31 of tax, and 31.655 rounded twice
      is 31.66 + 31.66 = ₹63.32, so the invoice footed to ₹415.01 against a
      ₹415.00 payment. One half is rounded and the other is the remainder.
    */
    const cgst = round2(amount / 2);
    invoice.tax = {
      rate: s.gstRate,
      taxable,
      amount,
      cgst,
      sgst: round2(amount - cgst),
    };
  }

  return invoice;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "₹1,234.00" — grouped the Indian way. */
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function invoiceDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
