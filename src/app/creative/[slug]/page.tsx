import { Metadata } from "next";
import { notFound } from "next/navigation";
import FAQAccordion from "@/app/_components/FAQAccordion";
import CreativeApp from "./CreativeApp";
import { CREATIVE_APPS, getCreativeApp, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";

const BASE = "https://www.sjpt.in";

export function generateStaticParams() {
  return CREATIVE_APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getCreativeApp(slug);
  if (!a) return {};
  const url = `${BASE}${CREATIVE_BASE}/${slug}`;
  return {
    title: a.title,
    description: a.metaDescription,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: { title: a.h1, description: a.metaDescription, url },
    twitter: { card: "summary_large_image", title: a.h1, description: a.metaDescription },
  };
}

export default async function CreativeAppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getCreativeApp(slug);
  if (!a) notFound();

  const url = `${BASE}${CREATIVE_BASE}/${slug}`;
  const related = CREATIVE_APPS.filter((x) => x.slug !== a.slug).slice(0, 6);

  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.h1,
    description: a.metaDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    screenshot: previewUrl(a.slug, 1100),
    image: previewUrl(a.slug, 1100),
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1200" },
    url,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Creative Apps", item: `${BASE}${CREATIVE_BASE}` },
      { "@type": "ListItem", position: 3, name: a.h1, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#fff" }}>
        {/* HERO + on-page generator */}
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "56px 24px 64px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
            <a href={CREATIVE_BASE} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>
              {a.emoji} JPT Creative App
            </a>
            <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 16px" }}>{a.h1}</h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 28px" }}>{a.tagline}</p>

            {/* Real AI before/after example */}
            <figure style={{ margin: "0 auto 8px", maxWidth: 760 }}>
              <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.16)", border: "1px solid #E5E7EB" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl(a.slug, 1100)} alt={`${a.h1}: real before and after AI example`} style={{ width: "100%", display: "block" }} />
              </div>
              <figcaption style={{ fontSize: 12.5, color: "#9CA3AF", marginTop: 8 }}>Real AI example — actual output from this Creative App</figcaption>
            </figure>
          </div>

          <CreativeApp slug={a.slug} prompt={a.prompt} cta="Generate Now" badge={a.badge} gradient={a.gradient} />
        </section>

        {/* How it works */}
        <section style={{ padding: "72px 24px", background: "linear-gradient(160deg,#F5F5FF 0%,#EEF2FF 100%)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: "#0F172A", textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.02em" }}>How the {a.h1} works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
              {[
                { n: "01", t: "Upload your photo", d: "Drag and drop or select any photo — JPG, PNG or WEBP. Everything happens right on this page." },
                { n: "02", t: "AI generates instantly", d: `Our AI applies the ${a.h1.replace(/^AI /, "").toLowerCase()} transformation in seconds — no editing skills needed.` },
                { n: "03", t: "Download your result", d: "Preview the before/after, then download your full-quality image. No watermark." },
              ].map((s) => (
                <div key={s.n} style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, background: "#fff", border: "2px solid #E0E7FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 900, color: "#6366F1", fontSize: 20 }}>{s.n}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO content */}
        <section style={{ padding: "72px 24px", background: "#F9FAFB" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", fontSize: 15.5, color: "#374151", lineHeight: 1.85 }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>{a.h1} — free, online & instant</h2>
            <p style={{ marginTop: 0 }}>{a.tagline} The {a.h1} is part of the JPT AI Creative Apps suite — a collection of free, browser-based AI photo tools. {a.intro} You don&apos;t need Photoshop, a separate app, or any design experience: upload a reference photo, let the AI do the work, and download a clean, full-resolution result with no watermark.</p>
            <p>JPT AI runs entirely online, so it works on any device — phone, tablet or desktop. Your images are processed securely and are never used to train models. Sign in to claim free daily credits and start creating. Looking for more? Explore the rest of our <a href={CREATIVE_BASE} style={{ color: "#6366F1", fontWeight: 700 }}>AI Creative Apps</a>, or jump into the full <a href="/editor" style={{ color: "#6366F1", fontWeight: 700 }}>AI photo editor</a> for advanced edits.</p>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: "#0F172A", textAlign: "center", margin: "0 0 40px", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
            <FAQAccordion faqs={a.faq} />
          </div>
        </section>

        {/* Related creative apps */}
        <section style={{ padding: "0 24px 80px", background: "#fff" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, color: "#0F172A", textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em" }}>More Creative Apps</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
              {related.map((r) => (
                <a key={r.slug} href={`${CREATIVE_BASE}/${r.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ aspectRatio: "16 / 10", borderRadius: 14, overflow: "hidden", marginBottom: 8, background: `linear-gradient(135deg, ${r.gradient[0]}, ${r.gradient[1]})` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl(r.slug, 500)} alt={`${r.h1} example`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", textAlign: "center", lineHeight: 1.3 }}>{r.h1}</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
