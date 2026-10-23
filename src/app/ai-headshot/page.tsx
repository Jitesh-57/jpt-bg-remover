import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
import LandingPage from '../_components/LandingPage'
import { variantsFor, PARENT_META } from '@/lib/landing-variants'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('headshot')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('headshot', config.og_image),
      url: 'https://www.sjpt.io/ai-headshot',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('headshot', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/ai-headshot' },
  }
}

export default async function AIHeadshotPage() {
  const config = await getPageConfig('headshot')
  const relatedVariants = variantsFor('ai-headshot').map(v => ({ slug: v.slug, h1: v.h1, href: `${PARENT_META['ai-headshot'].base}/${v.slug}` }))

  return (
    <>
      <LandingPage path="/ai-headshot" guides={<GuidesBlock path="/ai-headshot" />} config={config} toolHref="/headshot" pageId="headshot" relatedVariants={relatedVariants} />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
