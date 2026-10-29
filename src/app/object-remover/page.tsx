import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import { NOINDEX } from "@/lib/seo/index-policy";
import type { Metadata } from "next";
import ObjectRemoverPreview from "./ObjectRemoverPreview";

const URL = "https://www.sjpt.io/object-remover";

/*
  In review: the three ways to select are on show (?select=brush|lasso|box|all)
  until the owner picks, so the page stays out of the index until then.
*/
export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Object Remover — Remove Objects & People From Photos Free | Pixel Shine") },
  description: "Remove people, objects, text and anything else from a photo. Select it, press Remove, and AI fills the gap. Free, no sign-up, runs in your browser.",
  alternates: { canonical: URL },
  robots: NOINDEX,
});

const STEPS = [
  { n: "1", t: "Upload a photo", d: "JPG, PNG or WebP, up to 4K. It stays on your device." },
  { n: "2", t: "Select what to remove", d: "A person, a car, a sign, a power line. Select as many things as you like." },
  { n: "3", t: "Press Remove", d: "AI fills the gap from what's around it. Compare, then download." },
];

export default function Page({ searchParams }: { searchParams: { select?: string } }) {
  return (
    <main style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
      <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 60%)", padding: "48px 16px 52px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent-strong)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "5px 12px" }}>
            Free · No sign-up
          </span>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", margin: "16px 0 12px", textWrap: "balance" }}>
            AI Object Remover
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 28px" }}>
            Remove people, objects, text or anything else from a photo. Select it, press Remove, and AI fills the gap so it looks like it was never there.
          </p>
          <div id="tool" style={{ scrollMarginTop: 80 }}>
            <ObjectRemoverPreview select={searchParams.select ?? "all"} />
          </div>
        </div>
      </section>

      <section style={{ padding: "52px 16px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 26px" }}>How to remove an object from a photo</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-strong)", fontWeight: 900 }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "12px 0 6px" }}>{s.t}</h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
