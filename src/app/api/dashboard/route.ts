import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { aiCategories, popularTools } from "@/lib/dashboard-catalog";

export const runtime = "nodejs";

function createAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * One call for the whole /app home page — C10's explicit requirement.
 * Recent creations, category summary and the popular shortlist together, so
 * the dashboard never waterfalls a screen out of five separate requests.
 */
export async function GET(req: NextRequest) {
  const { session, error } = await checkAuth(req);
  if (error) return error;

  const admin = createAdmin();
  const [{ data: recent, error: recentErr }, { count: totalCreations }] = await Promise.all([
    admin
      .from("generations")
      .select("id, tool, category, label, thumb, image_url, result_url, source_url, app_slug, created_at")
      .eq("user_id", session!.userId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session!.userId)
      .eq("status", "succeeded"),
  ]);

  if (recentErr) {
    console.error("[api/dashboard]", recentErr);
    return NextResponse.json({ error: "Your dashboard could not be loaded. Please try again in a moment." }, { status: 500 });
  }

  const recentCreations = (recent || []).map((r) => ({
    id: r.id,
    tool: r.tool,
    category: r.category,
    label: r.label,
    thumb: r.thumb,
    imageUrl: r.result_url || r.image_url,
    appSlug: r.app_slug,
    timestamp: new Date(r.created_at).getTime(),
  }));

  return NextResponse.json({
    user: {
      userId: session!.userId,
      email: session!.email,
      name: session!.name,
      picture: session!.picture,
      credits: session!.credits,
      plan: session!.plan,
      hasPurchased: session!.plan !== "free",
    },
    recentCreations,
    creationsCount: totalCreations ?? 0,
    categories: aiCategories().map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, count: c.tools.length })),
    popularTools: popularTools(),
  });
}
