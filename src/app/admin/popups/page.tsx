import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import PopupsAdmin from "./PopupsAdmin";

export const metadata: Metadata = seoMeta({ title: "Popups — Admin", robots: { index: false, follow: false } });
export const dynamic = "force-dynamic";

export default function Page() {
  return <PopupsAdmin />;
}
