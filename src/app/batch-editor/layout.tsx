import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Batch Image Editor — Process Multiple Photos at Once") },
  description: "Upload multiple images and apply AI transformations in bulk. Remove backgrounds, upscale, or edit dozens of photos at once. Free to try — no software needed.",
  alternates: { canonical: "https://www.sjpt.io/batch-editor" },
});

export default function BatchEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
