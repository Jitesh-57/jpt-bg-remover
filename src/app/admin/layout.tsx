import type { Metadata } from "next";

// Internal admin area — never indexed.
export const metadata: Metadata = {
  title: { absolute: "Admin — Pixel Shine" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
