import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/trials — the country free-trial rules behind /admin/trials.
 *
 *   GET                                   rules + how many trials each country has given
 *   POST { country, credits, live }       add or change a country (takes effect on the next signup)
 *   POST { action: "stop-all" }           switch every country off at once
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

  return NextResponse.json({ rules: rules ?? [], stats, recent });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = createAdminSupabase();
  const body = await req.json().catch(() => ({})) as { action?: string; country?: string; credits?: number; live?: boolean };

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
