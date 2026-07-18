import type { Metadata } from "next";

// Legacy standalone background-remover UI. It duplicates the background-removal
// tool, so it is kept accessible but excluded from search indexing to avoid a
// "duplicate without user-selected canonical" flag in Search Console.
export const metadata: Metadata = {
  title: "Background Remover — JPT AI",
  robots: { index: false, follow: false },
};

export default function BgRemoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
