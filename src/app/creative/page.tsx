import { Metadata } from "next";
import { CREATIVE_APPS, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";

const BASE = "https://www.sjpt.in";
const URL = `${BASE}${CREATIVE_BASE}`;

export const metadata: Metadata = {
  title: "JPT AI Creative Apps — Free AI Photo Generators Online | JPT AI",
  description:
    "Free JPT AI Creative apps — saree photoshoot, 3D figurine, retro Bollywood, pet portrait, anime and more. Upload a photo and get the result right on the page. No app, no watermark.",
  keywords: "ai creative apps, ai photo generator free, ai photoshoot online, ai photo trends, free ai photo editor apps",
  alternates: { canonical: URL },
  openGraph: { title: "JPT AI Creative Apps — Free AI Photo Generators", description: "Upload a photo and get viral AI results right on the page. Free, no watermark.", url: URL },
};

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: CREATIVE_APPS.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.h1, url: `${URL}/${a.slug}` })),
};

export default function CreativeHub() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#fff" }}>
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "80px 24px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ JPT AI Creative Apps
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 900, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Viral AI Photo Apps — Free &amp; Instant
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
              Upload a photo and get the result right on the page — saree photoshoots, 3D figurines, retro portraits, pet art and more. No app to download, no watermark.
            </p>
          </div>
        </section>

        <section style={{ padding: "48px 24px 88px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
              {CREATIVE_APPS.map((a) => (
                <a key={a.slug} href={`${CREATIVE_BASE}/${a.slug}`} style={{ display: "block", textDecoration: "none", borderRadius: 18, overflow: "hidden", border: "1px solid #EAECF0", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ aspectRatio: "16 / 10", background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`, position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl(a.slug, 800)} alt={`${a.h1} before and after example`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", bottom: 10, right: 10, padding: "5px 12px", background: "rgba(255,255,255,0.92)", color: "#4338CA", fontSize: 11, fontWeight: 800, borderRadius: 8 }}>{a.emoji} {a.badge}</span>
                  </div>
                  <div style={{ padding: "18px 18px 20px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}>{a.h1}</div>
                    <p style={{ margin: 0, fontSize: 13.5, color: "#6B7280", lineHeight: 1.6 }}>{a.intro}</p>
                    <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "#6366F1" }}>Try free →</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
