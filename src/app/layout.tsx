import { seoJson, seoMeta } from "@/lib/seo/brand";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Inter } from "next/font/google";
import { TrialBar } from "./_components/TrialOffer";
import NavBar from "./_components/NavBar";
import Footer from "./_components/Footer";
import PricingModalHost from "./_components/PricingModalHost";
import Analytics from "./_components/Analytics";
import SupportChat from "./_components/SupportChat";
import AuthReturn from "./_components/AuthReturn";
import SignupWelcome from "./_components/SignupWelcome";
import SignupNudgeHost from "./_components/SignupNudgeHost";
import OneTap from "./_components/OneTap";
import PageGallery from "./_components/PageGallery";
import SiteEdits from "./_components/SiteEdits";
import { readEdits } from "@/lib/page-edits.server";
/*
  Inter, self-hosted by next/font. The font stack always named Inter but never
  loaded it, so Windows fell back to Segoe UI, whose 800/900 weights read as a
  slab. A variable font, so every weight in between renders true.
*/
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { galleryIndex, galleryTitleFor, readOverrides } from "@/lib/overrides";

const BASE = "https://www.sjpt.io";
// Origin that serves all landing/blog/tool imagery — preconnected below so the
// LCP hero image starts downloading sooner.
const SUPA_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lwworujvfttxkrjfrgav.supabase.co";
const LOGO_URL = `${SUPA_ORIGIN}/storage/v1/object/public/landing/logo.png`;
// The favicon is the square ✦ mark, served from /public. It used to point at
// landing/logo-mark.png in storage, which no longer exists, so every tab and
// search result showed a blank globe.

export const metadata: Metadata = seoMeta({
  title: {
    default: "PixelShine — Your Own AI Creative Studio",
    template: "%s | Pixel Shine",
  },
  description: "Create more, edit less. Bring your visual ideas to life with PixelShine AI — 200+ AI photo apps and free creative tools in one place.",
  keywords: ["ai image editor free", "remove background free", "image upscaler free", "ai photo editor online", "background remover free"],
  metadataBase: new URL(BASE),
  icons: { icon: "/icon.png", shortcut: "/favicon.ico", apple: "/apple-icon.png" },
  // No canonical here — each page sets its own. A layout-level canonical
  // would incorrectly point every subpage at the homepage.
  openGraph: {
    type: "website",
    siteName: "Pixel Shine",
    title: "PixelShine — Your Own AI Creative Studio",
    description: "Create more, edit less. Bring your visual ideas to life with PixelShine AI — 200+ AI photo apps and free creative tools in one place.",
    url: BASE,
    images: [{ url: LOGO_URL }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelShine — Your Own AI Creative Studio",
    description: "Create more, edit less. Bring your visual ideas to life with PixelShine AI — 200+ AI photo apps and free creative tools in one place.",
    images: [LOGO_URL],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: { google: "oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" },
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixel Shine",
  // What people type to find us: the domain and the older JPT name.
  alternateName: ["SJPT", "sjpt.io", "JPT AI"],
  url: BASE,
  logo: LOGO_URL,
  sameAs: ["https://twitter.com/jptai"],
  contactPoint: { "@type": "ContactPoint", email: "support@sjpt.io", contactType: "customer service" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pixel Shine",
  alternateName: ["SJPT", "sjpt.io", "JPT AI"],
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
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free browser tools with no sign-up, plus paid server-side AI features sold as one-time credit packs" },
  url: BASE,
  description: "Free AI image editor. Remove backgrounds, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts.",
};

/*
  Read once, for every page.

  Images added in /admin are addressed by URL, so any page can have them — and
  a layout is the only place that covers "any page" without editing sixty route
  files and still missing the next one. The document is one small JSON that
  Next caches for five minutes, and `readOverrides` returns empty rather than
  throwing, so a storage outage costs a gallery, not a page.

  The cost is honest and worth naming: pages that were fully static now
  revalidate on the same five-minute window the app pages already use. That is
  what makes an upload appear without a deploy.
*/
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [overrides, edits] = await Promise.all([readOverrides(), readEdits()]);
  const galleries = galleryIndex(overrides);
  const titles = Object.fromEntries(Object.keys(galleries).map((k) => [k, galleryTitleFor(overrides, k)]));

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Speed up the LCP image + tag scripts by warming these connections early. */}
        <link rel="preconnect" href={SUPA_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SUPA_ORIGIN} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <meta name="google-site-verification" content="oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" />
        <meta name="google-adsense-account" content="ca-pub-6299138657923728" />
        {/* Machine-readable site guide for AI/search crawlers. */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Pixel Shine AI-readable site guide" />
        {/* Google AdSense loader — placed as a raw <script> in <head> exactly
            where the AdSense crawler and the "code snippet" site-verification
            look for it. Auto ads serves units from this single loader. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6299138657923728"
          crossOrigin="anonymous"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(softwareSchema) }} />
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
          {/* The signup free trial, only where it is live for this visitor. */}
          <TrialBar />
          <NavBar />
          {children}
          <PageGallery galleries={galleries} titles={titles} />
          <Footer />
          {/* Mounted once so any 402, anywhere, can raise the packs. */}
          <PricingModalHost />
          {/* Returns the user to the page they signed in from, wherever the
              OAuth round-trip happened to drop them. */}
          <AuthReturn />
          {/* Counts a new signup once it exists, and announces its free credits. */}
          <SignupWelcome />
          {/* The sign-up card a signed-out visitor sees a few seconds after landing. */}
          <SignupNudgeHost />
          {/* Google One Tap; off until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set. */}
          <OneTap />
          {/* Copy and image changes from the visual page editor. */}
          <SiteEdits initial={edits} />
        </LanguageProvider>
      </body>
    </html>
  );
}
