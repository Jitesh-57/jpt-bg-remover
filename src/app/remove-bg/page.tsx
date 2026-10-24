import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
import LandingPage from '../_components/LandingPage'
import { variantsFor, PARENT_META } from '@/lib/landing-variants'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('remove-bg')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('remove-bg', config.og_image),
      url: 'https://www.sjpt.io/remove-bg',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('remove-bg', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/remove-bg' },
  }
}

export default async function RemoveBgPage() {
  const config = await getPageConfig('remove-bg')
  const relatedVariants = variantsFor('remove-bg').map(v => ({ slug: v.slug, h1: v.h1, href: `${PARENT_META['remove-bg'].base}/${v.slug}` }))

  return (
    <>
      <LandingPage path="/remove-bg" guides={<GuidesBlock path="/remove-bg" />} config={config} toolHref="/editor?tool=remove-bg" pageId="remove-bg" relatedVariants={relatedVariants} />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
