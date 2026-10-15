import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";

// Legacy standalone background-remover UI. It duplicates the background-removal
// tool, so it is kept accessible but excluded from search indexing to avoid a
// "duplicate without user-selected canonical" flag in Search Console.
export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("Background Remover — Pixel Shine") },
  robots: { index: false, follow: false },
});

export default function BgRemoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
