import type { Metadata } from "next";
import CommunityFeed from "./CommunityFeed";
import { communityFeed } from "@/lib/dashboard-feed.server";

export const metadata: Metadata = { title: "Community", robots: { index: false, follow: false } };
export const revalidate = 300;

export default async function CommunityPage() {
  const items = await communityFeed(240);
  const counts = new Map<string, number>();
  for (const it of items) if (it.useCase) counts.set(it.useCase, (counts.get(it.useCase) ?? 0) + 1);
  const topics = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name);
  return <CommunityFeed items={items} topics={topics} />;
}
