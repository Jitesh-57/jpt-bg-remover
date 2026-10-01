import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { createAdminSupabase } from "@/lib/auth";
import { recordCredits } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/users — accounts and their credits, for /admin/users. ?token= on every call.
 *
 *   GET ?filter=paid|credits|all&q=email&offset=…   accounts, newest first, 50 at a time
 *   GET ?id=<user id>                                 one account: purchases and credit history
 *   POST { userId, delta, note }                      add (+) or remove (−) credits
 *
 * Every adjustment lands in credit_ledger as admin_adjust with the note, so a
 * balance can always be explained later. A balance never goes below zero.
 */

const PAGE = 50;
type Profile = { id: string; email: string | null; name: string | null; credits: number; plan: string; created_at: string };

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = createAdminSupabase();
  const sp = req.nextUrl.searchParams;

  const id = sp.get("id");
  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not an account id." }, { status: 400 });
    const [{ data: profile }, { data: purchases }, { data: ledger }] = await Promise.all([
      db.from("profiles").select("id, email, name, credits, plan, created_at").eq("id", id).maybeSingle(),
      db.from("purchases").select("id, plan, credits_added, amount_paise, invoice_no, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
      db.from("credit_ledger").select("id, delta, balance_after, reason, tool, note, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(60),
    ]);
    if (!profile) return NextResponse.json({ error: "No such account." }, { status: 404 });
    return NextResponse.json({ profile, purchases: purchases ?? [], ledger: ledger ?? [] });
  }

  const filter = sp.get("filter") === "all" ? "all" : sp.get("filter") === "credits" ? "credits" : "paid";
  const q = (sp.get("q") || "").trim().toLowerCase().slice(0, 120);
  const offset = Math.max(0, Math.min(Number(sp.get("offset")) || 0, 100_000));

  // Who has ever paid: one query over purchases, summed per account.
  const { data: buys } = await db.from("purchases").select("user_id, amount_paise, created_at") as { data: { user_id: string; amount_paise: number; created_at: string }[] | null };
  const paid = new Map<string, { count: number; paise: number; last: string }>();
  for (const b of buys ?? []) {
    const cur = paid.get(b.user_id) ?? { count: 0, paise: 0, last: b.created_at };
    paid.set(b.user_id, { count: cur.count + 1, paise: cur.paise + (b.amount_paise || 0), last: b.created_at > cur.last ? b.created_at : cur.last });
  }

  let query = db.from("profiles").select("id, email, name, credits, plan, created_at", { count: "exact" });
  if (q) query = query.ilike("email", `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  if (filter === "credits") query = query.gt("credits", 0);
  if (filter === "paid") {
    const ids = Array.from(paid.keys());
    // Paying accounts, plus anyone holding credits or on a paid plan (given credits by hand, or a legacy plan).
    query = ids.length
      ? query.or(`id.in.(${ids.join(",")}),credits.gt.0,plan.neq.free`)
      : query.or("credits.gt.0,plan.neq.free");
  }
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(offset, offset + PAGE - 1) as { data: Profile[] | null; count: number | null; error: { message: string } | null };
  if (error) return NextResponse.json({ error: `Accounts could not be read: ${error.message}` }, { status: 500 });

  const totalPaise = Array.from(paid.values()).reduce((n, p) => n + p.paise, 0);
  return NextResponse.json({
    total: count ?? 0,
    stats: { payingUsers: paid.size, revenueInr: Math.round(totalPaise / 100) },
    users: (data ?? []).map((u) => ({ ...u, purchases: paid.get(u.id) ?? null })),
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { userId?: string; delta?: number; note?: string } | null;
  const userId = body?.userId || "";
  const delta = Math.trunc(Number(body?.delta));
  const note = String(body?.note || "").trim().slice(0, 200);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: "Not an account id." }, { status: 400 });
  if (!delta || Math.abs(delta) > 10_000) return NextResponse.json({ error: "Enter a number of credits between -10000 and 10000." }, { status: 400 });

  const db = createAdminSupabase();
  // Compare-and-set, retried: a generation spending credits at the same moment must not be overwritten.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: prof } = await db.from("profiles").select("credits").eq("id", userId).maybeSingle() as { data: { credits: number } | null };
    if (!prof) return NextResponse.json({ error: "No such account." }, { status: 404 });
    const before = prof.credits ?? 0;
    const after = Math.max(0, before + delta);
    const { data: updated } = await db.from("profiles").update({ credits: after }).eq("id", userId).eq("credits", before).select("credits");
    if (updated?.length) {
      await recordCredits({ userId, delta: after - before, balanceAfter: after, reason: "admin_adjust", note: note || (delta > 0 ? "Added by admin" : "Removed by admin") });
      return NextResponse.json({ ok: true, credits: after, applied: after - before });
    }
  }
  return NextResponse.json({ error: "The balance kept changing. Try again in a moment." }, { status: 409 });
}
