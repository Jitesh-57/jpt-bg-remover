import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import Link from 'next/link'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
import LandingPage from '../_components/LandingPage'
import { CONVERSIONS, buildContent } from '@/lib/conversions'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('convert-image')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('convert-image', config.og_image),
      url: 'https://www.sjpt.io/convert-image',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('convert-image', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/convert-image' },
  }
}

export default async function Page() {
  const config = await getPageConfig('convert-image')

  return (
    <>
      <LandingPage path="/convert-image" guides={<GuidesBlock path="/convert-image" />} config={config} toolHref="/editor?tool=convert" pageId="convert-image" />

      {/* Popular conversions — internal links to the per-format landing pages */}
      <section style={{ background: 'var(--surface)', padding: '56px 24px 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Popular image conversions
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>
            Free, instant, no watermark — pick a conversion to get started.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {CONVERSIONS.map((c) => {
              const ct = buildContent(c)
              return (
                <Link key={c.slug} href={`/convert/${c.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
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

export const generateMetadata = withSeoMeta(generateMetadataBase);
