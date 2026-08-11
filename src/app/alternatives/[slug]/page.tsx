import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ALTERNATIVES, getAlternative, buildContent, relatedAlternatives } from "@/lib/alternatives";
import ScrollReveal from "@/app/_components/ScrollReveal";

const BASE = "https://www.sjpt.io";
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAlternative(slug);
  if (!a) return {};
  const ct = buildContent(a);
  const url = `${BASE}/alternatives/${slug}`;
  return {
    title: { absolute: ct.title },
    description: ct.metaDescription,
    keywords: ct.keywords,
    alternates: { canonical: url },
    openGraph: { title: ct.title, description: ct.metaDescription, url, type: "website", siteName: "sjpt.io" },
    twitter: { card: "summary_large_image", title: `Free ${ct.name} Alternative | sjpt.io`, description: ct.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAlternative(slug);
  if (!a) notFound();
  const ct = buildContent(a);
  const url = `${BASE}/alternatives/${slug}`;
  const related = relatedAlternatives(slug);

  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: `sjpt.io ${ct.tool.label}`, applicationCategory: "MultimediaApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url,
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1200" },
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: ct.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Alternatives", item: `${BASE}/alternatives` },
      { "@type": "ListItem", position: 3, name: `${ct.name} alternative`, item: url },
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
        <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 55%,#F0FDF4 100%)", padding: "64px 24px 52px", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
              <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>
              {" / "}
              <Link href="/alternatives" style={{ color: "#6B7280", textDecoration: "none" }}>Alternatives</Link>
              {" / "}
              <span style={{ color: "#374151" }}>{ct.name}</span>
            </div>
            <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
              Free · No watermark · No sign-up
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.1rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 16px" }}>
              The Free{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{ct.name}</span>{" "}
              Alternative
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 30px" }}>
              {ct.heroSub}
            </p>
            <Link href={ct.tool.href} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
              Try the free {ct.tool.label} →
            </Link>
          </div>
        </section>

        {/* INTRO + WHY SWITCH */}
        <section style={{ padding: "56px 24px 8px", background: "#fff" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontSize: 16.5, color: "#374151", lineHeight: 1.8, margin: "0 0 32px" }}>{ct.intro}</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 18px", letterSpacing: "-0.02em" }}>{ct.whyHeading}</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {ct.gripes.map((g) => (
                <li key={g} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15.5, color: "#4B5563", lineHeight: 1.65 }}>
                  <span aria-hidden style={{ flex: "none", width: 22, height: 22, borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>✕</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section style={{ padding: "48px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 24px", letterSpacing: "-0.02em", textAlign: "center" }}>
              sjpt.io vs {ct.name}
            </h2>
            <div style={{ overflowX: "auto", border: "1px solid #EAECF5", borderRadius: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5, minWidth: 460 }}>
                <thead>
                  <tr style={{ background: "#F8F9FC" }}>
                    <th style={{ textAlign: "left", padding: "14px 16px", color: "#6B7280", fontWeight: 700 }}> </th>
                    <th style={{ textAlign: "left", padding: "14px 16px", color: "#0F172A", fontWeight: 900 }}>sjpt.io</th>
                    <th style={{ textAlign: "left", padding: "14px 16px", color: "#6B7280", fontWeight: 800 }}>{ct.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {ct.compareRows.map((r, i) => (
                    <tr key={r.feature} style={{ borderTop: "1px solid #EEF0F6", background: i % 2 ? "#fff" : "#FCFCFE" }}>
                      <td style={{ padding: "13px 16px", color: "#374151", fontWeight: 600 }}>{r.feature}</td>
                      <td style={{ padding: "13px 16px", color: "#16A34A", fontWeight: 800 }}>{r.us}</td>
                      <td style={{ padding: "13px 16px", color: "#6B7280" }}>{r.them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "12px 2px 0", lineHeight: 1.5 }}>
              Comparison reflects each service&apos;s free tier and typical plans; {ct.name} features and pricing may change over time.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "8px 24px 56px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to switch in seconds
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 24 }}>
              {ct.steps.map((s, i) => (
                <div key={i} style={{ background: "#F8F9FC", border: "1px solid #EAECF5", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Link href={ct.tool.href} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "13px 30px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
                Open the free {ct.tool.label} →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "48px 24px", background: "#F9FAFB" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {ct.faqs.map((f) => (
              <details key={f.q} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "#111827", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED — internal linking */}
        {related.length > 0 && (
          <section style={{ padding: "48px 24px 72px", background: "#fff" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free alternatives</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {related.map((r) => (
                  <Link key={r.slug} href={`/alternatives/${r.slug}`} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                    {r.name} alternative
                  </Link>
                ))}
                <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                  All free tools
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
