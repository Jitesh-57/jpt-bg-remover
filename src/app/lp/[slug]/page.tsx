import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AD_LANDINGS, getAdLanding } from "@/lib/ad-landing";
import AdLandingCTA from "./AdLandingCTA";

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return AD_LANDINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lp = getAdLanding(params.slug);
  if (!lp) return {};
  return {
    title: lp.title,
    description: lp.metaDescription,
    // Ad landing pages should not compete with the canonical tool pages in search.
    robots: { index: false, follow: true },
    alternates: { canonical: `${BASE}/lp/${lp.slug}` },
    openGraph: { title: lp.title, description: lp.metaDescription, url: `${BASE}/lp/${lp.slug}` },
  };
}

export default function AdLandingPage({ params }: { params: { slug: string } }) {
  const lp = getAdLanding(params.slug);
  if (!lp) notFound();

  const [before, after] = lp.headline.split(lp.highlight);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0F172A 0%,#1E1B4B 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#818CF8" }}>✦</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>JPT AI</span>
        </a>

        <div style={{ display: "inline-block", padding: "6px 14px", background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.35)", borderRadius: 999, fontSize: 13, fontWeight: 700, color: "#C7D2FE", marginBottom: 24 }}>
          {lp.badge}
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          {before}
          <span style={{ background: "linear-gradient(90deg,#818CF8,#C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{lp.highlight}</span>
          {after}
        </h1>

        <p style={{ fontSize: 19, color: "#CBD5E1", lineHeight: 1.5, margin: "0 0 32px" }}>{lp.subhead}</p>

        <AdLandingCTA href={lp.toolHref} label={lp.cta} tool={lp.tool} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginTop: 40 }}>
          {lp.bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#E2E8F0" }}>
              <span style={{ color: "#34D399", fontWeight: 900 }}>✓</span> {b}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, fontSize: 13, color: "#94A3B8" }}>
          ⭐ 4.8/5 · Trusted by thousands of creators and businesses
        </div>
      </div>
    </main>
  );
}
