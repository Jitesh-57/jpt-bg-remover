import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

/**
 * The sitemap index — what `robots.txt` points crawlers at.
 *
 * Six files instead of one `<urlset>`: Search Console reports indexing per
 * sitemap, and one blended number across every kind of page on the site was
 * hiding which kind of page actually had the problem.
 */
export async function GET() {
  return xmlResponse(sitemapIndexXml([
    `${BASE}/sitemap-pages.xml`,
    `${BASE}/sitemap-tools.xml`,
    `${BASE}/sitemap-blog.xml`,
    `${BASE}/sitemap-prompts.xml`,
    `${BASE}/sitemap-video-prompts.xml`,
    `${BASE}/sitemap-creative.xml`,
  ]));
}
