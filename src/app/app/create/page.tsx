import type { Metadata } from "next";
import CreateStudio from "./CreateStudio";
import { communityFeed } from "@/lib/dashboard-feed.server";

export const metadata: Metadata = { title: "Create Image", robots: { index: false, follow: false } };
export const revalidate = 300;

export default async function CreatePage() {
  const inspirations = await communityFeed(18, { textOnly: true });
  return <CreateStudio inspirations={inspirations} />;
}
