import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { requireAdmin, databaseUrl } from "@/lib/admin-token";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Reports what the database actually looks like.
 *
 * Migrating is not the same as being correct, and "it should be fine now" is
 * not something anyone should have to take on trust — particularly for the
 * tables that hold what people paid for. This checks the schema against what
 * the app requires and says plainly what is missing.
 *
 *   GET /api/admin/db-check?token=…
 *
 * Read-only. It changes nothing, so it is safe to run whenever.
 */

/**
 * What each table must have for the app to work.
 *
 * Only the columns something actually reads or writes — this is a check, not a
 * second copy of the schema, and listing every column would make it fail on
 * additions that break nothing.
 */
const REQUIRED: Record<string, string[]> = {
  profiles: ["id", "email", "credits", "plan"],
  purchases: [
    "id", "user_id", "razorpay_order_id", "razorpay_payment_id",
    "plan", "credits_added", "amount_paise", "invoice_no", "created_at",
  ],
  generations: [
    "id", "user_id", "tool", "app_slug", "source_url", "result_url",
    "model", "prompt", "credits_spent", "status", "created_at",
  ],
  credit_ledger: [
    "id", "user_id", "delta", "balance_after", "reason", "created_at",
  ],
};

interface TableReport {
  table: string;
  exists: boolean;
  missingColumns: string[];
  rlsEnabled: boolean;
  policies: string[];
  rows: number | null;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const db = databaseUrl();
  if (!db) {
    return NextResponse.json({
      error: "No database connection string is set, so the database cannot be inspected.",
      fix: "Set SUPABASE_DB_URL from Supabase → Project Settings → Database → Connection string → Session pooler (port 5432).",
      looked_for: ["SUPABASE_DB_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "DATABASE_URL"],
    }, { status: 503 });
  }

  const client = new Client({
    connectionString: db.url,
    ssl: /[?&]sslmode=disable\b/.test(db.url) ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    statement_timeout: 30_000,
  });

  try {
    await client.connect();
  } catch (e) {
    return NextResponse.json({
      error: `Could not connect to the database: ${(e as Error).message}`,
    }, { status: 502 });
  }

  try {
    const { rows: cols } = await client.query<{ table_name: string; column_name: string }>(
      `select table_name, column_name
         from information_schema.columns
        where table_schema = 'public'`
    );
    const byTable = new Map<string, Set<string>>();
    for (const c of cols) {
      if (!byTable.has(c.table_name)) byTable.set(c.table_name, new Set());
      byTable.get(c.table_name)!.add(c.column_name);
    }

    const { rows: rls } = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'`
    );
    const rlsOn = new Map(rls.map((r) => [r.relname, r.relrowsecurity]));

    const { rows: pols } = await client.query<{ tablename: string; policyname: string }>(
      `select tablename, policyname from pg_policies where schemaname = 'public'`
    );

    const tables: TableReport[] = [];
    for (const [table, required] of Object.entries(REQUIRED)) {
      const have = byTable.get(table);
      let rows: number | null = null;
      if (have) {
        try {
          // Quoted identifier from our own constant list, never from input.
          const r = await client.query<{ n: string }>(`select count(*)::text as n from public."${table}"`);
          rows = Number(r.rows[0]?.n ?? 0);
        } catch { /* a count is nice to have, not a reason to fail the report */ }
      }
      tables.push({
        table,
        exists: !!have,
        missingColumns: have ? required.filter((c) => !have.has(c)) : required,
        rlsEnabled: rlsOn.get(table) ?? false,
        policies: pols.filter((p) => p.tablename === table).map((p) => p.policyname),
        rows,
      });
    }

    let migrationsApplied: string[] = [];
    try {
      const r = await client.query<{ name: string }>(
        "select name from public.schema_migrations order by name"
      );
      migrationsApplied = r.rows.map((x) => x.name);
    } catch { /* the ledger only exists once /api/admin/migrate has run */ }

    await client.end().catch(() => {});

    const problems: string[] = [];
    for (const t of tables) {
      if (!t.exists) problems.push(`${t.table}: table does not exist`);
      else {
        if (t.missingColumns.length) problems.push(`${t.table}: missing ${t.missingColumns.join(", ")}`);
        if (!t.rlsEnabled) problems.push(`${t.table}: row-level security is OFF — anyone with the anon key can read every row`);
        else if (!t.policies.length) problems.push(`${t.table}: RLS is on with no policy, so even the owner cannot read their own rows`);
      }
    }

    return NextResponse.json({
      ok: problems.length === 0,
      connectionFrom: db.from,
      problems,
      fix: problems.length
        ? "Run /api/admin/migrate?token=…&apply=1 — it creates what is missing and never touches existing data."
        : undefined,
      tables,
      migrationsApplied,
      note: problems.length === 0
        ? "Schema matches what the app reads and writes, RLS is on everywhere, and every table has a policy."
        : "See `problems`.",
    });
  } catch (e) {
    await client.end().catch(() => {});
    return NextResponse.json({ error: `Inspection failed: ${(e as Error).message}` }, { status: 500 });
  }
}
