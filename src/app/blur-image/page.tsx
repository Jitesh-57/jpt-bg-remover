import type { Metadata } from "next";
import Link from "next/link";
import BlurTool from "./BlurTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/blur-image`;
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export const metadata: Metadata = {
  title: { absolute: "Free Blur Image Tool — Blur or Pixelate Part of a Photo | JPT AI" },
  description:
    "Blur or pixelate part of an image free online. Hide faces, licence plates, addresses and sensitive info — drag a box to censor it. No watermark, no sign-up, private in your browser.",
  keywords:
    "blur image, blur part of image, blur face, pixelate image, censor image, blur image online free, hide sensitive information image, blur license plate",
  openGraph: {
    title: "Free Blur Image Tool — Blur or Pixelate Part of a Photo | JPT AI",
    description: "Blur or pixelate faces and sensitive info in a photo, free. Drag a box to censor — no watermark, no sign-up.",
    url: URL,
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Blur Image Tool | JPT AI",
    description: "Blur or pixelate part of a photo free — hide faces and sensitive info. No sign-up.",
  },
  alternates: { canonical: URL },
};

const FAQS = [
  { q: "How do I blur part of an image?", a: "Upload your photo, then drag a box over the area you want to hide — it's blurred instantly. Repeat for as many areas as you like, then download." },
  { q: "Can I pixelate instead of blur?", a: "Yes. Switch to Pixelate mode to censor an area with a mosaic effect instead of a soft blur — useful for a stronger, more obvious redaction." },
  { q: "Is it good for hiding faces or licence plates?", a: "Yes — it's ideal for hiding faces, licence plates, house numbers, addresses, screenshots and any other sensitive detail before you share a photo." },
  { q: "Does it add a watermark?", a: "No watermark, ever. Your edited image downloads clean at full resolution." },
  { q: "Is my image uploaded to a server?", a: "No. The blur happens entirely in your browser, so your photo never leaves your device — important when you're hiding private information." },
  { q: "Is it free?", a: "Yes — completely free, with no sign-up and no limit on how many images you blur." },
];

const appLd = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "Free Blur Image Tool", applicationCategory: "MultimediaApplication", operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL,
};
const faqLd = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const RELATED = [
  { icon: "✂️", title: "Crop Image", href: "/crop-image" },
  { icon: "↔️", title: "Resize Image", href: "/resize-image" },
  { icon: "🔖", title: "Add Watermark", href: "/watermark-image" },
  { icon: "🗜️", title: "Compress Image", href: "/compress-image" },
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
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
                Free · Private · No sign-up
              </div>
              <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
                Free{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Blur Image</span>{" "}
                Tool
              </h1>
              <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
                Blur or pixelate any part of a photo to hide faces, licence plates and sensitive info. Just drag a box — it all happens in your browser, so your image stays private.
              </p>
            </div>
            <BlurTool />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to blur part of an image
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 24 }}>
              {[
                { t: "Upload your photo", d: "Drag and drop or pick an image. It's loaded straight into your browser — never uploaded." },
                { t: "Drag over the area", d: "Draw a box over each face or detail you want to hide. Choose blur or pixelate and set the strength." },
                { t: "Download", d: "Save the censored image at full resolution — free, with no watermark." },
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
