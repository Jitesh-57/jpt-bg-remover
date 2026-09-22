"use client";

import { useMemo, useState } from "react";
import ToolCard from "./ToolCard";
import { UTILITY_TOOLS, aiCategories, categoryMeta, type CategoryId, type DashboardTool } from "@/lib/dashboard-catalog";

type Filter = "all" | CategoryId;

function matches(q: string, t: DashboardTool): boolean {
  if (!q) return true;
  const hay = `${t.name} ${t.blurb}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
}

/** The full catalog browser — used both at /app/tools (all categories) and /app/tools/[category] (one pinned). */
export default function ToolsBrowser({ initialCategory = "all" }: { initialCategory?: Filter }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [sort, setSort] = useState<"catalog" | "az">("catalog");
  const [freeOnly, setFreeOnly] = useState(initialCategory === "utility");
  const [creditOnly, setCreditOnly] = useState(false);

  const categories = aiCategories();
  const all: DashboardTool[] = useMemo(() => [...UTILITY_TOOLS, ...categories.flatMap((c) => c.tools)], [categories]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? all : filter === "utility" ? UTILITY_TOOLS : (categories.find((c) => c.id === filter)?.tools ?? []);
    if (freeOnly) list = list.filter((t) => t.credits === 0);
    if (creditOnly) list = list.filter((t) => t.credits > 0);
    if (q.trim()) list = list.filter((t) => matches(q.trim().toLowerCase(), t));
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [all, categories, filter, freeOnly, creditOnly, q, sort]);

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem,2.6vw,1.8rem)", fontWeight: 900, margin: "0 0 4px", color: "var(--text)" }}>
          {filter === "all" ? "All tools" : categoryMeta(filter).label}
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 20px" }}>
          {filter === "all" ? categoryMeta("utility").blurb : categoryMeta(filter).blurb}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${filtered.length} tools…`}
            style={{ flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)", fontSize: 14, fontFamily: "inherit" }}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as "catalog" | "az")} style={selectStyle}>
            <option value="catalog">Popular order</option>
            <option value="az">A–Z</option>
          </select>
          <label style={toggleStyle}><input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Free only</label>
          <label style={toggleStyle}><input type="checkbox" checked={creditOnly} onChange={(e) => setCreditOnly(e.target.checked)} /> Credit tools</label>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 20 }}>
          <button onClick={() => setFilter("all")} style={chip(filter === "all")}>All</button>
          <button onClick={() => setFilter("utility")} style={chip(filter === "utility")}>🧰 Free tools</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setFilter(c.id)} style={chip(filter === c.id)}>{c.emoji} {c.label} <span style={{ opacity: 0.6 }}>({c.tools.length})</span></button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text-muted)" }}>
            Nothing matches that.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
            {filtered.map((t) => <ToolCard key={t.slug} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function chip(on: boolean): React.CSSProperties {
  return {
    flexShrink: 0, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
    padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
    background: on ? "var(--accent-soft)" : "var(--surface-2)",
    color: on ? "var(--accent-strong)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
  };
}

const selectStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border-strong)",
  color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer",
};

const toggleStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap",
};
