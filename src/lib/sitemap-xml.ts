import type { SitemapUrl } from "./sitemap-data";

/**
 * Hand-rolled XML rather than the `sitemap.ts` convention.
 *
 * The convention only produces one flavour of file: a `<urlset>` at exactly
 * `/sitemap.xml`. Splitting into `/sitemap-prompts.xml` and friends, with a
 * `<sitemapindex>` naming them, needs Route Handlers that control their own
 * path and their own XML root element — the convention offers neither.
 *
 * No `priority` or `changefreq` on any entry: Google has said for years it
 * ignores both, and a field that is read and acted on by nothing is not
 * neutral, it is noise a future edit of this file might spend time getting
 * "right".
 */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function urlsetXml(entries: SitemapUrl[]): string {
  const body = entries.map((e) => (
    `<url><loc>${esc(e.url)}</loc>${e.lastModified ? `<lastmod>${esc(e.lastModified)}</lastmod>` : ""}</url>`
  )).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(files: string[]): string {
  const body = files.map((f) => `<sitemap><loc>${esc(f)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Matches the app pages' own ISR window — a sitemap that is stale for
      // five minutes after a deploy costs nothing; one regenerated on every
      // hit costs a full walk of the dataset per crawler request.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
