import HomeView from "./HomeView";
import type { Pic, ShowFeature } from "./_components/FeatureShowcase";
import { appCards, communityFeed, popularApps, exploreApps, APP_CATEGORIES, type AppCardData } from "@/lib/dashboard-feed.server";
import { curateApps, readPlacements } from "@/lib/placements.server";

export const revalidate = 300;

export default async function DashboardHome() {
  const [apps, feed, community, placements] = await Promise.all([appCards(), communityFeed(400), communityFeed(13, { placement: "app.home.community" }), readPlacements()]);
  const bySlug = new Map(apps.map((a) => [a.slug, a]));

  const popular = popularApps(apps);

  /*
    Each card's picture is chosen from what actually exists, best candidate
    first: community images for Create Image, a
    published before|after creative for the editor (the split *is* the pitch),
    and the live after photo for the portrait tools.
  */
  const firstApp = (slugs: string[], wantMain = false) =>
    slugs.map((s) => bySlug.get(s)).find((a) => a && (wantMain ? a.main : a.hasExample)) ??
    slugs.map((s) => bySlug.get(s)).find((a) => a?.hasExample) ??
    null;
  const recreateApp = firstApp(["saree-photoshoot", "old-hollywood-glamour", "coastal-cowgirl-aesthetic", "renaissance-portrait"]);
  const editorApp = firstApp(["restore-old-photos", "object-remover", "background-remover", "unblur-image", "hairstyle-changer", "ghibli-style"], true);
  const headshotApp = firstApp(["professional-headshot", "linkedin-headshot", "ai-headshot-generator", "doctor-headshot-generator"]);

  /** An app's picture: its before|after main creative when published, else its result candidates. */
  const pic = (a: AppCardData | null | undefined): Pic => (a?.main ? { srcs: [a.main.url], split: true } : { srcs: a?.sources ?? [] });
  const feedPics = feed.filter((f) => !f.needsPhoto).slice(0, 12).map((f): Pic => ({ srcs: [f.image] }));
  const withExamples = apps.filter((a) => a.main || a.hasExample);
  const exampleAt = (n: number) => pic(withExamples[n % Math.max(1, withExamples.length)]);
  const portraitApp = firstApp(["ai-photoshoot", "old-hollywood-glamour", "ghibli-style", "coastal-cowgirl-aesthetic"], true);
  const headshotMain = firstApp(["professional-headshot", "linkedin-headshot", "ai-headshot-generator", "doctor-headshot-generator"], true);

  const features: ShowFeature[] = [
    { kind: "studio", title: "AI Studio", tagline: "Say what you want, refine by chatting", sub: "Chat your edits into place", href: "/app/studio", icon: "sparkle", badge: "NEW", grad: ["#F97316", "#DB2777"], pics: [pic(portraitApp ?? headshotApp)] },
    { kind: "create", title: "Create Image", tagline: "From a prompt to a finished shot", sub: "Describe it, get the image", href: "/app/create", icon: "create", grad: ["#7C3AED", "#DB2777"], pics: feedPics.length >= 4 ? feedPics.slice(0, 4) : [0, 1, 2, 3].map(exampleAt) },
    { kind: "editor", title: "AI Image Editor", tagline: "Edit any photo with a sentence", sub: "Describe the change, get the edit", href: "/app/editor", icon: "editor", grad: ["#0EA5E9", "#6366F1"], pics: [pic(editorApp)] },
    { kind: "recreate", title: "Recreate", tagline: "Any photo's look, with your face", sub: "Copy a look onto yourself", href: "/app/recreate", icon: "copy", grad: ["#F97316", "#EF4444"], pics: [feedPics[4] ?? exampleAt(5), pic(recreateApp)] },
    { kind: "headshot", title: "AI Headshot", tagline: "Studio portraits from one selfie", sub: "LinkedIn-ready in seconds", href: "/ai-headshot", icon: "community", grad: ["#10B981", "#0EA5E9"], pics: [pic(headshotMain ?? headshotApp)] },
    { kind: "batch", title: "Batch Editor", tagline: "One edit across every image", sub: "Up to 100 images at once", href: "/batch-editor", icon: "folder", grad: ["#F59E0B", "#EF4444"], pics: [6, 7, 8, 9, 10, 11].map(exampleAt) },
    { kind: "apps", title: "Creative Apps", tagline: `${apps.length}+ one-tap looks, no prompt`, sub: "Pick a look, upload a photo", href: "/app/apps", icon: "apps", grad: ["#A855F7", "#EC4899"], pics: [12, 13, 14].map(exampleAt) },
    { kind: "photo", title: "Photo Editor", tagline: "Crop, adjust and finish, free", sub: "Every free tool on one canvas", href: "/editor", icon: "tools", grad: ["#06B6D4", "#3B82F6"], pics: [exampleAt(15)] },
  ];

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
