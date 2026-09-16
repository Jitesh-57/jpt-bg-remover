import Link from "next/link";
import PromptCard from "./PromptCard";
import { DatasetCredit } from "./Attribution";
import {
  MODELS, byMedia, facetList, hottest, newest, toCards,
} from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import type { Media, PromptRecord } from "@/lib/prompts/types";

/**
 * MediaHub — the body of /prompts/image and /prompts/video (spec §5.2).
 *
 * One component for both: the sections are the same, the content is filtered
 * by medium. Everything on it is a link into a deeper page, which is the job
 * of a hub — it exists to be crawled and to get a visitor one click from the
 * thing they came for.
 */

function Row({
  title, sub, cards, href, hrefLabel,
}: {
  title: string; sub?: string; cards: ReturnType<typeof toCards>; href?: string; hrefLabel?: string;
}) {
  if (!cards.length) return null;
  return (
    <section style={{ marginTop: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
          {sub && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>{sub}</p>}
        </div>
        {href && (
          <Link href={href} style={{ fontSize: 13.5, fontWeight: 800, color: "var(--accent-strong)", textDecoration: "none", whiteSpace: "nowrap" }}>
            {hrefLabel || "View all"} →
          </Link>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 16 }}>
        {cards.map((c) => <PromptCard key={c.uid} p={c} />)}
      </div>
    </section>
  );
}

/** Applies the mirror resolver to a batch of cards. */
function resolveCards(records: PromptRecord[], resolve: (u: string | null) => string | null) {
  return toCards(records).map((c) => ({ ...c, image: resolve(c.image) }));
}

export default async function MediaHub({ media }: { media: Media }) {
  const resolve = await mediaResolver();
  const all = byMedia(media);
  const isVideo = media === "video";
  const label = isVideo ? "Video" : "Image";

  const models = MODELS.filter((m) => all.some((r) => r.modelSlug === m.slug));

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* HEADER */}
        <nav aria-label="Breadcrumb" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 16 }}>
          <Link href="/prompts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Prompts</Link>
          <span aria-hidden style={{ padding: "0 8px" }}>›</span>
          <span style={{ color: "var(--accent-strong)" }}>{label} prompts</span>
        </nav>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.08, margin: 0, textTransform: "uppercase" }}>
              {label} prompts
            </h1>
            <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.7, margin: "14px 0 0" }}>
              {all.length} {isVideo ? "video" : "image"} prompts from {models.length} models, each one credited to the
              person who wrote it. Copy any of them, or open one here and run it on your own photo.
            </p>
          </div>
          <Link
            href={isVideo ? "/creative" : "/editor?tool=ai-edit"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 999,
              background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14.5,
              textDecoration: "none", boxShadow: "var(--glow)", whiteSpace: "nowrap",
            }}
          >
            {isVideo ? "Browse the AI apps" : "Prompt to image"} →
          </Link>
        </div>

        <Row
          title="🔥 Hottest this week"
          sub="Featured by the curators, or newly added with the most to look at."
          cards={resolveCards(hottest(8, media), resolve)}
        />

        <Row
          title="Just added"
          sub="The most recent arrivals in this medium."
          cards={resolveCards(newest(8, media), resolve)}
        />

        {/* ONE ROW PER MODEL */}
        {models.map((m) => (
          <Row
            key={m.slug}
            title={`${m.name} prompts`}
            sub={`${m.count} prompts written for ${m.name}.`}
            cards={resolveCards(all.filter((r) => r.modelSlug === m.slug).slice(0, 6), resolve)}
            href={`/${m.slug}-prompts`}
            hrefLabel={`All ${m.count}`}
          />
        ))}

        {/* CATEGORY INDEX — three numbered columns, per the spec */}
        <section style={{ marginTop: 52 }}>
          <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
            Browse every category
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 24 }}>
            {([["use-cases", "Use cases"], ["styles", "Styles"], ["subjects", "Subjects"]] as const).map(([kind, title], i) => (
              <div key={kind}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 11 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "var(--accent-strong)", letterSpacing: "0.04em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {title}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
                  {facetList(media, kind).map((f) => (
                    <li key={f.slug}>
                      <Link href={`/prompts/${media}/${f.slug}`} style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
                        {f.name} <span style={{ color: "var(--text-faint)" }}>({f.count})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <DatasetCredit />
        </div>
      </div>
    </div>
  );
}
