import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function createAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Read-only view onto credit_ledger for /app/credits — the append-only log recordCredits() already writes. */
export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const admin = createAdmin();
  const { data, error: dbError } = await admin
    .from("credit_ledger")
    .select("id, delta, balance_after, reason, tool, note, created_at")
    .eq("user_id", session!.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) {
    console.error("[api/credits/history]", dbError);
    return NextResponse.json({ error: "Your credit history could not be loaded. Please try again in a moment." }, { status: 500 });
  }

  const items = (data || []).map((r) => ({
    id: r.id,
    delta: r.delta,
    balanceAfter: r.balance_after,
    reason: r.reason,
    tool: r.tool,
    note: r.note,
    timestamp: new Date(r.created_at).getTime(),
  }));

  return NextResponse.json({ items });
}
