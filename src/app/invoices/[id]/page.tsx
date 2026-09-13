import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { buildInvoice, rupees, invoiceDate, type Purchase } from "@/lib/invoice";
import { razorpayPurchases } from "@/lib/purchases.server";
import PrintButton from "./PrintButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice — Pixel Shine",
  robots: { index: false, follow: false },
};

/**
 * One invoice, addressed by its Razorpay payment id.
 *
 * Read with the visitor's own session, never the service role: the row comes
 * back only if the database agrees it belongs to them, so a guessed payment id
 * in the URL returns nothing rather than someone else's name and email.
 */
async function loadInvoice(paymentId: string) {
  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("purchases")
    .select("id, user_id, razorpay_order_id, razorpay_payment_id, plan, credits_added, amount_paise, invoice_no, created_at")
    .eq("razorpay_payment_id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  /*
    No row is not the same as no purchase.

    The table may not exist, or the row may have failed to write after a payment
    that did go through. Razorpay is asked before giving up — and the same
    ownership rule holds there, because razorpayPurchases only returns orders
    whose notes name this user, so a guessed payment id still finds nothing.
  */
  const purchase = (data as Purchase | null)
    || (await razorpayPurchases(user.id)).find((p) => p.razorpay_payment_id === paymentId)
    || null;

  if (!purchase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle() as { data: { name?: string; email?: string } | null };

  return buildInvoice(purchase, {
    name: profile?.name || (user.user_metadata?.name as string | undefined),
    email: profile?.email || user.email || undefined,
  });
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await loadInvoice(id);
  if (!inv) notFound();

  const label: React.CSSProperties = { fontSize: 11, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "#6b7280" };
  const value: React.CSSProperties = { fontSize: 14, color: "#111827", lineHeight: 1.65 };
  const cell: React.CSSProperties = { padding: "12px 14px", fontSize: 14, color: "#111827", borderBottom: "1px solid #e5e7eb" };
  const head: React.CSSProperties = { ...cell, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", background: "#f9fafb" };

  return (
    <main style={{ background: "var(--bg)", minHeight: "80vh", padding: "32px 16px 72px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Controls, dropped from the printed sheet by the rule in globals.css */}
        <div className="jpt-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <Link href="/invoices" style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>← All invoices</Link>
          <PrintButton />
        </div>

        {/*
          Deliberately on white with dark type, whatever the site theme is. This
          page is printed and filed; a dark receipt wastes ink and photocopies
          badly, so the colours here are literal rather than themed.
        */}
        <article
          id="jpt-invoice"
          style={{ background: "#fff", color: "#111827", borderRadius: 14, padding: "36px 34px", boxShadow: "var(--shadow-lg)" }}
        >
          <header style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", borderBottom: "2px solid #111827", paddingBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>{inv.seller.name}</div>
              {inv.seller.address && (
                <div style={{ ...value, color: "#374151", whiteSpace: "pre-line", marginTop: 6, maxWidth: 320 }}>{inv.seller.address}</div>
              )}
              {inv.seller.email && <div style={{ ...value, color: "#374151" }}>{inv.seller.email}</div>}
              {inv.seller.gstin && <div style={{ ...value, color: "#374151", marginTop: 6 }}>GSTIN: {inv.seller.gstin}</div>}
              {inv.seller.pan && <div style={{ ...value, color: "#374151" }}>PAN: {inv.seller.pan}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {inv.tax ? "Tax invoice" : "Invoice"}
              </div>
              <div style={{ ...value, marginTop: 8 }}><strong>{inv.number}</strong></div>
              <div style={{ ...value, color: "#374151" }}>{invoiceDate(inv.date)}</div>
            </div>
          </header>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: "22px 0" }}>
            <div>
              <div style={label}>Billed to</div>
              <div style={{ ...value, marginTop: 6 }}>
                {inv.buyer.name && <div style={{ fontWeight: 700 }}>{inv.buyer.name}</div>}
                {inv.buyer.email && <div style={{ color: "#374151" }}>{inv.buyer.email}</div>}
              </div>
            </div>
            <div>
              <div style={label}>Payment</div>
              <div style={{ ...value, marginTop: 6, color: "#374151" }}>
                <div>Razorpay · {inv.paymentId}</div>
                <div>Order {inv.orderId}</div>
              </div>
            </div>
          </section>

          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={{ ...head, textAlign: "left" }}>Description</th>
                <th style={{ ...head, textAlign: "right", width: 60 }}>Qty</th>
                <th style={{ ...head, textAlign: "right", width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i}>
                  <td style={cell}>{l.description}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{l.qty}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{rupees(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section style={{ display: "flex", justifyContent: "flex-end", paddingTop: 18 }}>
            <div style={{ width: "min(320px, 100%)" }}>
              {inv.tax && (
                <>
                  <Row k="Taxable value" v={rupees(inv.tax.taxable)} />
                  <Row k={`CGST @ ${inv.tax.rate / 2}%`} v={rupees(inv.tax.cgst)} />
                  <Row k={`SGST @ ${inv.tax.rate / 2}%`} v={rupees(inv.tax.sgst)} />
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0 0", marginTop: 8, borderTop: "2px solid #111827", fontSize: 17, fontWeight: 900 }}>
                <span>Total paid</span>
                <span>{rupees(inv.total)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "right" }}>
                {inv.tax ? "Amounts are inclusive of GST." : "No GST charged."}
              </div>
            </div>
          </section>

          <footer style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid #e5e7eb", fontSize: 12.5, color: "#6b7280", lineHeight: 1.75 }}>
            <div>Paid in full — this is a receipt, no payment is due.</div>
            <div>
              Credit packs are one-off purchases and the credits do not expire. Digital goods, delivered instantly to the
              account above; see the refund policy on the website.
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "5px 0", fontSize: 14, color: "#374151" }}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
