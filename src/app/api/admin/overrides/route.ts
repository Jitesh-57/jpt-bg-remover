import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-token";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import { EMPTY, readOverrides, writeOverrides, type Overrides, type PageOverride } from "@/lib/overrides";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Keys an editor is allowed to write. Anything else is dropped. */
const ALLOWED = new Set(["title", "metaDescription", "keywords", "h1", "tagline", "intro", "badge", "faq"]);
const MAX_FIELD = 2000;

/** Pages the editor may address: every app, plus the handful of key pages. */
const STATIC_KEYS = new Set(["page/home", "page/pricing", "page/tools", "page/creative"]);

function validKey(key: string): boolean {
  if (STATIC_KEYS.has(key)) return true;
  const m = /^creative\/([a-z0-9-]+)$/.exec(key);
  return !!m && CREATIVE_APPS.some((a) => a.slug === m[1]);
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
  return NextResponse.json(await readOverrides());
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

  const current = await readOverrides();
  const next: Overrides = {
    ...EMPTY,
    ...current,
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: { ...current.pages },
  };

  const cleaned = clean(values || {});
  if (Object.keys(cleaned).length) next.pages[key] = cleaned;
  else delete next.pages[key];

  const res = await writeOverrides(next);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });

  return NextResponse.json({ ok: true, key, fields: Object.keys(cleaned), pagesWithOverrides: Object.keys(next.pages).length });
}
