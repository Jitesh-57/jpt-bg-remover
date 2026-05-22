import type { Metadata } from "next";
import LandingPageClient from "./_components/LandingPageClient";

export const metadata: Metadata = {
  title: "JPT AI — AI Image Editor | Remove Background, Upscale & Edit Photos",
  description:
    "JPT AI is a free all-in-one AI image editor. Remove backgrounds instantly, upscale photos, generate AI backgrounds, resize, and edit images with a simple text prompt. No software to install.",
  keywords: [
    "AI image editor",
    "remove background online",
    "image upscaler",
    "AI photo editing",
    "background remover",
    "AI background generator",
    "online image editor",
    "JPT AI",
  ],
  openGraph: {
    title: "JPT AI — AI Image Editor",
    description:
      "Remove backgrounds, upscale photos, and edit images with AI. Free to start — no credit card required.",
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPT AI — AI Image Editor",
    description: "Remove backgrounds, upscale photos, and edit images with AI. Free to start.",
  },
};

export default function Page() {
  return <LandingPageClient />;
}
