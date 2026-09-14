import Link from "next/link";
import HomeHero from "@/app/_components/HomeHero";
import SmartImage from "@/app/_components/SmartImage";
import PricingSection from "@/app/_components/PricingSection";
import FAQAccordion from "@/app/_components/FAQAccordion";
import ScrollReveal from "@/app/_components/ScrollReveal";
import { CREATIVE_APPS, CREATIVE_BASE, previewUrl } from "@/lib/creative-apps";
import { landingImg } from "@/lib/landing-images";
import { CREDIT_COST } from "@/lib/plans";
import type { PageSEO } from "@/lib/page-config";

const BASE = "https://www.sjpt.io";

// Which of the 42 apps front the homepage gallery. Order is deliberate: the
// viral ones first, then the utilitarian ones people search for by name.
const FEATURED_APPS = [
  "saree-photoshoot", "3d-figurine", "retro-bollywood", "ghibli-style",
  "professional-headshot", "polaroid-photo", "restore-old-photos", "passport-photo",
];

const FREE_TOOLS = [
  { icon: "🔍", name: "Image Upscaler",     desc: "Sharpen and enlarge up to 4×",   href: "/upscale" },
  { icon: "🗜️", name: "Compress Image",     desc: "Hit an exact KB target",         href: "/compress-image" },
  { icon: "🔀", name: "Convert Format",     desc: "JPG · PNG · WebP",               href: "/convert-image" },
  { icon: "✂️", name: "Crop Image",         desc: "Social presets and circle crop", href: "/crop-image" },
  { icon: "↔️", name: "Resize Image",       desc: "Exact pixels or percent",        href: "/resize-image" },
  { icon: "🔄", name: "Rotate & Flip",      desc: "Any angle, mirror either way",   href: "/rotate-image" },
  { icon: "🫥", name: "Blur Image",         desc: "Hide faces and details",         href: "/blur-image" },
  { icon: "🔖", name: "Add Watermark",      desc: "Text watermark, any position",   href: "/watermark-image" },
  { icon: "😂", name: "Meme Generator",     desc: "Top and bottom captions",        href: "/meme-generator" },
  { icon: "📄", name: "Image to PDF",       desc: "Combine images into one PDF",    href: "/image-to-pdf" },
  { icon: "🔳", name: "QR Code Generator",  desc: "Link or text to QR",             href: "/qr-code-generator" },
  { icon: "⚡", name: "Batch Editor",       desc: "Same edit, 100 images",          href: "/batch-editor" },
];

const PRO_TOOLS = [
  { icon: "✨", name: "AI Editor",          desc: "Edit anything with a sentence",             href: "/ai-editor" },
  { icon: "🪄", name: "Remove Background",  desc: "Clean cutouts, hair and all",               href: "/remove-bg" },
  { icon: "🎯", name: "AI Headshot",        desc: "Studio headshots from a selfie",            href: "/ai-headshot" },
  { icon: "🌅", name: "Generate Background",desc: "A new scene behind your subject",           href: "/editor?tool=generate-bg" },
  { icon: "🔬", name: "4× AI Upscale",      desc: "Super-resolution with real detail",         href: "/editor?tool=upscale" },
  { icon: "🎨", name: "40+ AI Apps",        desc: "One-tap looks, no prompt writing",          href: CREATIVE_BASE },
];

const STEPS = [
  { n: "01", t: "Upload a photo",       d: "Drop any JPG, PNG or WebP. Your photo stays private, and your original is never changed.",           img: landingImg("home-step-1.png") },
  { n: "02", t: "Pick a tool or a look", d: "Choose a free tool, describe an edit in plain words, or tap one of the 40+ AI apps for an instant style.",   img: landingImg("home-step-2.png") },
  { n: "03", t: "Download in full res",  d: "Every export is full resolution with no watermark — free tools and AI results alike.",                    img: landingImg("home-step-3.png") },
];

export default function HomePage({
  config,
  withExamples = new Set<string>(),
}: {
  config: PageSEO;
  /** Slugs whose example image exists. Empty means "unknown" — see below. */
  withExamples?: Set<string>;
}) {
  /*
    Front apps that have a picture.

    The eight below are the deliberate picks, but the creatives are generated
    in batches, so featuring a slug whose file does not exist yet put a flat
    gradient tile on the homepage. Now the picks are filtered to the ones that
    have an image and the row is topped back up to eight from whatever else
    does — order still favours the deliberate list.

    An empty `withExamples` means the bucket could not be listed rather than
    "nothing exists", so the original picks are kept in that case.
  */
  const bySlug = (slug: string) => CREATIVE_APPS.find((a) => a.slug === slug);
  const featured = FEATURED_APPS.map(bySlug).filter((a): a is NonNullable<typeof a> => !!a);

  const apps = withExamples.size === 0
    ? featured
    : [
        ...featured.filter((a) => withExamples.has(a.slug)),
        ...CREATIVE_APPS.filter(
          (a) => withExamples.has(a.slug) && !FEATURED_APPS.includes(a.slug)
        ),
      ].slice(0, 8);

  /*
    The showcase under the hero.

    It was a single 21:9 frame holding home-hero.png. That file was never
    generated, so the frame rendered its gradient fallback: a large empty dark
    box across the top of the homepage.

    Three app panels replace it. Each is a real creative where one exists, and
    the app's own gradient plus its name where it does not — so the block is
    populated and self-explanatory either way, which the single empty frame
    could not manage. Three 4:5 panels come to roughly the same 21:9.
  */
  const showcase = [
    ...apps.filter((a) => withExamples.has(a.slug)),
    ...apps,
  ].filter((a, i, all) => all.findIndex((x) => x.slug === a.slug) === i).slice(0, 3);

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: config.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const webPageLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: config.title, description: config.meta_description, url: BASE,
  };

  const sectionHead = (eyebrow: string, title: string, sub?: string) => (
    <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{eyebrow}</div>
      <h2 className="jpt-h2" style={{ margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.65, margin: "14px 0 0" }}>{sub}</p>}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <ScrollReveal />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ padding: "72px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="jpt-pill" style={{ marginBottom: 20 }}>✦ 40+ AI apps · a dozen free tools · no watermark</div>
            <h1 className="jpt-h1" style={{ marginBottom: 18 }}>
              {config.h1.split(" ").slice(0, -2).join(" ")}{" "}
              <span className="jpt-grad-text">{config.h1.split(" ").slice(-2).join(" ")}</span>
            </h1>
            <p className="jpt-lead" style={{ maxWidth: 640, margin: "0 auto 34px" }}>{config.subtitle}</p>
          </div>
          <HomeHero />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 22px", justifyContent: "center", fontSize: 13.5, color: "var(--text-muted)", fontWeight: 600, marginTop: 22 }}>
            <span>✓ No sign-up for free tools</span>
            <span>✓ Nothing to install</span>
            <span>✓ Credits never expire</span>
          </div>
        </section>

        {/* ── SHOWCASE ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 72px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderRadius: 24, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
              {showcase.map((a) => (
                <Link key={a.slug} href={`${CREATIVE_BASE}/${a.slug}`} style={{ position: "relative", aspectRatio: "4 / 5", display: "block", textDecoration: "none", minWidth: 0 }}>
                  <SmartImage
                    src={previewUrl(a.slug)}
                    alt={`A photo turned into ${a.h1}`}
                    fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`}
                    sizes="(max-width: 768px) 33vw, 393px"
                    artwork={{ slug: a.slug, name: a.h1, emoji: a.emoji, gradient: [a.gradient[0], a.gradient[1]] }}
                    eager
                  />
                  <span style={{ position: "absolute", left: 12, bottom: 12, right: 12, background: "rgba(11,11,14,0.78)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 12.5, fontWeight: 800, borderRadius: 10, padding: "8px 11px", lineHeight: 1.35 }}>
                    {a.emoji} {a.h1}
                  </span>
                </Link>
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-faint)", marginTop: 12 }}>
              Real results — each one is an ordinary photo run through that app&apos;s own prompt.
            </p>
          </div>
        </section>

        {/* ── AI APPS GALLERY ──────────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 88px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {sectionHead("AI apps", "Turn one photo into any look", "Each app carries a tuned prompt, so you upload and tap. No prompt writing, no settings to learn.")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 18 }}>
              {apps.map((a) => (
                <Link key={a.slug} href={`${CREATIVE_BASE}/${a.slug}`} className="jpt-hover" style={{ textDecoration: "none", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)", display: "block" }}>
                  <div style={{ aspectRatio: "4 / 5", position: "relative" }}>
                    <SmartImage
                      src={previewUrl(a.slug)}
                      alt={`${a.h1} example`}
                      fallback={`linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`}
                      sizes="(max-width: 768px) 50vw, 280px"
                      artwork={{ slug: a.slug, name: a.h1, emoji: a.emoji, gradient: [a.gradient[0], a.gradient[1]], note: "Example coming soon" }}
                    />
                    <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(11,11,14,0.8)", color: "var(--accent)", border: "1px solid var(--accent-border)", backdropFilter: "blur(6px)", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "4px 10px" }}>{a.emoji} {a.badge}</span>
                  </div>
                  <div style={{ padding: "14px 15px 16px" }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>{a.h1}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{a.intro}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <Link href={CREATIVE_BASE} className="jpt-btn jpt-btn-ghost" style={{ textDecoration: "none" }}>See all {CREATIVE_APPS.length} apps →</Link>
            </div>
          </div>
        </section>

        {/* ── FREE TOOLS ───────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {sectionHead("Free tools", "Free, unlimited, private", "No limit, no account and no watermark — use them as often as you like.")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
              {FREE_TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="jpt-hover" style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 15px" }}>
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{t.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRO TOOLS ────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {sectionHead("Pro tools", "The AI tools, on credits", `Server-side AI at ${CREDIT_COST} credits a generation. Buy a pack once from $2 — it never expires and nothing auto-renews.`)}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 16 }}>
              {PRO_TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="jpt-hover" style={{ textDecoration: "none", position: "relative", display: "flex", gap: 14, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--accent-border)", borderRadius: 16, padding: "18px 18px" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{t.desc}</span>
                  </span>
                  <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10.5, fontWeight: 800, color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "3px 8px", letterSpacing: "0.06em" }}>PRO</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 88px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {sectionHead("How it works", "Three steps, under a minute")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 20 }}>
              {STEPS.map((st) => (
                <div key={st.n} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ aspectRatio: "16 / 9" }}>
                    <SmartImage src={st.img} alt={st.t} fallback="linear-gradient(135deg, var(--surface-3), var(--surface-2))" />
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 6 }}>{st.n}</div>
                    <h3 className="jpt-h3" style={{ margin: "0 0 6px" }}>{st.t}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{st.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING (shared) ─────────────────────────────────────────────── */}
        <PricingSection />

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section style={{ padding: "0 24px 96px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {sectionHead("FAQ", "Questions people ask")}
            <FAQAccordion faqs={config.faq} />
          </div>
        </section>
      </div>
    </>
  );
}
