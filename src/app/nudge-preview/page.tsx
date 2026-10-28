import type { Metadata } from "next";
import NudgePreview from "./NudgePreview";

// Temporary: the sign-up popup's designs, over the real homepage, for review.
export const metadata: Metadata = { title: "Sign-up popup preview", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: { v?: string; offer?: string } }) {
  return <NudgePreview v={searchParams.v ?? ""} offer={searchParams.offer !== "0"} />;
}
