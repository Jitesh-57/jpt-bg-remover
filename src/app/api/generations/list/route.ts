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

export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const admin = createAdmin();
  const { data, error: dbError } = await admin
    .from("generations")
    // "*" so this reads on databases with or without the status column.
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(60) as { data: { id: number; tool: string; category: string; label: string; thumb: string | null; image_url: string | null; original_name: string | null; created_at: string; status?: string }[] | null; error: { message: string } | null };

  if (dbError) {
    console.error("[generations/list]", dbError);
    return NextResponse.json({ error: "Your generations could not be loaded. Please try again in a moment." }, { status: 500 });
  }

  // Failed attempts are kept for the ledger, but there is nothing to show for them.
  const items = (data || []).filter(r => r.status !== "failed" && (r.image_url || r.thumb)).map(r => ({
    id: r.id,
    tool: r.tool,
    category: r.category,
    label: r.label,
    thumb: r.thumb,
    imageUrl: r.image_url,
    originalName: r.original_name,
    timestamp: new Date(r.created_at).getTime(),
  }));

  return NextResponse.json({ items });
}
