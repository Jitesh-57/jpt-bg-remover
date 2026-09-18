import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import { EMPTY, IMAGE_KEYS, readOverridesNow, writeOverrides, type Overrides, type PageOverride } from "@/lib/overrides";
import { resolveTarget } from "@/lib/page-target";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Keys an editor is allowed to write. Anything else is dropped. */
const ALLOWED = new Set(["title", "metaDescription", "keywords", "h1", "tagline", "intro", "badge", "faq"]);
const MAX_FIELD = 2000;

/**
 * Any page on the site, resolved the same way the uploader resolves one.
 *
 * It used to be four hard-coded keys plus the app list, which meant text could
 * only be edited for pages someone had remembered to name here. A creative slug
 * is still checked against the apps that exist, because that one is a claim
 * about a page that may simply not be there.
 */
function validKey(key: string): boolean {
  const target = resolveTarget(key);
  if (!target) return false;
  if (target.key !== key) return false;
  return !target.slug || CREATIVE_APPS.some((a) => a.slug === target.slug);
}

/**
 * Read and write the site's text overrides.
 *
 *   GET  /api/admin/overrides?token=…            the whole document
 *   POST /api/admin/overrides?token=…            { key, values } — merge one page
 *
 * A merge rather than a replace: two tabs open on different pages should not
 * be able to wipe each other's work, and the editor only ever knows about the
 * page in front of it.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  // Uncached: an editor opening a page wants what is stored, not what a
  // five-minute cache remembers — they may have saved it a minute ago.
  return NextResponse.json(await readOverridesNow());
}

function clean(values: Record<string, unknown>): PageOverride {
  const out: PageOverride = {};
  for (const [k, v] of Object.entries(values)) {
    if (!ALLOWED.has(k)) continue;
    if (k === "faq") {
      if (!Array.isArray(v)) continue;
      const faq = v
        .filter((x): x is { q: string; a: string } => !!x && typeof x === "object" && typeof (x as { q: unknown }).q === "string")
        .map((x) => ({ q: String(x.q).slice(0, 300), a: String(x.a ?? "").slice(0, MAX_FIELD) }))
        .filter((x) => x.q.trim() && x.a.trim());
      if (faq.length) out.faq = faq;
      continue;
    }
    if (typeof v !== "string") continue;
    const s = v.slice(0, MAX_FIELD);
    // An empty box means "no opinion", so the key is simply omitted — which is
    // also how a field gets reset to the built-in copy.
    if (s.trim()) (out as Record<string, string>)[k] = s;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let key: string, values: Record<string, unknown>;
  try {
    ({ key, values } = (await req.json()) as { key: string; values: Record<string, unknown> });
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!validKey(key)) {
    return NextResponse.json({ error: `"${key}" is not a page on this site.` }, { status: 400 });
  }

  // Uncached: this is a read-modify-write, and a stale read silently drops
  // whatever landed since it was cached.
  const current = await readOverridesNow();
  const next: Overrides = {
    ...EMPTY,
    ...current,
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: { ...current.pages },
  };

  /*
    Merged over what is already stored, never assigned over it.

    A page's entry holds two kinds of thing: text typed in the editor, and the
    image list written by the uploader. The editor only ever knows about the
    text, so assigning its payload straight in deleted the images — save a
    title after adding three creatives and the gallery emptied itself.
  */
  const cleaned = clean(values || {});
  const existing = current.pages[key] || {};
  const kept: PageOverride = {};
  for (const k of IMAGE_KEYS) {
    const v = existing[k];
    if (v !== undefined) (kept as Record<string, unknown>)[k] = v;
  }
  const merged = { ...kept, ...cleaned };
  if (Object.keys(merged).length) next.pages[key] = merged;
  else delete next.pages[key];

  const res = await writeOverrides(next);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });

  return NextResponse.json({ ok: true, key, fields: Object.keys(cleaned), pagesWithOverrides: Object.keys(next.pages).length });
}
