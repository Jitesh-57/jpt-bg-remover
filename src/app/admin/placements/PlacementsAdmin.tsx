"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { label, input, chip, chipOn, primary, danger, success } from "../creatives/AdminShell";
import type { Placement, PlacementId } from "@/lib/placements";

/**
 * /admin/placements — choose what every prompt/community section shows.
 *
 * Pick a section and you see exactly what is live there now. Replace any item,
 * remove it, move it, or add more from the library, then Publish. "Back to
 * automatic" returns the section to the site's own pick.
 */

type Item = { uid: string; title: string; image: string | null; media: string; model: string; author: string };
type Row = Placement & { custom: boolean; live: Item[]; pinned: Item[] };

const TOKEN_KEY = "jpt-admin-token";

/** What editing starts from: the whole list for an exact section, only the pinned items for a pin section. */
const start = (r: Row): Item[] => (r.mode === "pin" ? r.pinned : r.live);
const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const small: React.CSSProperties = { ...chip, padding: "4px 9px", fontSize: 11.5 };

function Thumb({ it, h = 120 }: { it: Item; h?: number }) {
  return (
    <span style={{ position: "relative", display: "block", height: h, borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, var(--surface-2), var(--surface-3, #222))" }}>
      {it.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
      {it.media === "video" && <span style={{ position: "absolute", left: 6, top: 6, fontSize: 9.5, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.7)", borderRadius: 5, padding: "2px 6px" }}>VIDEO</span>}
    </span>
  );
}

export default function PlacementsAdmin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<PlacementId | null>(null);
  const [draft, setDraft] = useState<Item[]>([]);
  const [picking, setPicking] = useState<{ index: number | null } | null>(null); // index null = add at the end
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [more, setMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => { try { const t = localStorage.getItem(TOKEN_KEY); if (t) setToken(t); } catch {} }, []);
  const t = token.trim();

  const load = useCallback(async (keep?: PlacementId | null) => {
    if (!t) return;
    setErr("");
    const r = await fetch(`/api/admin/placements?token=${encodeURIComponent(t)}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setErr(d.error ? `${d.error}${d.fix ? ` ${d.fix}` : ""}` : `HTTP ${r.status}`); setRows(null); return; }
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    setRows(d.placements as Row[]);
    const id = keep ?? null;
    if (id) { const row = (d.placements as Row[]).find((p) => p.id === id); if (row) setDraft(start(row)); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  const row = rows?.find((r) => r.id === sel) ?? null;
  const dirty = !!row && JSON.stringify(draft.map((d) => d.uid)) !== JSON.stringify(start(row).map((d) => d.uid));
  const cap = row ? (row.mode === "pin" ? 60 : row.size) : 0;

  const open = (id: PlacementId) => {
    if (dirty && !confirm("You have unpublished changes. Leave them?")) return;
    const r = rows?.find((x) => x.id === id);
    setSel(id); setDraft(r ? start(r) : []); setPicking(null); setOk(""); setErr(""); setQ("");
  };

  // Library search for the open section.
  useEffect(() => {
    if (!picking || !sel || !t) return;
    const ctl = new AbortController();
    const h = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/admin/placements?token=${encodeURIComponent(t)}&placement=${sel}&q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const d = await r.json();
        setResults(d.results || []);
        setTotal(d.total || 0);
      } catch { /* aborted */ }
      finally { setSearching(false); }
    }, 250);
    return () => { clearTimeout(h); ctl.abort(); };
  }, [picking, sel, q, t]);

  /** Loads the next 60 of everything that fits. */
  const loadMore = async () => {
    if (!sel) return;
    setMore(true);
    try {
      const r = await fetch(`/api/admin/placements?token=${encodeURIComponent(t)}&placement=${sel}&q=${encodeURIComponent(q)}&offset=${results.length}`);
      const d = await r.json();
      setResults((cur) => [...cur, ...((d.results || []) as Item[]).filter((x) => !cur.some((c) => c.uid === x.uid))]);
      setTotal(d.total || 0);
    } finally { setMore(false); }
  };

  const choose = (it: Item) => {
    if (!picking) return;
    setDraft((d) => {
      const without = d.filter((x) => x.uid !== it.uid);
      if (picking.index === null) return [...without, it].slice(0, cap);
      const at = d[picking.index];
      const next = [...d];
      next[picking.index] = it;
      // If the chosen item was elsewhere in the list, the spot it left takes the replaced one's place.
      const dupAt = d.findIndex((x, i) => x.uid === it.uid && i !== picking.index);
      if (dupAt >= 0) next[dupAt] = at;
      return next;
    });
    setPicking(null);
  };
  const move = (i: number, by: -1 | 1) => setDraft((d) => {
    const j = i + by;
    if (j < 0 || j >= d.length) return d;
    const n = [...d];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  const save = async (uids: string[] | null) => {
    if (!row) return;
    setBusy(true); setErr(""); setOk("");
    const r = await fetch(`/api/admin/placements?token=${encodeURIComponent(t)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placement: row.id, uids }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    setOk(uids ? "Published. The page shows this now." : "Back to automatic.");
    await load(row.id);
  };

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows ?? []) m.set(r.page, [...(m.get(r.page) ?? []), r]);
    return Array.from(m.entries());
  }, [rows]);
  const inDraft = new Set(draft.map((d) => d.uid));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 16px 90px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "10px 0 6px" }}>📌 What shows where</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 720 }}>
          Pick a section to see what is live there. <strong>Replace</strong> any item, remove it, move it, or add more from the library,
          then <strong>Publish</strong>. <strong>Back to automatic</strong> returns the section to the site&apos;s own pick.
        </p>

        {!rows && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 520 }}>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token (ADMIN_IMAGE_TOKEN)" style={input} />
            <button style={chip} onClick={() => void load()}>Load</button>
          </div>
        )}
        {err && <div style={{ ...danger, marginTop: 0, marginBottom: 16 }}>{err}</div>}

        {rows && (
          <div className="jpt-blog-admin" style={{ display: "grid", gap: 18, alignItems: "start" }}>
            <aside style={{ ...card, padding: 12, position: "sticky", top: 16 }}>
              {groups.map(([page, list]) => (
                <div key={page} style={{ marginBottom: 12 }}>
                  <div style={{ ...label, margin: "4px 8px 6px" }}>{page}</div>
                  {list.map((r) => (
                    <button key={r.id} onClick={() => open(r.id)}
                      style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 10, padding: "8px 10px", background: r.id === sel ? "var(--accent-soft)" : "transparent", color: "var(--text)" }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ display: "block", fontSize: 11.5, marginTop: 2, color: r.custom ? "var(--accent-strong)" : "var(--text-faint)", fontWeight: r.custom ? 700 : 500 }}>
                        {r.kind === "app" ? "Apps · " : ""}{r.custom ? (r.mode === "pin" ? `${r.pinned.length} pinned by you` : "Chosen by you") : "Automatic"}{r.mode === "exact" ? ` · ${r.live.length} shown` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            <section style={{ minWidth: 0 }}>
              {!row && <div style={{ ...card, color: "var(--text-muted)", fontSize: 14 }}>← Pick a section.</div>}
              {row && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ ...card, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", position: "sticky", top: 16, zIndex: 5 }}>
                    <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{row.page} · {row.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 3 }}>
                        {row.mode === "pin" ? `Your picks go first, the automatic feed follows (up to ${cap})` : `Holds ${row.size}`}
                        {row.media !== "any" ? ` · ${row.media === "video" ? "videos" : "images"} only` : ""}
                        {row.textOnly ? " · prompts that run without a photo" : ""}
                      </div>
                    </div>
                    <button style={{ ...primary, padding: "10px 18px", fontSize: 14, opacity: busy || !dirty ? 0.55 : 1 }} disabled={busy || !dirty} onClick={() => void save(draft.map((d) => d.uid))}>
                      {busy ? "Publishing…" : dirty ? "Publish" : "Published"}
                    </button>
                    {dirty && <button style={chip} onClick={() => setDraft(start(row))}>Discard</button>}
                    {row.custom && <button style={chip} disabled={busy} onClick={() => { if (confirm("Go back to the automatic pick for this section?")) void save(null); }}>Back to automatic</button>}
                    <a href={row.paths[0]} target="_blank" rel="noreferrer" style={{ ...chip, textDecoration: "none" }}>View page ↗</a>
                    {ok && !dirty && <div style={{ ...success, marginTop: 0, width: "100%", padding: "8px 12px", fontSize: 13 }}>{ok}</div>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(170px, 100%), 1fr))", gap: 12 }}>
                    {draft.map((it, i) => (
                      <div key={`${it.uid}-${i}`} style={{ ...card, padding: 8, borderColor: picking?.index === i ? "var(--accent)" : "var(--border)" }}>
                        <div style={{ position: "relative" }}>
                          <Thumb it={it} />
                          <span style={{ position: "absolute", right: 6, top: 6, fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.7)", borderRadius: 5, padding: "2px 6px" }}>#{i + 1}</span>
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, margin: "7px 2px 2px", lineHeight: 1.3, height: 33, overflow: "hidden" }}>{it.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 2px 7px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.model} · {it.author}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button style={{ ...small, ...chipOn }} onClick={() => { setPicking({ index: i }); setQ(""); }}>Replace</button>
                          <button style={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier">↑</button>
                          <button style={small} disabled={i === draft.length - 1} onClick={() => move(i, 1)} aria-label="Move later">↓</button>
                          <button style={{ ...small, color: "var(--danger)" }} onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}>Remove</button>
                        </div>
                      </div>
                    ))}
                    {draft.length < cap && (
                      <button onClick={() => { setPicking({ index: null }); setQ(""); }}
                        style={{ ...card, minHeight: 200, borderStyle: "dashed", cursor: "pointer", color: "var(--text-muted)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, borderColor: picking?.index === null ? "var(--accent)" : "var(--border-strong)" }}>
                        + Add an item
                      </button>
                    )}
                  </div>

                  {picking && (
                    <div style={card}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 14 }}>{picking.index === null ? "Add from the library" : `Replace #${picking.index + 1} with…`}</strong>
                        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={row.kind === "app" ? "Search apps: headshot, ghibli, saree, product…" : "Search prompts: ghibli, product, poster, portrait…"} style={{ ...input, flex: "1 1 260px" }} />
                        <button style={chip} onClick={() => setPicking(null)}>Cancel</button>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
                        {searching ? "Searching…" : `Showing ${results.length} of ${total}${q ? ` matching “${q}”` : ` ${row.kind === "app" ? "apps" : "items that fit this section"}`}`}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))", gap: 10 }}>
                        {results.map((it) => (
                          <button key={it.uid} onClick={() => choose(it)} title={it.title}
                            style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", background: "var(--surface-2)", border: `1px solid ${inDraft.has(it.uid) ? "var(--accent-border)" : "var(--border)"}`, borderRadius: 12, padding: 6, color: "var(--text)" }}>
                            <Thumb it={it} h={100} />
                            <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginTop: 6, lineHeight: 1.3, height: 30, overflow: "hidden" }}>{it.title}</span>
                            {inDraft.has(it.uid) && <span style={{ display: "block", fontSize: 10.5, color: "var(--accent-strong)", fontWeight: 700 }}>In this section</span>}
                          </button>
                        ))}
                      </div>
                      {results.length < total && (
                        <button style={{ ...chip, display: "block", margin: "14px auto 0" }} disabled={more} onClick={() => void loadMore()}>
                          {more ? "Loading…" : `Show more (${total - results.length} more)`}
                        </button>
                      )}
                    </div>
                  )}

                  {row.mode === "pin" && (
                    <div style={{ ...card, opacity: 0.8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Then, automatically</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(110px, 100%), 1fr))", gap: 8 }}>
                        {row.live.filter((x) => !inDraft.has(x.uid)).slice(0, 12).map((it) => (
                          <div key={it.uid} title={it.title}><Thumb it={it} h={70} /><div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
