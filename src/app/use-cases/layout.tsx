import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/index-policy";

/* Live for visitors, out of the index: see the sections note in lib/seo/index-policy. */
export const metadata: Metadata = { robots: NOINDEX };

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
