import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { storeImage } from "@/lib/store-image";

export const runtime = "nodejs";
export const maxDuration = 30;

/*
  The full-size image, kept in our Storage so My Creations shows and downloads
  the real result instead of the thumbnail. Remote links are only copied from
  hosts our AI providers actually return, fetched with a size cap and a
  timeout, so this cannot be pointed at arbitrary addresses.
*/
const IMAGE_HOSTS = [/\.fal\.media$/, /^fal\.media$/, /\.fal\.run$/, /\.fal\.ai$/, /\.replicate\.delivery$/, /^replicate\.delivery$/, /^storage\.googleapis\.com$/];
const MAX_BYTES = 25 * 1024 * 1024;

async function keepFullImage(userId: string, image?: string, imageUrl?: string): Promise<string | null> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (typeof image === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(image) && image.length < 6_000_000) {
    return storeImage(image, "creation", userId);
  }
  if (typeof imageUrl !== "string" || imageUrl.length > 2000) return null;
  if (base && imageUrl.startsWith(`${base}/storage/v1/object/public/`)) return imageUrl;
  let u: URL;
  try { u = new URL(imageUrl); } catch { return null; }
  if (u.protocol !== "https:" || !IMAGE_HOSTS.some((re) => re.test(u.hostname))) return null;
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(15_000), redirect: "error" });
    const type = res.headers.get("content-type") || "";
    const size = Number(res.headers.get("content-length") || 0);
    if (!res.ok || !type.startsWith("image/") || size > MAX_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) return null;
    return storeImage(`data:${type.split(";")[0]};base64,${bytes.toString("base64")}`, "creation", userId);
  } catch {
    return null;
  }
}

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

  const { tool, category, label, thumb, imageUrl, image, originalName } = await req.json() as {
    tool: string;
    category?: "generation" | "edit";
    label: string;
    thumb?: string;
    imageUrl?: string;
    /** The full-size image as a data URL, for results made in the browser. */
    image?: string;
    originalName?: string;
  };

  if (!tool) return NextResponse.json({ error: "tool required" }, { status: 400 });
  if (!thumb && !imageUrl && !image) return NextResponse.json({ error: "thumb or imageUrl required" }, { status: 400 });
  if (thumb && thumb.length > 25_000) return NextResponse.json({ error: "thumb too large" }, { status: 400 });

  const resolvedCategory: "generation" | "edit" =
    category ?? ((tool === "generate-bg" || tool === "ai-background") ? "generation" : "edit");

  const full = await keepFullImage(session.userId, image, imageUrl);

  const admin = createAdmin();
  const { data, error: dbError } = await admin.from("generations").insert({
    user_id: session.userId,
    tool,
    category: resolvedCategory,
    label: label || "Image",
    thumb: thumb || "",
    image_url: full,
    original_name: originalName || null,
  }).select("id").single();

  if (dbError) {
    console.error("[generations/save]", dbError);
    return NextResponse.json({ error: "Storage write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
