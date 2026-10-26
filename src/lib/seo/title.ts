/**
 * title.ts — page titles that fit in a search result.
 *
 * Google shows roughly 60 characters of a title. The audit found 868 of 1,484
 * titles longer than 65, and pages whose title already ended in
 * "| Pixel Shine" going through the root template "%s | Pixel Shine" and
 * showing the brand twice. Titles built here are passed as `absolute`, carry
 * the brand once, and lead with the keyword: when something has to go, the
 * brand goes before the words people searched for.
 */

export const BRAND_NAME = "Pixel Shine";
export const TITLE_MAX = 60;

/** "X | Pixel Shine", "X — Pixel Shine", "X · Pixel Shine" → "X". */
export function stripBrand(title: string): string {
  return title.replace(/\s*[|—–·-]\s*Pixel Shine\s*$/i, "").trim();
}

/** The first candidate that fits; otherwise the last one cut at a word boundary. */
export function fitTitle(candidates: string[], max = TITLE_MAX): string {
  const list = candidates.map((c) => c.trim()).filter(Boolean);
  const fit = list.find((c) => c.length <= max);
  if (fit) return fit;
  const last = list[list.length - 1] ?? "";
  const cut = last.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : last.slice(0, max)).replace(/[\s,;:—–|·(-]+$/, "");
}

/**
 * The best title that fits, in this order:
 *   "Keyword — qualifier | Pixel Shine"
 *   "Keyword — qualifier"
 *   "Keyword | Pixel Shine"      (the part before the dash)
 *   "Keyword"
 * The brand is never added to a title that already names it.
 */
export function brandedTitle(main: string | undefined, max = TITLE_MAX): string {
  const full = stripBrand(main ?? "");
  // A listing's " — Page 2" survives every shortening: dropped with the
  // qualifier, it left pages 2, 3, 4… of a listing all titled like page 1.
  const page = full.match(/\s+—\s+Page \d+$/)?.[0] ?? "";
  const m = page ? full.slice(0, -page.length) : full;
  const head = m.split(/\s+[—–|]\s+|\s+-\s+/)[0].trim();
  const brand = (t: string) => (/pixel shine/i.test(t) ? t : `${t} | ${BRAND_NAME}`);
  return fitTitle([brand(m + page), m + page, brand(head + page), head + page], max);
}
