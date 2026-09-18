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
 *   slot   "main"   the single creative at the top of an app page
 *          "showcase-1".."showcase-9"   a whole image in the page's gallery
 *          "before" | "after"   the template's old cropped pair, kept so the
 *          pages that still have them can be read and cleared
 *
 * Also DELETE (remove an image) and PATCH (change how wide it is drawn), which
 * live here because they act on the same object and the same record.
 *
 * The image arrives already cropped and compressed — the browser does that, on
 * the machine that has the file, which is both faster and the only way this
 * works at all for someone dropping a 6 MB PNG onto a page. The server's job is
 * to check who is asking, check the page is real, and put the bytes where that
 * page looks for them.
 */

const BUCKET = "landing";
const MAX_BYTES = 2 * 1024 * 1024;

const SLOT_ERROR = 'slot must be "main", "showcase-1".."showcase-9", "before" or "after".';
const isSlot = (s: string) => /^(main|before|after|showcase-[1-9])$/.test(s);

/** Resolves a request's page and slot, or the response explaining why not. */
async function resolve(req: NextRequest): Promise<
  { ok: true; key: string; path: string; slot: string; body: Record<string, unknown> } | { ok: false; res: NextResponse }
> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, res: NextResponse.json({ error: "Malformed request." }, { status: 400 }) };
  }
  const page = String(body.page ?? (body.slug ? `creative/${body.slug}` : ""));
  const slot = String(body.slot ?? body.half ?? "");
  const target = resolveTarget(page);
  if (!target) {
    return { ok: false, res: NextResponse.json({ error: `"${page}" is not a page on this site.` }, { status: 400 }) };
  }
  if (target.slug && !CREATIVE_APPS.some((a) => a.slug === target.slug)) {
    return { ok: false, res: NextResponse.json({ error: `"${target.slug}" is not an app on this site.` }, { status: 400 }) };
  }
  if (!isSlot(slot)) {
    return { ok: false, res: NextResponse.json({ error: SLOT_ERROR }, { status: 400 }) };
  }
  const key = target.slug ? creativeKey(target.slug) : target.key;
  return { ok: true, key, path: storagePathFor(key, slot), slot, body };
}

/** The storage credentials, or the response saying they are missing. */
function storage(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

const notConfigured = () => NextResponse.json({
  error: "Storage is not configured on this deployment.",
  fix: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
}, { status: 503 });

/**
 * Removes one image: the file, and the record that points at it.
 *
 *   DELETE /api/admin/creative-upload?token=…   { page, slot }
 *
 * The record goes first. A record pointing at a file that is gone is a broken
 * image on a live page; a file with nothing pointing at it is invisible and
 * costs a few kilobytes — so if only one of the two can happen, it should be
 * the second. The old cropped pair has no record, and deleting the file is
 * what restores the page's built-in artwork.
 */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const store = storage();
  if (!store) return notConfigured();

  const r = await resolve(req);
  if (!r.ok) return r.res;

  if (r.slot === "main" || r.slot.startsWith("showcase-")) {
    const current = await readOverridesNow();
    const entry = { ...(current.pages[r.key] || {}) };
    if (r.slot === "main") delete entry.main;
    else entry.showcase = (entry.showcase || []).filter((x) => x.slot !== r.slot);
    if (!entry.showcase?.length) delete entry.showcase;
    const saved = await writeOverrides({
      ...current, version: 1, updatedAt: new Date().toISOString(),
      pages: { ...current.pages, [r.key]: entry },
    });
    if (!saved.ok) return NextResponse.json({ error: "The page could not be updated.", detail: saved.error }, { status: 502 });
  }

  try {
    const res = await fetch(`${store.url}/storage/v1/object/${BUCKET}/${r.path}`, {
      method: "DELETE",
      headers: { apikey: store.key, Authorization: `Bearer ${store.key}` },
    });
    // A file that is already gone is the state being asked for, not a failure.
    if (!res.ok && res.status !== 404 && res.status !== 400) {
      const detail = (await res.text()).slice(0, 300);
      return NextResponse.json({ error: `Storage refused the delete (${res.status}).`, detail }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Storage could not be reached.", detail: (e as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, slot: r.slot, removed: r.path });
}

/**
 * Changes how wide an image is drawn.
 *
 *   PATCH /api/admin/creative-upload?token=…   { page, slot, width }
 *
 * Only the record changes — the file is already the right size, and
 * re-encoding it to draw it smaller would cost a round trip and some quality
 * to achieve what one CSS number does.
 */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!storage()) return notConfigured();

  const r = await resolve(req);
  if (!r.ok) return r.res;

  const width = Math.round(Number(r.body.width));
  if (!(width >= 25 && width <= 100)) {
    return NextResponse.json({ error: "width must be a percentage between 25 and 100." }, { status: 400 });
  }
  if (r.slot !== "main" && !r.slot.startsWith("showcase-")) {
    return NextResponse.json({ error: "Only the main creative and the gallery images have a width." }, { status: 400 });
  }

  const current = await readOverridesNow();
  const entry = { ...(current.pages[r.key] || {}) };
  if (r.slot === "main") {
    if (!entry.main) return NextResponse.json({ error: "There is no main creative on this page yet." }, { status: 404 });
    entry.main = { ...entry.main, width };
  } else {
    const list = entry.showcase || [];
    const found = list.find((x) => x.slot === r.slot);
    if (!found) return NextResponse.json({ error: `There is no image in ${r.slot} yet.` }, { status: 404 });
    entry.showcase = list.map((x) => (x.slot === r.slot ? { ...x, width } : x));
  }
  const saved = await writeOverrides({
    ...current, version: 1, updatedAt: new Date().toISOString(),
    pages: { ...current.pages, [r.key]: entry },
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 502 });
  return NextResponse.json({ ok: true, slot: r.slot, width });
}

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

  if (!isSlot(slot)) {
    return NextResponse.json({ error: SLOT_ERROR }, { status: 400 });
  }
  /*
    The hero and the old pair are drawn by the creative app template and
    nothing else. Accepting "main" for /pricing would store a file that page
    has no place to show, which is exactly the failure this route exists to
    prevent.
  */
  if (!target.slug && !slot.startsWith("showcase-")) {
    return NextResponse.json({
      error: `${target.path} has no main creative — that belongs to the creative app pages.`,
      fix: "Use one of the gallery slots instead.",
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
  if ((slot === "main" || slot.startsWith("showcase-")) && width > 0 && height > 0) {
    const current = await readOverridesNow();
    const entry = { ...(current.pages[key] || {}) };
    if (slot === "main") {
      // Keeping the chosen width across a re-upload: someone replacing the
      // image has not asked for it to jump back to full width.
      entry.main = { slot, w: width, h: height, ...(entry.main?.width ? { width: entry.main.width } : {}) };
    } else {
      const previous = (entry.showcase || []).find((x) => x.slot === slot);
      const list = (entry.showcase || []).filter((x) => x.slot !== slot);
      entry.showcase = [...list, { slot, w: width, h: height, ...(previous?.width ? { width: previous.width } : {}) }]
        .sort((a, b) => a.slot.localeCompare(b.slot));
    }
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
