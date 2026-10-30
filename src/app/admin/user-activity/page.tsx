import type { Metadata } from "next";
import { seoMeta } from "@/lib/seo/brand";
import UserActivityInspector from "./UserActivityInspector";

export const metadata: Metadata = seoMeta({
  title: "User activity inspector — Admin",
  robots: { index: false, follow: false },
});
export const dynamic = "force-dynamic";

export default function Page() {
  return <UserActivityInspector />;
}
