import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import LandingPage from '../_components/LandingPage'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig('remove-bg')
  return {
    title: config.title,
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      url: 'https://jpt.ai/remove-bg',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: 'https://jpt.ai/remove-bg' },
  }
}

export default async function RemoveBgPage() {
  const config = await getPageConfig('remove-bg')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.h1,
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://jpt.ai/remove-bg',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage config={config} toolHref="/editor?tool=remove-bg" />
    </>
  )
}
