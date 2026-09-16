import Link from "next/link";
import PromptGrid from "./PromptGrid";
import { DatasetCredit } from "./Attribution";
import { byFacet, facetList, findFacet, toCards } from "@/lib/prompts/data";
import { mediaResolver } from "@/lib/prompts/media";
import type { Media } from "@/lib/prompts/types";
import { notFound } from "next/navigation";

/**
 * A single category listing: /prompts/image/watercolor and friends.
 *
 * Every facet gets a real page rather than a query-string filter, because a
 * URL like /prompts/image/youtube-thumbnail is the thing people search for and
 * the thing other sites link to. A filter state is neither.
 */
export default async function CategoryPage({ media, facetSlug }: { media: Media; facetSlug: string }) {
  const found = findFacet(media, facetSlug);
  if (!found) notFound();

  const { kind, facet } = found;
  const resolve = await mediaResolver();
  const records = byFacet(media, kind, facet.name);
  const cards = toCards(records).map((c) => ({ ...c, image: resolve(c.image) }));

  const kindLabel = kind === "use-cases" ? "Use case" : kind === "styles" ? "Style" : "Subject";
  const siblings = facetList(media, kind).filter((f) => f.slug !== facet.slug);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 24px 80px" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/prompts" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Prompts</Link>
          <span aria-hidden>›</span>
          <Link href={`/prompts/${media}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            {media === "video" ? "Video" : "Image"}
          </Link>
          <span aria-hidden>›</span>
          <span style={{ color: "var(--accent-strong)" }}>{facet.name}</span>
        </nav>

        <div style={{ maxWidth: 680 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
            {kindLabel}
          </div>
          <h1 style={{ fontSize: "clamp(1.9rem,4.4vw,2.9rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0 }}>
            {facet.name} {media === "video" ? "video" : "image"} prompts
          </h1>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "14px 0 0" }}>
            {facet.count} {facet.count === 1 ? "prompt" : "prompts"} tagged {facet.name.toLowerCase()}, drawn from the
            open prompt collections. Each one credits the author who wrote it and links to their original post.
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          <PromptGrid cards={cards} pageSize={24} showSort />
        </div>

        {siblings.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Other {kindLabel.toLowerCase()}s
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {siblings.map((f) => (
                <Link
                  key={f.slug}
                  href={`/prompts/${media}/${f.slug}`}
                  className="jpt-hover"
                  style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 999, textDecoration: "none" }}
                >
                  {f.name} <span style={{ color: "var(--text-faint)" }}>({f.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: 44, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <DatasetCredit />
        </div>
      </div>
    </div>
  );
}
