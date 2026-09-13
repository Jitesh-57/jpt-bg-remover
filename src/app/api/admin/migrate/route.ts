import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-token";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Applies supabase/migrations to the database.
 *
 * The schema could not be created from the app before: supabase-js speaks
 * PostgREST, which has no DDL, so every table had to be pasted into the
 * Supabase SQL editor by hand — and until someone did, the invoices page told
 * paying customers their purchase history did not exist.
 *
 * This connects to Postgres directly instead. The migrations are written to be
 * re-runnable, so calling this twice is a no-op rather than an error, and it
 * runs inside a transaction: either the whole file applies or none of it does.
 *
 *   GET /api/admin/migrate?token=…          what it would run
 *   GET /api/admin/migrate?token=…&apply=1  run it
 *
 * Needs SUPABASE_DB_URL — Supabase → Project Settings → Database → Connection
 * string, with the password filled in.
 *
 * Use the **Session pooler** URI (port 5432). The direct `db.<ref>.supabase.co`
 * host is IPv6-only on newer projects and a serverless function generally
 * cannot reach it; the transaction pooler on 6543 can be reached but does not
 * support prepared statements, so nothing here uses one.
 *
 * The value is a database superuser credential. It belongs in the environment
 * and nowhere else — never in a query string, which is logged.
 */

const DIR = path.join(process.cwd(), "supabase", "migrations");

/**
 * Every migration, in filename order.
 *
 * The folder is the list — a new .sql file needs no code change here — and the
 * names are dated, so sorting them is applying them in the order they were
 * written. They are all written to be re-runnable.
 */
async function migrations(): Promise<string[]> {
  const names = (await readdir(DIR)).filter((n) => n.endsWith(".sql"));
  return names.sort();
}

function dbUrl(): string | null {
  const raw = (process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL || "").trim();
  return raw || null;
}

/*
  Read from disk rather than imported as a string, so the SQL stays a .sql file
  — readable, diffable, and pasteable into the Supabase editor — instead of
  becoming an escaped template literal. next.config.mjs traces the folder into
  this function's bundle, because a path built at runtime is not something the
  bundler can follow on its own.
*/
async function loadMigration(name: string): Promise<string> {
  return readFile(path.join(DIR, name), "utf8");
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const apply = req.nextUrl.searchParams.get("apply") === "1";

  let names: string[];
  try {
    names = await migrations();
  } catch (e) {
    return NextResponse.json({ error: `Could not read the migrations: ${(e as Error).message}` }, { status: 500 });
  }

  const url = dbUrl();
  if (!url) {
    return NextResponse.json({
      error: "SUPABASE_DB_URL is not set, so there is no database to migrate.",
      fix: "Supabase → Project Settings → Database → Connection string → Session pooler (port 5432). Put the real password in it, set it as SUPABASE_DB_URL in the Vercel project's environment variables, and call this again once the redeploy finishes.",
      migrations: names,
    }, { status: 503 });
  }


  const client = new Client({
    connectionString: url,
    /*
      Supabase terminates TLS with a certificate this client has no root for;
      the connection is still encrypted and the host is fixed by the URL, so the
      check is relaxed rather than the transport being turned off.

      `sslmode=disable` in the URL is honoured, for a database that does not
      speak TLS at all — a local one, in practice. Forcing SSL on those fails
      the handshake rather than falling back.
    */
    ssl: /[?&]sslmode=disable\b/.test(url) ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
    statement_timeout: 90_000,
  });

  try {
    await client.connect();
  } catch (e) {
    return NextResponse.json({
      error: `Could not connect to the database: ${(e as Error).message}`,
      fix: "Check SUPABASE_DB_URL. It needs the real password in it (not the [YOUR-PASSWORD] placeholder), and a host this function can reach: use the Session pooler URI on port 5432. The direct db.<ref>.supabase.co host is IPv6-only on newer projects and is usually unreachable from here.",
    }, { status: 502 });
  }

  /*
    Each file is applied once and recorded, rather than the whole folder being
    replayed every time.

    Writing every migration to be re-runnable is a good habit but a bad
    guarantee: the translations migration already in this folder creates a
    policy, `create policy` has no "if not exists", and a second run therefore
    failed and rolled back the entire batch — including the tables that had just
    been created. A ledger of what has run makes that impossible to get wrong,
    whatever any individual file does.
  */
  const applied: string[] = [];
  const skipped: string[] = [];
  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows } = await client.query<{ name: string }>("select name from public.schema_migrations");
    const done = new Set(rows.map((r) => r.name));

    if (!apply) {
      const pending = names.filter((n) => !done.has(n));
      await client.end().catch(() => {});
      return NextResponse.json({
        applied: false,
        pending,
        alreadyApplied: names.filter((n) => done.has(n)),
        note: pending.length
          ? "Nothing ran. Re-run with &apply=1 to apply the files in `pending`."
          : "Nothing to do — every migration has already been applied.",
      });
    }

    for (const name of names) {
      if (done.has(name)) { skipped.push(name); continue; }
      const body = await loadMigration(name);
      // One transaction per file: a file either lands whole or not at all, and
      // one that fails does not undo the ones before it.
      await client.query("begin");
      try {
        await client.query(body);
        /*
          Escaped into the statement rather than passed as a parameter.

          A parameterised query goes over the extended protocol, which means a
          prepared statement — and Supabase's transaction-mode pooler (port
          6543) does not support those. Someone who pastes that connection
          string would have every migration apply and then fail to be recorded.
          The value is a filename from our own folder either way; escapeLiteral
          is what makes inlining it safe rather than the source being trusted.
        */
        await client.query(
          `insert into public.schema_migrations (name) values (${client.escapeLiteral(name)})`
        );
        await client.query("commit");
        applied.push(name);
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${name}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    await client.end().catch(() => {});
    return NextResponse.json({
      error: `Migration failed and was rolled back: ${(e as Error).message}`,
      applied,
      skipped,
      note: applied.length
        ? "The migrations listed in `applied` did land and are recorded; only the failing one was rolled back."
        : "Nothing was changed.",
    }, { status: 500 });
  }

  // Report what is actually there now, rather than asserting success.
  let tables: { table: string; columns: number }[] = [];
  try {
    const { rows } = await client.query<{ table_name: string; columns: string }>(
      `select table_name, count(*)::text as columns
         from information_schema.columns
        where table_schema = 'public'
          and table_name in ('profiles','purchases','generations','credit_ledger')
        group by table_name
        order by table_name`
    );
    tables = rows.map((r) => ({ table: r.table_name, columns: Number(r.columns) }));
  } catch { /* the migration committed; this is only the confirmation */ }

  await client.end().catch(() => {});

  return NextResponse.json({
    ok: true,
    applied,
    skipped,
    tables,
    note: applied.length
      ? "Schema is up to date."
      : "Everything had already been applied; nothing to do.",
  });
}
