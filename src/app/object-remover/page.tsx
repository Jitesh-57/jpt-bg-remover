import { seoJson, seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import { CREDIT_COST } from "@/lib/plans";
import type { Metadata } from "next";
import Link from "next/link";
import ObjectRemoverTool from "./ObjectRemoverTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/object-remover`;

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Object Remover: Remove Objects From Photos | Pixel Shine") },
  description: "Remove people, objects, text and anything else from a photo. Brush over it, press Remove, and AI fills the gap so it looks like it was never there.",
  keywords: "ai object remover, remove object from photo, remove person from photo, object eraser, remove unwanted objects, magic eraser online",
  alternates: { canonical: URL },
  openGraph: {
    title: "AI Object Remover — Remove Objects & People From Photos | Pixel Shine",
    description: "Brush over anything in a photo and AI removes it, filling the gap from what's around it.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
  },
});

const STEPS = [
  { n: "1", t: "Upload a photo", d: "A JPG, PNG or WebP. Large photos are kept up to 3,072 pixels on the long side." },
  { n: "2", t: "Brush over what to remove", d: "Paint over the person, object or text, a little past its edges. Brushed too much? Switch to Erase." },
  { n: "3", t: "Press Remove", d: "AI removes it and fills the gap from what's around it. Compare before and after, then download." },
];

const REMOVES = [
  "People in the background", "Tourists and crowds", "Cars and bikes", "Signs and poles",
  "Power lines and wires", "Text and logos", "Bins, cones and clutter", "Spots and blemishes",
];

const FAQS = [
  { q: "How do I remove an object from a photo?", a: "Upload the photo, brush over the object with the Brush and press Remove. AI takes it out and fills the space from the surrounding picture. Drag the slider to compare before and after, then download." },
  { q: "How much does it cost?", a: `Each removal uses ${CREDIT_COST} credits. Credits come with a monthly plan or a one-time pack, and pack credits never expire. Brushing, undoing and comparing are free; only pressing Remove uses credits, and a removal that fails costs nothing.` },
  { q: "Can it remove a person from a photo?", a: "Yes. Brush over the person, including their shadow, and AI rebuilds the scene behind them. It works best when what's behind them is grass, sky, sand, a wall or a street, rather than another person." },
  { q: "I brushed over too much. How do I fix it?", a: "Switch to Erase and brush over the part you want to keep: it takes the brush off. Undo steps back one stroke, and Clear starts the selection again." },
  { q: "Part of the object is still there. What now?", a: "Press \"Brush & remove more\", brush over what's left and remove it again. Each pass works on the last result, and \"Undo last removal\" goes back a step." },
  { q: "Does it add a watermark?", a: "No. The result has no watermark, and it's saved in My Creations so you can download it again later." },
  { q: "Is my photo private?", a: "Your photo is sent to our AI partner to make the edit and saved to your account so you can find it in My Creations. It isn't used to train AI models and isn't sold. See our privacy policy for details." },
  { q: "Do I need an account?", a: "Yes, because removals use credits. Sign in with Google or email; your photo waits for you while you do." },
];

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "AI Object Remover", applicationCategory: "MultimediaApplication", operatingSystem: "Web", url: URL,
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "AI Object Remover", item: URL },
    ],
  };
  const h2: React.CSSProperties = { fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 26px", textWrap: "balance" };
  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 };

  return (
    <main style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(breadcrumbLd) }} />

      <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 60%)", padding: "48px 16px 52px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent-strong)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "5px 12px" }}>
            AI tool · {CREDIT_COST} credits per removal
          </span>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", margin: "16px 0 12px", textWrap: "balance" }}>
            AI Object Remover
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 28px" }}>
            Remove people, objects, text or anything else from a photo. Brush over it, press Remove, and AI fills the gap so it looks like it was never there.
          </p>
          <div id="tool" style={{ scrollMarginTop: 80 }}>
            <ObjectRemoverTool />
          </div>
        </div>
      </section>

      <section style={{ padding: "52px 16px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={h2}>How to remove an object from a photo</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={card}>
                <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-strong)", fontWeight: 900 }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "12px 0 6px" }}>{s.t}</h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "52px 16px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={h2}>What can you remove?</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {REMOVES.map((r) => (
              <span key={r} style={{ fontSize: 14.5, fontWeight: 700, padding: "9px 15px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)" }}>{r}</span>
            ))}
          </div>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 700, margin: "24px auto 0", textAlign: "center" }}>
            The AI looks at everything around what you brushed — the sky, the water, the wall, the pattern on the floor — and continues it into the gap. Busy, detailed backgrounds can take a second pass; plain ones usually come out clean the first time.
            For a watermark on a photo you own, the free <Link href="/watermark-remover" style={{ color: "var(--accent-strong)" }}>watermark remover</Link> runs in your browser.
          </p>
        </div>
      </section>

      <section style={{ padding: "52px 16px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <h2 style={h2}>Questions people ask</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQS.map((f) => (
              <details key={f.q} className="jpt-faq">
                <summary className="jpt-faq-q">
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", lineHeight: 1.4 }}>{f.q}</span>
                  <span className="jpt-faq-icon" aria-hidden />
                </summary>
                <div style={{ padding: "0 24px 20px", color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
