import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PromptCard from "@/app/prompts/_components/PromptCard";
import { DatasetCredit } from "@/app/prompts/_components/Attribution";
import { PACKS, PACK_BY_SLUG, packPrompts } from "@/lib/prompts/packs";
import { toCards } from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return PACKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = PACK_BY_SLUG[slug];
  if (!pack) return {};
  const url = `${BASE}/prompts-pack/${slug}`;
  const n = packPrompts(pack).length;
  const description = `${n} hand-picked AI prompts: ${pack.subtitle} Every prompt credited to its author and free to copy.`;
  return {
    title: { absolute: `${pack.title} — ${n} AI Prompts | ${BRAND}` },
    description,
    alternates: { canonical: url },
    openGraph: { title: pack.title, description, url, siteName: BRAND },
    twitter: { card: "summary_large_image", title: pack.title, description },
  };
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = PACK_BY_SLUG[slug];
  if (!pack) notFound();

  const resolve = await mediaResolver();
  const records = packPrompts(pack);
  const cards = toCards(records).map((c) => ({ ...c, image: resolve(c.image) }));
  const others = PACKS.filter((p) => p.slug !== slug).slice(0, 3);
  const url = `${BASE}/prompts-pack/${slug}`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pack.title,
    description: pack.subtitle,
    url,
    isPartOf: { "@type": "WebSite", name: BRAND, url: BASE },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cards.length,
      itemListElement: cards.map((c, i) => ({
        "@type": "ListItem", position: i + 1, name: c.title, url: `${BASE}${c.href}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 24px 80px" }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 16, display: "flex", gap: 8 }}>
            <Link href="/prompts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Prompts</Link>
            <span aria-hidden>›</span>
            <span style={{ color: "var(--accent-strong)" }}>Packs</span>
          </nav>

          <div style={{ maxWidth: 720 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0 }}>
              {pack.title}
            </h1>
            <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "12px 0 0" }}>{pack.subtitle}</p>
          </div>

          <section style={{ marginTop: 24, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 16, padding: "18px 20px", maxWidth: 820 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 7 }}>
              Why this pack
            </div>
            <p style={{ margin: 0, fontSize: 15, color: "var(--text)", lineHeight: 1.7 }}>{pack.featuredReason}</p>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
              Curated by the {BRAND} team · {cards.length} prompts
            </p>
          </section>

          <section style={{ marginTop: 38 }}>
            <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              Prompts in this pack <span style={{ color: "var(--text-faint)" }}>01 / {cards.length}</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
              {cards.map((c) => <PromptCard key={c.uid} p={c} />)}
            </div>
          </section>

          <section style={{ marginTop: 50, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 20 }}>
            {[
              ["Why this pack matters", pack.about.why],
              ["What is included", pack.about.included],
              ["How to use it", pack.about.how],
            ].map(([h, body]) => (
              <div key={h} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, margin: "0 0 8px" }}>{h}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, margin: "0 0 8px" }}>Best used for</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.85 }}>
                {pack.about.useCases.map((u) => <li key={u}>{u}</li>)}
              </ul>
            </div>
          </section>

          <section style={{ marginTop: 50 }}>
            <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>More packs</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 14 }}>
              {others.map((p) => (
                <Link key={p.slug} href={`/prompts-pack/${p.slug}`} className="jpt-hover" style={{ display: "block", textDecoration: "none", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>{p.subtitle}</span>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--accent-strong)", marginTop: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {packPrompts(p).length} prompts →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div style={{ marginTop: 44, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <DatasetCredit />
          </div>
        </div>
      </div>
    </>
  );
}
