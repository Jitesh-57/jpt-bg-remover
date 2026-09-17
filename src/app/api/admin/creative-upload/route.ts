import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { CREATIVE_APPS } from "@/lib/creative-apps";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Stores one before/after pane for an app.
 *
 *   POST /api/admin/creative-upload?token=<ADMIN_IMAGE_TOKEN>
 *   { slug, half: "before" | "after", dataUrl }
 *
 * The image arrives already cropped and compressed — the browser does that, on
 * the machine that has the file, which is both faster and the only way this
 * works at all for someone dropping a 6 MB PNG onto a page. The server's job is
 * to check who is asking, check the name is real, and put the bytes where the
 * app pages look.
 */

const BUCKET = "landing";
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({
      error: "Storage is not configured on this deployment.",
      fix: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
    }, { status: 503 });
  }

  let slug: string, half: string, dataUrl: string;
  try {
    const body = (await req.json()) as { slug: string; half?: string; slot?: string; dataUrl: string };
    slug = body.slug;
    // "slot" is the name the editor uses; "half" is what this route shipped
    // with. Accepting both means a tab left open over a deploy keeps working.
    half = body.slot ?? body.half ?? "";
    dataUrl = body.dataUrl;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  /*
    The slot decides the filename, so it is matched against a pattern rather
    than trusted: it becomes a storage path, and a name nothing reads is the
    kind of mistake you find weeks later. "extra-1" and up exist for apps
    whose page shows more than a pair.
  */
  if (!/^(before|after|extra-[1-9])$/.test(half)) {
    return NextResponse.json({ error: 'slot must be "before", "after" or "extra-1".."extra-9".' }, { status: 400 });
  }
  /*
    The slug decides a storage path, so it is checked against the apps that
    exist rather than merely sanitised. A name that is not an app would write a
    file nothing ever reads — the silent kind of mistake you find weeks later.
  */
  if (!CREATIVE_APPS.some((a) => a.slug === slug)) {
    return NextResponse.json({ error: `"${slug}" is not an app on this site.` }, { status: 400 });
  }

  const m = /^data:image\/webp;base64,/.exec(dataUrl || "");
  if (!m) return NextResponse.json({ error: "Expected a WebP data URL." }, { status: 400 });
  const body = Buffer.from(dataUrl.slice(m[0].length), "base64");
  if (!body.length) return NextResponse.json({ error: "That image was empty." }, { status: 400 });
  if (body.length > MAX_BYTES) {
    return NextResponse.json({ error: `That came to ${(body.length / 1048576).toFixed(1)}MB; the limit is 2MB.` }, { status: 413 });
  }

  const path = `creatives/${slug}-${half}.webp`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "image/webp",
      // Replacing is the normal case: you re-render a creative and upload again.
      "x-upsert": "true",
      "Cache-Control": "public, max-age=300",
    },
    body,
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error(`[creative-upload] ${path} failed (${res.status}): ${detail}`);
    return NextResponse.json({ error: `Storage refused the upload (${res.status}).`, detail }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
    bytes: body.length,
    page: `/creative/${slug}`,
  });
}
