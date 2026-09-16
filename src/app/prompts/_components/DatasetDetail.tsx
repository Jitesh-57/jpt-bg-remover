import Link from "next/link";
import Gallery from "./Gallery";
import PromptBlock from "./PromptBlock";
import PromptCard from "./PromptCard";
import { PromptCredit } from "./Attribution";
import { facetList, related, toCards } from "@/lib/prompts/data";
import type { MediaResolver } from "@/lib/prompts/media";
import type { PromptRecord } from "@/lib/prompts/types";

/**
 * The detail page body for a dataset prompt — image or video.
 *
 * One component for both because they differ in three places (the media
 * block, the CTA wording and which category index is linked) and agree
 * everywhere else. Two near-identical files would drift.
 */

const LANG_NAME: Record<string, string> = {
  en: "English", zh: "Chinese", ja: "Japanese", ko: "Korean",
  es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  ru: "Russian", ar: "Arabic", hi: "Hindi",
};

function Section({ title, children, sub }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 38 }}>
      <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>{title}</h2>
      {sub && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--text-muted)" }}>{sub}</p>}
      {!sub && <div style={{ height: 14 }} />}
      {children}
    </section>
  );
}

function VideoPlayer({ src, poster, title }: { src: string | null; poster: string | null; title: string }) {
  if (src) {
    return (
      <video
        controls
        preload="none"
        poster={poster || undefined}
        style={{ width: "100%", borderRadius: 16, border: "1px solid var(--border)", background: "#000", display: "block" }}
      >
        <source src={src} type="video/mp4" />
        {title}
      </video>
    );
  }
  if (poster) {
    return (
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={`${title} — poster frame`} style={{ width: "100%", display: "block" }} />
        {/*
          A poster with no mp4 behind it. The upstream dataset only ships the
          video file for a handful of Seedance entries, so saying so is more
          use than a play button that does nothing.
        */}
        <span style={{
          position: "absolute", left: 12, bottom: 12, background: "rgba(0,0,0,0.75)", color: "#fff",
          fontSize: 11.5, fontWeight: 700, padding: "5px 10px", borderRadius: 999,
        }}>
          Poster frame — the clip lives on the author&apos;s original post
        </span>
      </div>
    );
  }
  return null;
}

export default function DatasetDetail({
  p,
  resolve,
  generateHref,
}: {
  p: PromptRecord;
  resolve: MediaResolver;
  generateHref: string;
}) {
  const isVideo = p.media === "video";
  const images = p.images.map((i) => resolve(i)).filter((x): x is string => !!x);
  const poster = resolve(p.videoThumbnail);
  const more = toCards(related(p, 6));
  const tags = [p.useCase, ...p.styles, ...p.subjects].filter((x): x is string => !!x);

  const steps = isVideo
    ? [
        "Copy the prompt — fill in any placeholders first and the copy takes your version.",
        "Paste it into the video model you use. Timeline prompts work best pasted whole, not split up.",
        "Generate, then judge the first and last second: that is where drift shows up.",
        "Bring the result back here to upscale a frame, cut a thumbnail, or clean up a still.",
      ]
    : [
        "Copy the prompt — fill in any placeholders first and the copy takes your version.",
        "Paste it into your image model, or press Generate to open it here with your own photo.",
        "Run it twice. Generation is not deterministic and the second pass is often the keeper.",
        "Finish it with the free tools: upscale, crop to the platform you need, compress before sharing.",
      ];

  return (
    <>
      {/* HEADER */}
      <nav aria-label="Breadcrumb" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/prompts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Prompts</Link>
        <span aria-hidden>›</span>
        <Link href={isVideo ? "/prompts/video" : "/prompts/image"} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          {isVideo ? "Video prompt" : "Image prompt"}
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/${p.modelSlug}-prompts`} style={{ color: "var(--accent-strong)", textDecoration: "none" }}>{p.model}</Link>
      </nav>

      <h1 style={{ fontSize: "clamp(1.7rem,3.6vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.16, margin: "14px 0 0" }}>
        {p.title}
      </h1>
      {p.description && (
        <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, margin: "12px 0 0" }}>{p.description}</p>
      )}

      {/* MEDIA */}
      <div style={{ marginTop: 22 }}>
        {isVideo ? <VideoPlayer src={p.videoUrl} poster={poster} title={p.title} /> : <Gallery images={images} alt={p.title} />}
      </div>

      {/* CREDIT — required by the licence, kept directly under the result */}
      <div style={{ marginTop: 14 }}>
        <PromptCredit
          authorName={p.author.name}
          authorUrl={p.author.url}
          sourceUrl={p.sourceUrl}
          publishedAt={p.publishedAt}
          license={p.license}
        />
      </div>

      {/* THE PROMPT */}
      <div style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
          The prompt
        </h2>
        <PromptBlock uid={p.uid} prompt={p.prompt} media={p.media} generateHref={generateHref} />
      </div>

      {/* META */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 26px", marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
        {[
          ["Model", p.model],
          ["Media", isVideo ? "Video" : "Image"],
          ["Language", p.languages.map((l) => LANG_NAME[l] || l).join(", ")],
          ["Words", String(p.prompt.split(/\s+/).length)],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 16 }}>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/prompts/${p.media}/${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: 999, textDecoration: "none" }}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* HOW TO USE */}
      <Section title="How to use this prompt">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {steps.map((s, i) => (
            <li key={s} style={{ display: "flex", gap: 13, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 13, padding: "13px 16px" }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "var(--accent-strong)", minWidth: 18 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{s}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* UPSELL */}
      <Section
        title={isVideo ? "Go beyond generating video" : "Go beyond generating the image"}
        sub="Everything after the generation, on the same site."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Upscale to 4K", href: "/upscale" },
            { label: "Remove the background", href: "/creative/background-remover" },
            { label: "Crop for a platform", href: "/crop-image" },
            { label: "Compress before sharing", href: "/compress-image" },
            { label: "All AI apps", href: "/creative" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="jpt-hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}
            >
              {l.label} →
            </Link>
          ))}
        </div>
      </Section>

      {/* MORE FROM MODEL */}
      {more.length > 0 && (
        <Section title={`More from ${p.model}`} sub={`Same model, same dataset — ${p.model} prompts people have shared.`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 14 }}>
            {more.map((c) => <PromptCard key={c.uid} p={c} />)}
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href={`/${p.modelSlug}-prompts`} style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-strong)", textDecoration: "none" }}>
              View all {p.model} prompts →
            </Link>
          </div>
        </Section>
      )}

      {/* CATEGORY INDEX */}
      <Section title={isVideo ? "All video categories" : "All image categories"}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 18 }}>
          {([["use-cases", "Use cases"], ["styles", "Styles"], ["subjects", "Subjects"]] as const).map(([kind, label]) => (
            <div key={kind}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 5 }}>
                {facetList(p.media, kind).map((f) => (
                  <li key={f.slug}>
                    <Link href={`/prompts/${p.media}/${f.slug}`} style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "none" }}>
                      {f.name} <span style={{ color: "var(--text-faint)" }}>({f.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
