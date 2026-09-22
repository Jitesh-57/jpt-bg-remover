import { Metadata } from "next";
import SmartImage from "@/app/_components/SmartImage";
import { CREATIVE_APPS, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";
import { creativeSources, uploadedCreative } from "@/lib/app-creatives";
import { appsWithExamples } from "@/lib/creative-examples.server";
import { categorizedApps, categoryAnchor, type CategoryGroup } from "@/lib/creative-categories";
import { creativeKey, readOverrides, type ShowcaseImage } from "@/lib/overrides";
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
  reads match the positions a visitor sees: category order, then within each
  category the same order the grid draws.
*/
const itemListLd = (apps: CreativeApp[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: apps.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.h1, url: `${URL}/${a.slug}` })),
});

/**
 * One app card.
 *
 * Two image treatments. An app with a "main" creative uploaded in /admin — a
 * single image that already is a before and after — is shown whole, at its
 * own shape. No BEFORE/AFTER pills drawn over it: that image is a finished
 * creative made outside this codebase, and the label is baked into the
 * picture itself. Drawing our own on top of someone else's duplicated it,
 * usually misaligned with theirs. An app without a main image falls back to
 * the "after" result on a 16:10 frame, exactly as before.
 */
function AppCard({ a, main }: { a: CreativeApp; main?: ShowcaseImage }) {
  return (
    <a href={`${CREATIVE_BASE}/${a.slug}`} className="jpt-hover" style={{ display: "block", textDecoration: "none", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      {main ? (
        <div style={{ position: "relative", aspectRatio: `${main.w} / ${main.h}`, background: "var(--surface-2)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={uploadedCreative(a.slug, "main")}
            alt={`${a.h1} — before and after`}
            width={main.w}
            height={main.h}
            loading="lazy"
            decoding="async"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <div style={{ aspectRatio: "16 / 10", background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`, position: "relative" }}>
          {/*
            Two hundred cards on one page, each pointing at a full-size PNG.
            Through the optimiser a card costs tens of kilobytes instead of one to
            two megabytes, and a slug with no creative yet draws its own artwork
            rather than a bare gradient.
          */}
          <SmartImage
            sources={creativeSources(a.slug, "after", previewUrl(a.slug))}
            alt={`${a.h1} before and after example`}
            fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`}
            sizes="(max-width: 768px) 100vw, 260px"
            artwork={{ slug: a.slug, name: a.h1, emoji: a.emoji, gradient: [a.gradient[0], a.gradient[1]], note: "Example coming soon" }}
          />
          <span style={{ position: "absolute", bottom: 10, right: 10, padding: "5px 12px", background: "rgba(11,11,14,0.82)", color: "var(--accent)", border: "1px solid var(--accent-border)", backdropFilter: "blur(6px)", fontSize: 11, fontWeight: 800, borderRadius: 8 }}>{a.emoji} {a.badge}</span>
        </div>
      )}
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
  Apps with a real example first within their category, the rest after.

  Two sources of "real example": a legacy photograph in the old preview
  bucket, or a "main" creative uploaded in /admin — the second is what
  determines which pill-labelled treatment a card gets, but either is enough
  to move an app ahead of one with no example at all. Within that split, the
  order is CREATIVE_APPS's own (stable, from a hash of the slug), so this only
  ever moves an app between the two groups and never reshuffles within one.
*/
function readyFirst(withExamples: Set<string>, mains: Map<string, ShowcaseImage>) {
  const hasExample = (a: CreativeApp) => mains.has(a.slug) || withExamples.has(a.slug);
  return (a: CreativeApp, b: CreativeApp) => Number(hasExample(b)) - Number(hasExample(a));
}

/* Listed once per revalidation, in step with creative-examples.server and overrides. */
export const revalidate = 300;

export default async function CreativeHub() {
  const [withExamples, overrides] = await Promise.all([appsWithExamples(), readOverrides()]);
  const mains = new Map<string, ShowcaseImage>();
  for (const [key, page] of Object.entries(overrides.pages)) {
    if (page.main && key.startsWith("creative/")) mains.set(key.slice("creative/".length), page.main);
  }

  const groups = categorizedApps(readyFirst(withExamples, mains));
  const flat = groups.flatMap((g) => g.apps);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd(flat)) }} />
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

        {/*
          Category jump strip — real anchors, not a script-driven filter, so
          the links are there whether or not the page has hydrated, and a
          detail page's breadcrumb has somewhere genuine to send a click.
        */}
        <nav aria-label="Jump to category" style={{ padding: "22px 24px 0", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${categoryAnchor(g.id)}`}
                style={{
                  fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none",
                  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999,
                  padding: "7px 14px", whiteSpace: "nowrap",
                }}
              >
                {g.emoji} {g.label} <span style={{ color: "var(--text-faint)" }}>({g.apps.length})</span>
              </a>
            ))}
          </div>
        </nav>

        <section style={{ padding: "36px 24px 88px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {groups.map((g: CategoryGroup) => (
              <div key={g.id} id={categoryAnchor(g.id)} style={{ marginTop: 56, scrollMarginTop: 24 }}>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: "clamp(1.3rem,2.6vw,1.7rem)", fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>
                    {g.emoji} {g.label}
                  </h2>
                  <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "6px 0 0" }}>{g.blurb}</p>
                </div>
                <div style={GRID}>
                  {g.apps.map((a) => <AppCard key={a.slug} a={a} main={mains.get(a.slug)} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
