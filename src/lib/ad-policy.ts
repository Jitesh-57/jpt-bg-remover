/**
 * ad-policy.ts — which pages may carry AdSense ads, and which pages search
 * engines should not index.
 *
 * AdSense rejected sjpt.io with "We found some policy violations". The review
 * looks at the whole site, so two rules keep it clean:
 *
 *  1. Ads load only on pages whose main purpose is original written content
 *     (home, blog, guides). Upload widgets, editors, account screens and the
 *     third-party prompt gallery are "screens without publisher content" in
 *     AdSense terms, so the loader never runs there.
 *
 *  2. The prompt gallery republished from an outside dataset (YouMind OpenLab,
 *     CC BY 4.0) is kept for users but marked noindex. Republished content is
 *     "copied content" to Google even when the licence allows it. Our own
 *     originals (/prompts/originals and their detail pages) stay indexed.
 *
 * To put ads on a new section, add its prefix to AD_ALLOWED_PREFIXES — only
 * after it has real, original text on the page.
 */

/** Exact paths that may show ads. */
const AD_ALLOWED_EXACT = new Set<string>(["/", "/about", "/contact"]);

/** Path prefixes (the path itself and anything under it) that may show ads. */
const AD_ALLOWED_PREFIXES = ["/blog", "/answers", "/ai", "/use-cases", "/alternatives", "/docs"];

function underPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + "/");
}

export function adsAllowed(path: string | null | undefined): boolean {
  if (!path) return false;
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (AD_ALLOWED_EXACT.has(p)) return true;
  // "/ai" must not match "/ai-editor" or "/ai-headshot" — underPrefix handles that.
  return AD_ALLOWED_PREFIXES.some((pre) => underPrefix(p, pre));
}

/**
 * Third-party dataset pages: noindex, follow. Detail pages under /prompts/<slug>
 * are handled in their own generateMetadata, because originals and dataset
 * records share that route.
 */
const NOINDEX_PREFIXES = ["/video-prompts", "/prompts/image", "/prompts/video", "/prompts-pack"];
const MODEL_PROMPT_PAGE = /^\/[a-z0-9-]+-prompts(\/|$)/;
const OWN_PROMPT_PAGES = new Set(["/80s-ai-photo-prompts"]);

export function shouldNoindex(path: string): boolean {
  if (NOINDEX_PREFIXES.some((pre) => underPrefix(path, pre))) return true;
  if (MODEL_PROMPT_PAGE.test(path)) {
    const root = "/" + path.split("/")[1];
    return !OWN_PROMPT_PAGES.has(root);
  }
  return false;
}
