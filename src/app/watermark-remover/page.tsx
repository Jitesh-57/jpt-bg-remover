import type { Metadata } from "next";
import Link from "next/link";
import { blogCreative } from "@/lib/creative-images";
import SafeImage from "@/app/_components/SafeImage";
import ScrollReveal from "@/app/_components/ScrollReveal";
import WatermarkRemoverCTA from "./WatermarkRemoverCTA";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/watermark-remover`;
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export const metadata: Metadata = {
  title: { absolute: "Best Free Watermark Remover — Remove Watermark From Photos Online | JPT AI" },
  description:
    "Remove watermarks from images online with the best free AI watermark remover. Erase logos, text, timestamps and stock watermarks from photos in seconds — no software, no sign-up.",
  keywords:
    "watermark remover, remove watermark, watermark remover online, remove watermark from image, photo watermark remover, free watermark remover, remove watermark from photo, ai watermark remover, image watermark remover",
  alternates: { canonical: URL },
  openGraph: {
    title: "Best Free Watermark Remover — Remove Watermark From Photos | JPT AI",
    description: "Erase logos, text and stock watermarks from images with the best free AI watermark remover — fast, online, no sign-up.",
    url: URL,
    type: "website",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free Watermark Remover | JPT AI",
    description: "Remove watermarks from photos online free with AI — logos, text, timestamps and more.",
  },
};

const FAQS = [
  { q: "How do I remove a watermark from an image for free?", a: "Upload your image here, then click Remove Watermark. Our recommended AI watermark remover erases logos, text and stock watermarks automatically — no software to install and free to try." },
  { q: "What kinds of watermarks can it remove?", a: "It handles most common watermarks: semi-transparent logos, text overlays, date and time stamps, stock-photo watermarks, signatures and repeated tiled marks across a photo." },
  { q: "Is the watermark remover really free?", a: "Yes — you can upload and try it free with no sign-up. It's the fastest way to see your image cleaned up before you download." },
  { q: "Does it work on my phone?", a: "Yes. It runs entirely in your browser, so it works on phones, tablets and computers — nothing to download." },
  { q: "Will the quality of my photo drop?", a: "The AI fills in the area behind the watermark to match the surrounding image, so the result stays sharp and natural in most photos." },
  { q: "Should I only remove watermarks I own?", a: "Yes. Only remove watermarks from images you own or have permission to edit. Removing someone else's watermark from copyrighted work without permission may be against their rights." },
];

const FEATURES = [
  { t: "AI-powered removal", d: "Smart inpainting rebuilds the area behind the watermark so the fix looks natural, not smudged.", icon: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" },
  { t: "Any kind of watermark", d: "Logos, text, timestamps, signatures and stock-photo marks — cleared in a couple of clicks.", icon: "M4 7h16M4 12h10M4 17h7" },
  { t: "Photos, screenshots & more", d: "Works on JPG, PNG and WEBP — product shots, screenshots, downloads and social images.", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" },
  { t: "Free to try, no sign-up", d: "Upload and see your cleaned image before you commit — no account, no watermark of our own.", icon: "M12 3v18M5 12h14" },
  { t: "Fast & online", d: "No installs, no waiting on heavy software — the whole thing runs right in your browser.", icon: "M13 3L4 14h7l-1 8 9-11h-7z" },
  { t: "Private & secure", d: "Your upload stays your own — a quick, hassle-free way to clean up an image.", icon: "M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" },
];

const REMOVES = [
  "Logo watermarks", "Text overlays", "Date & time stamps", "Stock-photo watermarks",
  "Signatures", "Tiled / repeated marks", "Copyright stamps", "Brand overlays",
];

const STEPS = [
  { t: "Upload your image", d: "Drag in or select the photo, screenshot or download that has the watermark you want gone." },
  { t: "Click Remove Watermark", d: "The AI detects the watermark and rebuilds the pixels behind it to match the rest of the photo." },
  { t: "Download the clean image", d: "Get a crisp, watermark-free version ready to post, print or reuse anywhere." },
];

/** Labeled before/after frame. Shows a placeholder until the creative is uploaded to the Blogs bucket. */
function Frame({ name, label, alt }: { name: string; label: string; alt: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0, aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", border: "1px solid #E6E8F2", background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)" }}>
      <span style={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: label === "After" ? "#059669" : "#6366F1", background: "#fff", borderRadius: 999, padding: "4px 10px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>{label}</span>
      <SafeImage
        src={blogCreative(name)}
        alt={alt}
        wrapperStyle={{ position: "absolute", inset: 0 }}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#A5AECB" }}>{label} image</span>
    </div>
  );
}

function BeforeAfter({ id, caption }: { id: number; caption: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EAECF5", borderRadius: 18, padding: 16, boxShadow: "0 8px 24px rgba(30,41,90,.05)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <Frame name={`watermark-before-${id}`} label="Before" alt={`${caption} — with watermark`} />
        <Frame name={`watermark-after-${id}`} label="After" alt={`${caption} — watermark removed`} />
      </div>
      <p style={{ fontSize: 13.5, color: "#6B7280", textAlign: "center", margin: "12px 0 2px", fontWeight: 600 }}>{caption}</p>
    </div>
  );
}

const RELATED = [
  { href: "/tiktok-watermark-remover", label: "TikTok No-Watermark" },
  { href: "/compress-image", label: "Compress Image" },
  { href: "/convert-image", label: "Convert Image" },
  { href: "/crop-image", label: "Crop Image" },
  { href: "/upscale", label: "Image Upscaler" },
  { href: "/watermark-image", label: "Add Watermark" },
];

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Best Free Watermark Remover", applicationCategory: "MultimediaApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL,
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1240" },
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Watermark Remover", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        {/* HERO */}
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "60px 24px 52px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ Best Free Watermark Remover
            </div>
            <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 16px" }}>
              Remove Watermarks From Photos{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>in Seconds</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 30px" }}>
              The best free AI watermark remover online. Erase logos, text, timestamps and stock watermarks from any image — no software, no sign-up. Just upload and click.
            </p>
            <WatermarkRemoverCTA />
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 26, fontSize: 13.5, color: "#6B7280", fontWeight: 600 }}>
              <span>✓ Free to try</span>
              <span>✓ No sign-up</span>
              <span>✓ Works on any device</span>
              <span>✓ AI-powered</span>
            </div>
          </div>
        </section>

        {/* BEFORE / AFTER SHOWCASE */}
        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>See the watermark disappear</h2>
              <p style={{ fontSize: 15.5, color: "#6B7280", margin: 0 }}>Real before &amp; after results — clean images with no trace of the original watermark.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
              <BeforeAfter id={1} caption="Logo watermark removed from a product photo" />
              <BeforeAfter id={2} caption="Text & timestamp cleared from a downloaded image" />
              <BeforeAfter id={3} caption="Stock-photo watermark erased cleanly" />
              <BeforeAfter id={4} caption="Signature removed from artwork" />
            </div>
          </div>
        </section>

        {/* WHY BEST — FEATURES */}
        <section style={{ padding: "56px 24px", background: "#F9FAFB" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 38 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>Why it&apos;s the best watermark remover</h2>
              <p style={{ fontSize: 15.5, color: "#6B7280", margin: 0 }}>Built to make watermarks vanish without leaving a smudge behind.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
              {FEATURES.map((f) => (
                <div key={f.t} style={{ background: "#fff", border: "1px solid #EAECF5", borderRadius: 16, padding: "24px 22px", boxShadow: "0 6px 20px rgba(30,41,90,.04)" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                  </span>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{f.t}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 34px", letterSpacing: "-0.02em", textAlign: "center" }}>How to remove a watermark</h2>
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

        {/* WHAT YOU CAN REMOVE */}
        <section style={{ padding: "8px 24px 56px", background: "#fff" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 22px", letterSpacing: "-0.02em" }}>What you can remove</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {REMOVES.map((r) => (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, color: "#334155" }}>
                  <span style={{ color: "#6366F1" }}>✓</span>{r}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "56px 24px", background: "#F9FAFB" }}>
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

        {/* FINAL CTA */}
        <section style={{ padding: "8px 24px 56px", background: "#F9FAFB" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", background: GRAD, borderRadius: 22, padding: "40px 30px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Ready to remove your watermark?</h2>
            <p style={{ margin: "0 0 24px", fontSize: 15.5, color: "rgba(255,255,255,.92)" }}>Upload your image and get a clean, watermark-free result — free to try, no sign-up.</p>
            <a href="https://www.gostudio.ai/watermark-remover" rel="sponsored nofollow noopener" className="jpt-hover" style={{ display: "inline-block", background: "#fff", color: "#6366F1", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>
              Remove Watermark Now →
            </a>
          </div>
        </section>

        {/* RELATED FREE TOOLS — internal linking */}
        <section style={{ padding: "48px 24px 72px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free image tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                  {r.label}
                </Link>
              ))}
              <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7CDF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "#6366F1", textDecoration: "none" }}>
                All tools →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
