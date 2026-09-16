import type { Metadata } from "next";
import MediaHub from "../_components/MediaHub";
import { COUNTS, MODELS } from "@/lib/prompts/data";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const URL = "https://www.sjpt.io/prompts/image";

export const metadata: Metadata = {
  title: { absolute: `${COUNTS.image} AI Image Prompts — Free, Credited, Copy & Paste | ${BRAND}` },
  description:
    `${COUNTS.image} free AI image prompts for ${MODELS.filter((m) => m.media === "image").map((m) => m.name).join(", ")}. Every prompt credits its author and links to the original post. Copy, edit the placeholders, generate.`,
  keywords: "ai image prompts, image prompt library, nano banana pro prompts, gpt image prompts, seedream prompts, free ai prompts",
  alternates: { canonical: URL },
  openGraph: { title: `${COUNTS.image} free AI image prompts`, description: "Browse by model, use case, style or subject. Every prompt credited to its author.", url: URL, siteName: BRAND },
};

export default function ImagePromptsHub() {
  return <MediaHub media="image" />;
}
