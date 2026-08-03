import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/app/_components/ScrollReveal";
import RotateTool from "./RotateTool";
import { ToolFAQ, ToolRelated, TOOL_GRAD as GRAD } from "@/app/tools/_components/ToolPageBits";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/tools/rotate`;

export const metadata: Metadata = {
  title: { absolute: "Free Rotate & Flip Image — Do It & Download Here | JPT AI" },
  description: "Rotate and flip images right on this page — turn 90°, flip horizontally or vertically, and download in seconds. Free, no watermark, nothing to install.",
  keywords: "rotate image, flip image, mirror image, rotate photo 90, flip photo, straighten image",
  alternates: { canonical: URL },
  openGraph: { title: "Free Rotate & Flip Image — Do It & Download Here | JPT AI", description: "Upload, rotate or flip, and download — all on one page. Free.", url: URL, type: "website", siteName: "JPT AI" },
};

const FAQS = [
  { q: "Is the rotate/flip tool free?", a: "Yes — rotating and flipping is free on the page. Guests get 5 free edits, then a free account keeps it unlimited. No watermark." },
  { q: "Can I rotate 90°, 180° or 270°?", a: "Yes — tap Left or Right 90° to reach any rotation, and flip horizontally or vertically too." },
  { q: "What's the difference between rotate and flip?", a: "Rotate turns the image around its centre; flip mirrors it (horizontal = left-right, vertical = top-bottom)." },
  { q: "Is my image uploaded to a server?", a: "No — it's processed in your browser, so your image never leaves your device." },
];

export default function Page() {
  const appLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Free Rotate & Flip Image", applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const bcLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: BASE }, { "@type": "ListItem", position: 2, name: "All Tools", item: `${BASE}/tools` }, { "@type": "ListItem", position: 3, name: "Rotate & Flip", item: URL }] };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      <ScrollReveal />
      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "52px 20px 56px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>{" / "}<Link href="/tools" style={{ color: "#6B7280", textDecoration: "none" }}>Tools</Link>{" / "}<span style={{ color: "#374151" }}>Rotate &amp; Flip</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
              Rotate &amp; <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Flip Image</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 30px" }}>Upload, rotate or flip, and download — all right here. No watermark, nothing to install.</p>
            <RotateTool />
          </div>
        </section>
        <ToolFAQ faqs={FAQS} />
        <ToolRelated exclude="/rotate-image" />
      </div>
    </>
  );
}
