import { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/app/_components/LandingPage";
import {
  getVariant,
  variantsFor,
  variantToConfig,
  PARENT_META,
  PARENT_PAGE_ID,
} from "@/lib/landing-variants";

const PARENT = "ai-headshot" as const;
const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return variantsFor(PARENT).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const v = getVariant(PARENT, slug);
  if (!v) return {};
  const url = `${BASE}${PARENT_META[PARENT].base}/${slug}`;
  return {
    title: v.title,
    description: v.metaDescription,
    keywords: v.keywords,
    alternates: { canonical: url },
    openGraph: { title: v.h1, description: v.metaDescription, url },
    twitter: { card: "summary_large_image", title: v.h1, description: v.metaDescription },
  };
}

export default async function VariantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = getVariant(PARENT, slug);
  if (!v) notFound();

  const config = variantToConfig(v);
  const url = `${BASE}${PARENT_META[PARENT].base}/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: v.h1,
    description: v.metaDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: v.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <LandingPage config={config} toolHref={PARENT_META[PARENT].toolHref} pageId={PARENT_PAGE_ID[PARENT]} />
    </>
  );
}
