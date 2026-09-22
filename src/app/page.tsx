import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-config";
import HomePage from "./_components/HomePage";

const BASE = "https://www.sjpt.io";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageConfig("home");
  return {
    title: { absolute: config.title },
    description: config.meta_description,
    keywords: config.keywords,
    openGraph: {
      title: config.og_title || config.title,
      description: config.og_description || config.meta_description,
      images: config.og_image ? [config.og_image] : [],
      type: "website",
      siteName: "Pixel Shine",
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
  const config = await getPageConfig("home");

  // FAQ and WebPage structured data are emitted by <HomePage>.
  return (
    <>
      <HomePage config={config} />
    </>
  );
}
