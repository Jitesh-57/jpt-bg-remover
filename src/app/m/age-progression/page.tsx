import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CREATIVE_APPS } from "@/lib/creative-apps";
import { appCards } from "@/lib/dashboard-feed.server";
import AgeApp from "./AgeApp";

export const metadata: Metadata = {
  title: { absolute: "Age Progression · Pixel Shine" },
  description: "See yourself at any age from 1 to 100.",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

/**
 * The AI Age Progression mobile app, web version.
 *
 * Everything behind it is the site's own: the age-progression app's tested
 * prompt and 1–100 age option, /api/creative-edit (credits, My Creations,
 * the default model on fal), sign-in and the credit packs. This page only
 * supplies the app config and its before|after example; AgeApp is the app.
 */
export default async function Page() {
  const app = CREATIVE_APPS.find((a) => a.slug === "age-progression");
  if (!app) notFound();

  // The published before|after creative when there is one, else the best "after" candidates.
  const cards = await appCards().catch(() => []);
  const card = cards.find((c) => c.slug === "age-progression") ?? cards.find((c) => c.slug === "age-progression-tool");
  const example = card?.main ? { split: card.main.url, after: [] as string[] } : { split: null, after: card?.sources ?? [] };

  return <AgeApp app={app} example={example} />;
}
