import { Metadata } from "next";
import { notFound } from "next/navigation";
import FAQAccordion from "@/app/_components/FAQAccordion";
import CreativeApp from "./CreativeApp";
import { CREATIVE_APPS, getCreativeApp, CREATIVE_BASE } from "@/lib/creative-apps";

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
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 36px" }}>{a.tagline}</p>
          </div>

          <CreativeApp slug={a.slug} prompt={a.prompt} cta="Generate Now" badge={a.badge} gradient={a.gradient} />
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
                  <div style={{ aspectRatio: "1 / 1", borderRadius: 14, background: `linear-gradient(135deg, ${r.gradient[0]}, ${r.gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 8 }}>{r.emoji}</div>
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
