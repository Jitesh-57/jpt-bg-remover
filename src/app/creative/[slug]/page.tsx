import { Metadata } from "next";
import { notFound } from "next/navigation";
import FAQAccordion from "@/app/_components/FAQAccordion";
import AppWorkspace from "./AppWorkspace";
import { presetsFor } from "@/lib/app-presets";
import { presetImagesFor, sampleImages } from "@/lib/preset-images.server";
import { CREATIVE_APPS, getCreativeApp, getCreativeContent, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";
import { longContentFor } from "@/lib/app-content";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

export function generateStaticParams() {
  return CREATIVE_APPS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getCreativeApp(slug);
  if (!a) return {};
  const url = `${BASE}${CREATIVE_BASE}/${slug}`;
  return {
    title: { absolute: a.title },
    description: a.metaDescription,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: { title: a.h1, description: a.metaDescription, url },
    twitter: { card: "summary_large_image", title: a.h1, description: a.metaDescription },
  };
}


/** Two-line feature card, used by every composed section on this page. */
function Cards({ items, min = 260 }: { items: { t: string; d: string }[]; min?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 18 }}>
      {items.map((i) => (
        <div key={i.t} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 22px" }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.35 }}>{i.t}</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{i.d}</p>
        </div>
      ))}
    </div>
  );
}

function Head2({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto 36px", textAlign: "center" }}>
      <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.22 }}>{children}</h2>
      {sub && <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "14px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Head3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: "clamp(1.15rem,2vw,1.45rem)", fontWeight: 850, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.01em" }}>{children}</h3>
  );
}

export default async function CreativeAppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getCreativeApp(slug);
  if (!a) notFound();

  const url = `${BASE}${CREATIVE_BASE}/${slug}`;
  const related = CREATIVE_APPS.filter((x) => x.slug !== a.slug).slice(0, 6);

  // Preset thumbnails and sample photos are resolved from Supabase at ISR time,
  // so they appear as soon as they're uploaded — no redeploy needed.
  const [presetImages, samples] = await Promise.all([
    presetImagesFor(a.slug, presetsFor(a, "solo"), a.cat),
    sampleImages(),
  ]);
  const content = getCreativeContent(slug);
  const lc = longContentFor(a);

  // Hand-written copy wins where it exists; the composed copy fills the rest of
  // the page. Tips are merged rather than replaced so the 42 hand-written apps
  // end up with more advice than the composed ones, not less.
  const paragraphs = content?.paragraphs?.length ? content.paragraphs : lc.intro;
  const tipsTitle = content?.tipsTitle || lc.bestResults.heading;
  const seen = new Set<string>();
  const tips = [...(content?.tips ?? []), ...lc.bestResults.items]
    .filter((t) => { const k = t.slice(0, 40).toLowerCase(); return seen.has(k) ? false : (seen.add(k), true); })
    .slice(0, 11);

  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.h1,
    description: a.metaDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    screenshot: previewUrl(a.slug),
    image: previewUrl(a.slug),
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1200" },
    url,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: lc.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Creative Apps", item: `${BASE}${CREATIVE_BASE}` },
      { "@type": "ListItem", position: 3, name: a.h1, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO + on-page generator */}
        <section style={{ background: "var(--bg)", padding: "34px 24px 64px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <a href={CREATIVE_BASE} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontWeight: 700, fontSize: 12.5, marginBottom: 22, textDecoration: "none" }}>
              ← All AI apps
            </a>
          </div>

          <AppWorkspace app={a} presetImages={presetImages} samples={samples} />
        </section>

        {/* How it works */}
        <section style={{ padding: "72px 24px", background: "linear-gradient(160deg,var(--surface-2) 0%,var(--accent-soft) 100%)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: "var(--text)", textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.02em" }}>How to use {a.h1}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
              {lc.howTo.map((step, i) => (
                <div key={step.t} style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, background: "var(--surface)", border: "2px solid var(--accent-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 900, color: "var(--accent)", fontSize: 20 }}>{`0${i + 1}`}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{step.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real AI before/after example */}
        <section style={{ padding: "72px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 28px", letterSpacing: "-0.02em" }}>See it in action — real before &amp; after</h2>
            <figure style={{ margin: 0 }}>
              <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.16)", border: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl(a.slug)} alt={`${a.h1}: real before and after AI example`} style={{ width: "100%", display: "block" }} />
              </div>
              <figcaption style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 10 }}>Real AI example — actual output from this Creative App</figcaption>
            </figure>
          </div>
        </section>

        {/* Why use — composed per category, led by this app's own description */}
        <section style={{ padding: "76px 24px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Head2>{lc.why.heading}</Head2>
            <Cards items={lc.why.items} min={300} />
          </div>
        </section>

        {/* What this app actually asks the model for — unique to each app */}
        {lc.transform && (
          <section style={{ padding: "0 24px 76px", background: "var(--bg)" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: 18, padding: "26px 28px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 850, color: "var(--accent)", margin: "0 0 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>What {a.h1} changes</h3>
              <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.75, margin: 0 }}>{lc.transform}</p>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "14px 0 0" }}>
                Your face, bone structure and skin tone are held fixed on every generation — only what is described above is changed. Add your own brief in the Custom tab to take it further.
              </p>
            </div>
          </section>
        )}

        {/* Built for */}
        <section style={{ padding: "76px 24px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Head2 sub={lc.built.sub}>{lc.built.heading}</Head2>
            <Cards items={lc.built.items} min={380} />
          </div>
        </section>

        {/* Key highlights — benefits, use cases, prompt ideas */}
        <section style={{ padding: "76px 24px", background: "var(--bg)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Head2>Key highlights of {a.h1}</Head2>

            <Head3>Benefits</Head3>
            <Cards items={lc.benefits} min={300} />

            <div style={{ height: 52 }} />
            <Head3>What people use it for</Head3>
            <Cards items={lc.useCases} min={300} />

            <div style={{ height: 52 }} />
            <Head3>Prompt ideas</Head3>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.75, margin: "0 0 22px", maxWidth: 780 }}>{lc.promptIdeas.intro}</p>
            <Cards items={lc.promptIdeas.items} min={260} />
          </div>
        </section>

        {/* Long-form copy: hand-written where it exists, composed otherwise */}
        {paragraphs.length > 0 && (
          <section style={{ padding: "76px 24px", background: "var(--surface-2)" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", fontSize: 16, color: "var(--text-muted)", lineHeight: 1.85 }}>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "var(--text)", margin: "0 0 22px", letterSpacing: "-0.02em" }}>More about {a.h1}</h2>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ marginTop: i === 0 ? 0 : 18 }}>{p}</p>
              ))}

              <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", margin: "34px 0 14px" }}>{tipsTitle}</h3>
              <ul style={{ margin: 0, paddingLeft: 22 }}>
                {tips.map((t, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>{t}</li>
                ))}
              </ul>

              <p style={{ marginTop: 26, fontSize: 15, color: "var(--text-muted)" }}>
                It&apos;s free to try and runs online — nothing to install. Explore the rest of our{" "}
                <a href={CREATIVE_BASE} style={{ color: "var(--accent)", fontWeight: 700 }}>AI Creative Apps</a>, or open the full{" "}
                <a href="/editor" style={{ color: "var(--accent)", fontWeight: 700 }}>AI photo editor</a> for more control.
              </p>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section style={{ padding: "72px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: "var(--text)", textAlign: "center", margin: "0 0 40px", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
            <FAQAccordion faqs={lc.faq} />
          </div>
        </section>

        {/* Related creative apps */}
        <section style={{ padding: "0 24px 80px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, color: "var(--text)", textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em" }}>More Creative Apps</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
              {related.map((r) => (
                <a key={r.slug} href={`${CREATIVE_BASE}/${r.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ aspectRatio: "16 / 10", borderRadius: 14, overflow: "hidden", marginBottom: 8, background: `linear-gradient(135deg, ${r.gradient[0]}, ${r.gradient[1]})` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl(r.slug)} alt={`${r.h1} example`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center", lineHeight: 1.3 }}>{r.h1}</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
