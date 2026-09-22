import type { Metadata } from "next";
import { CREATIVE_APPS, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";
import { creativeSources, mainSources } from "@/lib/app-creatives";
import CompareCard, { type CompareMode } from "@/app/_components/CompareCard";

/**
 * preview-hero-compare — an internal-only page to pick a homepage animation.
 *
 * Not linked from anywhere, not in the sitemap, noindex as a backstop. Exists
 * only so the three CompareCard modes can be judged against real photos on a
 * real deploy before one of them replaces the homepage's static showcase —
 * delete this route once that choice is made.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const revalidate = 0;

const SLUGS = ["saree-photoshoot", "3d-figurine", "ghibli-style"];

const MODES: { id: CompareMode; label: string; blurb: string }[] = [
  { id: "wipe", label: "A — Auto-wipe", blurb: "A vertical line sweeps across on a loop, wiping from after to before and back. No interaction needed." },
  { id: "fade", label: "B — Crossfade", blurb: "Before and after gently dissolve into each other on a loop. Softer, no moving line." },
  { id: "drag", label: "C — Drag to compare", blurb: "Auto-sweeps the same as A until touched — then a visitor can grab the line and drag it themselves." },
];

function cardsFor(mode: CompareMode) {
  return SLUGS.map((slug) => {
    const a = CREATIVE_APPS.find((x) => x.slug === slug);
    if (!a) return null;
    return (
      <CompareCard
        key={`${mode}-${slug}`}
        slug={a.slug}
        href={`${CREATIVE_BASE}/${a.slug}`}
        before={creativeSources(a.slug, "before")}
        main={mainSources(a.slug)}
        after={creativeSources(a.slug, "after", previewUrl(a.slug))}
        alt={`A photo turned into ${a.h1}`}
        name={a.h1}
        emoji={a.emoji}
        gradient={a.gradient}
        mode={mode}
      />
    );
  });
}

export default function PreviewHeroCompare() {
  const sareeApp = CREATIVE_APPS.find((x) => x.slug === "saree-photoshoot");

  return (
    <main style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", padding: "48px 24px 96px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ marginBottom: 44, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Internal preview — not linked, noindex</div>
          <h1 style={{ fontSize: "clamp(1.7rem,3vw,2.3rem)", fontWeight: 900, margin: "0 0 10px" }}>Homepage before/after — pick a style</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: 640, margin: "0 auto" }}>
            Each needs a separate before and after photo per app — the single merged image used on the tool pages has no seam a program can animate. If an app only has the merged photo (or none at all), its card below quietly falls back to the plain static card, same as today.
          </p>
        </div>

        {/* Same photo, three motions — the direct comparison. */}
        {sareeApp && (
          <section style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 18px", textAlign: "center" }}>Same photo, three styles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {MODES.map((m) => (
                <div key={m.id}>
                  <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <CompareCard
                      slug={sareeApp.slug}
                      href={`${CREATIVE_BASE}/${sareeApp.slug}`}
                      before={creativeSources(sareeApp.slug, "before")}
                      main={mainSources(sareeApp.slug)}
                      after={creativeSources(sareeApp.slug, "after", previewUrl(sareeApp.slug))}
                      alt={`A photo turned into ${sareeApp.h1}`}
                      name={sareeApp.h1}
                      emoji={sareeApp.emoji}
                      gradient={sareeApp.gradient}
                      mode={m.id}
                    />
                  </div>
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{m.label}</div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0", lineHeight: 1.55 }}>{m.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Each style, as it would actually sit on the homepage. */}
        {MODES.map((m) => (
          <section key={m.id} style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{m.label} — full showcase row</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>{m.blurb}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderRadius: 24, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
              {cardsFor(m.id)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
