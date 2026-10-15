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

/** Every string in a metadata object, at any depth, with the name spelled for search. URLs and the like are left alone. */
export function seoMeta<T>(value: T): T {
  if (typeof value === "string") return seoText(value) as T;
  if (Array.isArray(value)) return value.map((v) => seoMeta(v)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = seoMeta(v);
    return out as T;
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
