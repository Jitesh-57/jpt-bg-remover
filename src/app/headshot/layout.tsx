import type { Metadata } from "next";
import { seoMeta } from "@/lib/seo/brand";

// The headshot studio is a client page and had no metadata of its own, so it
// went out with the home page's title and description and no canonical — a
// duplicate of "/". The page people should find in search is /ai-headshot.
export const metadata: Metadata = seoMeta({
  title: "AI Headshot Studio",
  description: "Make professional headshots from one selfie: pick a style and a background, and download studio-quality portraits.",
  alternates: { canonical: "https://www.sjpt.io/ai-headshot" },
  robots: { index: false, follow: true },
});

export default function HeadshotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
