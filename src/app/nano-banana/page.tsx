import { Metadata } from "next";
import { NANO_BANANA_PAGES, NANO_BANANA_BASE, NANO_BANANA_TOOL_HREF } from "@/lib/nano-banana";

const BASE = "https://www.sjpt.in";
const URL = `${BASE}${NANO_BANANA_BASE}`;

export const metadata: Metadata = {
  title: "Nano Banana AI Photo Editor — Free Viral Trends & Prompts | JPT AI",
  description:
    "Try every viral Nano Banana AI trend free online — saree photoshoot, 3D figurine, retro Bollywood, polaroid and more. No app, no watermark.",
  keywords: "nano banana, nano banana ai, nano banana online free, nano banana photo editor, nano banana trends, nano banana prompts",
  alternates: { canonical: URL },
  openGraph: { title: "Nano Banana AI Photo Editor — Free Viral Trends", description: "Try every viral Nano Banana AI trend free online. No app, no watermark.", url: URL },
};

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: NANO_BANANA_PAGES.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.h1,
    url: `${URL}/${p.slug}`,
  })),
};

export default function NanoBananaHub() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#fff" }}>
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "80px 24px 56px", textAlign: "center" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              🍌 Nano Banana Trends
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 900, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Every Viral Nano Banana AI Trend — Free
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 32px" }}>
              Recreate the trends taking over your feed — saree photoshoots, 3D figurines, retro Bollywood, polaroids and more. Upload a photo, describe the look, and download free. No app, no watermark.
            </p>
            <a href={NANO_BANANA_TOOL_HREF} style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 16, padding: "16px 36px", borderRadius: 14, textDecoration: "none", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}>
              📂 Start Editing Free →
            </a>
          </div>
        </section>

        <section style={{ padding: "64px 24px 88px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {NANO_BANANA_PAGES.map((p) => (
                <a key={p.slug} href={`${NANO_BANANA_BASE}/${p.slug}`}
                  style={{ display: "block", background: "#F7F8FC", border: "1px solid #EAECF0", borderRadius: 18, padding: "26px 24px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{p.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.3 }}>{p.h1.replace(" — Free", "").replace(" — Free AI", "").replace(" — Free Online", "")}</div>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#6B7280", lineHeight: 1.6 }}>{p.intro}</p>
                  <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "#6366F1" }}>Try free →</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
