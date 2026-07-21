import { Metadata } from 'next'
import Link from 'next/link'
import { getPageConfig } from '@/lib/page-config'
import LandingPage from '../_components/LandingPage'
import { CONVERSIONS, buildContent } from '@/lib/conversions'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig('convert-image')
  return {
    title: { absolute: config.title },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      url: 'https://www.sjpt.io/convert-image',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: 'https://www.sjpt.io/convert-image' },
  }
}

export default async function Page() {
  const config = await getPageConfig('convert-image')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.h1,
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://www.sjpt.io/convert-image',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage config={config} toolHref="/editor?tool=convert" pageId="convert-image" />

      {/* Popular conversions — internal links to the per-format landing pages */}
      <section style={{ background: '#fff', padding: '56px 24px 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Popular image conversions
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 28px' }}>
            Free, instant, no watermark — pick a conversion to get started.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {CONVERSIONS.map((c) => {
              const ct = buildContent(c)
              return (
                <Link key={c.slug} href={`/convert/${c.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F5F6FB', border: '1px solid #EAECF5', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: '#334155', textDecoration: 'none' }}>
                  {ct.fromLabel} → {ct.toLabel}
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
