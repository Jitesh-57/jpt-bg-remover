import type { Metadata } from "next";
import AppsGallery from "./AppsGallery";
import { appCards, APP_CATEGORIES } from "@/lib/dashboard-feed.server";
import { UTILITY_TOOLS } from "@/lib/dashboard-catalog";

export const metadata: Metadata = { title: "AI Apps", robots: { index: false, follow: false } };
export const revalidate = 300;

export default async function AppsPage() {
  const apps = await appCards();
  const categories = APP_CATEGORIES
    .map((c) => ({ ...c, count: apps.filter((a) => a.category === c.id).length }))
    .filter((c) => c.count > 0);
  return <AppsGallery apps={apps} categories={categories} tools={UTILITY_TOOLS} />;
}
