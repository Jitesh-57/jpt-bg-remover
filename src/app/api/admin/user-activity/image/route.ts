import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { createAdminSupabase } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stable admin-only image URL. The route fetches the object from Supabase on
 * every request, so the URL itself has no signed-URL expiry. Access remains
 * protected by ADMIN_IMAGE_TOKEN and the source object must still exist.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const bucket = (req.nextUrl.searchParams.get("bucket") || "").trim();
  const path = (req.nextUrl.searchParams.get("path") || "").trim();
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(bucket) || !path || path.startsWith("/") || path.split("/").some((part) => !part || part === "." || part === "..")) {
    return NextResponse.json({ error: "Invalid storage object path." }, { status: 400 });
  }

  const { data, error } = await createAdminSupabase().storage.from(bucket).download(path);
  if (error || !data) {
    return NextResponse.json({ error: "Image could not be loaded from storage." }, { status: 404 });
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Length": String(data.size),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
