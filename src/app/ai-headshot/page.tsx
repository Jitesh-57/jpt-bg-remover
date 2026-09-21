import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import LandingPage from '../_components/LandingPage'
import { variantsFor, PARENT_META } from '@/lib/landing-variants'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig('headshot')
  return {
    title: { absolute: config.title },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      url: 'https://www.sjpt.io/ai-headshot',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: 'https://www.sjpt.io/ai-headshot' },
  }
}

export default async function AIHeadshotPage() {
  const config = await getPageConfig('headshot')
  const relatedVariants = variantsFor('ai-headshot').map(v => ({ slug: v.slug, h1: v.h1, href: `${PARENT_META['ai-headshot'].base}/${v.slug}` }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.h1,
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://www.sjpt.io/ai-headshot',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage config={config} toolHref="/headshot" pageId="headshot" relatedVariants={relatedVariants} />
    </>
  )
}
