import HomeView from "./HomeView";
import { buildShowFeatures, CREATE_PICKS } from "@/lib/show-features.server";
import { appCards, communityFeed, feedItemsByUid, popularApps, exploreApps, APP_CATEGORIES } from "@/lib/dashboard-feed.server";
import { curateApps, readPlacements } from "@/lib/placements.server";

export const revalidate = 300;

export default async function DashboardHome() {
  const [apps, feed, community, placements] = await Promise.all([appCards(), communityFeed(400), communityFeed(13, { placement: "app.home.community" }), readPlacements()]);
  const popular = popularApps(apps);

  const features = buildShowFeatures(apps, feed, await feedItemsByUid(CREATE_PICKS));

  const showcase = exploreApps(apps);
  const categories = APP_CATEGORIES
    .filter((c) => showcase.filter((a) => a.category === c.id).length >= 4)
    .map(({ id, label }) => ({ id, label }));

  return (
    <HomeView
      features={features}
      popular={curateApps("app.home.popular", placements, popular, apps, 8)}
      showcase={curateApps("app.home.explore", placements, showcase, apps, 120)}
      categories={categories}
      community={community}
      appCount={apps.length}
    />
  );
}
