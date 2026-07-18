import type { Metadata } from "next";

// Internal admin area — never indexed.
export const metadata: Metadata = {
  title: "Admin — JPT AI",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
