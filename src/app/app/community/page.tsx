import type { Metadata } from "next";
import CommunityFeed from "./CommunityFeed";
import { communityFeed } from "@/lib/dashboard-feed.server";

export const metadata: Metadata = { title: "Community", robots: { index: false, follow: false } };
export const revalidate = 300;

const FEATURED = "E-commerce Main Image";

export default async function CommunityPage() {
  const all = await communityFeed(1000);
  const featured = all.filter((it) => it.useCase === FEATURED);
  const items = [...featured, ...all.filter((it) => it.useCase !== FEATURED).slice(0, 240)];
  const counts = new Map<string, number>();
  for (const it of items) if (it.useCase && it.useCase !== FEATURED) counts.set(it.useCase, (counts.get(it.useCase) ?? 0) + 1);
  const rest = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([name]) => name);
  const topics = featured.length ? [FEATURED, ...rest] : rest;
  return <CommunityFeed items={items} topics={topics} initialTopic={featured.length ? FEATURED : "all"} />;
}
