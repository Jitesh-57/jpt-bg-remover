import HomeView, { type Feature } from "./HomeView";
import { appCards, communityFeed, APP_CATEGORIES, type AppCardData } from "@/lib/dashboard-feed.server";
import { popularTools } from "@/lib/dashboard-catalog";

export const revalidate = 300;

export default async function DashboardHome() {
  const [apps, feed] = await Promise.all([appCards(), communityFeed(400)]);
  const community = feed.slice(0, 13);
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

  /*
    Each card's picture is chosen from what actually exists, best candidate
    first: a striking product shot from the community for Create Image, a
    published before|after creative for the editor (the split *is* the pitch),
    and the live after photo for the portrait tools.
  */
  const firstApp = (slugs: string[], wantMain = false) =>
    slugs.map((s) => bySlug.get(s)).find((a) => a && (wantMain ? a.main : a.hasExample)) ??
    slugs.map((s) => bySlug.get(s)).find((a) => a?.hasExample) ??
    null;
  const showpiece =
    feed.find((f) => f.useCase === "E-commerce Main Image" && !f.needsPhoto) ??
    feed.find((f) => f.useCase === "Product Marketing" && !f.needsPhoto) ??
    feed[0];
  const recreateApp = firstApp(["saree-photoshoot", "old-hollywood-glamour", "coastal-cowgirl-aesthetic", "renaissance-portrait"]);
  const editorApp = firstApp(["restore-old-photos", "object-remover", "background-remover", "unblur-image", "hairstyle-changer", "ghibli-style"], true);
  const headshotApp = firstApp(["professional-headshot", "linkedin-headshot", "ai-headshot-generator", "doctor-headshot-generator"]);

  const features: Feature[] = [
    { title: "Create Image", sub: "Turn words into a photo", href: "/app/create", icon: "sparkle", image: showpiece ? { kind: "url", url: showpiece.image } : null, gradient: ["#7C3AED", "#DB2777"] },
    { title: "Recreate", sub: "Any photo's look, with your face", href: "/app/recreate", icon: "copy", image: recreateApp ? { kind: "app", app: recreateApp } : null, gradient: ["#F97316", "#DB2777"] },
    { title: "AI Image Editor", sub: "Describe the change, get the edit", href: "/app/editor", icon: "editor", image: editorApp ? { kind: "app", app: editorApp, full: !!editorApp.main } : null, gradient: ["#0EA5E9", "#6366F1"] },
    { title: "AI Headshot", sub: "Studio portraits from a selfie", href: "/ai-headshot", icon: "community", image: headshotApp ? { kind: "app", app: headshotApp } : null, gradient: ["#10B981", "#0EA5E9"] },
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
      community={community}
      appCount={apps.length}
    />
  );
}
