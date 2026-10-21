import type { Metadata } from "next";
import NudgePreview from "./NudgePreview";

// Temporary: the sign-up nudge's design options, over the real homepage, for review.
export const metadata: Metadata = { title: "Nudge preview", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: { v?: string; offer?: string } }) {
  const v = searchParams.v === "card" || searchParams.v === "corner" ? searchParams.v : "split";
  return <NudgePreview variant={v} offer={searchParams.offer !== "0"} />;
}
