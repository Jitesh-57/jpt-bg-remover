import type { Metadata } from "next";
import YouTubeVideoDownloader from "./YouTubeVideoDownloader";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/youtube-video-downloader`;

export const metadata: Metadata = {
  title: { absolute: "Free YouTube Video Downloader — Download YouTube Videos in HD MP4 | JPT AI" },
  description:
    "Download YouTube videos free online. Paste a YouTube link and save it as an HD MP4 — no app, no sign-up.",
  keywords:
    "youtube video downloader, download youtube video, youtube to mp4, save youtube video, youtube downloader hd, youtube mp4 download",
  openGraph: {
    title: "Free YouTube Video Downloader — HD MP4 | JPT AI",
    description: "Paste a YouTube link and download the video in HD MP4 — free, no app, no sign-up.",
    url: URL,
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free YouTube Video Downloader | JPT AI",
    description: "Download YouTube videos as HD MP4 — free, no sign-up.",
  },
  alternates: { canonical: URL },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Is the YouTube video downloader free?", a: "Yes — it's completely free with no sign-up and no app. Paste a link and download." },
    { q: "What formats can I download?", a: "Videos download as HD MP4 files that play on virtually any device or editor." },
    { q: "Does it work on iPhone and Android?", a: "Yes — it runs in your phone or computer's browser. There is nothing to install." },
    { q: "Can I download private or age-restricted videos?", a: "No. The tool works with public videos only." },
    { q: "Is it legal to download YouTube videos?", a: "Downloading content you own or that is licensed for download is generally fine. Always respect YouTube's Terms of Service and the creator's rights." },
  ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Free YouTube Video Downloader",
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
      <YouTubeVideoDownloader />
    </>
  );
}
