import type { Metadata } from "next";
import LandingPageClient from "./_components/LandingPageClient";

export const metadata: Metadata = {
  title: { absolute: "JPT AI — Free AI Image Editor | Remove Background, Upscale & Edit Photos Online" },
  description:
    "Free AI image editor online. Remove backgrounds in one click, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts. No software needed.",
  keywords: [
    "ai image editor online free",
    "remove background online",
    "ai background remover",
    "image upscaler online",
    "ai photo editing",
    "remove background from image",
    "upscale image online",
    "ai headshot generator",
    "edit photos with ai",
    "background remover free",
    "online photo editor",
    "JPT AI",
  ],
  alternates: { canonical: "https://www.sjpt.io" },
  openGraph: {
    title: "JPT AI — Free AI Image Editor Online",
    description:
      "Remove backgrounds, upscale photos to 4K, generate AI backgrounds, and edit images with text prompts. Free to start.",
    type: "website",
    siteName: "JPT AI",
    url: "https://www.sjpt.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "JPT AI — Free AI Image Editor Online",
    description: "Remove backgrounds, upscale photos, and edit images with AI. Free to start — no credit card required.",
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JPT AI",
  url: "https://www.sjpt.io",
  description:
    "All-in-one AI image editor. Remove backgrounds, upscale photos, generate AI backgrounds, and edit images with text prompts.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to start with 10 AI credits",
  },
  featureList: [
    "AI Background Removal",
    "AI Image Upscaling (2× and 4×)",
    "AI Photo Editing with Text Prompts",
    "AI Background Generation",
    "AI Headshot Generation",
    "Smart Resize",
    "Color & Light Adjustments",
  ],
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JPT AI",
  url: "https://www.sjpt.io",
  description: "AI-powered image editing tools for creators, businesses, and professionals.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is JPT AI free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — sign in with Google and get 10 free AI credits immediately. No credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "How do I remove a background from an image?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload your image at jpptai.com/remove-bg. Our AI detects the subject and removes the background in seconds, delivering a transparent PNG.",
      },
    },
    {
      "@type": "Question",
      name: "Can I upscale an image to 4K quality?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. JPT AI supports 2× and 4× AI upscaling using super-resolution technology. Pro AI mode adds extra detail and sharpness.",
      },
    },
    {
      "@type": "Question",
      name: "How does AI photo editing with text prompts work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload a photo and describe the change you want — e.g. 'replace background with a sunset beach'. The AI applies the edit in seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Can I generate a professional AI headshot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upload a clear photo of your face, select a style (corporate, modern, executive), and JPT AI generates a professional portrait in seconds.",
      },
    },
    {
      "@type": "Question",
      name: "What image formats does JPT AI support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JPT AI supports JPG, PNG, and WEBP images. Output is always full-quality PNG or JPG depending on the tool used.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <LandingPageClient />
    </>
  );
}
