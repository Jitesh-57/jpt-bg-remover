import { withSeoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import { getPageConfig } from "@/lib/page-config";
import HomePage from "./_components/HomePage";
import { readPlacements } from "@/lib/placements.server";
import { appCards, communityFeed, feedItemsByUid } from "@/lib/dashboard-feed.server";
import { buildShowFeatures, CREATE_PICKS } from "@/lib/show-features.server";

const BASE = "https://www.sjpt.io";

/*
  What Google and link previews show for the homepage: the home screen's
  tagline. Set here rather than read from the page-SEO row, like the hero copy,
  so an old admin override cannot put a retired title or description back into
  search results and shared links. The page itself is unaffected.
*/
const HOME_TITLE = "PixelShine — Your Own AI Creative Studio";
const HOME_DESCRIPTION =
  "Create more, edit less. Bring your visual ideas to life with PixelShine AI — 200+ AI photo apps and free creative tools in one place.";

async function generateMetadataBase(): Promise<Metadata> {
  const config = await getPageConfig("home");
  return {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    keywords: config.keywords,
    openGraph: {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: config.og_image ? [config.og_image] : [],
      type: "website",
      siteName: "PixelShine",
      url: BASE,
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      images: config.og_image ? [config.og_image] : [],
    },
    alternates: { canonical: BASE },
  };
}

export default async function Page() {
  const [config, placements, apps, feed, picks] = await Promise.all([getPageConfig("home"), readPlacements(), appCards(), communityFeed(60), feedItemsByUid(CREATE_PICKS)]);
  const features = buildShowFeatures(apps, feed, picks);

  // FAQ and WebPage structured data are emitted by <HomePage>.
  return (
    <>
      <HomePage config={config} placements={placements} features={features} />
    </>
  );
}

export const generateMetadata = withSeoMeta(generateMetadataBase);
