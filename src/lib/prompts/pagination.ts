/**
 * pagination.ts — turning `?page=` into a number, once, the same way everywhere.
 *
 * Six route files read this query param (the model hubs, the two facet
 * routes, and /prompts/originals). A different parsing rule in one of them —
 * NaN handled differently, negative numbers accepted — is how one listing
 * ends up 404ing on a URL another one of them serves.
 */
export function parsePage(searchParams: { page?: string | string[] }): number {
  const raw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** The canonical URL for a page: bare for page 1, `?page=N` after that. */
export function canonicalFor(url: string, page: number): string {
  return page <= 1 ? url : `${url}?page=${page}`;
}

/** " — Page 3" appended to a title, or nothing on page 1. */
export function pageSuffix(page: number): string {
  return page > 1 ? ` — Page ${page}` : "";
}
