import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./_components/NavBar";
import Footer from "./_components/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const BASE = "https://www.sjpt.in";

export const metadata: Metadata = {
  title: {
    default: "JPT AI — Free AI Image Editor | Remove Background, Upscale & Edit Photos Online",
    template: "%s | JPT AI",
  },
  description: "Free AI image editor online. Remove backgrounds in one click, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts. No watermark, no software needed.",
  keywords: ["ai image editor free", "remove background free", "image upscaler free", "ai photo editor online", "background remover free"],
  metadataBase: new URL(BASE),
  alternates: {
    canonical: BASE,
    languages: {
      "x-default": BASE,
      en: BASE,
      hi: BASE,
      es: BASE,
      fr: BASE,
      pt: BASE,
      de: BASE,
      ar: BASE,
      ja: BASE,
      "zh-CN": BASE,
      ko: BASE,
    },
  },
  openGraph: {
    type: "website",
    siteName: "JPT AI",
    title: "JPT AI — Free AI Image Editor Online",
    description: "Remove backgrounds, upscale photos to 4K, and edit images with AI. Free to start — no credit card required.",
    url: BASE,
  },
  twitter: {
    card: "summary_large_image",
    title: "JPT AI — Free AI Image Editor Online",
    description: "Remove backgrounds, upscale photos, and edit images with AI. Free to start — no credit card required.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: "oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JPT AI",
  url: BASE,
  logo: `${BASE}/logo.png`,
  sameAs: ["https://twitter.com/jptai"],
  contactPoint: { "@type": "ContactPoint", email: "support@sjpt.in", contactType: "customer service" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JPT AI",
  url: BASE,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE}/blog?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JPT AI — Free AI Image Editor",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan with 10 daily credits" },
  url: BASE,
  description: "Free AI image editor. Remove backgrounds, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts.",
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1200" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <LanguageProvider>
          <NavBar />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
