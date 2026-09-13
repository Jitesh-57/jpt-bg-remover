import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import NavBar from "./_components/NavBar";
import Footer from "./_components/Footer";
import PricingModalHost from "./_components/PricingModalHost";
import Analytics from "./_components/Analytics";
import SupportChat from "./_components/SupportChat";
import AuthReturn from "./_components/AuthReturn";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const BASE = "https://www.sjpt.io";
// Origin that serves all landing/blog/tool imagery — preconnected below so the
// LCP hero image starts downloading sooner.
const SUPA_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";
const LOGO_URL = `${SUPA_ORIGIN}/storage/v1/object/public/landing/logo.png`;
// The favicon needs the square mark, not the wide lockup — a 3:1 image shrunk
// into a 32px box is an unreadable sliver.
const MARK_URL = `${SUPA_ORIGIN}/storage/v1/object/public/landing/logo-mark.png`;

export const metadata: Metadata = {
  title: {
    default: "Pixel Shine — Free AI Image Editor | Remove Background, Upscale & Edit Photos Online",
    template: "%s | Pixel Shine",
  },
  description: "Free AI image editor online. Remove backgrounds in one click, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts. No watermark, no software needed.",
  keywords: ["ai image editor free", "remove background free", "image upscaler free", "ai photo editor online", "background remover free"],
  metadataBase: new URL(BASE),
  icons: { icon: MARK_URL, shortcut: MARK_URL, apple: MARK_URL },
  // No canonical here — each page sets its own. A layout-level canonical
  // would incorrectly point every subpage at the homepage.
  openGraph: {
    type: "website",
    siteName: "Pixel Shine",
    title: "Pixel Shine — Free AI Image Editor Online",
    description: "Remove backgrounds, upscale photos to 4K, and edit images with AI. Free to start — no credit card required.",
    url: BASE,
    images: [{ url: LOGO_URL }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Shine — Free AI Image Editor Online",
    description: "Remove backgrounds, upscale photos, and edit images with AI. Free to start — no credit card required.",
    images: [LOGO_URL],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: "oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixel Shine",
  url: BASE,
  logo: LOGO_URL,
  sameAs: ["https://twitter.com/jptai"],
  contactPoint: { "@type": "ContactPoint", email: "support@sjpt.io", contactType: "customer service" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pixel Shine",
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
  name: "Pixel Shine — Free AI Image Editor",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan with 5 free trials plus unlimited free basic upscale" },
  url: BASE,
  description: "Free AI image editor. Remove backgrounds, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts.",
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1200" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Speed up the LCP image + tag scripts by warming these connections early. */}
        <link rel="preconnect" href={SUPA_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPA_ORIGIN} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <meta name="google-site-verification" content="oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" />
        <meta name="google-adsense-account" content="ca-pub-6299138657923728" />
        {/* Google AdSense loader — placed as a raw <script> in <head> exactly
            where the AdSense crawler and the "code snippet" site-verification
            look for it. Auto ads serves units from this single loader. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6299138657923728"
          crossOrigin="anonymous"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font)" }}>
        {/* Google Tag Manager — deferred so it doesn't block first paint. */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5GVHPFWD');`}
        </Script>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5GVHPFWD"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Analytics />
        {/* Support chatbot — signed-in users only; see SupportChat. */}
        <SupportChat />
        <LanguageProvider>
          <NavBar />
          {children}
          <Footer />
          {/* Mounted once so any 402, anywhere, can raise the packs. */}
          <PricingModalHost />
          {/* Returns the user to the page they signed in from, wherever the
              OAuth round-trip happened to drop them. */}
          <AuthReturn />
        </LanguageProvider>
      </body>
    </html>
  );
}
