import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-token";
import { readTrialLog } from "@/lib/free-trial.server";
import { WORLDWIDE } from "@/lib/trial-batches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/trials — the country free-trial rules behind /admin/trials.
 *
 *   GET                                   rules + how many trials each country has given
 *   GET ?view=insights                    signups, buyers and revenue per country
 *   POST { country, credits, live }       add or change a country (takes effect on the next signup);
 *                                         country "XX" is the worldwide rule for every unlisted country
 *   POST { action: "stop-all" }           switch every country off at once, worldwide included
 *   POST { action: "start-all" }          switch every listed country on (not worldwide)
 *   POST { action: "batch", countries, credits, live }
 *                                         a batch on (adding missing countries with `credits`) or off
 *   DELETE ?country=US                    remove a country
 *
 * All calls carry ?token=<ADMIN_IMAGE_TOKEN>.
 */

interface Rule { country: string; credits: number; live: boolean; updated_at: string }

function missingTable(msg: string | undefined): boolean {
  return !!msg && /does not exist|could not find the table|schema cache/i.test(msg);
}

const SETUP = {
  needsSetup: true,
  error: "The free-trial tables aren't in the database yet.",
  fix: "Click \"Set up database\" (runs /api/admin/migrate), or paste supabase/migrations/20260923_free_trials.sql into the Supabase SQL editor.",
};

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = createAdminSupabase();
  if (req.nextUrl.searchParams.get("view") === "insights") return insights(db);

  const { data: rules, error } = await db.from("trial_countries").select("country, credits, live, updated_at").order("country") as { data: Rule[] | null; error: { message: string } | null };
  if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: missingTable(error.message) ? 200 : 500 });

  // Per-country totals, plus the latest few grants so a switch-on can be seen working.
  const { data: grants } = await db.from("trial_grants").select("country, email, credits, granted_at").order("granted_at", { ascending: false }).limit(5000) as { data: { country: string; email: string | null; credits: number; granted_at: string }[] | null };
  const stats: Record<string, { users: number; credits: number }> = {};
  for (const g of grants ?? []) {
    const s = (stats[g.country] ??= { users: 0, credits: 0 });
    s.users += 1;
    s.credits += g.credits;
  }
  const recent = (grants ?? []).slice(0, 15).map((g) => ({ ...g, email: g.email ? g.email.replace(/^(.{2}).*(@.*)$/, "$1…$2") : null }));

  const log = await readTrialLog();
  const warnings: string[] = [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) warnings.push("SUPABASE_SERVICE_ROLE_KEY is not set on this deployment, so no grant can be written.");
  const { error: gErr } = await db.from("trial_grants").select("user_id", { head: true, count: "exact" });
  if (gErr) warnings.push(`The trial_grants table can't be read: ${gErr.message}`);

  const worldwide = (rules ?? []).find((r) => r.country === WORLDWIDE) ?? null;
  return NextResponse.json({ rules: (rules ?? []).filter((r) => r.country !== WORLDWIDE), worldwide, stats, recent, log, warnings });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = createAdminSupabase();
  const body = await req.json().catch(() => ({})) as { action?: string; country?: string; countries?: string[]; credits?: number; live?: boolean };
  const now = new Date().toISOString();

  if (body.action === "start-all") {
    const { error } = await db.from("trial_countries").update({ live: true, updated_at: now }).eq("live", false).neq("country", WORLDWIDE);
    if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "batch") {
    const list = Array.from(new Set((body.countries ?? []).map((c) => String(c).trim().toUpperCase()))).filter((c) => /^[A-Z]{2}$/.test(c) && c !== WORLDWIDE).slice(0, 250);
    const credits = Math.round(Number(body.credits));
    if (!list.length) return NextResponse.json({ error: "The batch has no countries." }, { status: 400 });
    if (body.live) {
      if (!Number.isFinite(credits) || credits < 1 || credits > 100) return NextResponse.json({ error: "Credits must be between 1 and 100." }, { status: 400 });
      // Countries already listed keep their own credits and are switched on; the rest are added.
      const { data: have, error: rErr } = await db.from("trial_countries").select("country").in("country", list) as { data: { country: string }[] | null; error: { message: string } | null };
      if (rErr) return NextResponse.json(missingTable(rErr.message) ? SETUP : { error: rErr.message }, { status: 500 });
      const existing = new Set((have ?? []).map((r) => r.country));
      const fresh = list.filter((c) => !existing.has(c)).map((country) => ({ country, credits, live: true, updated_at: now }));
      if (fresh.length) {
        const { error } = await db.from("trial_countries").upsert(fresh, { onConflict: "country" });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (existing.size) {
        const { error } = await db.from("trial_countries").update({ live: true, updated_at: now }).in("country", Array.from(existing));
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await db.from("trial_countries").update({ live: false, updated_at: now }).in("country", list);
      if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "stop-all") {
    const { error } = await db.from("trial_countries").update({ live: false, updated_at: new Date().toISOString() }).eq("live", true);
    if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const country = String(body.country || "").trim().toUpperCase();
  const credits = Math.round(Number(body.credits));
  if (!/^[A-Z]{2}$/.test(country)) return NextResponse.json({ error: "Pick a country." }, { status: 400 });
  if (!Number.isFinite(credits) || credits < 1 || credits > 100) return NextResponse.json({ error: "Credits must be between 1 and 100." }, { status: 400 });

  const { error } = await db.from("trial_countries").upsert(
    { country, credits, live: !!body.live, updated_at: new Date().toISOString() },
    { onConflict: "country" },
  );
  if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const country = (req.nextUrl.searchParams.get("country") || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return NextResponse.json({ error: "Pick a country." }, { status: 400 });
  const { error } = await createAdminSupabase().from("trial_countries").delete().eq("country", country);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* ── Which countries buy ──────────────────────────────────────────────────── */

type Db = ReturnType<typeof createAdminSupabase>;

/** Every row of a select, 1000 at a time (PostgREST's page cap), up to `max`. */
async function allRows<T>(db: Db, table: string, select: string, max = 50_000): Promise<{ rows: T[]; error?: string }> {
  const rows: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await db.from(table).select(select).range(from, from + 999) as { data: T[] | null; error: { message: string } | null };
    if (error) return { rows, error: error.message };
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return { rows };
}

interface Row { country: string; signups: number; trials: number; buyers: number; trialBuyers: number; purchases: number; revenueInr: number }

/**
 * Per country: accounts, trials given, paying accounts, purchases and revenue.
 *
 * A purchase counts for the country it was paid from; older purchases, made
 * before that was recorded, count for the buyer's signup country, then their
 * trial's country, else "unknown". An account's country is where it signed up.
 */
async function insights(db: Db) {
  const [uc, pc, pu, tg] = await Promise.all([
    allRows<{ user_id: string; signup_country: string; first_seen: string }>(db, "user_countries", "user_id, signup_country, first_seen"),
    allRows<{ purchase_id: number; country: string }>(db, "purchase_countries", "purchase_id, country"),
    allRows<{ id: number; user_id: string; amount_paise: number }>(db, "purchases", "id, user_id, amount_paise"),
    allRows<{ user_id: string | null; country: string }>(db, "trial_grants", "user_id, country"),
  ]);
  const needsSetup = !!(uc.error && missingTable(uc.error)) || !!(pc.error && missingTable(pc.error));

  const home = new Map<string, string>();
  for (const t of tg.rows) if (t.user_id) home.set(t.user_id, t.country);
  for (const u of uc.rows) home.set(u.user_id, u.signup_country);
  const trialUsers = new Set(tg.rows.map((t) => t.user_id).filter(Boolean) as string[]);
  const paidFrom = new Map(pc.rows.map((p) => [p.purchase_id, p.country]));

  const by = new Map<string, Row & { buyerSet: Set<string>; trialBuyerSet: Set<string> }>();
  const row = (c: string) => {
    let r = by.get(c);
    if (!r) by.set(c, (r = { country: c, signups: 0, trials: 0, buyers: 0, trialBuyers: 0, purchases: 0, revenueInr: 0, buyerSet: new Set(), trialBuyerSet: new Set() }));
    return r;
  };
  home.forEach((c) => { row(c).signups += 1; });
  for (const t of tg.rows) row(t.country).trials += 1;
  for (const p of pu.rows) {
    const r = row(paidFrom.get(p.id) || home.get(p.user_id) || "??");
    r.purchases += 1;
    r.revenueInr += (p.amount_paise || 0) / 100;
    r.buyerSet.add(p.user_id);
    if (trialUsers.has(p.user_id)) r.trialBuyerSet.add(p.user_id);
  }

  const rows: Row[] = Array.from(by.values()).map(({ buyerSet, trialBuyerSet, ...r }) => ({
    ...r, buyers: buyerSet.size, trialBuyers: trialBuyerSet.size, revenueInr: Math.round(r.revenueInr),
  })).sort((a, b) => b.revenueInr - a.revenueInr || b.buyers - a.buyers || b.signups - a.signups);

  const since = uc.rows.reduce<string | null>((m, u) => (!m || u.first_seen < m ? u.first_seen : m), null);
  return NextResponse.json({
    rows,
    since,
    totals: { accountsWithCountry: home.size, purchases: pu.rows.length, revenueInr: Math.round(pu.rows.reduce((n, p) => n + (p.amount_paise || 0), 0) / 100) },
    needsSetup,
    error: !needsSetup ? (uc.error || pc.error || pu.error || tg.error) : undefined,
  });
}
