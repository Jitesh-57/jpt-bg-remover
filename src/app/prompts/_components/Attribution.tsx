import { DATASET_CREDIT, DATASET_ORG_URL, LICENSE_URL } from "@/lib/prompts/types";

/**
 * The credit line the licence requires.
 *
 * CC BY 4.0 lets us copy, adapt and republish these prompts commercially on
 * one condition: attribution. That makes this component load-bearing rather
 * than decorative — if it stops rendering, the site is using the dataset
 * outside its licence.
 */
export function DatasetCredit({ compact = false }: { compact?: boolean }) {
  return (
    <p style={{
      margin: 0, fontSize: compact ? 12 : 12.5, color: "var(--text-faint)", lineHeight: 1.6,
    }}>
      {DATASET_CREDIT.replace(" (CC BY 4.0)", "")} —{" "}
      <a href={DATASET_ORG_URL} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
        YouMind OpenLab
      </a>{" "}
      — licensed{" "}
      <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
        CC BY 4.0
      </a>
      . Each prompt credits its original author and links to their post.
    </p>
  );
}

/** Per-prompt credit: author, their profile, and the post it came from. */
export function PromptCredit({
  authorName, authorUrl, sourceUrl, publishedAt, license,
}: {
  authorName: string;
  authorUrl: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  license: string;
}) {
  const link: React.CSSProperties = { color: "var(--text)", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid var(--border-strong)" };
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "center",
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14,
      padding: "13px 16px", fontSize: 13.5, color: "var(--text-muted)",
    }}>
      <span>
        Prompt by{" "}
        {authorUrl ? (
          <a href={authorUrl} target="_blank" rel="noopener noreferrer nofollow" style={link}>@{authorName}</a>
        ) : (
          <strong style={{ color: "var(--text)" }}>@{authorName}</strong>
        )}
      </span>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ ...link, fontWeight: 600 }}>
          View the original post ↗
        </a>
      )}
      {publishedAt && <span>Published {publishedAt}</span>}
      <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer nofollow" style={{ ...link, fontWeight: 600 }}>
        {license}
      </a>
    </div>
  );
}
