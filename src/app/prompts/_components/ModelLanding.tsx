import Link from "next/link";
import { notFound } from "next/navigation";
import PromptCard from "./PromptCard";
import PromptGrid, { type GridFilter } from "./PromptGrid";
import GeneratorBar from "./GeneratorBar";
import { DatasetCredit } from "./Attribution";
import {
  MODELS, byModel, facetList, getModel, toCards,
} from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import { BRAND } from "@/lib/brand";

/** Same size as the facet listing pages — one number, one place. */
export const MODEL_PAGE_SIZE = 48;

/**
 * ModelLanding — /{model}-prompts (spec §5.3).
 *
 * These are the pages people search for by name, so they are the ones that
 * have to be complete: what the model is, what its prompts look like, every
 * prompt filterable, and a way to try one without leaving.
 *
 * The blurbs below describe what the collection shows rather than reciting
 * vendor specifications. What is verifiable here is the dataset — how many
 * prompts, by how many authors, tending toward what — so that is what they
 * say. Stating capabilities of a model this codebase does not run would be
 * inventing them.
 */

const ABOUT: Record<string, { blurb: string; note: string }> = {
  "nano-banana-pro": {
    blurb:
      "Google's image model, and the largest collection here. The prompts lean heavily on identity-preserving edits and on structured, JSON-shaped instructions — a sign the model responds well to being told exactly what goes where.",
    note: "Many of these carry editable placeholders, so you can swap the subject without rewriting the prompt.",
  },
  "gpt-image-2": {
    blurb:
      "OpenAI's image model. The prompts collected for it skew toward posters, infographics and anything with words in the picture, which is the job people reach for it to do.",
    note: "If your result needs legible text, this is the model these prompts were written against.",
  },
  "gpt-image-1-5": {
    blurb:
      "The earlier OpenAI image model, still widely used. Its prompt collection covers much the same ground as GPT Image 2 — layout-heavy compositions, typography, explainer graphics.",
    note: "Prompts written for 1.5 usually transfer to 2 with little or no editing.",
  },
  "seedream-4-5": {
    blurb:
      "ByteDance's image model. The prompts here are the most photographic of the set: portraits, product shots and scenes described in the language of lenses and light.",
    note: "Worth reading even if you use another model — the camera detail is the transferable part.",
  },
  "seedance-2-0": {
    blurb:
      "ByteDance's video model, and the source of most of the timeline prompts in this library. Its entries describe a clip second by second — camera move, action, sound — rather than as a single sentence.",
    note: "Timeline prompts render here shot by shot, which is much easier to read than the raw block.",
  },
  "grok-imagine": {
    blurb:
      "xAI's generative model. The collection is video-first and unusually playful: physical comedy, impossible camera moves, short narrative beats.",
    note: "Good hunting ground if you want motion ideas rather than a finished script.",
  },
  "gemini-3": {
    blurb:
      "Google's Gemini 3. The smallest collection here, and the most experimental — the prompts read like people testing the edges of what it will do.",
    note: "Small set, high variance. Worth a browse rather than a search.",
  },
};

function Band({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 52, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 26px" }}>
      {children}
    </section>
  );
}

export default async function ModelLanding({ slug, page = 1 }: { slug: string; page?: number }) {
  const model = getModel(slug);
  if (!model) notFound();

  const resolve = await mediaResolver();
  const records = byModel(slug);
  const cards = toCards(records).map((c) => ({ ...c, image: resolve(c.image) }));

  // Same reasoning as the facet pages: an out-of-range page is a 404, not a
  // quiet redraw of page 1 under a URL that claims to be something else.
  const totalPages = Math.max(1, Math.ceil(cards.length / MODEL_PAGE_SIZE));
  if (page < 1 || page > totalPages) notFound();

  const trending = cards.slice(0, 8);
  const about = ABOUT[slug] || {
    blurb: `${model.count} prompts written for ${model.name}, collected from the people who published them.`,
    note: "",
  };

  const isVideo = model.media === "video";
  const authors = new Set(records.map((r) => r.author.name)).size;
  const withVars = records.filter((r) => r.hasVariables).length;

  /*
    Category chips, built from what this model's prompts are actually tagged
    with. A fixed list would show empty categories on the smaller models.
  */
  const useCases = facetList(model.media, "use-cases").filter((f) =>
    records.some((r) => r.useCase === f.name)
  );
  const filters: GridFilter[] = [
    { id: "all", label: `All ${model.count}` },
    ...useCases.map((f) => ({ id: f.slug, label: f.name, match: { useCase: f.name } })),
    ...(withVars ? [{ id: "vars", label: "Editable", match: { hasVariables: true as const } }] : []),
  ];

  const faqs = [
    {
      q: `What is ${model.name}?`,
      a: `${about.blurb} This page collects ${model.count} prompts written for it by ${authors} different people.`,
    },
    {
      q: "Where do these prompts come from?",
      a: "They are drawn from open, CC BY 4.0 licensed collections published on GitHub by YouMind OpenLab. Each prompt was originally posted by an individual creator, and every card and detail page here credits that person and links to their original post — that credit is the licence condition, not a courtesy.",
    },
    {
      q: "How do I use these prompts?",
      a: `Open any prompt, fill in the placeholders if it has them, and copy. The copy button gives you the filled-in version. You can paste it into ${model.name} wherever you use it, or press Generate to open it in the ${BRAND} editor with your own photo.`,
    },
    {
      q: "Are they free?",
      a: "Copying is free and needs no account. Generating an image inside Pixel Shine uses credits; using the prompt in a tool you already pay for costs nothing here.",
    },
    ...(withVars
      ? [{
          q: "What are the editable fields?",
          a: `${withVars} of these prompts contain placeholders like {argument name="subject" default="a red bicycle"}. Rather than making you find and replace them by hand, they are rendered as input boxes — change one and the prompt below updates, and Copy takes your version.`,
        }]
      : []),
  ];

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 24px 80px" }}>
          {/* HEADER */}
          <nav aria-label="Breadcrumb" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/prompts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Prompts</Link>
            <span aria-hidden>›</span>
            <Link href={`/prompts/${model.media}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              {isVideo ? "Video" : "Image"}
            </Link>
            <span aria-hidden>›</span>
            <span style={{ color: "var(--accent-strong)" }}>{model.name}</span>
          </nav>

          <div style={{ maxWidth: 720 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.08, margin: 0 }}>
              {model.name} <span className="jpt-grad-text">prompts</span>
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, margin: "14px 0 0" }}>
              {model.count} prompts by {authors} creators, free to copy, each credited to the person who wrote it.
              {withVars > 0 && ` ${withVars} of them have editable fields you can fill in before you copy.`}
            </p>
          </div>

          <GeneratorBar model={model.name} />

          {/* TRENDING */}
          <section style={{ marginTop: 46 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
              <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>🔥 Trending {model.name} prompts</h2>
              <Link href={`/prompts/${model.media}`} style={{ fontSize: 13.5, fontWeight: 800, color: "var(--accent-strong)", textDecoration: "none" }}>
                All {isVideo ? "video" : "image"} prompts →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
              {trending.map((c) => <PromptCard key={c.uid} p={c} />)}
            </div>
          </section>

          {/* ALL PROMPTS */}
          <section style={{ marginTop: 54 }}>
            <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              All {model.count} {model.name} prompts
            </h2>
            <PromptGrid cards={cards} filters={filters} page={page} pageSize={MODEL_PAGE_SIZE} basePath={`/${slug}-prompts`} />
          </section>

          {/* ABOUT */}
          <Band>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 10px" }}>About {model.name}</h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.75, margin: 0, maxWidth: 760 }}>{about.blurb}</p>
            {about.note && (
              <p style={{ fontSize: 14, color: "var(--text-faint)", lineHeight: 1.7, margin: "10px 0 0", maxWidth: 760 }}>{about.note}</p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <Link href="/app/create" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "var(--glow)" }}>
                Use a prompt in {BRAND} →
              </Link>
              <Link href="/creative" className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Browse the AI apps
              </Link>
            </div>
          </Band>

          {/* FAQ */}
          <section style={{ marginTop: 46, maxWidth: 800 }}>
            <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 16px" }}>Common questions</h2>
            {faqs.map((f) => (
              <details key={f.q} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "15px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </section>

          {/* CROSS-LINKS */}
          <section style={{ marginTop: 50, paddingTop: 26, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 26 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 9 }}>Browse by model</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {MODELS.map((m) => (
                    <li key={m.slug}>
                      <Link href={`/${m.slug}-prompts`} style={{ fontSize: 13.5, color: m.slug === slug ? "var(--accent-strong)" : "var(--text-muted)", fontWeight: m.slug === slug ? 800 : 400, textDecoration: "none" }}>
                        {m.name} <span style={{ color: "var(--text-faint)" }}>({m.count})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 9 }}>Browse by category</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {facetList(model.media, "use-cases").slice(0, 8).map((f) => (
                    <li key={f.slug}>
                      <Link href={`/prompts/${model.media}/${f.slug}`} style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>{f.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 9 }}>Tools</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {[["Create Image", "/app/create"], ["AI apps", "/creative"], ["Upscale", "/upscale"], ["Free tools", "/tools"], ["Pixel Shine originals", "/prompts/originals"]].map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 26 }}>
              <DatasetCredit />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
