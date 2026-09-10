import type { Metadata } from "next";
import Link from "next/link";
import { ALTERNATIVES, TOOLS, type ToolKey } from "@/lib/alternatives";
import ScrollReveal from "@/app/_components/ScrollReveal";

const BASE = "https://www.sjpt.io";
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";

export const metadata: Metadata = {
  title: { absolute: "Free Alternatives to Popular Image Tools (No Watermark) | sjpt.io" },
  description:
    "Free, no-watermark, no-sign-up alternatives to Remove.bg, Canva, PhotoRoom, Photoshop, TinyPNG and more. Remove backgrounds, upscale, compress and convert images online.",
  keywords:
    "free image tool alternatives, remove.bg alternative, canva alternative, photoroom alternative, tinypng alternative, free background remover, no watermark",
  alternates: { canonical: `${BASE}/alternatives` },
  openGraph: {
    title: "Free Alternatives to Popular Image Tools | sjpt.io",
    description: "Free, no-watermark alternatives to the tools you already know.",
    url: `${BASE}/alternatives`,
    type: "website",
    siteName: "sjpt.io",
  },
};

// Order the tool groups on the page.
const GROUP_ORDER: ToolKey[] = ["remove-bg", "editor", "upscale", "compress", "convert", "pdf"];

export default function AlternativesIndex() {
  const grouped = GROUP_ORDER.map((tool) => ({
    tool,
    info: TOOLS[tool],
    items: ALTERNATIVES.filter((a) => a.tool === tool),
  })).filter((g) => g.items.length > 0);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ALTERNATIVES.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${a.name} alternative`,
      url: `${BASE}/alternatives/${a.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "64px 24px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
              {" / "}
              <span style={{ color: "var(--text-muted)" }}>Alternatives</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px" }}>
              Free{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>alternatives</span>{" "}
              to the tools you know
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
              Hit a paywall, watermark or sign-up wall? sjpt.io does the same core jobs — free, in your browser, with nothing to install.
            </p>
          </div>
        </section>

        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 40 }}>
            {grouped.map((g) => (
              <div key={g.tool}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
                    {g.info.label} alternatives
                  </h2>
                  <Link href={g.info.href} style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                    Open free tool →
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
                  {g.items.map((a) => (
                    <Link key={a.slug} href={`/alternatives/${a.slug}`} className="jpt-hover" style={{ display: "block", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", textDecoration: "none" }}>
                      <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>{a.name} alternative</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Free {a.category} — no watermark</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
