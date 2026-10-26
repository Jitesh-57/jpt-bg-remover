import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zero SEO value — keep crawlers out entirely. Pages that must stay
      // crawlable so Google can read their `noindex` tag (e.g. /bg-remover,
      // /history, /editor) are intentionally NOT disallowed here.
      //
      // Also the parameter copies of pages: the prompt library's tag
      // searches (?q=), its category filter (?c=) and each prompt's
      // "Generate" link (?generate=1). Each is canonical to the page without
      // the parameter, but there are thousands of links to them, and every
      // crawl spent there is one not spent on a page that can rank.
      disallow: ["/admin", "/api/", "/*?q=", "/*&q=", "/*?generate=", "/*&generate=", "/prompts/originals?c="],
    },
    sitemap: "https://www.sjpt.io/sitemap.xml",
  };
}
