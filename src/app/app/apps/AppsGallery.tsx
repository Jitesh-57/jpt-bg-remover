"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "../_components/Icon";
import { AppTile } from "../_components/AppCard";
import type { AppCardData } from "@/lib/dashboard-feed.server";
import type { DashboardTool } from "@/lib/dashboard-catalog";
import type { AppCat } from "@/lib/app-catalog";

type Tab = "apps" | "tools";
interface Cat { id: AppCat; label: string; emoji: string; count: number }

const PAGE = 24;

export default function AppsGallery({ apps, categories, tools }: { apps: AppCardData[]; categories: Cat[]; tools: DashboardTool[] }) {
  const [tab, setTab] = useState<Tab>("apps");
  const [cat, setCat] = useState<AppCat | "all">("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tab") === "tools") setTab("tools");
    const c = p.get("cat");
    if (c && categories.some((x) => x.id === c)) setCat(c as AppCat);
  }, [categories]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (tab === "tools") p.set("tab", "tools");
    if (tab === "apps" && cat !== "all") p.set("cat", cat);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    setShown(PAGE);
  }, [tab, cat]);

  const query = q.trim().toLowerCase();
  const filteredApps = useMemo(
    () => apps.filter((a) => (cat === "all" || a.category === cat) && (!query || `${a.name} ${a.blurb}`.toLowerCase().includes(query))),
    [apps, cat, query]
  );
  const filteredTools = useMemo(
    () => tools.filter((t) => !query || `${t.name} ${t.blurb}`.toLowerCase().includes(query)),
    [tools, query]
  );

  return (
    <div style={{ padding: "26px 24px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="jpt-a-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,2.8vw,2rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>AI Apps</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Upload a photo, pick an app, get the result. No prompt needed.</p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, width: "min(320px, 100%)", padding: "9px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder={tab === "apps" ? "Search 200+ apps…" : "Search tools…"} aria-label="Search" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, fontFamily: "inherit" }} />
            {q && <button onClick={() => setQ("")} aria-label="Clear search" style={{ display: "flex", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 0 }}><Icon name="close" size={15} /></button>}
          </label>
        </div>

        <div className="jpt-a-up" style={{ ["--d" as string]: "50ms", display: "inline-flex", gap: 4, padding: 4, borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 14 }}>
          {([["apps", "AI Apps", apps.length], ["tools", "Photo Tools", tools.length]] as [Tab, string, number][]).map(([id, label, n]) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 18px", borderRadius: 999, border: on ? "1px solid var(--accent-border)" : "1px solid transparent", background: on ? "var(--accent-soft)" : "transparent", color: on ? "var(--accent)" : "var(--text-muted)", fontWeight: 700, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", transition: "all .18s ease" }}>
                {label} <span style={{ opacity: 0.6, fontWeight: 600 }}>{n}</span>
                {id === "tools" && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "var(--success)", background: "var(--success-soft)", borderRadius: 999, padding: "2px 6px" }}>FREE</span>}
              </button>
            );
          })}
        </div>

        {tab === "apps" && (
          <>
            <div className="jpt-tabs jpt-a-up" style={{ ["--d" as string]: "90ms", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
              <button className="jpt-tab" data-active={cat === "all"} onClick={() => setCat("all")}>All</button>
              {categories.map((c) => (
                <button key={c.id} className="jpt-tab" data-active={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.label} <span style={{ opacity: 0.5, fontSize: 12.5 }}>{c.count}</span>
                </button>
              ))}
            </div>

            {filteredApps.length === 0 ? (
              <Empty text={`No apps match "${q}".`} />
            ) : (
              <>
                <div key={`${cat}-${query}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(190px, 100%), 1fr))", gap: 14 }}>
                  {filteredApps.slice(0, shown).map((a, i) => <AppTile key={a.slug} a={a} delay={Math.min(i % PAGE, 16) * 30} eager={i < 8} />)}
                </div>
                {shown < filteredApps.length && (
                  <div style={{ textAlign: "center", marginTop: 26 }}>
                    <button onClick={() => setShown((s) => s + PAGE)} className="jpt-lift" style={{ padding: "11px 26px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                      Show more <span style={{ color: "var(--text-faint)" }}>({filteredApps.length - shown} left)</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "tools" && (
          filteredTools.length === 0 ? <Empty text={`No tools match "${q}".`} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12, marginTop: 6 }}>
              {filteredTools.map((t, i) => (
                <Link key={t.slug} href={t.href} className="jpt-lift jpt-a-up" style={{ ["--d" as string]: `${i * 30}ms`, display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{t.emoji}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.blurb}</span>
                  </span>
                  <Icon name="chevronRight" size={16} style={{ color: "var(--text-faint)" }} />
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="jpt-a-pop" style={{ textAlign: "center", padding: "64px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text-muted)", fontSize: 14 }}>
      <Icon name="search" size={26} style={{ color: "var(--text-faint)", marginBottom: 10 }} />
      <div>{text}</div>
    </div>
  );
}
