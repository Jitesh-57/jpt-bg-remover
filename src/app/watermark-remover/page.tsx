import type { Metadata } from "next";
import Link from "next/link";
import { blogCreative } from "@/lib/creative-images";
import SafeImage from "@/app/_components/SafeImage";
import ScrollReveal from "@/app/_components/ScrollReveal";
import WatermarkRemoverTool from "./WatermarkRemoverTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/watermark-remover`;
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";

export const metadata: Metadata = {
  title: { absolute: "Best Free Watermark Remover — Remove Watermark From Photos Online | Pixel Shine" },
  description:
    "Remove watermarks from photos free — just paint over the watermark and AI erases it. Logos, text, timestamps and signatures. 100% free, no sign-up, runs privately in your browser.",
  keywords:
    "watermark remover, remove watermark, watermark remover online, remove watermark from image, photo watermark remover, free watermark remover, remove watermark from photo, ai watermark remover, image watermark remover",
  alternates: { canonical: URL },
  openGraph: {
    title: "Best Free Watermark Remover — Remove Watermark From Photos | Pixel Shine",
    description: "Paint over a watermark and AI erases it — logos, text and timestamps. 100% free, no sign-up, nothing uploaded.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free Watermark Remover | Pixel Shine",
    description: "Paint over a watermark and AI erases it. 100% free, no sign-up, runs in your browser.",
  },
};

const FAQS = [
  { q: "How do I remove a watermark from an image for free?", a: "Upload your image, paint over the watermark with the brush and click Remove Painted Area. The AI rebuilds what was behind it — drag the slider to compare, then click Download." },
  { q: "Is it really free?", a: "Yes — completely. No sign-up, no credits, no limits and no watermark of our own on the result. It runs in your browser, so it costs us nothing per photo." },
  { q: "Is my photo uploaded anywhere?", a: "No. The AI model runs on your own device, in your browser. Your photo never leaves your computer or phone." },
  { q: "Why does the first removal take a little longer?", a: "The first time, your browser downloads the AI model (about 109 MB). It's saved, so after that removal starts straight away — usually in a second or two on a computer with a modern graphics card." },
  { q: "How do I make the brush bigger or smaller?", a: "Use the Brush size slider. The circle on the image shows exactly how much the brush will cover — paint a little past the edges of the watermark for the cleanest result." },
  { q: "What if part of the watermark is still visible?", a: "Click Paint & remove more, brush over what's left and remove it again. Undo last removal takes you back a step if you don't like a result." },
  { q: "What kinds of watermarks can it remove?", a: "Logos, text overlays, date and time stamps, signatures, stamps and small objects. It works best when the watermark sits over sky, walls, fabric or other natural texture." },
  { q: "Does it work on my phone?", a: "Yes. Paint with your finger on phones and tablets. Older phones without graphics acceleration are slower, but it still works." },
  { q: "Should I only remove watermarks I own?", a: "Yes. Only remove watermarks from images you own or have permission to edit. Removing someone else's watermark from copyrighted work without permission may be against their rights." },
];

const FEATURES = [
  { t: "Paint & it's gone", d: "Brush over the watermark and AI inpainting rebuilds what was behind it — no smudge, no blur.", icon: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" },
  { t: "100% free, no limits", d: "No account, no credits, no daily cap and no watermark of our own on the result.", icon: "M12 3v18M5 12h14" },
  { t: "Private — never uploaded", d: "The AI runs in your browser, so your photo stays on your device the whole time.", icon: "M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" },
  { t: "Any kind of mark", d: "Logos, text, timestamps, signatures, stamps and small objects.", icon: "M4 7h16M4 12h10M4 17h7" },
  { t: "Full-quality download", d: "Only the painted area changes — the rest of your photo stays exactly as it was.", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" },
  { t: "Undo & refine", d: "Remove more in as many passes as you like, and undo any step.", icon: "M13 3L4 14h7l-1 8 9-11h-7z" },
];

const REMOVES = [
  "Logo watermarks", "Text overlays", "Date & time stamps", "Signatures",
  "Stamps", "Captions", "Small objects", "Blemishes & spots",
];

const STEPS = [
  { t: "Upload your image", d: "Drag in or select the photo, screenshot or download that has the watermark you want gone." },
  { t: "Paint over the watermark", d: "Brush over it — the circle shows your brush size. Then click Remove Painted Area and the AI rebuilds what was behind it." },
  { t: "Download the clean image", d: "Compare with the slider, remove more if needed, then download — free, at full quality." },
]

/** Labeled before/after frame. Shows a placeholder until the creative is uploaded to the Blogs bucket. */
function Frame({ name, label, alt }: { name: string; label: string; alt: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0, aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", background: "linear-gradient(135deg,var(--accent-soft),var(--surface-2))" }}>
      <span style={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: label === "After" ? "var(--success)" : "var(--accent)", background: "var(--surface)", borderRadius: 999, padding: "4px 10px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>{label}</span>
      <SafeImage
        src={blogCreative(name)}
        alt={alt}
        wrapperStyle={{ position: "absolute", inset: 0 }}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--text-faint)" }}>{label} image</span>
    </div>
  );
}

function BeforeAfter({ id, caption }: { id: number; caption: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 16, boxShadow: "0 8px 24px rgba(30,41,90,.05)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <Frame name={`watermark-before-${id}`} label="Before" alt={`${caption} — with watermark`} />
        <Frame name={`watermark-after-${id}`} label="After" alt={`${caption} — watermark removed`} />
      </div>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center", margin: "12px 0 2px", fontWeight: 600 }}>{caption}</p>
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
  { href: "/invisible-watermark-remover", label: "Invisible Watermark & Metadata Remover" },
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

      <div style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO */}
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "60px 24px 52px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ Best Free Watermark Remover
            </div>
            <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>
              Remove Watermarks From Photos{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>in Seconds</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 30px" }}>
              Paint over the watermark and AI rebuilds what was behind it. Logos, text, timestamps and signatures — 100% free, no sign-up, and your photo never leaves your device.
            </p>
            <div id="tool" style={{ scrollMarginTop: 80 }}><WatermarkRemoverTool /></div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 26, fontSize: 13.5, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>✓ 100% free</span>
              <span>✓ No sign-up</span>
              <span>✓ Works on any device</span>
              <span>✓ Never uploaded</span>
            </div>
          </div>
        </section>

        {/* BEFORE / AFTER SHOWCASE */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>See the watermark disappear</h2>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: 0 }}>Real before &amp; after results — clean images with no trace of the original watermark.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
              <BeforeAfter id={1} caption="Logo watermark removed from a product photo" />
              <BeforeAfter id={2} caption="Text & timestamp cleared from a downloaded image" />
              <BeforeAfter id={3} caption="Date stamp erased cleanly" />
              <BeforeAfter id={4} caption="Signature removed from artwork" />
            </div>
          </div>
        </section>

        {/* WHY BEST — FEATURES */}
        <section style={{ padding: "56px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 38 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>Why it&apos;s the best watermark remover</h2>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: 0 }}>Built to make watermarks vanish without leaving a smudge behind.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
              {FEATURES.map((f) => (
                <div key={f.t} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px", boxShadow: "0 6px 20px rgba(30,41,90,.04)" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                  </span>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{f.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 34px", letterSpacing: "-0.02em", textAlign: "center" }}>How to remove a watermark</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT YOU CAN REMOVE */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 22px", letterSpacing: "-0.02em" }}>What you can remove</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {REMOVES.map((r) => (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span>{r}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "56px 24px", background: "var(--surface-2)" }}>
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

        {/* FINAL CTA */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", background: GRAD, borderRadius: 22, padding: "40px 30px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Ready to remove your watermark?</h2>
            <p style={{ margin: "0 0 24px", fontSize: 15.5, color: "rgba(255,255,255,.92)" }}>Upload your image and get a clean, watermark-free result — free to try, no sign-up.</p>
            <a href="#tool" className="jpt-hover" style={{ display: "inline-block", background: "var(--surface)", color: "var(--accent)", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>
              Remove Watermark Now →
            </a>
          </div>
        </section>

        {/* RELATED FREE TOOLS — internal linking */}
        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free image tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  {r.label}
                </Link>
              ))}
              <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", border: "1px solid #C7CDF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                All tools →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
