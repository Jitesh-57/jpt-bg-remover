import { MetadataRoute } from "next";
import { POSTS } from "./blog/_data/posts";

const BASE = "https://www.sjpt.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                       lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/upscale`,          lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/remove-bg`,        lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/ai-editor`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/ai-headshot`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/editor`,           lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/batch-editor`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`,          lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/blog`,             lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/privacy`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
