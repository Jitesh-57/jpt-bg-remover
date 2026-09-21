/**
 * page-href.ts — the one formula for a paginated listing's URL.
 *
 * Shared by the `<Pagination>` component (which links to these) and the
 * sitemap builder (which lists them) — one place, so a change to the URL
 * shape can't update one and miss the other.
 */
export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
