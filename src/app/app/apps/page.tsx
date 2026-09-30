import type { Metadata } from "next";
import AppsGallery from "./AppsGallery";
import { appCards, APP_CATEGORIES } from "@/lib/dashboard-feed.server";
import { UTILITY_TOOLS } from "@/lib/dashboard-catalog";
import { curateApps, readPlacements } from "@/lib/placements.server";

export const metadata: Metadata = { title: "AI Apps", robots: { index: false, follow: false } };
export const revalidate = 300;

export default async function AppsPage() {
  const [all, placements] = await Promise.all([appCards(), readPlacements()]);
  // Apps pinned in /admin/placements lead the gallery; the rest keep their order.
  const apps = curateApps("app.apps.top", placements, all, all, all.length + 60);
  const categories = APP_CATEGORIES
    .map((c) => ({ ...c, count: apps.filter((a) => a.category === c.id).length }))
    .filter((c) => c.count > 0);
  return <AppsGallery apps={apps} categories={categories} tools={UTILITY_TOOLS} />;
}
