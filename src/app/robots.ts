import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zero SEO value — keep crawlers out entirely. Pages that must stay
      // crawlable so Google can read their `noindex` tag (e.g. /bg-remover,
      // /history, /editor) are intentionally NOT disallowed here.
      disallow: ["/admin", "/api/"],
    },
    sitemap: "https://www.sjpt.io/sitemap.xml",
  };
}
