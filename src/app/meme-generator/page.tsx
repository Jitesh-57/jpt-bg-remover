import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from 'next'
import { getPageConfig } from '@/lib/page-config'
import { toolShareImages } from '@/lib/landing-images'
import LandingPage from '../_components/LandingPage'

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig('meme-generator')
  return {
    title: { absolute: brandedTitle(config.title) },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('meme-generator', config.og_image),
      url: 'https://www.sjpt.io/meme-generator',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: toolShareImages('meme-generator', config.og_image),
    },
    alternates: { canonical: 'https://www.sjpt.io/meme-generator' },
  }
}

export default async function Page() {
  const config = await getPageConfig('meme-generator')

  return (
    <>
      <LandingPage path="/meme-generator" guides={<GuidesBlock path="/meme-generator" />} config={config} toolHref="/editor?tool=meme" pageId="meme-generator" />
    </>
  )
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
