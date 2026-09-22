import HomeView, { type Feature } from "./HomeView";
import { appCards, communityFeed, APP_CATEGORIES, type AppCardData } from "@/lib/dashboard-feed.server";
import { popularTools } from "@/lib/dashboard-catalog";

export const revalidate = 300;

export default async function DashboardHome() {
  const [apps, community] = await Promise.all([appCards(), communityFeed(14)]);
  const bySlug = new Map(apps.map((a) => [a.slug, a]));

  const popular: AppCardData[] = [];
  for (const t of popularTools()) {
    const a = bySlug.get(t.slug);
    if (a) popular.push(a);
  }
  for (const a of apps) {
    if (popular.length >= 8) break;
    if (a.hasExample && !popular.includes(a)) popular.push(a);
  }

  const sourcesOf = (slug: string) => bySlug.get(slug)?.sources ?? [];
  const features: Feature[] = [
    { title: "Create Image", sub: "Turn words into a photo", href: "/app/create", icon: "sparkle", sources: community[0] ? [community[0].image] : [], external: true, gradient: ["#7C3AED", "#DB2777"] },
    { title: "Recreate", sub: "Any photo's look, with your face", href: "/app/recreate", icon: "copy", sources: sourcesOf("saree-photoshoot"), gradient: ["#F97316", "#DB2777"] },
    { title: "AI Image Editor", sub: "Describe the change, get the edit", href: "/app/editor", icon: "editor", sources: sourcesOf("object-remover"), gradient: ["#0EA5E9", "#6366F1"] },
    { title: "AI Headshot", sub: "Studio portraits from a selfie", href: "/ai-headshot", icon: "community", sources: sourcesOf("professional-headshot"), gradient: ["#10B981", "#0EA5E9"] },
  ];

  const showcase = apps.filter((a) => a.hasExample).length >= 12 ? apps.filter((a) => a.hasExample) : apps;
  const categories = APP_CATEGORIES
    .filter((c) => showcase.filter((a) => a.category === c.id).length >= 4)
    .map(({ id, label }) => ({ id, label }));

  return (
    <HomeView
      features={features}
      popular={popular.slice(0, 8)}
      showcase={showcase.slice(0, 120)}
      categories={categories}
      community={community.slice(1)}
      appCount={apps.length}
    />
  );
}
