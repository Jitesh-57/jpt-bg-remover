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

/**
 * An extra example image, shown whole.
 *
 * The main pair is cropped to the 4:5 the two panes render at. These are not:
 * they are whole creatives — usually a finished before/after with its own
 * labels — so cropping them would cut the thing that makes them readable. The
 * page needs their shape to reserve the right space before they load, which is
 * why the size is recorded rather than guessed.
 */
export interface ShowcaseImage {
  slot: string;
  w: number;
  h: number;
  /**
   * How wide to draw it, as a percentage of the column.
   *
   * A creative that reads well at 1000px can look shouty at the top of a page
   * and lost at the bottom of one, and which it is depends on the image — so
   * it is a setting rather than a constant. Absent means full width.
   */
  width?: number;
}

export interface PageOverride {
  /**
   * The single image at the top of a creative app page.
   *
   * The template's own version of that block is two cropped panes with BEFORE
   * and AFTER drawn over them. A finished creative already *is* a before and
   * after, with its own labels and its own framing, so cutting it into two 4:5
   * windows destroys it. When this is set the page draws it whole and skips
   * the pair.
   */
  main?: ShowcaseImage;
  showcase?: ShowcaseImage[];
  /** Heading above the gallery. "Examples" reads oddly over a pricing page. */
  galleryTitle?: string;
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

/**
 * The fields an editor may set, grouped by where they appear on the page.
 *
 * Grouped rather than one long list because they are edited for different
 * reasons: the first three are what a search result looks like, the next three
 * are what a visitor reads on arrival. A flat column of seven boxes gives no
 * hint which is which.
 */
export const SECTIONS = [
  {
    id: "search",
    label: "Search result",
    blurb: "What Google shows. Nobody sees this on the page itself.",
    fields: [
      { key: "title", label: "Title", hint: "Google shows roughly 60 characters.", lines: 2 },
      { key: "metaDescription", label: "Meta description", hint: "Roughly 155 characters.", lines: 3 },
      { key: "keywords", label: "Keywords", hint: "Comma separated. Carries little weight, but harmless.", lines: 2 },
    ],
  },
  {
    id: "header",
    label: "Page header",
    blurb: "The first thing a visitor reads.",
    fields: [
      { key: "h1", label: "H1 — the headline", hint: "", lines: 2 },
      { key: "tagline", label: "Tagline under the H1", hint: "", lines: 3 },
      { key: "badge", label: "Badge on the result image", hint: "", lines: 1 },
    ],
  },
  {
    id: "card",
    label: "Hub card",
    blurb: "How this app reads on /creative and the homepage.",
    fields: [
      { key: "intro", label: "Short intro", hint: "One line. Shown under the app name on cards.", lines: 2 },
    ],
  },
] as const;

export interface Field {
  key: FieldKey;
  label: string;
  hint: string;
  lines: number;
}

/** Flat list, for anything that just needs every key. */
export const FIELDS: Field[] = SECTIONS.flatMap((s) => s.fields.map((f) => ({ ...f })));

export type FieldKey = (typeof SECTIONS)[number]["fields"][number]["key"];

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
  return read({ next: { revalidate: 300 } }, Math.floor(Date.now() / 300_000));
}

/**
 * The document as it is *right now*, uncached.
 *
 * Every write is a read-modify-write, and reading through the cache made that
 * quietly lossy: publishing three images in a row recorded the first and the
 * third, because uploads two and three both read the same cached copy from
 * before upload one had landed — and a text edit saved a minute earlier
 * vanished the same way. A writer must see what is actually stored.
 *
 * `no-store` and a unique query string, because there are two caches in the
 * way: Next's own, and whatever sits in front of the storage bucket.
 */
export async function readOverridesNow(): Promise<Overrides> {
  return read({ cache: "no-store" }, Date.now());
}

async function read(init: RequestInit, stamp: number): Promise<Overrides> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return EMPTY;
  try {
    const res = await fetch(`${publicUrl()}?t=${stamp}`, init);
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
 * Fields that are set by uploading an image, not by typing in a box.
 *
 * Named in one place because the text editor must merge *over* them rather
 * than replace the entry: saving a page's title after adding three images used
 * to drop the images, since the editor only ever sends the text it knows about.
 */
export const IMAGE_KEYS = ["main", "showcase", "galleryTitle"] as const;

/**
 * Every page that has gallery images, as a path-keyed index.
 *
 * Only `page/...` keys: an app page draws its own "More examples" section
 * server-side from the same data, and a second copy under the footer would be
 * the same images twice. Reduced to slots and shapes because this crosses to
 * the browser on every request — the text fields would be dead weight there.
 */
export function galleryIndex(o: Overrides): Record<string, ShowcaseImage[]> {
  const out: Record<string, ShowcaseImage[]> = {};
  for (const [key, page] of Object.entries(o.pages || {})) {
    if (!key.startsWith("page/")) continue;
    const list = (page.showcase || []).filter((x) => x && x.slot && x.w > 0 && x.h > 0);
    if (list.length) out[key] = list.map((x) => ({ slot: x.slot, w: x.w, h: x.h, ...(x.width ? { width: x.width } : {}) }));
  }
  return out;
}

/** The gallery heading for a page, defaulted. */
export function galleryTitleFor(o: Overrides, key: string): string {
  return (o.pages?.[key]?.galleryTitle || "").trim() || "Examples";
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
    // Arrays (faq, showcase) are not page fields to merge over — the caller
    // reads them off the override directly.
    else if (Array.isArray(v) && v.length && k === "faq") out[k] = v;
  }
  return out as T;
}

/** Writes the document back. Server-only: needs the service key. */
export async function writeOverrides(next: Overrides): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: false, error: "Storage is not configured on this deployment." };

  // A fetch that cannot reach the host throws rather than returning a status,
  // and the callers of this all have something useful to say about a failure.
  try {
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
  } catch (e) {
    return { ok: false, error: `Storage could not be reached: ${(e as Error).message}` };
  }
}
