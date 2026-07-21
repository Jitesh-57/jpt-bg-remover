import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COMPRESSIONS, getCompression, buildCompressContent } from "@/lib/compressions";
import { blogCreative } from "@/lib/creative-images";
import SafeImage from "@/app/_components/SafeImage";

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return COMPRESSIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompression(slug);
  if (!c) return {};
  const ct = buildCompressContent(c);
  const url = `${BASE}/compress/${slug}`;
  return {
    title: { absolute: ct.title },
    description: ct.metaDescription,
    keywords: ct.keywords,
    alternates: { canonical: url },
    openGraph: { title: ct.title, description: ct.metaDescription, url, type: "website", siteName: "JPT AI" },
    twitter: { card: "summary_large_image", title: `${ct.h1} | JPT AI`, description: ct.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCompression(slug);
  if (!c) notFound();
  const ct = buildCompressContent(c);
  const url = `${BASE}/compress/${slug}`;
  const toolHref = `/editor?tool=compress&target=${c.kb}`;
  const related = COMPRESSIONS.filter((x) => x.slug !== slug);

  const appLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: ct.h1, applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ct.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    { "@type": "ListItem", position: 2, name: "Image Compressor", item: `${BASE}/compress-image` },
    { "@type": "ListItem", position: 3, name: ct.h1, item: url },
  ] };

  const GRAD = "linear-gradient(120deg,#0EA5E9,#6366F1)";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111827", background: "#fff" }}>
        <section style={{ background: "linear-gradient(160deg,#F0F9FF 0%,#fff 55%,#F5F5FF 100%)", padding: "64px 24px 52px", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
              <Link href="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>{" / "}
              <Link href="/compress-image" style={{ color: "#6B7280", textDecoration: "none" }}>Image Compressor</Link>{" / "}
              <span style={{ color: "#374151" }}>{ct.label}</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.1rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 16px" }}>
              Compress Image to <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{ct.label}</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 30px" }}>
              Free online compressor — reduce any JPG or PNG to {ct.label} or less in seconds. No watermark, no sign-up.
            </p>
            <Link href={toolHref} style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(14,165,233,0.35)" }}>
              Compress to {ct.label} →
            </Link>
            <SafeImage
              src={blogCreative(slug)}
              alt={`Compress an image to ${ct.label} — before and after`}
              wrapperStyle={{ maxWidth: 600, margin: "40px auto 0" }}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: 16, border: "1px solid #E6E8F2", boxShadow: "0 18px 50px rgba(14,165,233,0.14)" }}
            />
          </div>
        </section>

        <section style={{ padding: "56px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontSize: 16.5, color: "#374151", lineHeight: 1.8, margin: "0 0 28px" }}>{ct.intro}</p>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 16px", letterSpacing: "-0.02em" }}>Why compress to {ct.label}?</h2>
            <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.8, margin: 0 }}>{ct.why}</p>
          </div>
        </section>

        <section style={{ padding: "8px 24px 56px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "#0F172A", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>How to compress an image to {ct.label}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {ct.steps.map((s, i) => (
                <div key={i} style={{ background: "#F8F9FC", border: "1px solid #EAECF5", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Link href={toolHref} style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "13px 30px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>Compress to {ct.label} now</Link>
            </div>
          </div>
        </section>

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

        <section style={{ padding: "48px 24px 72px", background: "#fff" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 20px", letterSpacing: "-0.02em" }}>Compress to other sizes</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {related.map((r) => (
                <Link key={r.slug} href={`/compress/${r.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
                  Compress to {r.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
