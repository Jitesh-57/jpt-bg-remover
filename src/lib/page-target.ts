/**
 * page-target.ts — turning "the page I mean" into a key, a path and a filename.
 *
 * The admin console used to address one thing: a creative app, chosen from a
 * list. That list is 200 pages out of 500-odd, and the other 300 — the tool
 * landing pages, the prompt pages, the blog, pricing, the homepage — had no way
 * to receive an image at all. So a target is now a *URL*, which is the thing
 * someone actually has in hand when they decide a page needs a picture.
 *
 * One input, three outputs:
 *
 *   key    what the overrides document stores it under      "page/pricing"
 *   path   where it renders                                 "/pricing"
 *   slug   the creative app, when it is one                 "age-progression-tool"
 *
 * Existing keys are kept exactly as they were — `creative/<slug>` for an app,
 * `page/home` for the homepage — so nothing already stored has to be migrated.
 */

const BUCKET = "landing";

/** The homepage has no path segment to name it, so it gets one. */
const HOME_KEY = "page/home";

/**
 * Routes that exist but must never be a target.
 *
 * Not a taste judgement: /api serves JSON, /admin is this console, and the
 * signed-in pages are per-user views nobody arrives at from a search result.
 * An image published to one of them would be a file nothing ever shows.
 */
const CLOSED = ["api", "admin", "history", "generations", "invoices"];

export interface PageTarget {
  /** The overrides key. */
  key: string;
  /** The path it renders at, leading slash, no trailing slash. */
  path: string;
  /** The creative app slug, when the target is one of those pages. */
  slug: string | null;
}

/**
 * A path, once it is known to be one, as a target.
 *
 * Segments are restricted to what this site's routes actually use, and
 * deliberately exclude `_`: the storage filename is the key with its slashes
 * turned into underscores, and allowing both would let `/a/b` and `/a_b` write
 * to the same file.
 */
function fromPath(raw: string): PageTarget | null {
  const path = raw.replace(/\/+$/, "") || "/";
  if (path === "/") return { key: HOME_KEY, path: "/", slug: null };
  if (!path.startsWith("/")) return null;

  const segments = path.slice(1).split("/");
  if (segments.length > 5) return null;
  if (!segments.every((s) => /^[a-z0-9.-]{1,80}$/.test(s) && s !== "." && s !== "..")) return null;
  if (CLOSED.includes(segments[0])) return null;

  if (segments[0] === "creative" && segments.length === 2) {
    return { key: `creative/${segments[1]}`, path, slug: segments[1] };
  }
  return { key: `page/${segments.join("/")}`, path, slug: null };
}

/**
 * What someone pasted, as a target — or null, with no guessing.
 *
 * Accepts a full URL, a path, or a bare app slug, because all three are things
 * people paste. An off-site URL is rejected rather than reduced to its path:
 * pasting a competitor's page and having an image quietly land on your own
 * lookalike path is the kind of helpfulness that ruins an afternoon.
 */
export function parseTarget(input: string): PageTarget | null {
  const text = (input || "").trim().toLowerCase();
  if (!text) return null;

  if (/^https?:\/\//.test(text)) {
    let url: URL;
    try { url = new URL(text); } catch { return null; }
    const host = url.hostname;
    const ours = host === "sjpt.io" || host.endsWith(".sjpt.io") || host === "localhost" || host === "127.0.0.1";
    if (!ours) return null;
    return fromPath(url.pathname);
  }

  // Not a URL: a path, or a bare slug meant as one.
  return fromPath(text.startsWith("/") ? text.split(/[?#]/)[0] : `/${text.split(/[?#]/)[0]}`);
}

/**
 * A target from anything the console or a stored document might hold: a URL, a
 * path, or an overrides key.
 *
 * Keys are round-tripped through `pathFor` rather than parsed separately,
 * because `page/home` renders at `/` and any second implementation of that fact
 * is a second place for it to drift.
 */
export function resolveTarget(input: string): PageTarget | null {
  const text = (input || "").trim().toLowerCase();
  if (!text) return null;
  if (text.startsWith("creative/") || text.startsWith("page/")) return parseTarget(pathFor(text));
  return parseTarget(text);
}

/** The key a path renders under. The inverse of `pathFor`. */
export function pageKeyFromPath(path: string): string {
  return parseTarget(path)?.key ?? "";
}

/** Where a key renders. */
export function pathFor(key: string): string {
  if (key === HOME_KEY) return "/";
  if (key.startsWith("creative/")) return `/${key}`;
  return `/${key.slice("page/".length)}`;
}

/**
 * The storage path for one image.
 *
 * Creative apps keep the flat `creatives/<slug>-<slot>.webp` they have always
 * used — there are live pages pointing at those files and a rename would blank
 * every one of them. Everything else goes under `creatives/pages/`, named after
 * the key, so the bucket stays readable by eye.
 */
export function storagePathFor(key: string, slot: string): string {
  if (key.startsWith("creative/")) return `creatives/${key.slice("creative/".length)}-${slot}.webp`;
  return `creatives/pages/${key.slice("page/".length).replace(/\//g, "_")}-${slot}.webp`;
}

/** The public URL of one image, whether or not it has been uploaded yet. */
export function imageUrlFor(key: string, slot: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePathFor(key, slot)}`;
}

/** The filename an editor sees before publishing. */
export function fileNameFor(key: string, slot: string): string {
  return storagePathFor(key, slot).split("/").pop() || "";
}
