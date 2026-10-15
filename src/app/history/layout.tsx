import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";

// Private per-user history page — never indexed.
export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("Your History — Pixel Shine") },
  robots: { index: false, follow: false },
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
