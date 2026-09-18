import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import { creativeKey, readOverridesNow, writeOverrides } from "@/lib/overrides";
import { resolveTarget, storagePathFor } from "@/lib/page-target";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Stores one image for one page.
 *
 *   POST /api/admin/creative-upload?token=<ADMIN_IMAGE_TOKEN>
 *   { page, slot, dataUrl, w, h, galleryTitle? }
 *
 *   page   a URL, a path, or an overrides key — "https://www.sjpt.io/pricing",
 *          "/pricing" and "page/pricing" all mean the same page
 *   slot   "before" | "after"   the two panes on a creative app page
 *          "showcase-1".."showcase-9"   a whole image in the page's gallery
 *
 * The image arrives already cropped and compressed — the browser does that, on
 * the machine that has the file, which is both faster and the only way this
 * works at all for someone dropping a 6 MB PNG onto a page. The server's job is
 * to check who is asking, check the page is real, and put the bytes where that
 * page looks for them.
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

  let page: string, slot: string, dataUrl: string, galleryTitle = "", width = 0, height = 0;
  try {
    const body = (await req.json()) as {
      page?: string; slug?: string; slot?: string; half?: string;
      dataUrl: string; w?: number; h?: number; galleryTitle?: string;
    };
    width = Number(body.w) || 0;
    height = Number(body.h) || 0;
    galleryTitle = (body.galleryTitle || "").slice(0, 120);
    /*
      "page" is what the console sends now; "slug"/"half" are what this route
      shipped with. Accepting both means a tab left open across a deploy keeps
      working instead of failing on a press of Apply.
    */
    page = body.page ?? (body.slug ? `creative/${body.slug}` : "");
    slot = body.slot ?? body.half ?? "";
    dataUrl = body.dataUrl;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  /*
    The page decides a storage path and an overrides key, so it is resolved
    rather than trusted. An unresolvable page would write a file nothing ever
    reads — the silent kind of mistake you find weeks later.
  */
  const target = resolveTarget(page);
  if (!target) {
    return NextResponse.json({
      error: `"${page}" is not a page on this site.`,
      fix: "Paste the page's URL, e.g. https://www.sjpt.io/pricing.",
    }, { status: 400 });
  }
  if (target.slug && !CREATIVE_APPS.some((a) => a.slug === target.slug)) {
    return NextResponse.json({ error: `"${target.slug}" is not an app on this site.` }, { status: 400 });
  }

  if (!/^(before|after|showcase-[1-9])$/.test(slot)) {
    return NextResponse.json({ error: 'slot must be "before", "after" or "showcase-1".."showcase-9".' }, { status: 400 });
  }
  /*
    Those two panes are drawn by the creative app template and nothing else.
    Accepting "before" for /pricing would store a file that page has no place
    to show, which is exactly the failure this route exists to prevent.
  */
  if (!target.slug && (slot === "before" || slot === "after")) {
    return NextResponse.json({
      error: `${target.path} has no before/after panes — those belong to the creative app pages.`,
      fix: "Use one of the gallery slots instead; they publish the image whole.",
    }, { status: 400 });
  }

  const m = /^data:image\/webp;base64,/.exec(dataUrl || "");
  if (!m) return NextResponse.json({ error: "Expected a WebP data URL." }, { status: 400 });
  const body = Buffer.from(dataUrl.slice(m[0].length), "base64");
  if (!body.length) return NextResponse.json({ error: "That image was empty." }, { status: 400 });
  if (body.length > MAX_BYTES) {
    return NextResponse.json({ error: `That came to ${(body.length / 1048576).toFixed(1)}MB; the limit is 2MB.` }, { status: 413 });
  }

  const key = target.slug ? creativeKey(target.slug) : target.key;
  const path = storagePathFor(key, slot);
  /*
    Wrapped, because a fetch that never reaches the host *throws* rather than
    returning a bad status — and an unhandled throw here is a bare 500 with an
    empty body, which reaches the editor as "Upload failed (500)" and says
    nothing about why.
  */
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
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
  } catch (e) {
    const detail = (e as Error).message;
    console.error(`[creative-upload] ${path} could not reach storage: ${detail}`);
    return NextResponse.json({ error: "Storage could not be reached.", detail }, { status: 502 });
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error(`[creative-upload] ${path} failed (${res.status}): ${detail}`);
    return NextResponse.json({ error: `Storage refused the upload (${res.status}).`, detail }, { status: 502 });
  }

  /*
    A gallery image has to be discoverable, and nothing on the server can list
    a bucket per render. So the slot and its shape are recorded in the
    overrides document every page already fetches — one read, and the page can
    reserve the right space before the image loads.

    Recorded here rather than by the browser afterwards: two requests mean a
    window where the file exists and nothing points at it.
  */
  if (slot.startsWith("showcase-") && width > 0 && height > 0) {
    const current = await readOverridesNow();
    const entry = { ...(current.pages[key] || {}) };
    const list = (entry.showcase || []).filter((x) => x.slot !== slot);
    entry.showcase = [...list, { slot, w: width, h: height }].sort((a, b) => a.slot.localeCompare(b.slot));
    if (galleryTitle.trim()) entry.galleryTitle = galleryTitle.trim();
    const saved = await writeOverrides({
      ...current,
      version: 1,
      updatedAt: new Date().toISOString(),
      pages: { ...current.pages, [key]: entry },
    });
    if (!saved.ok) {
      return NextResponse.json({
        error: "The image uploaded but the page was not told about it.",
        detail: saved.error,
      }, { status: 502 });
    }
  }

  return NextResponse.json({
    ok: true,
    url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
    bytes: body.length,
    key,
    page: target.path,
  });
}
