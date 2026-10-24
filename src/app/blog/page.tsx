import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";
import BlogIndex from "./_components/BlogIndex";

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Photo Editing Guides & Tutorials | Pixel Shine") },
  description:
    "Plain-English guides to editing photos with AI: headshots, Ghibli and anime styles, restoring old photos, clean backgrounds and fixing blurry pictures.",
  keywords: [
    "ai photo editing guide",
    "how to make ghibli style photo",
    "ai headshot tips",
    "restore old photos",
    "fix blurry photo",
  ],
  alternates: { canonical: "https://www.sjpt.io/blog" },
  openGraph: {
    title: "AI Photo Editing Guides & Tutorials | Pixel Shine",
    description: "Plain-English guides to editing photos with AI: headshots, Ghibli and anime styles, restoring old photos, clean backgrounds and fixing blurry pictures.",
    type: "website",
  },
});

/* Covers follow the creatives uploaded in /admin, re-read with the creative gallery's cadence. */
export const revalidate = 300;

export default function BlogIndexPage() {
  return <BlogIndex page={1} />;
}
