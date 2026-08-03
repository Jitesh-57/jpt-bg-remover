import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/app/_components/ScrollReveal";
import CompressTool from "./CompressTool";
import { ToolFAQ, ToolRelated, TOOL_GRAD as GRAD } from "@/app/tools/_components/ToolPageBits";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/tools/compress`;

export const metadata: Metadata = {
  title: { absolute: "Free Image Compressor — Compress & Download Here | JPT AI" },
  description: "Compress JPG, PNG and WEBP images right on this page — upload, shrink the file size and download in seconds. Free, no watermark, nothing to install.",
  keywords: "compress image, image compressor, reduce image size, shrink image, compress jpg, compress png",
  alternates: { canonical: URL },
  openGraph: { title: "Free Image Compressor — Compress & Download Here | JPT AI", description: "Upload, compress and download — all on one page. Free, no watermark.", url: URL, type: "website", siteName: "JPT AI" },
};

const FAQS = [
  { q: "Is the image compressor free?", a: "Yes — compressing is free right on the page. Guests get 5 free edits, then a free account keeps it unlimited. No watermark." },
  { q: "Do I need to install anything?", a: "No — it runs entirely in your browser. Your image never leaves your device." },
  { q: "How much can I compress an image?", a: "Lower the quality slider for a smaller file. Around 60–80% is usually invisible for photos while cutting the size a lot." },
  { q: "What formats does it work on?", a: "Upload JPG, PNG or WEBP. The compressed output is a JPEG, which is ideal for photos." },
];

export default function Page() {
  const appLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Free Image Compressor", applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const bcLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: BASE }, { "@type": "ListItem", position: 2, name: "All Tools", item: `${BASE}/tools` }, { "@type": "ListItem", position: 3, name: "Image Compressor", item: URL }] };

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
              <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>{" / "}<Link href="/tools" style={{ color: "#6B7280", textDecoration: "none" }}>Tools</Link>{" / "}<span style={{ color: "#374151" }}>Image Compressor</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
              Free Image <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Compressor</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 30px" }}>Upload, shrink the file size, and download — all right here. No watermark, nothing to install.</p>
            <CompressTool />
          </div>
        </section>
        <ToolFAQ faqs={FAQS} />
        <ToolRelated exclude="/compress-image" />
      </div>
    </>
  );
}
