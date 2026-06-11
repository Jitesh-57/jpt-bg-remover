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
    .select("id, tool, category, label, thumb, image_url, original_name, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (dbError) {
    console.error("[generations/list]", dbError);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  const items = (data || []).map(r => ({
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
