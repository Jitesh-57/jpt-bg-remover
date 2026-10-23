import { withSeoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/app/_components/LandingPage";
import { toolShareImages } from "@/lib/landing-images";
import {
  getVariant,
  variantsFor,
  variantToConfig,
  PARENT_META,
  PARENT_PAGE_ID,
} from "@/lib/landing-variants";

const PARENT = "ai-editor" as const;
const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return variantsFor(PARENT).map((v) => ({ slug: v.slug }));
}

async function generateMetadataBase({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = getVariant(PARENT, slug);
  if (!v) return {};
  const url = `${BASE}${PARENT_META[PARENT].base}/${slug}`;
  return {
    title: { absolute: brandedTitle(v.title) },
    description: v.metaDescription,
    keywords: v.keywords,
    alternates: { canonical: url },
    openGraph: { title: v.h1, description: v.metaDescription, url, images: toolShareImages(PARENT_PAGE_ID[PARENT]) },
    twitter: { card: "summary_large_image", title: v.h1, description: v.metaDescription },
  };
}

export default async function VariantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getVariant(PARENT, slug);
  if (!v) notFound();

  const config = variantToConfig(v);
  const relatedVariants = variantsFor(PARENT).map((x) => ({ slug: x.slug, h1: x.h1, href: `${PARENT_META[PARENT].base}/${x.slug}` }));

  return (
    <>
      <LandingPage path={`/ai-editor/${slug}`} guides={<GuidesBlock path={`/ai-editor/${slug}`} />} config={config} toolHref={PARENT_META[PARENT].toolHref} pageId={PARENT_PAGE_ID[PARENT]} relatedVariants={relatedVariants} currentSlug={slug} />
    </>
  );
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
