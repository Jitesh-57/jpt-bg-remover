import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyPromptButton, UseInEditorButton } from "../PromptLibrary";
import PromptText from "./PromptText";
import DatasetDetail from "../_components/DatasetDetail";
import {
  PROMPTS, PROMPT_BY_SLUG, CATEGORY_BY_ID, PLATFORM_BY_ID, relatedPrompts,
} from "@/lib/prompt-library";
import { matchLibraryImages, LIBRARY_BUCKET } from "@/lib/prompt-library-images";
import { listBucketImagesServer } from "@/lib/prompt-images.server";
import { getPrompt, byMedia, excerpt } from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { getCreativeApp, CREATIVE_BASE } from "@/lib/creative-apps";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";

/**
 * One route, two kinds of prompt.
 *
 * `/prompts/<slug>` serves the Pixel Shine originals, which shipped first and
 * are already indexed under bare slugs. `/prompts/<slug>-<shortid>` serves the
 * licensed dataset. Keeping them in one segment is what lets the original URLs
 * keep working: moving them to make room would have broken every link on a
 * page that had been live for two days.
 */
export function generateStaticParams() {
  return [
    ...PROMPTS.map((p) => ({ slug: p.slug })),
    ...byMedia("image").map((r) => ({ slug: r.uid })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const url = `${BASE}/prompts/${slug}`;

  const ds = getPrompt(slug);
  if (ds && ds.media === "image") {
    const description = ds.description || excerpt(ds, 155);
    return {
      title: { absolute: `${ds.title} — ${ds.model} Prompt | ${BRAND}` },
      description,
      keywords: [ds.model, "ai prompt", ds.useCase, ...ds.styles, ...ds.subjects].filter(Boolean).join(", "),
      alternates: { canonical: url },
      openGraph: {
        title: ds.title, description, url, type: "article", siteName: BRAND,
        ...(ds.images[0] ? { images: [ds.images[0]] } : {}),
      },
      twitter: { card: "summary_large_image", title: ds.title, description },
    };
  }

  const p = PROMPT_BY_SLUG[slug];
  if (!p) return {};
  const cat = CATEGORY_BY_ID[p.category];
  const description = `${p.text.slice(0, 150).trim()}… A free ${cat.name.toLowerCase()} prompt, composed for ${p.ratio}. Copy it, or run it on your own photo.`;
  return {
    title: { absolute: `${p.title} — AI Photo Prompt (Free, Copy & Paste) | ${BRAND}` },
    description,
    keywords: [...p.tags, "ai prompt", `${p.title.toLowerCase()} prompt`].join(", "),
    alternates: { canonical: url },
    openGraph: { title: p.title, description, url, type: "article", siteName: BRAND },
    twitter: { card: "summary_large_image", title: p.title, description },
  };
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 3 }}>{value}</div>
    </div>
  );
}

export default async function PromptDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = `${BASE}/prompts/${slug}`;

  // ── The licensed dataset ──────────────────────────────────────────────────
  const ds = getPrompt(slug);
  if (ds && ds.media === "image") {
    const resolve = await mediaResolver();
    const breadcrumbLd = {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Prompts", item: `${BASE}/prompts` },
        { "@type": "ListItem", position: 2, name: "Image prompts", item: `${BASE}/prompts/image` },
        { "@type": "ListItem", position: 3, name: `${ds.model} prompts`, item: `${BASE}/${ds.modelSlug}-prompts` },
        { "@type": "ListItem", position: 4, name: ds.title, item: url },
      ],
    };
    const workLd = {
      "@context": "https://schema.org", "@type": "CreativeWork",
      name: ds.title,
      ...(ds.description ? { description: ds.description } : {}),
      text: ds.prompt.slice(0, 5000),
      url,
      inLanguage: ds.languages,
      license: "https://creativecommons.org/licenses/by/4.0/",
      isAccessibleForFree: true,
      author: { "@type": "Person", name: ds.author.name, ...(ds.author.url ? { url: ds.author.url } : {}) },
      ...(ds.sourceUrl ? { isBasedOn: ds.sourceUrl } : {}),
      ...(ds.images.length ? { image: ds.images } : {}),
      publisher: { "@type": "Organization", name: BRAND, url: BASE },
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(workLd) }} />
        <div style={{ background: "var(--bg)", color: "var(--text)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "26px 24px 70px" }}>
            <DatasetDetail p={ds} resolve={resolve} generateHref="/editor?tool=ai-edit" />
          </div>
        </div>
      </>
    );
  }

  // ── The Pixel Shine originals ─────────────────────────────────────────────
  const p = PROMPT_BY_SLUG[slug];
  if (!p) notFound();

  const cat = CATEGORY_BY_ID[p.category];
  const app = p.app ? getCreativeApp(p.app) : null;
  const related = relatedPrompts(p);

  const files = await listBucketImagesServer(LIBRARY_BUCKET);
  const images = matchLibraryImages(PROMPTS, files);
  const hero = images[p.id];

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Prompts", item: `${BASE}/prompts` },
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  };
  const workLd = {
    "@context": "https://schema.org", "@type": "CreativeWork",
    name: p.title, text: p.text, url, genre: cat.name,
    isAccessibleForFree: true, inLanguage: "en",
    publisher: { "@type": "Organization", name: BRAND, url: BASE },
    ...(hero ? { image: hero } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(workLd) }} />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "26px 24px 70px" }}>
          <Link href="/prompts" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>
            ← All prompts
          </Link>

          <header style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-strong)", background: "var(--accent-soft)", padding: "4px 11px", borderRadius: 999 }}>
                {cat.emoji} {cat.name}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-2)", padding: "4px 11px", borderRadius: 999 }}>
                Pixel Shine original
              </span>
              {p.platforms.map((id) => (
                <span key={id} title={PLATFORM_BY_ID[id].note} style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-2)", padding: "4px 11px", borderRadius: 999 }}>
                  {PLATFORM_BY_ID[id].name}
                </span>
              ))}
            </div>

            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
              {p.title}
            </h1>

            <div style={{ display: "flex", gap: 26, flexWrap: "wrap", padding: "14px 0 0", borderTop: "1px solid var(--border)" }}>
              <Meta label="Aspect ratio" value={p.ratio} />
              <Meta label="Needs a photo" value={p.needsPhoto ? "Yes — yours" : "No, it generates one"} />
              <Meta label="Words" value={String(p.text.split(/\s+/).length)} />
            </div>
          </header>

          {hero && (
            <div style={{ marginTop: 22, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt={`${p.title} — example result`} style={{ width: "100%", display: "block" }} />
            </div>
          )}

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
              The prompt
            </h2>
            <PromptText text={p.text} />

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}><CopyPromptButton prompt={p} full /></div>
              <div style={{ flex: "1 1 200px" }}><UseInEditorButton prompt={p} full /></div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "10px 0 0", lineHeight: 1.6 }}>
              “Use it” opens the editor with this prompt already loaded — add your photo and generate.
              Copy works anywhere else: ChatGPT, Gemini, Midjourney.
            </p>
          </section>

          <section style={{ marginTop: 22, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 14, padding: "15px 18px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              One thing that helps
            </div>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text)", lineHeight: 1.65 }}>{p.tip}</p>
          </section>

          {app && (
            <section style={{ marginTop: 22 }}>
              <Link
                href={`${CREATIVE_BASE}/${app.slug}`}
                className="jpt-hover"
                style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px" }}
              >
                <span style={{ fontSize: 26 }}>{app.emoji}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Or skip the prompt
                  </span>
                  <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: "var(--text)", marginTop: 3 }}>{app.h1}</span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.55 }}>
                    The same look as a one-click app, with the settings already chosen.
                  </span>
                </span>
                <span style={{ fontSize: 18, color: "var(--text-faint)" }}>→</span>
              </Link>
            </section>
          )}

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 24 }}>
            {p.tags.map((t) => (
              <Link key={t} href={`/prompts?q=${encodeURIComponent(t)}`} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: 999, textDecoration: "none" }}>
                {t}
              </Link>
            ))}
          </div>

          {related.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 14px" }}>Prompts like this</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 12 }}>
                {related.map((r) => (
                  <Link key={r.slug} href={`/prompts/${r.slug}`} className="jpt-hover" style={{ textDecoration: "none", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 15px", display: "block" }}>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--accent-strong)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {CATEGORY_BY_ID[r.category].name} · {r.ratio}
                    </span>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 5, lineHeight: 1.35 }}>{r.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
