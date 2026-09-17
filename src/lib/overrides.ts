/**
 * overrides.ts — text you edit in /admin that a deploy must not undo.
 *
 * Every app's title, description, H1 and FAQ lives in creative-apps.ts, which
 * is code. Editing code from an admin page would mean writing to the
 * filesystem of a serverless instance — lost on the next request — or pushing
 * a commit, which is a deploy per typo. Either way the next deploy is the
 * thing that decides what the page says, and that is exactly what must not
 * happen to someone's hand-written copy.
 *
 * So overrides live in Supabase Storage, outside the repo and outside the
 * build. Code supplies the default; the stored document wins where it has an
 * opinion. A deploy replaces the defaults and leaves the overrides alone.
 *
 * One document rather than a row per page: the whole thing is a few hundred
 * kilobytes at most, every render wants the same few keys, and one fetch that
 * Next caches for the page's revalidate window beats a query per page.
 */

const BUCKET = "landing";
const PATH = "overrides/site.json";

export interface PageOverride {
  title?: string;
  metaDescription?: string;
  keywords?: string;
  h1?: string;
  tagline?: string;
  intro?: string;
  badge?: string;
  faq?: { q: string; a: string }[];
}

export interface Overrides {
  version: 1;
  updatedAt: string;
  pages: Record<string, PageOverride>;
}

export const EMPTY: Overrides = { version: 1, updatedAt: "", pages: {} };

/** The fields an editor may set, in the order they are shown. */
export const FIELDS = [
  { key: "title", label: "Browser / SERP title", hint: "Google shows roughly 60 characters.", lines: 2 },
  { key: "metaDescription", label: "Meta description", hint: "Roughly 155 characters.", lines: 3 },
  { key: "keywords", label: "Keywords", hint: "Comma separated. Carries little weight, but harmless.", lines: 2 },
  { key: "h1", label: "H1 — the page's headline", hint: "", lines: 2 },
  { key: "tagline", label: "Tagline under the H1", hint: "", lines: 3 },
  { key: "intro", label: "Short intro (used on hub cards)", hint: "", lines: 2 },
  { key: "badge", label: "Badge on the result image", hint: "", lines: 1 },
] as const;

export type FieldKey = (typeof FIELDS)[number]["key"];

function publicUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${BUCKET}/${PATH}`;
}

/**
 * The stored overrides, or empty.
 *
 * Never throws and never blocks a page on a storage problem: a page that
 * cannot reach the override document should render its built-in copy, not a
 * 500. `revalidate` matches the app pages' own window, so this is one fetch
 * per page per five minutes rather than one per visitor.
 */
export async function readOverrides(): Promise<Overrides> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return EMPTY;
  try {
    const res = await fetch(`${publicUrl()}?t=${Math.floor(Date.now() / 300_000)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY;
    const json = (await res.json()) as Overrides;
    if (!json || typeof json !== "object" || !json.pages) return EMPTY;
    return json;
  } catch {
    return EMPTY;
  }
}

/** The key a page is stored under. Stable, and readable in the JSON. */
export function creativeKey(slug: string): string {
  return `creative/${slug}`;
}

/**
 * Applies an override to a record, field by field.
 *
 * Only non-empty strings win. An empty box in the editor means "no opinion,
 * use the built-in copy" rather than "make this page's title blank" — which
 * is both what someone clearing a field intends and the safer reading.
 */
export function applyOverride<T extends object>(base: T, o: PageOverride | undefined): T {
  if (!o) return base;
  const out = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
    else if (Array.isArray(v) && v.length) out[k] = v;
  }
  return out as T;
}

/** Writes the document back. Server-only: needs the service key. */
export async function writeOverrides(next: Overrides): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };

  const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${PATH}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "x-upsert": "true",
      // Short, because an editor wants to see their own change land.
      "Cache-Control": "public, max-age=60",
    },
    body: JSON.stringify(next, null, 2),
  });
  if (!res.ok) return { ok: false, error: `Storage refused the write (${res.status}).` };
  return { ok: true };
}
