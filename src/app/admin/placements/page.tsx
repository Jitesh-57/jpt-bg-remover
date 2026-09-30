import type { Metadata } from "next";
import PlacementsAdmin from "./PlacementsAdmin";

export const metadata: Metadata = { title: "What shows where — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PlacementsAdmin />;
}
