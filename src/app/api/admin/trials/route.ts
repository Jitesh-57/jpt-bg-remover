import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-token";
import { readTrialLog, TRIAL_LOG_KEEP } from "@/lib/free-trial.server";
import { WORLDWIDE } from "@/lib/trial-batches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/trials — the country free-trial rules behind /admin/trials.
 *
 *   GET                                   rules + how many trials each country has given
 *   GET ?view=insights                    signups, buyers and revenue per country, and per day
 *     both take &from=&to= (ISO times; `to` exclusive, either may be left out) to
 *     narrow everything dated to that period, and &tzo= (the browser's
 *     getTimezoneOffset()) so days are the admin's own
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

/** The period asked for, as epoch ms. Unset ends are open. */
interface Period { from: number; to: number; all: boolean }

function periodOf(req: NextRequest): Period {
  const p = req.nextUrl.searchParams;
  const f = Date.parse(p.get("from") || "");
  const t = Date.parse(p.get("to") || "");
  const from = Number.isFinite(f) ? f : -Infinity;
  const to = Number.isFinite(t) ? t : Infinity;
  return { from, to, all: from === -Infinity && to === Infinity };
}

/** Whether a timestamp falls in the period. Undated rows only count for "all time". */
function within(at: string | null | undefined, p: Period): boolean {
  if (p.all) return true;
  const ms = Date.parse(at || "");
  return ms >= p.from && ms < p.to;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = createAdminSupabase();
  const period = periodOf(req);
  if (req.nextUrl.searchParams.get("view") === "insights") {
    const tzo = Math.max(-840, Math.min(840, Math.round(Number(req.nextUrl.searchParams.get("tzo")) || 0)));
    return insights(db, period, tzo);
  }

  const { data: rules, error } = await db.from("trial_countries").select("country, credits, live, updated_at").order("country") as { data: Rule[] | null; error: { message: string } | null };
  if (error) return NextResponse.json(missingTable(error.message) ? SETUP : { error: error.message }, { status: missingTable(error.message) ? 200 : 500 });

  // Per-country totals, all time and in the period, plus the period's grants so a switch-on can be seen working.
  const { data: grants } = await db.from("trial_grants").select("country, email, credits, granted_at").order("granted_at", { ascending: false }).limit(5000) as { data: { country: string; email: string | null; credits: number; granted_at: string }[] | null };
  const stats: Record<string, { users: number; credits: number }> = {};
  const periodStats: Record<string, { users: number; credits: number }> = {};
  const inPeriod: NonNullable<typeof grants> = [];
  for (const g of grants ?? []) {
    const s = (stats[g.country] ??= { users: 0, credits: 0 });
    s.users += 1;
    s.credits += g.credits;
    if (!within(g.granted_at, period)) continue;
    const ps = (periodStats[g.country] ??= { users: 0, credits: 0 });
    ps.users += 1;
    ps.credits += g.credits;
    inPeriod.push(g);
  }
  const recent = inPeriod.slice(0, 300).map((g) => ({ ...g, email: g.email ? g.email.replace(/^(.{2}).*(@.*)$/, "$1…$2") : null }));

  // The log only keeps the latest checks; say how far back it reaches so an empty period isn't misread.
  const fullLog = await readTrialLog();
  const log = fullLog.filter((l) => within(l.at, period));
  const logOldest = fullLog.length ? fullLog[fullLog.length - 1].at : null;
  const warnings: string[] = [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) warnings.push("SUPABASE_SERVICE_ROLE_KEY is not set on this deployment, so no grant can be written.");
  const { error: gErr } = await db.from("trial_grants").select("user_id", { head: true, count: "exact" });
  if (gErr) warnings.push(`The trial_grants table can't be read: ${gErr.message}`);

  const worldwide = (rules ?? []).find((r) => r.country === WORLDWIDE) ?? null;
  return NextResponse.json({
    rules: (rules ?? []).filter((r) => r.country !== WORLDWIDE), worldwide, stats, periodStats,
    recent, recentTotal: inPeriod.length, log, logOldest, logFull: fullLog.length >= TRIAL_LOG_KEEP, logKeep: TRIAL_LOG_KEEP, warnings,
  });
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

interface Row { country: string; signups: number; signupsPaid: number; trials: number; trialsPaid: number; buyers: number; purchases: number; revenueInr: number }
interface Day { accounts: number; trials: number; purchases: number; revenueInr: number }

/**
 * Per country: accounts, trials given, paying accounts, purchases and revenue,
 * for the period; and the same by day, for the chart.
 *
 * A purchase counts for the country it was paid from; older purchases, made
 * before that was recorded, count for the buyer's signup country, then their
 * trial's country, else "unknown". An account's country is where it signed up,
 * and it counts in the period it signed up in (its trial's date, for accounts
 * older than the country record).
 *
 * Buyers, purchases and revenue are what was paid in the period. The two
 * rates follow the period's own people instead, so they can't pass 100%:
 * signupsPaid is the period's new accounts that have bought since, trialsPaid
 * the period's trial users that have.
 */
async function insights(db: Db, period: Period, tzo: number) {
  const [uc, pc, pu, tg] = await Promise.all([
    allRows<{ user_id: string; signup_country: string; first_seen: string }>(db, "user_countries", "user_id, signup_country, first_seen"),
    allRows<{ purchase_id: number; country: string }>(db, "purchase_countries", "purchase_id, country"),
    allRows<{ id: number; user_id: string; amount_paise: number; created_at: string }>(db, "purchases", "id, user_id, amount_paise, created_at"),
    allRows<{ user_id: string | null; country: string; granted_at: string }>(db, "trial_grants", "user_id, country, granted_at"),
  ]);
  const needsSetup = !!(uc.error && missingTable(uc.error)) || !!(pc.error && missingTable(pc.error));

  const home = new Map<string, { country: string; at: string }>();
  for (const t of tg.rows) if (t.user_id) home.set(t.user_id, { country: t.country, at: t.granted_at });
  for (const u of uc.rows) home.set(u.user_id, { country: u.signup_country, at: u.first_seen });
  const everBought = new Set(pu.rows.map((p) => p.user_id));
  const paidFrom = new Map(pc.rows.map((p) => [p.purchase_id, p.country]));

  // The admin's own calendar day: tzo is minutes behind UTC, as the browser reports it.
  const dayOf = (at: string) => {
    const ms = Date.parse(at);
    return Number.isFinite(ms) ? new Date(ms - tzo * 60_000).toISOString().slice(0, 10) : null;
  };
  const daily: Record<string, Day> = {};
  const day = (at: string) => {
    const k = dayOf(at);
    return k ? (daily[k] ??= { accounts: 0, trials: 0, purchases: 0, revenueInr: 0 }) : null;
  };

  const by = new Map<string, Row & { buyerSet: Set<string> }>();
  const row = (c: string) => {
    let r = by.get(c);
    if (!r) by.set(c, (r = { country: c, signups: 0, signupsPaid: 0, trials: 0, trialsPaid: 0, buyers: 0, purchases: 0, revenueInr: 0, buyerSet: new Set() }));
    return r;
  };
  let accounts = 0;
  let accountsPaid = 0;
  home.forEach((h, user) => {
    if (!within(h.at, period)) return;
    const r = row(h.country);
    accounts += 1;
    r.signups += 1;
    if (everBought.has(user)) { accountsPaid += 1; r.signupsPaid += 1; }
    const d = day(h.at);
    if (d) d.accounts += 1;
  });
  let trials = 0;
  let trialsPaid = 0;
  for (const t of tg.rows) {
    if (!within(t.granted_at, period)) continue;
    const r = row(t.country);
    trials += 1;
    r.trials += 1;
    if (t.user_id && everBought.has(t.user_id)) { trialsPaid += 1; r.trialsPaid += 1; }
    const d = day(t.granted_at);
    if (d) d.trials += 1;
  }
  let purchases = 0;
  let paise = 0;
  const buyers = new Set<string>();
  for (const p of pu.rows) {
    if (!within(p.created_at, period)) continue;
    const r = row(paidFrom.get(p.id) || (p.user_id && home.get(p.user_id)?.country) || "??");
    purchases += 1;
    paise += p.amount_paise || 0;
    r.purchases += 1;
    r.revenueInr += (p.amount_paise || 0) / 100;
    r.buyerSet.add(p.user_id);
    buyers.add(p.user_id);
    const d = day(p.created_at);
    if (d) { d.purchases += 1; d.revenueInr += (p.amount_paise || 0) / 100; }
  }
  for (const d of Object.values(daily)) d.revenueInr = Math.round(d.revenueInr);

  const rows: Row[] = Array.from(by.values()).map(({ buyerSet, ...r }) => ({
    ...r, buyers: buyerSet.size, revenueInr: Math.round(r.revenueInr),
  })).sort((a, b) => b.revenueInr - a.revenueInr || b.buyers - a.buyers || b.signups - a.signups);

  const since = uc.rows.reduce<string | null>((m, u) => (!m || u.first_seen < m ? u.first_seen : m), null);
  return NextResponse.json({
    rows,
    since,
    daily,
    totals: { accountsWithCountry: accounts, accountsPaid, trials, trialsPaid, buyers: buyers.size, purchases, revenueInr: Math.round(paise / 100) },
    needsSetup,
    error: !needsSetup ? (uc.error || pc.error || pu.error || tg.error) : undefined,
  });
}
