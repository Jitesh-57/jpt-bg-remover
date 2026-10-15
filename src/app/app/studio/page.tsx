import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import AIStudio from "./AIStudio";

export const metadata: Metadata = seoMeta({ title: "AI Studio", robots: { index: false, follow: false } });

export default function StudioPage() {
  return <AIStudio />;
}
