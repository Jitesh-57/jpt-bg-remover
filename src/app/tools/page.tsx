import type { Metadata } from "next";
import Link from "next/link";
import { CONVERSIONS, buildContent } from "@/lib/conversions";
import { COMPRESSIONS } from "@/lib/compressions";
import { CROPS } from "@/lib/crops";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/tools`;

export const metadata: Metadata = {
  title: { absolute: "All Free Image Tools — Convert, Compress, Crop, Upscale & More | JPT AI" },
  description:
    "Every free JPT AI image tool in one place: upscale, compress, convert (PNG, JPG, WebP), crop, rotate, watermark, meme maker, image to PDF, and TikTok downloader. No watermark, no sign-up.",
  keywords: "free image tools, online image tools, image converter, image compressor, crop image, upscale image, free photo tools",
  alternates: { canonical: URL },
  openGraph: { title: "All Free Image Tools | JPT AI", description: "Every free JPT AI image tool in one place — no watermark, no sign-up.", url: URL, type: "website", siteName: "JPT AI" },
};

const CORE_TOOLS = [
  { icon: "🔍", name: "Image Upscaler", desc: "Enhance resolution up to 4×", href: "/upscale" },
  { icon: "🗜️", name: "Compress Image", desc: "Reduce file size to KB", href: "/compress-image" },
  { icon: "🔀", name: "Convert Format", desc: "JPG · PNG · WebP", href: "/convert-image" },
  { icon: "✂️", name: "Crop Image", desc: "Social ratios + circle crop", href: "/crop-image" },
  { icon: "🔄", name: "Rotate & Flip", desc: "Turn or mirror photos", href: "/rotate-image" },
  { icon: "🔖", name: "Add Watermark", desc: "Text watermark on photos", href: "/watermark-image" },
  { icon: "😂", name: "Meme Generator", desc: "Top & bottom meme text", href: "/meme-generator" },
  { icon: "📄", name: "Image to PDF", desc: "JPG & PNG to PDF", href: "/image-to-pdf" },
  { icon: "🎬", name: "TikTok No-Watermark", desc: "Download TikTok videos clean", href: "/tiktok-watermark-remover" },
  { icon: "🧩", name: "Batch Editor", desc: "Process many images at once", href: "/batch-editor" },
];

function Chips({ items, icon = "→" }: { items: { href: string; label: string }[]; icon?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 }}>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            background: "#fff", border: "1px solid #EAECF5", borderRadius: 14, padding: "14px 16px",
            fontSize: 14.5, fontWeight: 700, color: "#1E293B", textDecoration: "none",
            boxShadow: "0 4px 14px rgba(30,41,90,.05)",
          }}
        >
          <span>{i.label}</span>
          <span aria-hidden style={{ color: "#6366F1", fontWeight: 800, flexShrink: 0 }}>{icon}</span>
        </Link>
      ))}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>{children}</h2>
      {sub && <p style={{ fontSize: 14.5, color: "#6B7280", margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

export default function ToolsPage() {
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Free Image Tools",
    url: URL,
    hasPart: [
      ...CORE_TOOLS.map((t) => ({ "@type": "SoftwareApplication", name: t.name, url: `${BASE}${t.href}`, applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } })),
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "All Tools", item: URL },
    ],
  };

  const convertChips = CONVERSIONS.map((c) => { const ct = buildContent(c); return { href: `/convert/${c.slug}`, label: `${ct.fromLabel} → ${ct.toLabel}` }; });
  const compressChips = COMPRESSIONS.map((c) => ({ href: `/compress/${c.slug}`, label: `Compress to ${c.label}` }));
  const cropChips = CROPS.map((c) => ({ href: `/crop/${c.slug}`, label: c.h1.replace(/ \(.*\)$/, "") }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        {/* HERO */}
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "64px 24px 44px", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 22, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ 100% FREE · NO SIGN-UP
            </div>
            <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 14px" }}>
              All Free Image Tools
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
              Every JPT AI tool in one place — convert, compress, crop, upscale and more. All free, no watermark, nothing to install.
            </p>
          </div>
        </section>

        {/* CORE TOOLS */}
        <section style={{ padding: "48px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <SectionTitle sub="The essentials — one click to open each editor.">Core tools</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
              {CORE_TOOLS.map((t) => (
                <Link key={t.href} href={t.href} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid #EAECF5", borderRadius: 16, padding: "18px 18px", textDecoration: "none", boxShadow: "0 6px 20px rgba(30,41,90,.05)" }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{t.icon}</span>
                  <span>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: "#111827" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 13, color: "#6B7280", marginTop: 3 }}>{t.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CONVERSIONS */}
        <section style={{ padding: "16px 24px 40px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <SectionTitle sub="Convert between formats — free and instant.">Image converters</SectionTitle>
            <Chips items={convertChips} />
          </div>
        </section>

        {/* COMPRESS */}
        <section style={{ padding: "16px 24px 40px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <SectionTitle sub="Hit an exact file size for uploads, forms and email.">Compress to a target size</SectionTitle>
            <Chips items={compressChips} />
          </div>
        </section>

        {/* CROP */}
        <section style={{ padding: "16px 24px 56px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <SectionTitle sub="Crop to the exact shape each platform needs.">Crop presets</SectionTitle>
            <Chips items={cropChips} />
          </div>
        </section>

        {/* BLOG CTA */}
        <section style={{ padding: "8px 24px 72px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 20, padding: "32px 30px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Guides &amp; tutorials</div>
            <p style={{ margin: "0 0 18px", fontSize: 15, color: "rgba(255,255,255,.9)" }}>How-tos for every tool on the blog.</p>
            <Link href="/blog" style={{ display: "inline-block", background: "#fff", color: "#6366F1", borderRadius: 12, padding: "12px 26px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>Read the blog →</Link>
          </div>
        </section>
      </div>
    </>
  );
}
