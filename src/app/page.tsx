import type { Metadata } from "next";
import HomeHub from "./_components/HomeHub";

const BASE = "https://www.sjpt.io";

export const metadata: Metadata = {
  title: {
    absolute: "sjpt.io — Free Online Image Tools | Remove Background, Upscale, Compress & More",
  },
  description:
    "sjpt.io is a free all-in-one image toolkit. Remove backgrounds, upscale to 4K, compress, convert, crop, resize, blur, watermark and more — no watermark, no sign-up, right in your browser.",
  keywords:
    "free image tools, free online photo editor, remove background free, image upscaler free, compress image, convert image, free image editor no watermark, sjpt",
  alternates: { canonical: BASE },
  openGraph: {
    title: "sjpt.io — Free Online Image Tools",
    description:
      "Every image tool you need, free: remove backgrounds, upscale to 4K, compress, convert, crop and more. No watermark, no sign-up.",
    url: BASE,
    type: "website",
    siteName: "sjpt.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "sjpt.io — Free Online Image Tools",
    description: "Remove backgrounds, upscale, compress, convert and more — free, no watermark, no sign-up.",
  },
};

export default function Page() {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "sjpt.io — Free Online Image Tools",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: BASE,
    description:
      "Free all-in-one image toolkit: remove backgrounds, upscale to 4K, compress, convert, crop, resize, blur, watermark, QR codes and image-to-PDF — no watermark, no sign-up.",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1200" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <HomeHub />
    </>
  );
}
