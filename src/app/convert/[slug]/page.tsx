import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CONVERSIONS, getConversion, buildContent } from "@/lib/conversions";
import { blogCreative } from "@/lib/creative-images";
import SafeImage from "@/app/_components/SafeImage";
import ScrollReveal from "@/app/_components/ScrollReveal";

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return CONVERSIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getConversion(slug);
  if (!c) return {};
  const ct = buildContent(c);
  const url = `${BASE}/convert/${slug}`;
  return {
    title: { absolute: ct.title },
    description: ct.metaDescription,
    keywords: ct.keywords,
    alternates: { canonical: url },
    openGraph: { title: ct.title, description: ct.metaDescription, url, type: "website", siteName: "JPT AI" },
    twitter: { card: "summary_large_image", title: `${ct.fromLabel} to ${ct.toLabel} Converter | JPT AI`, description: ct.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getConversion(slug);
  if (!c) notFound();
  const ct = buildContent(c);
  const url = `${BASE}/convert/${slug}`;
  const toolHref = `/editor?tool=convert&to=${ct.toParam}`;

  const related = CONVERSIONS.filter((x) => x.slug !== slug && (x.from === c.from || x.to === c.to)).slice(0, 6);

  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: ct.h1, applicationCategory: "MultimediaApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url,
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: ct.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Image Converter", item: `${BASE}/convert-image` },
      { "@type": "ListItem", position: 3, name: `${ct.fromLabel} to ${ct.toLabel}`, item: url },
    ],
  };

  const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO */}
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "64px 24px 52px", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              {" / "}
              <Link href="/convert-image" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Image Converter</Link>
              {" / "}
              <span style={{ color: "var(--text-muted)" }}>{ct.fromLabel} to {ct.toLabel}</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.1rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>
              Convert {ct.fromLabel} to <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{ct.toLabel}</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 30px" }}>
              Free online {ct.fromLabel}-to-{ct.toLabel} converter — no watermark, no sign-up, no software. Convert in seconds, right in your browser.
            </p>
            <Link href={toolHref} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(15,157,107,0.35)" }}>
              Convert {ct.fromLabel} to {ct.toLabel} →
            </Link>
            <SafeImage
              src={blogCreative(`convert-${slug}`)}
              alt={`Convert ${ct.fromLabel} to ${ct.toLabel} — before and after`}
              wrapperStyle={{ maxWidth: 600, margin: "40px auto 0" }}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 18px 50px rgba(15,157,107,0.14)" }}
            />
          </div>
        </section>

        {/* INTRO + WHY */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.8, margin: "0 0 32px" }}>{ct.intro}</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>{ct.whyHeading}</h2>
            <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.8, margin: 0 }}>{ct.why}</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to convert {ct.fromLabel} to {ct.toLabel}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {ct.steps.map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Link href={toolHref} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "13px 30px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
                Open the {ct.fromLabel} → {ct.toLabel} converter
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "48px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {ct.faqs.map((f) => (
              <details key={f.q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED CONVERSIONS — internal linking */}
        {related.length > 0 && (
          <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free converters</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {related.map((r) => {
                  const rc = buildContent(r);
                  return (
                    <Link key={r.slug} href={`/convert/${r.slug}`} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                      {rc.fromLabel} → {rc.toLabel}
                    </Link>
                  );
                })}
                <Link href="/compress-image" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  Compress Image
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
