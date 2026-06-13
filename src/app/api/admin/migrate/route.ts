import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";

// One-time migration — call once after deploy to add plan & daily_credits_reset_at columns.
// Protected by ADMIN_SECRET env var.
export async function POST(req: NextRequest) {
  const { secret } = await req.json() as { secret?: string };
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabase();

  // Add columns via raw SQL using Supabase service role
  const migrations = [
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_credits_reset_at timestamptz DEFAULT NOW()`,
    `UPDATE profiles SET plan = 'free' WHERE plan IS NULL`,
    `UPDATE profiles SET daily_credits_reset_at = NOW() WHERE daily_credits_reset_at IS NULL`,
  ];

  const results: string[] = [];
  for (const sql of migrations) {
    const { error } = await admin.rpc("exec_sql", { query: sql }).single();
    results.push(error ? `FAILED: ${sql} → ${error.message}` : `OK: ${sql}`);
  }

  return NextResponse.json({ results });
}
