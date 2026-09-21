import Link from "next/link";
import { pageHref } from "@/lib/prompts/page-href";

/**
 * Real, server-rendered pagination for a listing page.
 *
 * Every link here is an `<a href>` in the initial HTML — not a button, not a
 * click handler. That is the entire point of this component: a crawler
 * without JavaScript follows exactly these links, and a "Show more" button
 * that only exists in the client bundle is invisible to it. That gap is why
 * roughly a thousand pages on this site were sitting in Search Console as
 * "discovered — currently not indexed": Google knew the URLs from the
 * sitemap, but the only path to most of them was a button.
 *
 * Numbered links (first, last, current ±2) rather than only prev/next,
 * because a crawler follows a link it can see on the page — a prev/next-only
 * chain means page 40 is forty hops from page 1, and nothing that deep in a
 * chain is worth much crawl budget. A numbered "last" link makes every page
 * reachable in at most two hops from page 1.
 */

function Chip({ href, current, children, "aria-label": ariaLabel }: { href: string; current?: boolean; children: React.ReactNode; "aria-label"?: string }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 38, height: 38, padding: "0 10px", borderRadius: 10,
        fontSize: 13.5, fontWeight: 800, textDecoration: "none",
        background: current ? "var(--accent-soft)" : "var(--surface)",
        color: current ? "var(--accent-strong)" : "var(--text-muted)",
        border: `1px solid ${current ? "var(--accent-border)" : "var(--border)"}`,
      }}
    >
      {children}
    </Link>
  );
}

/**
 * Which page numbers to show: every one of them if there are few, otherwise
 * 1, the last page, and a window around current.
 *
 * Showing all of them up to a point is not a display nicety — it is what
 * makes every page of a listing reachable in one click from page 1, rather
 * than from whichever page happens to be within two of it. A prompt sitting
 * on page 5 of a 6-page model hub was unreachable from page 1 before this:
 * page 1 only ever linked 1, 2, 3 and 6, so page 5 was a page 1 → page 3 (or
 * 6) → page 5 detour, one hop further than a shallow crawl budget allows —
 * and it showed up as a genuine miss in the crawl check for exactly that
 * reason. Every listing on the site today tops out at 6 pages, so this
 * threshold currently removes the ellipsis everywhere it would otherwise
 * appear; it exists for when one eventually doesn't.
 */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const nums = Array.from(set).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export default function Pagination({
  basePath, page, totalPages, totalItems, itemLabel = "results",
}: {
  basePath: string;
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel?: string;
}) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {page > 1 && <Chip href={pageHref(basePath, page - 1)} aria-label="Previous page">‹</Chip>}
        {items.map((it, i) =>
          it === "…" ? (
            <span key={`gap-${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 38, height: 38, color: "var(--text-faint)", fontSize: 13.5 }}>…</span>
          ) : (
            <Chip key={it} href={pageHref(basePath, it)} current={it === page}>{it}</Chip>
          )
        )}
        {page < totalPages && <Chip href={pageHref(basePath, page + 1)} aria-label="Next page">›</Chip>}
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-faint)" }}>
        Page {page} of {totalPages} · {totalItems} {itemLabel}
      </p>
    </nav>
  );
}
