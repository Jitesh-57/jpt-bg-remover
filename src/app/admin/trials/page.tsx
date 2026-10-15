import { seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import TrialsAdmin from "./TrialsAdmin";

export const metadata: Metadata = seoMeta({ title: "Free trials — Admin", robots: { index: false, follow: false } });
export const dynamic = "force-dynamic";

export default function Page() {
  return <TrialsAdmin />;
}
