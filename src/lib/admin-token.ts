import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * admin-token.ts — the shared guard on the /api/admin routes.
 *
 * These endpoints return every user's email address, rewrite credit balances
 * and spend real money generating images. They were guarded by
 * `process.env.ADMIN_IMAGE_TOKEN || "jptblog2026"` — and this repository is
 * public, so the fallback was a password anyone could read. Wherever the
 * variable was unset, the guard was decorative.
 *
 * There is no default now. If the variable is not set the route refuses and
 * says what to set, which fails closed instead of open.
 */

export function adminToken(): string | null {
  const t = (process.env.ADMIN_IMAGE_TOKEN || "").trim();
  return t || null;
}

/** Constant-time, so the comparison does not leak the token a character at a time. */
function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which is itself a length oracle
  // — but the length of a secret is not the secret, and a wrong length is
  // already a wrong token.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Returns the response to send when the caller is not authorised, or null to
 * carry on. Reads `?token=` from the query string.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const expected = adminToken();
  if (!expected) {
    return NextResponse.json({
      error: "This endpoint is disabled because ADMIN_IMAGE_TOKEN is not set.",
      fix: "Set ADMIN_IMAGE_TOKEN to a private value in the Vercel project's environment variables, redeploy, and call this with ?token=<that value>.",
      why: "It used to fall back to a token written in this repository, which is public — so the guard protected nothing.",
    }, { status: 503 });
  }
  const given = (req.nextUrl.searchParams.get("token") || "").trim();
  if (!matches(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * The Postgres connection string, under whatever name it arrived as.
 *
 * The Supabase and Neon Vercel integrations set these themselves, so a project
 * that has ever used one already has a working URL and needs nothing added by
 * hand. SUPABASE_DB_URL is checked first so an explicitly set value always
 * wins; POSTGRES_URL_NON_POOLING is preferred over POSTGRES_URL because the
 * integration points the latter at the transaction pooler.
 */
export function databaseUrl(): { url: string; from: string } | null {
  const names = [
    "SUPABASE_DB_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL",
    "DATABASE_URL",
  ];
  for (const name of names) {
    const v = (process.env[name] || "").trim();
    if (v) return { url: v, from: name };
  }
  return null;
}
