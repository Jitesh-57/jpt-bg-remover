import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AD_LANDINGS, getAdLanding } from "@/lib/ad-landing";
import AdLandingCTA from "./AdLandingCTA";
import BrandLogo from "@/app/_components/BrandLogo";

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
        background: "linear-gradient(160deg,var(--text) 0%,#1E1B4B 100%)",
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
          <BrandLogo height={62} variant="full" />
        </a>

        <div style={{ display: "inline-block", padding: "6px 14px", background: "var(--accent-soft)", border: "1px solid rgba(255,106,26,0.40)", borderRadius: 999, fontSize: 13, fontWeight: 700, color: "var(--accent)", marginBottom: 24 }}>
          {lp.badge}
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          {before}
          <span style={{ background: "linear-gradient(90deg,var(--accent),#C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{lp.highlight}</span>
          {after}
        </h1>

        <p style={{ fontSize: 19, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 32px" }}>{lp.subhead}</p>

        <AdLandingCTA href={lp.toolHref} label={lp.cta} tool={lp.tool} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", marginTop: 40 }}>
          {lp.bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-muted)" }}>
              <span style={{ color: "#34D399", fontWeight: 900 }}>✓</span> {b}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, fontSize: 13, color: "var(--text-faint)" }}>
          ⭐ 4.8/5 · Trusted by thousands of creators and businesses
        </div>
      </div>
    </main>
  );
}
