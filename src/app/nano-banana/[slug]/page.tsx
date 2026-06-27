import { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/app/_components/LandingPage";
import {
  getNanoBananaPage,
  nanoBananaToConfig,
  NANO_BANANA_PAGES,
  NANO_BANANA_BASE,
  NANO_BANANA_TOOL_HREF,
  NANO_BANANA_PAGE_ID,
} from "@/lib/nano-banana";

const BASE = "https://www.sjpt.in";

export function generateStaticParams() {
  return NANO_BANANA_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getNanoBananaPage(slug);
  if (!p) return {};
  const url = `${BASE}${NANO_BANANA_BASE}/${slug}`;
  return {
    title: p.title,
    description: p.metaDescription,
    keywords: p.keywords,
    alternates: { canonical: url },
    openGraph: { title: p.h1, description: p.metaDescription, url },
    twitter: { card: "summary_large_image", title: p.h1, description: p.metaDescription },
  };
}

export default async function NanoBananaPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getNanoBananaPage(slug);
  if (!p) notFound();

  const config = nanoBananaToConfig(p);
  const url = `${BASE}${NANO_BANANA_BASE}/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.h1,
    description: p.metaDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Nano Banana", item: `${BASE}${NANO_BANANA_BASE}` },
      { "@type": "ListItem", position: 3, name: p.h1, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <LandingPage config={config} toolHref={NANO_BANANA_TOOL_HREF} pageId={NANO_BANANA_PAGE_ID} />

      {/* Example prompts — E-E-A-T content unique to this trend */}
      <section style={{ padding: "0 24px 72px", background: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#0F172A", textAlign: "center", marginBottom: 28, letterSpacing: "-0.02em" }}>
            Example prompts to try
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {p.promptExamples.map((ex) => (
              <div key={ex} style={{ background: "#F7F8FC", border: "1px solid #EAECF0", borderRadius: 12, padding: "14px 18px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                <span style={{ color: "#6366F1", fontWeight: 800, marginRight: 8 }}>›</span>{ex}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <a href={NANO_BANANA_TOOL_HREF} style={{ display: "inline-block", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 16, padding: "14px 34px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}>
              {p.cta_text} →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
