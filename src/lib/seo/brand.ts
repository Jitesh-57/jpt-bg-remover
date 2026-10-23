import type { Metadata } from "next";

/**
 * brand.ts — the name as search engines and link previews show it.
 *
 * Search results and shared links say "PixelShine"; the pages themselves keep
 * the copy they display. So the spelling is corrected only where a page's
 * metadata and structured data are produced, never in the text both share:
 * every page's metadata passes through seoMeta() (or withSeoMeta() for
 * generateMetadata), and every JSON-LD block is written with seoJson().
 */

const OLD_SPELLING = /Pixel Shine/g;
const NAME = "PixelShine";

export function seoText(text: string): string {
  return text.replace(OLD_SPELLING, NAME);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * The picture a shared link shows when its page names none of its own: the
 * name, the headline and three apps' results, 1200×630 (public/og.jpg).
 */
export const SHARE_IMAGE = "/og.jpg";

function hasImages(v: unknown): boolean {
  const images = isPlainObject(v) ? v.images : undefined;
  return Array.isArray(images) ? images.some(Boolean) : !!images;
}

/**
 * A page that sets its own openGraph replaces the layout's whole block, image
 * included, so a page that forgot one shared as a bare link. Every one now
 * falls back to SHARE_IMAGE, and X to whatever openGraph shows.
 */
function withShareImage(meta: Record<string, unknown>): Record<string, unknown> {
  const out = { ...meta };
  if (isPlainObject(out.openGraph) && !hasImages(out.openGraph)) out.openGraph = { ...out.openGraph, images: [SHARE_IMAGE] };
  if (isPlainObject(out.twitter) && !hasImages(out.twitter)) {
    out.twitter = { ...out.twitter, images: hasImages(out.openGraph) ? (out.openGraph as Record<string, unknown>).images : [SHARE_IMAGE] };
  }
  return out;
}

/** Every string in a metadata object, at any depth, with the name spelled for search. URLs and the like are left alone. */
export function seoMeta<T>(value: T): T {
  if (typeof value === "string") return seoText(value) as T;
  if (Array.isArray(value)) return value.map((v) => seoMeta(v)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = seoMeta(v);
    // Only a page's metadata has these keys, so this is a no-op at any other depth.
    return ("openGraph" in out || "twitter" in out ? withShareImage(out) : out) as T;
  }
  return value;
}

/** Wraps a generateMetadata so whatever it returns goes through seoMeta(). */
export function withSeoMeta<A extends unknown[]>(
  generate: (...args: A) => Metadata | Promise<Metadata>,
): (...args: A) => Promise<Metadata> {
  return async (...args: A) => seoMeta(await generate(...args));
}

/** JSON.stringify for a JSON-LD block, with the name spelled for search. */
export function seoJson(...args: Parameters<typeof JSON.stringify>): string {
  return seoText(JSON.stringify(...args));
}
