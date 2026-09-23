import type { Metadata } from "next";
import Link from "next/link";
import PromptCard from "./_components/PromptCard";
import SafeImage from "./_components/SafeImage";
import { DatasetCredit } from "./_components/Attribution";
import {
  COUNTS, MODELS, facetList, featured, hottest, toCards,
} from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { PACKS, packPrompts } from "@/lib/prompts/packs";
import { PROMPT_COUNT as ORIGINALS_COUNT } from "@/lib/prompt-library";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/prompts`;

const TOTAL = COUNTS.total + ORIGINALS_COUNT;

export const metadata: Metadata = {
  title: { absolute: `${TOTAL} AI Prompts — Free Image & Video Prompt Library | ${BRAND}` },
  description:
    `A free library of ${TOTAL} AI prompts for ${MODELS.map((m) => m.name).join(", ")} and more. Browse by model, medium, use case or style. Every prompt credits the creator who wrote it.`,
  keywords:
    "ai prompts, ai prompt library, image prompts, video prompts, nano banana pro prompts, gpt image 2 prompts, seedream prompts, seedance prompts, free ai prompts",
  alternates: { canonical: URL },
  openGraph: {
    title: `${TOTAL} free AI prompts`,
    description: "Image and video prompts for every major model — free to copy, credited to their authors.",
    url: URL, type: "website", siteName: BRAND,
  },
  twitter: { card: "summary_large_image", title: `${TOTAL} free AI prompts`, description: "Browse by model, medium, use case or style. Free to copy." },
};

function H2({ children, sub, href, hrefLabel }: { children: React.ReactNode; sub?: string; href?: string; hrefLabel?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.025em", margin: 0 }}>{children}</h2>
        {sub && <p style={{ margin: "5px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} style={{ fontSize: 13.5, fontWeight: 800, color: "var(--accent-strong)", textDecoration: "none", whiteSpace: "nowrap" }}>
          {hrefLabel || "View all"} →
        </Link>
      )}
    </div>
  );
}

export default async function PromptsHub() {
  const resolve = await mediaResolver();
  const hot = toCards(hottest(8)).map((c) => ({ ...c, image: resolve(c.image) }));
  const weekly = featured(1)[0];
  const weeklyImage = weekly ? resolve(weekly.media === "video" ? weekly.videoThumbnail : weekly.images[0]) : null;

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${BRAND} prompt library?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A free, browsable collection of ${TOTAL} AI prompts — ${COUNTS.image} image prompts and ${COUNTS.video} video prompts drawn from open CC BY 4.0 collections, plus ${ORIGINALS_COUNT} written in-house. Every prompt has its own page, credits the person who wrote it, and can be copied without an account.`,
        },
      },
      {
        "@type": "Question",
        name: "Where do the prompts come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most are adapted from YouMind OpenLab's open prompt collections on GitHub, published under CC BY 4.0. Each one was originally posted by an individual creator, and we credit them and link to their post on every card and every page. The rest are written by Pixel Shine.",
        },
      },
      {
        "@type": "Question",
        name: "Are the prompts free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Copying is free and needs no account. The licence lets you use them commercially as long as the author is credited — we do that here, and you should keep the credit if you republish one.",
        },
      },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "AI prompt models",
    itemListElement: MODELS.map((m, i) => ({
      "@type": "ListItem", position: i + 1, name: `${m.name} prompts`, url: `${BASE}/${m.slug}-prompts`,
    })),
  };

  const tile: React.CSSProperties = {
    display: "block", textDecoration: "none", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 18, padding: "22px 22px 24px",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "46px 24px 80px" }}>
          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <section id="prompts-overview" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 30, alignItems: "center" }}>
            <div>
              <div className="jpt-pill" style={{ marginBottom: 18 }}>
                {TOTAL} PROMPTS · {COUNTS.authors}+ CREATORS · FREE TO COPY
              </div>
              <h1 style={{ fontSize: "clamp(2.2rem,6vw,4rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0 }}>
                Every prompt,<br />
                <span className="jpt-grad-text">credited and free.</span>
              </h1>
              <p style={{ fontSize: 16.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "18px 0 0", maxWidth: 520 }}>
                {COUNTS.image} image prompts and {COUNTS.video} video prompts for {MODELS.length} models, plus{" "}
                {ORIGINALS_COUNT} written here. Fill in the blanks, copy, and generate — with the author of every
                prompt credited and linked.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
                <Link href="/prompts/image" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 999, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14.5, textDecoration: "none", boxShadow: "var(--glow)" }}>
                  Browse image prompts →
                </Link>
                <Link href="/prompts/video" className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}>
                  Video prompts
                </Link>
              </div>
            </div>

            {/* Weekly featured */}
            {weekly && (
              <Link href={weekly.media === "video" ? `/video-prompts/${weekly.uid}` : `/prompts/${weekly.uid}`} style={{ ...tile, padding: 0, overflow: "hidden" }} className="jpt-hover">
                <div style={{ position: "relative", aspectRatio: "16 / 10", background: "var(--surface-2)" }}>
                  <SafeImage src={weeklyImage} alt={weekly.title} />
                  <span style={{ position: "absolute", left: 12, top: 12, background: "#F5B301", color: "#1a1a1a", fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 999 }}>
                    WEEKLY FEATURED
                  </span>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--accent-strong)" }}>{weekly.model}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginTop: 5, lineHeight: 1.3 }}>{weekly.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 7 }}>Prompt by @{weekly.author.name}</div>
                </div>
              </Link>
            )}
          </section>

          {/* ── PACKS ────────────────────────────────────────────────────── */}
          <section id="prompts-packs" style={{ marginTop: 62 }}>
            <H2 sub="Hand-picked collections for one job each.">Curated prompt packs</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
              {PACKS.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/prompts-pack/${p.slug}`} className="jpt-hover" style={tile}>
                  <span style={{ display: "block", fontSize: 18, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>{p.subtitle}</span>
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 900, color: "var(--accent-strong)", marginTop: 14, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {packPrompts(p).length} prompts →
                  </span>
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              {PACKS.slice(3).map((p) => (
                <Link key={p.slug} href={`/prompts-pack/${p.slug}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 999, textDecoration: "none" }}>
                  {p.title}
                </Link>
              ))}
            </div>
          </section>

          {/* ── HOTTEST ──────────────────────────────────────────────────── */}
          <section id="prompts-weekly-highlights" style={{ marginTop: 62 }}>
            <H2 sub="Featured by the curators, or newly added with the most to show." href="/prompts/image" hrefLabel="All image prompts">
              🔥 Hottest this week
            </H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
              {hot.map((c) => <PromptCard key={c.uid} p={c} />)}
            </div>
          </section>

          {/* ── BROWSE BY MEDIA ──────────────────────────────────────────── */}
          <section style={{ marginTop: 62 }}>
            <H2>Browse by medium</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
              {[
                { href: "/prompts/image", title: "Image prompts", n: COUNTS.image, blurb: "Portraits, posters, product shots, infographics." },
                { href: "/prompts/video", title: "Video prompts", n: COUNTS.video, blurb: "Timeline prompts, shot by shot, for video models." },
                { href: "/prompts/originals", title: "Pixel Shine originals", n: ORIGINALS_COUNT, blurb: "Written here, sized for each platform's crop." },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="jpt-hover" style={tile}>
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 900, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {t.n} prompts
                  </span>
                  <span style={{ display: "block", fontSize: 19, fontWeight: 900, color: "var(--text)", marginTop: 7, letterSpacing: "-0.02em" }}>{t.title}</span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 7, lineHeight: 1.6 }}>{t.blurb}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── BROWSE BY MODEL ──────────────────────────────────────────── */}
          <section style={{ marginTop: 62 }}>
            <H2 sub="Each model has its own page, with every prompt written for it.">Browse by model</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
              {MODELS.map((m) => (
                <Link key={m.slug} href={`/${m.slug}-prompts`} className="jpt-hover" style={{ ...tile, padding: "16px 18px" }}>
                  <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>{m.name}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--text-faint)", marginTop: 4 }}>
                    {m.count} prompts · {m.media}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── BROWSE BY CATEGORY ───────────────────────────────────────── */}
          <section style={{ marginTop: 62 }}>
            <H2>Browse by category</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>
              {(["image", "video"] as const).map((media) => (
                <div key={media} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                      {media === "image" ? "Image" : "Video"} prompt index
                    </h3>
                    <Link href={`/prompts/${media}`} style={{ fontSize: 12.5, fontWeight: 800, color: "var(--accent-strong)", textDecoration: "none" }}>View all →</Link>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {[...facetList(media, "use-cases"), ...facetList(media, "styles").slice(0, 6)].slice(0, 14).map((f) => (
                      <Link key={f.slug} href={`/prompts/${media}/${f.slug}`} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 999, textDecoration: "none" }}>
                        {f.name} <span style={{ color: "var(--text-faint)" }}>{f.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ABOUT ────────────────────────────────────────────────────── */}
          <section id="prompts-about" style={{ marginTop: 66, maxWidth: 820 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.025em", margin: "0 0 14px" }}>
              What is the {BRAND} prompt library?
            </h2>
            <div style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.8, display: "grid", gap: 14 }}>
              <p style={{ margin: 0 }}>
                {TOTAL} AI prompts you can read, copy and run — {COUNTS.image} for image models, {COUNTS.video} for
                video models, and {ORIGINALS_COUNT} written in-house for the tools on this site. Every one has its own
                page, so you can link to a single prompt rather than to a list.
              </p>
              <p style={{ margin: 0 }}>
                {COUNTS.withVariables} of them carry editable fields — the subject, the colour, the text on the poster —
                rendered here as input boxes rather than as placeholders you have to find and replace. Copy gives you
                the filled-in version.
              </p>
              <p style={{ margin: 0 }}>
                The collection comes from open, CC BY 4.0 licensed repositories published by YouMind OpenLab, written
                originally by {COUNTS.authors} individual creators. That licence permits commercial use on one
                condition — attribution — so every card and every page names the author and links to the post it came
                from. If you republish one of these prompts, keep that credit with it.
              </p>
            </div>
          </section>

          {/* ── MORE FEATURES ────────────────────────────────────────────── */}
          <section style={{ marginTop: 56 }}>
            <H2>Then do something with it</H2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
              {[
                { href: "/app/create", title: "Create Image", blurb: "Paste a prompt, add your photo, generate." },
                { href: "/creative", title: "200 AI apps", blurb: "The same looks with the settings already chosen." },
                { href: "/tools", title: "Free tools", blurb: "Upscale, crop, compress — no account, no credits." },
              ].map((t) => (
                <Link key={t.href} href={t.href} className="jpt-hover" style={tile}>
                  <span style={{ display: "block", fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{t.title}</span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 7, lineHeight: 1.6 }}>{t.blurb}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── CREDIT ───────────────────────────────────────────────────── */}
          <div style={{ marginTop: 56, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
            <DatasetCredit />
          </div>
        </div>
      </div>
    </>
  );
}
