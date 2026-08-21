import type { Metadata } from "next";
import Link from "next/link";
import QrGenerator from "./QrGenerator";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/qr-code-generator`;
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export const metadata: Metadata = {
  title: { absolute: "Free QR Code Generator — Create a QR Code Online | JPT AI" },
  description:
    "Free online QR code generator. Turn any link or text into a QR code and download it as a PNG or SVG — custom colours, no watermark, no sign-up, made in your browser.",
  keywords:
    "qr code generator, free qr code generator, create qr code, qr code maker online, generate qr code free, qr code png svg, custom qr code",
  openGraph: {
    title: "Free QR Code Generator — Create & Download QR Codes | JPT AI",
    description: "Turn any link or text into a QR code and download PNG or SVG — free, custom colours, no sign-up.",
    url: URL,
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator | JPT AI",
    description: "Create a QR code from any link or text and download it free — PNG or SVG, no sign-up.",
  },
  alternates: { canonical: URL },
};

const FAQS = [
  { q: "Is this QR code generator free?", a: "Yes — completely free with no sign-up, no watermark and no limit on how many QR codes you create." },
  { q: "Do the QR codes ever expire?", a: "No. These are static QR codes that encode your link or text directly, so they never expire and keep working forever." },
  { q: "Can I download the QR code as an SVG?", a: "Yes. You can download a high-resolution PNG or a scalable SVG — SVG is ideal for print because it stays sharp at any size." },
  { q: "Can I change the colours?", a: "Yes — pick any foreground and background colour. Keep good contrast (dark code on a light background) so scanners read it reliably." },
  { q: "What can I put in a QR code?", a: "Any link (website, menu, form, social profile) or plain text — Wi-Fi details, contact info, a message, and more." },
  { q: "Is my data private?", a: "Yes. The QR code is generated entirely in your browser, so whatever you encode never leaves your device." },
];

const appLd = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "Free QR Code Generator", applicationCategory: "UtilitiesApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL,
};
const faqLd = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const RELATED = [
  { icon: "🔍", title: "Image Upscaler", href: "/upscale" },
  { icon: "🗜️", title: "Compress Image", href: "/compress-image" },
  { icon: "↔️", title: "Resize Image", href: "/resize-image" },
  { icon: "📄", title: "Image to PDF", href: "/image-to-pdf" },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        {/* HERO + TOOL */}
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "56px 24px 48px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
                Free · No watermark · No sign-up
              </div>
              <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
                Free{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>QR Code</span>{" "}
                Generator
              </h1>
              <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
                Turn any link or text into a QR code and download it as a PNG or SVG. Custom colours, made right in your browser — no watermark, no sign-up.
              </p>
            </div>
            <QrGenerator />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to make a QR code
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 24 }}>
              {[
                { t: "Enter your link or text", d: "Paste a URL or type any text you want the QR code to open." },
                { t: "Customise it", d: "Pick colours, size and error-correction to match your brand or print needs." },
                { t: "Download", d: "Save a high-resolution PNG or a scalable SVG — free, no watermark." },
              ].map((s, i) => (
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                  <span>{r.icon}</span> {r.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
