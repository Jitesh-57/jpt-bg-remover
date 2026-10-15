import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import RecreateStudio from "./RecreateStudio";

export const metadata: Metadata = seoMeta({ title: "Recreate", robots: { index: false, follow: false } });

export default function RecreatePage() {
  return <RecreateStudio />;
}
