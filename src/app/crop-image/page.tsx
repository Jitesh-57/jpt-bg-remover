import { Metadata } from 'next'
import Link from 'next/link'
import { getPageConfig } from '@/lib/page-config'
import LandingPage from '../_components/LandingPage'
import { CROPS } from '@/lib/crops'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig('crop-image')
  return {
    title: { absolute: config.title },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      url: 'https://www.sjpt.io/crop-image',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: 'https://www.sjpt.io/crop-image' },
  }
}

export default async function Page() {
  const config = await getPageConfig('crop-image')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.h1,
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://www.sjpt.io/crop-image',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage config={config} toolHref="/editor?tool=crop" pageId="crop-image" />

      {/* Popular crop presets — internal links to the crop preset pages */}
      <section style={{ background: '#fff', padding: '56px 24px 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Popular crop presets</h2>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 28px' }}>Crop to the exact shape you need — free, one click, no watermark.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {CROPS.map((c) => (
              <Link key={c.slug} href={`/crop/${c.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FAF5FF', border: '1px solid #EEE0FB', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: '#7C3AED', textDecoration: 'none' }}>
                {c.h1.replace(/ \(.*\)$/, '')}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
