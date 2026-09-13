import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PACK_BY_ID } from "@/lib/plans";
import { rupees, invoiceDate, type Purchase } from "@/lib/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your invoices — Pixel Shine",
  description: "Every credit pack you have bought, with a printable invoice for each.",
  robots: { index: false, follow: false },
};

/**
 * The buyer's own purchase history.
 *
 * Read with the visitor's own session rather than the service role, so the
 * rows they can see are the rows the database says are theirs. An invoice
 * carries a name, an email address and a payment reference; it must not be
 * possible to reach someone else's by changing a number in the URL.
 */
async function purchasesForUser(): Promise<{ rows: Purchase[]; signedIn: boolean; tableMissing: boolean }> {
  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rows: [], signedIn: false, tableMissing: false };

  const { data, error } = await supabase
    .from("purchases")
    .select("id, user_id, razorpay_order_id, razorpay_payment_id, plan, credits_added, amount_paise, invoice_no, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 42P01 is "relation does not exist" — the table has not been created yet.
  const tableMissing = !!error && /does not exist|schema cache/i.test(error.message);
  if (error && !tableMissing) console.error("[invoices] query failed:", error.message);

  return { rows: (data as Purchase[]) || [], signedIn: true, tableMissing };
}

export default async function InvoicesPage() {
  const { rows, signedIn, tableMissing } = await purchasesForUser();

  const shell = (children: React.ReactNode) => (
    <main style={{ background: "var(--bg)", minHeight: "70vh", padding: "56px 24px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          Your invoices
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.7 }}>
          One for every credit pack you have bought. Credits never expire, so these are one-off purchases — there is nothing recurring to cancel.
        </p>
        {children}
      </div>
    </main>
  );

  if (!signedIn) {
    return shell(
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 24px", color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7 }}>
        Sign in to see your purchases. <Link href="/pricing" style={{ color: "var(--accent)", fontWeight: 700 }}>View the credit packs →</Link>
      </div>
    );
  }

  if (tableMissing) {
    return shell(
      <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-soft)", borderRadius: 16, padding: "22px 24px", color: "var(--danger)", fontSize: 14.5, lineHeight: 1.7 }}>
        Purchase history is not available yet — the <code>purchases</code> table has not been created.
        See <code>docs/invoices.md</code> for the one-off SQL that creates it.
      </div>
    );
  }

  if (!rows.length) {
    return shell(
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 24px", color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7 }}>
        No purchases yet. The browser tools are free and unlimited; the AI apps run on credits.{" "}
        <Link href="/pricing" style={{ color: "var(--accent)", fontWeight: 700 }}>See the packs →</Link>
      </div>
    );
  }

  return shell(
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((p) => {
        const pack = PACK_BY_ID[p.plan];
        const when = p.created_at ? invoiceDate(new Date(p.created_at)) : "—";
        return (
          <div
            key={String(p.id ?? p.razorpay_payment_id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>
                {pack ? `${pack.label} pack` : "Credit pack"} · {p.credits_added} credits
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                {when}
                {p.invoice_no && <> · Invoice {p.invoice_no}</>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text)" }}>{rupees(p.amount_paise / 100)}</span>
              <Link
                href={`/invoices/${encodeURIComponent(p.razorpay_payment_id)}`}
                style={{ padding: "9px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--accent)", fontWeight: 800, fontSize: 14, textDecoration: "none" }}
              >
                View invoice
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
