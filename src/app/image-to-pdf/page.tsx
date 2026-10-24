import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
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
      images: toolShareImages('image-to-pdf', config.og_image),
      url: 'https://www.sjpt.io/image-to-pdf',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('image-to-pdf', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/image-to-pdf' },
  }
}

export default async function Page() {
  const config = await getPageConfig('image-to-pdf')

  return (
    <>
      <LandingPage path="/image-to-pdf" guides={<GuidesBlock path="/image-to-pdf" />} config={config} toolHref="/editor?tool=pdf" pageId="image-to-pdf" />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
