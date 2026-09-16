import type { Metadata } from "next";
import MediaHub from "../_components/MediaHub";
import { COUNTS, MODELS } from "@/lib/prompts/data";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const URL = "https://www.sjpt.io/prompts/video";

export const metadata: Metadata = {
  title: { absolute: `${COUNTS.video} AI Video Prompts — Free, Credited, Copy & Paste | ${BRAND}` },
  description:
    `${COUNTS.video} free AI video prompts for ${MODELS.filter((m) => m.media === "video").map((m) => m.name).join(" and ")}. Timeline prompts rendered shot by shot, each credited to its author.`,
  keywords: "ai video prompts, seedance prompts, grok imagine prompts, video prompt library, free ai video prompts",
  alternates: { canonical: URL },
  openGraph: { title: `${COUNTS.video} free AI video prompts`, description: "Cinematic scenes, shorts and commercials, written shot by shot. Every prompt credited.", url: URL, siteName: BRAND },
};

export default function VideoPromptsHub() {
  return <MediaHub media="video" />;
}
