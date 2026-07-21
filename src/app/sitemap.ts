import { MetadataRoute } from "next";
import { POSTS } from "./blog/_data/posts";
import { VARIANTS, PARENT_META } from "@/lib/landing-variants";
import { CREATIVE_APPS, CREATIVE_BASE } from "@/lib/creative-apps";
import { CONVERSIONS } from "@/lib/conversions";
import { PAID_FEATURES_ENABLED } from "@/lib/features";

const BASE = "https://www.sjpt.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only the free, live pages are indexed in free-only mode.
  const freePages: MetadataRoute.Sitemap = [
    { url: BASE,                       lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/upscale`,          lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/compress-image`,   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/convert-image`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/crop-image`,       lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/rotate-image`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/watermark-image`,  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/meme-generator`,   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/image-to-pdf`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/tiktok-watermark-remover`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    // /editor is noindex (tool UI) — excluded from sitemap
    { url: `${BASE}/batch-editor`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`,             lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/privacy`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  // The published (upscale-only) blog posts.
  const freeBlogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Live upscale landing variants (e.g. /upscale/4k). Other parents redirect
  // home in free-only mode, so only the upscale variants are indexable here.
  const freeVariantPages: MetadataRoute.Sitemap = VARIANTS
    .filter((v) => v.parent === "upscale")
    .map((v) => ({
      url: `${BASE}${PARENT_META[v.parent].base}/${v.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  // Programmatic image-conversion landing pages (e.g. /convert/png-to-jpg).
  const conversionPages: MetadataRoute.Sitemap = CONVERSIONS.map((c) => ({
    url: `${BASE}/convert/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  if (!PAID_FEATURES_ENABLED) return [...freePages, ...freeVariantPages, ...conversionPages, ...freeBlogPages];

  const paidPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/remove-bg`,        lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/ai-editor`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/ai-headshot`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,          lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/blog`,             lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}${CREATIVE_BASE}`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
  ];

  const blogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const variantPages: MetadataRoute.Sitemap = VARIANTS.map((v) => ({
    url: `${BASE}${PARENT_META[v.parent].base}/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const creativePages: MetadataRoute.Sitemap = CREATIVE_APPS.map((a) => ({
    url: `${BASE}${CREATIVE_BASE}/${a.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...freePages, ...paidPages, ...variantPages, ...creativePages, ...blogPages];
}
