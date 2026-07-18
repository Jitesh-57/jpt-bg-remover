import type { Metadata } from "next";
import InstagramVideoDownloader from "./InstagramVideoDownloader";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/instagram-video-downloader`;

export const metadata: Metadata = {
  title: { absolute: "Free Instagram Video Downloader — Download Reels & Videos in HD | JPT AI" },
  description:
    "Download Instagram reels and videos free online. Paste an Instagram link and get a clean HD MP4 — no watermark, no app, no sign-up.",
  keywords:
    "instagram video downloader, download instagram video, instagram reels downloader, download instagram reels, save instagram video, instagram video download hd",
  openGraph: {
    title: "Free Instagram Video Downloader — Reels & Videos in HD | JPT AI",
    description: "Paste an Instagram link and download the reel or video in HD — free, no app, no sign-up.",
    url: URL,
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Instagram Video Downloader | JPT AI",
    description: "Download Instagram reels & videos in HD — free, no sign-up.",
  },
  alternates: { canonical: URL },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Is the Instagram video downloader free?", a: "Yes — it's completely free with no sign-up, no app, and no limit on how many videos you download." },
    { q: "Can I download Instagram Reels?", a: "Yes. Paste any public Reel, video post or IGTV link and download it as a clean HD MP4." },
    { q: "Does it work on iPhone and Android?", a: "Yes — it runs in your phone or computer's browser. There is nothing to install." },
    { q: "Can I download private videos?", a: "No. For privacy reasons the tool only works with public reels and posts, not private accounts." },
    { q: "Do I need to install anything?", a: "No. Paste the link and download — nothing to install, works on phone and computer." },
  ].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Free Instagram Video Downloader",
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
      <InstagramVideoDownloader />
    </>
  );
}
