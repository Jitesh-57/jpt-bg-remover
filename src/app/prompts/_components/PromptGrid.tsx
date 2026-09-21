"use client";

import { useEffect, useMemo, useState } from "react";
import PromptCard from "./PromptCard";
import Pagination from "./Pagination";
import type { PromptCardData } from "@/lib/prompts/types";

/**
 * A listing of cards: crawlable by default, filterable once someone touches it.
 *
 * Two different things were being asked of one piece of client state.
 * "Show more" grew the number of cards mounted in the browser, which is a fine
 * answer to "don't render 850 DOM nodes at once" and a bad answer to "let a
 * crawler reach card 49" — the button has no href, so a request for this page
 * with JavaScript off, which is what a crawler's fetch is, only ever sees the
 * first `pageSize`. That gap is why roughly a thousand pages sat in Search
 * Console as "discovered — currently not indexed": found via the sitemap,
 * never reached by a link.
 *
 * So there are two rendering modes, and which one is showing depends on
 * whether anyone has touched the controls:
 *
 *   default   — untouched search/filter/sort. Shows exactly the slice the
 *               server put on this URL (`page`, out of `basePath`), with real
 *               `<a href>` pagination below it. This is what a fresh request
 *               for `?page=N` renders, with or without JavaScript, which is
 *               the thing `curl` and a crawler both see.
 *   filtered  — the moment a search term, a chip or a sort order is touched.
 *               Runs over the full set already sitting in this client
 *               component's props (unchanged from before — filtering an array
 *               already in memory needs no request) with the old "Show more"
 *               button. Filtered results have no stable URL of their own and
 *               were never the thing that needed to be crawlable; the
 *               unfiltered pages already cover every card at least once.
 */

export interface GridFilter {
  id: string;
  label: string;
  match?: { useCase?: string; hasVariables?: true };
}

function matches(p: PromptCardData, f: GridFilter): boolean {
  if (!f.match) return true;
  if (f.match.useCase && p.useCase !== f.match.useCase) return false;
  if (f.match.hasVariables && !p.hasVariables) return false;
  return true;
}

type Sort = "hot" | "new" | "az";

const SORTS: { id: Sort; label: string }[] = [
  { id: "hot", label: "Hottest" },
  { id: "new", label: "Newest" },
  { id: "az", label: "A–Z" },
];

export default function PromptGrid({
  cards,
  page = 1,
  pageSize = 48,
  basePath,
  itemLabel = "prompts",
  filters = [],
  showSearch = true,
  showSort = true,
  emptyNote = "Nothing matches that.",
}: {
  /** The full, unfiltered set — already shipped to this client component so
   *  the search/filter/sort below can run without another request. */
  cards: PromptCardData[];
  /** Which server-computed page this request is for. Ignored once a filter,
   *  search or sort other than the default is touched. */
  page?: number;
  pageSize?: number;
  /** The path pagination links are built from, e.g. "/nano-banana-pro-prompts". */
  basePath: string;
  itemLabel?: string;
  filters?: GridFilter[];
  showSearch?: boolean;
  showSort?: boolean;
  emptyNote?: string;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("all");
  const [sort, setSort] = useState<Sort>("hot");
  const [shown, setShown] = useState(pageSize);

  const touched = q.trim() !== "" || active !== "all" || sort !== "hot";

  const filtered = useMemo(() => {
    if (!touched) return cards;
    let out = cards;
    const f = filters.find((x) => x.id === active);
    if (f?.match) out = out.filter((p) => matches(p, f));
    const query = q.trim().toLowerCase();
    if (query) {
      const terms = query.split(/\s+/);
      out = out.filter((p) => {
        const hay = `${p.title} ${p.excerpt} ${p.model} ${p.authorName}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    if (sort === "new") {
      out = [...out].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    } else if (sort === "az") {
      out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    }
    return out;
  }, [cards, touched, filters, active, q, sort]);

  useEffect(() => { setShown(pageSize); }, [q, active, sort, pageSize]);

  // Default mode: the server's slice for this page. Filtered mode: everything
  // that matches, grown by "Show more" — there is no page N of a search.
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));
  const visible = touched ? filtered.slice(0, shown) : cards.slice((page - 1) * pageSize, page * pageSize);
  const resultCount = touched ? filtered.length : cards.length;

  const chip = (on: boolean): React.CSSProperties => ({
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 700,
    background: on ? "var(--accent-soft)" : "var(--surface)",
    color: on ? "var(--accent-strong)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
  });

  return (
    <div>
      {(showSearch || filters.length > 0 || showSort) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {showSearch && (
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={`Search these ${itemLabel}`}
              placeholder={`Search ${cards.length} ${itemLabel}…`}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 11, fontFamily: "inherit",
                fontSize: 14.5, fontWeight: 600, background: "var(--surface)", color: "var(--text)",
                border: "1px solid var(--border-strong)",
              }}
            />
          )}

          {(filters.length > 0 || showSort) && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 7, overflowX: "auto", flex: 1, minWidth: 0, paddingBottom: 2 }}>
                {filters.map((f) => (
                  <button key={f.id} onClick={() => setActive(f.id)} aria-pressed={active === f.id} style={chip(active === f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              {showSort && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sort</span>
                  {SORTS.map((s) => (
                    <button key={s.id} onClick={() => setSort(s.id)} aria-pressed={sort === s.id} style={chip(sort === s.id)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, marginBottom: 14 }}>
        {touched && resultCount !== cards.length ? `${resultCount} of ${cards.length} ${itemLabel}` : `${cards.length} ${itemLabel}`}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text-muted)", fontSize: 14.5 }}>
          {emptyNote}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(270px, 100%), 1fr))", gap: 16 }}>
            {visible.map((p) => <PromptCard key={p.uid} p={p} />)}
          </div>

          {touched ? (
            shown < filtered.length && (
              <div style={{ textAlign: "center", marginTop: 26 }}>
                <button
                  onClick={() => setShown((n) => n + pageSize)}
                  style={{
                    cursor: "pointer", fontFamily: "inherit", padding: "12px 24px", borderRadius: 999,
                    background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)",
                    fontWeight: 800, fontSize: 14,
                  }}
                >
                  Show {Math.min(pageSize, filtered.length - shown)} more
                </button>
              </div>
            )
          ) : (
            <Pagination basePath={basePath} page={page} totalPages={totalPages} totalItems={cards.length} itemLabel={itemLabel} />
          )}
        </>
      )}
    </div>
  );
}
