import { Metadata } from "next";
import SmartImage from "@/app/_components/SmartImage";
import { CREATIVE_APPS, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";
import { appsWithExamples } from "@/lib/creative-examples.server";
import type { CreativeApp } from "@/lib/creative-apps";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}${CREATIVE_BASE}`;

export const metadata: Metadata = {
  title: { absolute: "Pixel Shine Creative Apps — Free AI Photo Generators Online | Pixel Shine" },
  description:
    "Free Pixel Shine Creative apps — saree photoshoot, 3D figurine, retro Bollywood, pet portrait, anime and more. Upload a photo and get the result right on the page. No app, no watermark.",
  keywords: "ai creative apps, ai photo generator free, ai photoshoot online, ai photo trends, free ai photo editor apps",
  alternates: { canonical: URL },
  openGraph: { title: "Pixel Shine Creative Apps — Free AI Photo Generators", description: "Upload a photo and get viral AI results right on the page. Free, no watermark.", url: URL },
};

/*
  Built from the rendered order, not the raw list, so the positions a crawler
  reads match the positions a visitor sees. Every app is still listed — the
  ones without an example are last rather than absent.
*/
const itemListLd = (apps: CreativeApp[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: apps.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.h1, url: `${URL}/${a.slug}` })),
});

/** One app card. Identical in both blocks — only the order differs. */
function AppCard({ a }: { a: CreativeApp }) {
  return (
    <a href={`${CREATIVE_BASE}/${a.slug}`} style={{ display: "block", textDecoration: "none", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ aspectRatio: "16 / 10", background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`, position: "relative" }}>
        {/*
          Two hundred cards on one page, each pointing at a full-size PNG.
          Through the optimiser a card costs tens of kilobytes instead of one to
          two megabytes, and a slug with no creative yet draws its own artwork
          rather than a bare gradient.
        */}
        <SmartImage
          src={previewUrl(a.slug)}
          alt={`${a.h1} before and after example`}
          fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`}
          sizes="(max-width: 768px) 100vw, 260px"
          artwork={{ slug: a.slug, name: a.h1, emoji: a.emoji, gradient: [a.gradient[0], a.gradient[1]], note: "Example coming soon" }}
        />
        <span style={{ position: "absolute", bottom: 10, right: 10, padding: "5px 12px", background: "rgba(11,11,14,0.82)", color: "var(--accent)", border: "1px solid var(--accent-border)", backdropFilter: "blur(6px)", fontSize: 11, fontWeight: 800, borderRadius: 8 }}>{a.emoji} {a.badge}</span>
      </div>
      <div style={{ padding: "18px 18px 20px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>{a.h1}</div>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{a.intro}</p>
        <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>Open app →</div>
      </div>
    </a>
  );
}

const GRID: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 };

/*
  Apps with a real example image first, the rest after.

  The creatives are generated in batches, so at any time some slugs have a
  photograph and the rest draw the placeholder artwork. Interleaved, the grid
  read as broken — a picture, two flat tiles, a picture — and the apps we can
  actually show off were scattered among ones we cannot.

  Order within each group is the order CREATIVE_APPS already has (stable, from
  a hash of the slug), so this only ever moves an app between the two blocks and
  never reshuffles within one.
*/
function partition(withExamples: Set<string>): { ready: CreativeApp[]; pending: CreativeApp[] } {
  // An empty set means the bucket could not be listed, not that nothing exists.
  // Treat that as "unknown" and leave the page exactly as it was.
  if (!withExamples.size) return { ready: CREATIVE_APPS, pending: [] };
  return {
    ready: CREATIVE_APPS.filter((a) => withExamples.has(a.slug)),
    pending: CREATIVE_APPS.filter((a) => !withExamples.has(a.slug)),
  };
}

/* Listed once per revalidation, in step with creative-examples.server. */
export const revalidate = 300;

export default async function CreativeHub() {
  const { ready, pending } = partition(await appsWithExamples());
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd([...ready, ...pending])) }} />
      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "80px 24px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ Pixel Shine Creative Apps
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 900, color: "var(--text)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
              Viral AI Photo Apps — One Tap, No Prompt
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
              Upload a photo and get the result right on the page — saree photoshoots, 3D figurines, retro portraits, pet art and more. Each runs on credits, with no app to download and no watermark.
            </p>
          </div>
        </section>

        <section style={{ padding: "48px 24px 88px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={GRID}>
              {ready.map((a) => <AppCard key={a.slug} a={a} />)}
            </div>

            {pending.length > 0 && (
              <>
                {/*
                  A heading rather than a silent second run of cards: without
                  one, the point where the photographs stop looks like a bug.
                  Saying what these are makes the placeholder artwork read as
                  intentional, and every one of them still works.
                */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "56px 0 28px" }}>
                  <div style={{ height: 1, background: "var(--border)", flex: 1 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    More apps · examples coming soon
                  </div>
                  <div style={{ height: 1, background: "var(--border)", flex: 1 }} />
                </div>
                <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)", margin: "0 0 28px", lineHeight: 1.7 }}>
                  These work exactly the same — we just have not shot an example for them yet.
                </p>
                <div style={GRID}>
                  {pending.map((a) => <AppCard key={a.slug} a={a} />)}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
