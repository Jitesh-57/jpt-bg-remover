import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/app/_components/ScrollReveal";
import UpscaleTool from "./UpscaleTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/tools/upscale`;
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export const metadata: Metadata = {
  title: { absolute: "Free Image Upscaler — Upscale & Download Here | JPT AI" },
  description:
    "Upscale images 2× and 4× right on this page — upload, enhance and download in seconds. Free, no sign-up for basic upscaling, no watermark, nothing to install.",
  keywords: "image upscaler, upscale image, enhance image resolution, upscale photo online, free image upscaler, 4k upscaler",
  alternates: { canonical: URL },
  openGraph: { title: "Free Image Upscaler — Upscale & Download Here | JPT AI", description: "Upload, upscale 2× or 4×, and download — all on one page. Free, no watermark.", url: URL, type: "website", siteName: "JPT AI" },
  twitter: { card: "summary_large_image", title: "Free Image Upscaler | JPT AI", description: "Upscale images 2× and 4× on-page — free, no watermark." },
};

const STEPS = [
  { t: "Upload your image", d: "Drop a JPG, PNG or WEBP straight onto the page — it's processed privately in your browser." },
  { t: "Choose 2× or 4×", d: "2× is free. 4× ultra-resolution is part of the one-time Unlimited plan." },
  { t: "Download", d: "Get your sharper, higher-resolution image instantly — no watermark, nothing to install." },
];

const FAQS = [
  { q: "Is the image upscaler free?", a: "Yes — 2× upscaling is free, right here on the page, with no sign-up. Guests get 5 free edits, then a free account keeps the basic tools unlimited. 4× ultra upscaling is part of the one-time $5 Unlimited plan." },
  { q: "Do I need to install anything?", a: "No. It runs entirely in your browser — upload, upscale and download without any app or software." },
  { q: "Does it add a watermark?", a: "No — your upscaled image is clean, with no watermark." },
  { q: "Will upscaling improve a blurry photo?", a: "Upscaling enlarges and sharpens, reconstructing edges and detail. Low-resolution and soft images improve the most; heavily blurred ones improve less." },
  { q: "Is my image uploaded to a server?", a: "No — upscaling happens on your device, so your image never leaves your browser." },
  { q: "What's the difference between 2× and 4×?", a: "2× doubles each dimension (4× the pixels); 4× quadruples each dimension (16× the pixels) for large prints and 4K screens." },
];

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Free Image Upscaler", applicationCategory: "MultimediaApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL,
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "All Tools", item: `${BASE}/tools` },
      { "@type": "ListItem", position: 3, name: "Image Upscaler", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        {/* HERO + TOOL */}
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "52px 20px 56px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>{" / "}
              <Link href="/tools" style={{ color: "#6B7280", textDecoration: "none" }}>Tools</Link>{" / "}
              <span style={{ color: "#374151" }}>Image Upscaler</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
              Free Image <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Upscaler</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 30px" }}>
              Upload, upscale 2× or 4×, and download — all right here. No editor, no watermark, nothing to install.
            </p>
            <UpscaleTool />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 34px", letterSpacing: "-0.02em", textAlign: "center" }}>How to upscale an image</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ background: "#F8F9FC", border: "1px solid #EAECF5", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "48px 24px", background: "#F9FAFB" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "#111827", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED */}
        <section style={{ padding: "48px 24px 72px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free image tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { href: "/compress-image", label: "Compress Image" },
                { href: "/convert-image", label: "Convert Image" },
                { href: "/crop-image", label: "Crop Image" },
                { href: "/rotate-image", label: "Rotate & Flip" },
                { href: "/watermark-remover", label: "Watermark Remover" },
              ].map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                  {r.label}
                </Link>
              ))}
              <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "#6366F1", textDecoration: "none" }}>
                All tools →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
