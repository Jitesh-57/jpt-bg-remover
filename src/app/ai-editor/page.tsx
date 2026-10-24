import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
import LandingPage from '../_components/LandingPage'
import { variantsFor, PARENT_META } from '@/lib/landing-variants'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('ai-editor')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('ai-editor', config.og_image),
      url: 'https://www.sjpt.io/ai-editor',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('ai-editor', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/ai-editor' },
  }
}

export default async function AIEditorPage() {
  const config = await getPageConfig('ai-editor')
  const relatedVariants = variantsFor('ai-editor').map(v => ({ slug: v.slug, h1: v.h1, href: `${PARENT_META['ai-editor'].base}/${v.slug}` }))

  return (
    <>
      <LandingPage path="/ai-editor" guides={<GuidesBlock path="/ai-editor" />} config={config} toolHref="/editor" pageId="ai-editor" relatedVariants={relatedVariants} />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
