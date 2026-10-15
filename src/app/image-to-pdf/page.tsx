import { seoJson, withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import LandingPage from '../_components/LandingPage'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('image-to-pdf')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      url: 'https://www.sjpt.io/image-to-pdf',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: 'https://www.sjpt.io/image-to-pdf' },
  }
}

export default async function Page() {
  const config = await getPageConfig('image-to-pdf')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.h1,
    description: config.meta_description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://www.sjpt.io/image-to-pdf',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: seoJson(jsonLd) }}
      />
      <LandingPage guides={<GuidesBlock path="/image-to-pdf" />} config={config} toolHref="/editor?tool=pdf" pageId="image-to-pdf" />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
