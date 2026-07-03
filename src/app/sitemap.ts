import { MetadataRoute } from 'next'

const BASE = 'https://www.sjpt.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages = [
    { url: BASE, priority: 1.0 },
    { url: `${BASE}/upscale`, priority: 0.9 },
    { url: `${BASE}/remove-bg`, priority: 0.9 },
    { url: `${BASE}/ai-headshot`, priority: 0.9 },
    { url: `${BASE}/ai-editor`, priority: 0.9 },
    { url: `${BASE}/photo-enhancer`, priority: 0.85 },
    { url: `${BASE}/compress-image`, priority: 0.85 },
    { url: `${BASE}/change-background`, priority: 0.85 },
    { url: `${BASE}/watermark-remover`, priority: 0.85 },
    { url: `${BASE}/make-background-white`, priority: 0.8 },
    { url: `${BASE}/passport-photo`, priority: 0.8 },
    { url: `${BASE}/convert-to-png`, priority: 0.8 },
    { url: `${BASE}/convert-to-jpg`, priority: 0.8 },
    { url: `${BASE}/editor`, priority: 0.7 },
    { url: `${BASE}/pricing`, priority: 0.7 },
    { url: `${BASE}/blog`, priority: 0.7 },
  ]
  return pages.map(p => ({ url: p.url, lastModified: now, changeFrequency: 'weekly', priority: p.priority }))
}
