import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CROPS, getCrop, buildCropContent } from "@/lib/crops";
import { blogCreative } from "@/lib/creative-images";
import SafeImage from "@/app/_components/SafeImage";
import ScrollReveal from "@/app/_components/ScrollReveal";

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return CROPS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCrop(slug);
  if (!c) return {};
  const ct = buildCropContent(c);
  const url = `${BASE}/crop/${slug}`;
  return {
    title: { absolute: ct.title },
    description: ct.metaDescription,
    keywords: ct.keywords,
    alternates: { canonical: url },
    openGraph: { title: ct.title, description: ct.metaDescription, url, type: "website", siteName: "Pixel Shine" },
    twitter: { card: "summary_large_image", title: `${ct.h1} | Pixel Shine`, description: ct.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCrop(slug);
  if (!c) notFound();
  const ct = buildCropContent(c);
  const url = `${BASE}/crop/${slug}`;
  const toolHref = `/editor?tool=crop&ratio=${encodeURIComponent(c.ratio)}`;
  const related = CROPS.filter((x) => x.slug !== slug);

  const appLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: ct.h1, applicationCategory: "MultimediaApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ct.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const breadcrumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE },
    { "@type": "ListItem", position: 2, name: "Crop Image", item: `${BASE}/crop-image` },
    { "@type": "ListItem", position: 3, name: ct.h1, item: url },
  ] };

  const GRAD = "linear-gradient(120deg,var(--accent-2),#EC4899)";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--surface-2) 100%)", padding: "64px 24px 52px", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>{" / "}
              <Link href="/crop-image" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Crop Image</Link>{" / "}
              <span style={{ color: "var(--text-muted)" }}>{c.name}</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.9rem,4.6vw,2.9rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>{ct.h1}</h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 30px" }}>
              Free online crop tool — no watermark, no sign-up. Crops in one click, right in your browser.
            </p>
            <Link href={toolHref} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px var(--accent-soft)" }}>
              Open the crop tool →
            </Link>
            <SafeImage
              src={blogCreative(slug)}
              alt={`${ct.h1} — before and after`}
              wrapperStyle={{ maxWidth: 600, margin: "40px auto 0" }}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: 16, border: "1px solid #EEE0EA", boxShadow: "0 18px 50px var(--accent-soft)" }}
            />
          </div>
        </section>

        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.8, margin: 0 }}>{ct.intro}</p>
          </div>
        </section>

        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>How it works</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {ct.steps.map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid #EEE6FB", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 36 }}>
              <Link href={toolHref} className="jpt-hover" style={{ display: "inline-block", background: GRAD, color: "#fff", borderRadius: 12, padding: "13px 30px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>Crop your image now</Link>
            </div>
          </div>
        </section>

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

        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More crop presets</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {related.map((r) => (
                <Link key={r.slug} href={`/crop/${r.slug}`} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  {r.h1.replace(/ \(.*\)$/, "")}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
