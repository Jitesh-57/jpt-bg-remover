# Step 1 — Get Indexed (do this first, ~20 min)

Ranking is impossible before indexing. This is free and the fastest win available.

## Google Search Console

1. Go to https://search.google.com/search-console and add property **https://www.sjpt.io**.
2. Verify (DNS TXT record, or the HTML meta-tag method — you control the `<head>`).
3. **Sitemaps** → submit: `https://www.sjpt.io/sitemap.xml`
4. **URL Inspection** → paste each of your top pages → **Request Indexing**. Do these first:
   - `https://www.sjpt.io/`
   - `https://www.sjpt.io/upscale`
   - `https://www.sjpt.io/compress-image`
   - `https://www.sjpt.io/convert-image`
   - `https://www.sjpt.io/crop-image`
   - `https://www.sjpt.io/image-to-pdf`
   - `https://www.sjpt.io/tiktok-watermark-remover`
   - `https://www.sjpt.io/alternatives`
   - `https://www.sjpt.io/alternatives/remove-bg-alternative`
   - `https://www.sjpt.io/blog`
   - Your 3–5 best blog posts

> You can request indexing for a limited number of URLs per day. Prioritise the
> highest-value pages first; the sitemap handles the long tail over time.

## Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters and add **https://www.sjpt.io**.
2. **Import from Google Search Console** (one click — saves re-verifying), or verify directly.
3. Submit the same sitemap: `https://www.sjpt.io/sitemap.xml`
4. Use **URL Inspection → Request Indexing** on the same priority pages.
   (Bing also powers DuckDuckGo, Ecosia and — increasingly — AI answer engines.)

## Verify the fundamentals

- `https://www.sjpt.io/robots.txt` — confirm it does **not** block the tool/landing pages and that it points to the sitemap.
- `https://www.sjpt.io/sitemap.xml` — open it and confirm the new `/alternatives/*` URLs are present.
- Spot-check a couple of pages with GSC's **URL Inspection → Test Live URL** to confirm Google can render them and sees the JSON-LD (SoftwareApplication / FAQ / BreadcrumbList).

## After ~1 week

- GSC **Pages** report: confirm pages are moving from "Discovered/Crawled" to "Indexed".
- GSC **Performance**: first impressions should appear. Note which queries show up — those are your quick-win optimisation targets.
- Fix anything under **Pages → Not indexed** with a reason you can act on (redirects, canonicals, soft-404s).
