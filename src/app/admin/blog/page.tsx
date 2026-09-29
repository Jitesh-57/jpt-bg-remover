import type { Metadata } from "next";
import BlogAdmin from "./BlogAdmin";

export const metadata: Metadata = { title: "Blog editor — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  return <BlogAdmin />;
}
