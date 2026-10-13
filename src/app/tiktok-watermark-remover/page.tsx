import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import type { Metadata } from "next";
import VideoWatermarkRemover from "./VideoWatermarkRemover";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/tiktok-watermark-remover`;

export const metadata: Metadata = {
  title: { absolute: brandedTitle("TikTok Watermark Remover — Free HD Download, No App") },
  description:
    "Paste a TikTok link and download the video in HD with no watermark, or save the MP3. Free, no app, no sign-up — works in any browser.",
  keywords:
    "tiktok watermark remover, remove tiktok watermark free, download tiktok without watermark, tiktok video downloader no watermark, save tiktok no watermark",
  openGraph: {
    title: "Free TikTok Watermark Remover — Download No-Watermark Video | Pixel Shine",
    description: "Paste a TikTok link and download the video without the watermark in HD — free, no app, no sign-up.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free TikTok Watermark Remover | Pixel Shine",
    description: "Download TikTok videos without the watermark — free, HD, no sign-up.",
  },
  alternates: { canonical: URL },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Is the TikTok watermark remover free?", a: "Yes — it's completely free with no sign-up, no app, and no limit on how many videos you download." },
    { q: "Does it remove the TikTok logo and username?", a: "It fetches the original, clean version of the video without the moving TikTok watermark and username overlay." },
    { q: "Can I download in HD?", a: "Yes. When an HD source is available you'll see an HD button; otherwise the standard no-watermark MP4 is provided." },
    { q: "Do I need to install anything?", a: "No. Paste the link and download — nothing to install, works on phone and computer." },
  ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Free TikTok Watermark Remover",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  url: URL,
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <VideoWatermarkRemover />
      <GuidesBlock path="/tiktok-watermark-remover" />
    </>
  );
}
