import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-config";
import LandingPage from "./_components/LandingPage";

const BASE = "https://www.sjpt.io";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig("upscale");
  return {
    title: { absolute: config.title },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      type: "website",
      siteName: "JPT AI",
      url: BASE,
    },
    twitter: {
      card: "summary_large_image",
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: BASE },
  };
}

export default async function Page() {
  const config = await getPageConfig("upscale");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JPT AI Image Upscaler",
    description: config.meta_description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: BASE,
  };

  // FAQ structured data is emitted by <LandingPage> to avoid duplication.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPage config={config} toolHref="/editor?tool=upscale" pageId="upscale" isHome />
    </>
  );
}
