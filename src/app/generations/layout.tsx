import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";

/**
 * /generations is a signed-in user's own history: nothing on it is for
 * search. Without this it inherited the homepage's title and `index`, so
 * Google read it as a duplicate of the homepage.
 */
export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("My Generations | Pixel Shine") },
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.sjpt.io/generations" },
});

export default function GenerationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
