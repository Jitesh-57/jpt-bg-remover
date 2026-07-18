import type { Metadata } from "next";

// Private per-user history page — never indexed.
export const metadata: Metadata = {
  title: "Your History — JPT AI",
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
