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

export async function POST(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdmin();
  const { error: dbError } = await admin
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", session.userId);

  if (dbError) {
    console.error("[generations/delete]", dbError);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
