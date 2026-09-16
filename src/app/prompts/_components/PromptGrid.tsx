"use client";

import { useEffect, useMemo, useState } from "react";
import PromptCard from "./PromptCard";
import type { PromptCardData } from "@/lib/prompts/types";

/**
 * A filterable grid over a page's cards.
 *
 * Everything runs in the browser over the cards already rendered into the
 * page: at this size it is instant, needs no API, and the filter state is a
 * shareable URL. The full dataset never reaches the client — only the cards
 * the server chose for this page.
 */

/**
 * A filter is data, never a callback.
 *
 * This component is a client boundary, and a server component cannot hand a
 * function across it — Next fails the export with a serialization error, which
 * is exactly how the model pages broke the first time. Describing the match
 * declaratively keeps the whole thing serialisable.
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
  filters = [],
  pageSize = 24,
  showSearch = true,
  showSort = true,
  emptyNote = "Nothing matches that.",
}: {
  cards: PromptCardData[];
  filters?: GridFilter[];
  pageSize?: number;
  showSearch?: boolean;
  showSort?: boolean;
  emptyNote?: string;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("all");
  const [sort, setSort] = useState<Sort>("hot");
  const [shown, setShown] = useState(pageSize);

  const results = useMemo(() => {
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
    // "hot" is the order the server sent, which is already hotScore order.
    return out;
  }, [cards, filters, active, q, sort]);

  useEffect(() => { setShown(pageSize); }, [q, active, sort, pageSize]);

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
              aria-label="Search these prompts"
              placeholder={`Search ${cards.length} prompts…`}
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
        {results.length === cards.length ? `${cards.length} prompts` : `${results.length} of ${cards.length} prompts`}
      </div>

      {results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text-muted)", fontSize: 14.5 }}>
          {emptyNote}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(270px, 100%), 1fr))", gap: 16 }}>
            {results.slice(0, shown).map((p) => <PromptCard key={p.uid} p={p} />)}
          </div>
          {shown < results.length && (
            <div style={{ textAlign: "center", marginTop: 26 }}>
              <button
                onClick={() => setShown((n) => n + pageSize)}
                style={{
                  cursor: "pointer", fontFamily: "inherit", padding: "12px 24px", borderRadius: 999,
                  background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)",
                  fontWeight: 800, fontSize: 14,
                }}
              >
                Show {Math.min(pageSize, results.length - shown)} more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
