import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export interface GenItem {
  id: string;
  tool: string;
  category: "generation" | "edit";
  label: string;
  thumb: string;
  imageUrl?: string;
  timestamp: number;
  originalName?: string;
}

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

  const { tool, category, label, thumb, imageUrl, originalName } = await req.json() as {
    tool: string;
    category?: "generation" | "edit";
    label: string;
    thumb?: string;
    imageUrl?: string;
    originalName?: string;
  };

  if (!tool) return NextResponse.json({ error: "tool required" }, { status: 400 });
  if (!thumb && !imageUrl) return NextResponse.json({ error: "thumb or imageUrl required" }, { status: 400 });
  if (thumb && thumb.length > 25_000) return NextResponse.json({ error: "thumb too large" }, { status: 400 });

  const resolvedCategory: "generation" | "edit" =
    category ?? ((tool === "generate-bg" || tool === "ai-background") ? "generation" : "edit");

  const admin = createAdmin();
  const { data, error: dbError } = await admin.from("generations").insert({
    user_id: session.userId,
    tool,
    category: resolvedCategory,
    label: label || "Image",
    thumb: thumb || "",
    image_url: imageUrl || null,
    original_name: originalName || null,
  }).select("id").single();

  if (dbError) {
    console.error("[generations/save]", dbError);
    return NextResponse.json({ error: "Storage write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
