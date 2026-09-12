import type { Metadata } from "next";
import Link from "next/link";
import QrGenerator from "./QrGenerator";
import PricingSection from "@/app/_components/PricingSection";
import SafeImage from "@/app/_components/SafeImage";
import { blogCreative } from "@/lib/creative-images";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/qr-code-generator`;
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";

export const metadata: Metadata = {
  title: { absolute: "Free QR Code Generator — Create a QR Code Online | Pixel Shine" },
  description:
    "Free online QR code generator. Turn any link or text into a QR code and download it as a PNG or SVG — custom colours, no watermark, no sign-up, made in your browser.",
  keywords:
    "qr code generator, free qr code generator, create qr code, qr code maker online, generate qr code free, qr code png svg, custom qr code",
  openGraph: {
    title: "Free QR Code Generator — Create & Download QR Codes | Pixel Shine",
    description: "Turn any link or text into a QR code and download PNG or SVG — free, custom colours, no sign-up.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator | Pixel Shine",
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
  { icon: "🔍", title: "Image Upscaler", href: "/" },
  { icon: "🗜️", title: "Compress Image", href: "/compress-image" },
  { icon: "↔️", title: "Resize Image", href: "/resize-image" },
  { icon: "📄", title: "Image to PDF", href: "/image-to-pdf" },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO + TOOL */}
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "56px 24px 48px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <div style={{ display: "inline-block", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
                Free · No watermark · No sign-up
              </div>
              <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 14px" }}>
                Free{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>QR Code</span>{" "}
                Generator
              </h1>
              <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
                Turn any link or text into a QR code and download it as a PNG or SVG. Custom colours, made right in your browser — no watermark, no sign-up.
              </p>
            </div>
            <QrGenerator />
          </div>
        </section>


        {/* SHOWCASE — creative slot (Blogs bucket: qr-code-generator-showcase.png) */}
        <section style={{ padding: "8px 24px 48px", background: "var(--surface)" }}>
          <SafeImage
            src={blogCreative("qr-code-generator-showcase")}
            alt="QR Code Generator — a scannable QR code generated from a link"
            wrapperStyle={{ maxWidth: 900, margin: "0 auto" }}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 18, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}
          />
        </section>
        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to make a QR code
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 24 }}>
              {[
                { t: "Enter your link or text", d: "Paste a URL or type any text you want the QR code to open." },
                { t: "Customise it", d: "Pick colours, size and error-correction to match your brand or print needs." },
                { t: "Download", d: "Save a high-resolution PNG or a scalable SVG — free, no watermark." },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING (shared) */}
        <PricingSection toolName="QR Code Generator" />

        {/* FAQ */}
        <section style={{ padding: "48px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED */}
        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
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
