import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Clears credits nobody paid for.
 *
 * Closing the signup grant stopped new accounts getting free AI generations,
 * but it could not touch the balances already handed out — and an account
 * holding those is, as far as every gate is concerned, a paying customer. That
 * is why AI generation still worked on an account that had never bought
 * anything: not a hole in the gate, a leftover in the data.
 *
 * "Paid for" means a row in `purchases`. Anyone with one is left completely
 * alone, balance and plan intact; the reset only touches profiles with credits
 * and no purchase behind them.
 *
 *   GET /api/admin/reset-free-credits?token=…          what would change
 *   GET /api/admin/reset-free-credits?token=…&apply=1  change it
 *
 * Dry by default, because this spends nothing but cannot be undone: the
 * previous balances are only in the response, so read it before applying.
 */
const TOKEN = process.env.ADMIN_IMAGE_TOKEN || "jptblog2026";

interface ProfileRow { id: string; email?: string | null; credits: number | null; plan?: string | null }

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if ((q.get("token") || "").trim() !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apply = q.get("apply") === "1";

  const admin = createAdminSupabase();

  const { data: holders, error: profErr } = await admin
    .from("profiles")
    .select("id, email, credits, plan")
    .gt("credits", 0) as { data: ProfileRow[] | null; error: { message: string } | null };

  if (profErr) {
    return NextResponse.json({ error: `Could not read profiles: ${profErr.message}` }, { status: 500 });
  }
  if (!holders?.length) {
    return NextResponse.json({ applied: false, holders: 0, note: "No account is holding credits." });
  }

  // One query for the buyers, rather than one per profile.
  const { data: paidRows, error: purchErr } = await admin
    .from("purchases")
    .select("user_id")
    .in("user_id", holders.map((h) => h.id)) as { data: { user_id: string }[] | null; error: { message: string } | null };

  if (purchErr && !/does not exist|schema cache/i.test(purchErr.message)) {
    return NextResponse.json({ error: `Could not read purchases: ${purchErr.message}` }, { status: 500 });
  }
  /*
    A missing purchases table would make every holder look unpaid, which would
    wipe real customers' balances. Refuse instead: the table is what proves a
    purchase, and without it this cannot tell the two apart.
  */
  if (purchErr) {
    return NextResponse.json({
      error: "The purchases table does not exist, so paid and unpaid balances cannot be told apart.",
      fix: "Create it with the SQL in docs/invoices.md first — running this without it would clear real customers' credits.",
    }, { status: 412 });
  }

  const paid = new Set((paidRows || []).map((r) => r.user_id));
  const unpaid = holders.filter((h) => !paid.has(h.id));

  const preview = unpaid.map((h) => ({
    id: h.id,
    email: h.email ?? null,
    credits: h.credits ?? 0,
    plan: h.plan ?? "free",
  }));

  if (!apply) {
    return NextResponse.json({
      applied: false,
      holders: holders.length,
      paid: holders.length - unpaid.length,
      wouldClear: unpaid.length,
      accounts: preview,
      note: "Nothing changed. Re-run with &apply=1 to clear these.",
    });
  }

  let cleared = 0;
  const failures: string[] = [];
  for (const u of unpaid) {
    const { error } = await admin
      .from("profiles")
      .update({ credits: 0, plan: "free" })
      .eq("id", u.id);
    if (error) failures.push(`${u.id}: ${error.message}`);
    else cleared += 1;
  }

  return NextResponse.json({
    applied: true,
    holders: holders.length,
    paid: holders.length - unpaid.length,
    cleared,
    failures,
    accounts: preview,
    note: "Balances above were granted, not bought. Paying accounts were left untouched.",
  });
}
