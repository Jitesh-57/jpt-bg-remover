"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "../_components/Icon";
import FeedCard, { useRecreate } from "../_components/FeedCard";
import type { FeedItem } from "@/lib/dashboard-feed.server";
import { LICENSE_URL } from "@/lib/prompts/types";

const PAGE = 40;

export default function CommunityFeed({ items, topics, initialTopic = "all" }: { items: FeedItem[]; topics: string[]; initialTopic?: string }) {
  const [topic, setTopic] = useState<string | "all">(initialTopic);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<FeedItem | null>(null);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () => items.filter((it) => (topic === "all" || it.useCase === topic) && (!query || `${it.title} ${it.author} ${it.model}`.toLowerCase().includes(query))),
    [items, topic, query]
  );

  useEffect(() => setShown(PAGE), [topic, query]);

  return (
    <div style={{ padding: "26px 24px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="jpt-a-up" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,2.8vw,2rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Community</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Images made by creators, with the prompts behind them. Tap Recreate to make your own.</p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, width: "min(320px, 100%)", padding: "9px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-faint)" }}>
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search images, creators, models…" aria-label="Search" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, fontFamily: "inherit" }} />
          </label>
        </div>

        <div className="jpt-tabs jpt-a-up" style={{ ["--d" as string]: "60ms", borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
          {topics.slice(0, initialTopic === "all" ? 0 : 1).map((t) => <button key={t} className="jpt-tab" data-active={topic === t} onClick={() => setTopic(t)}>{t}</button>)}
          <button className="jpt-tab" data-active={topic === "all"} onClick={() => setTopic("all")}>Trending</button>
          {topics.slice(initialTopic === "all" ? 0 : 1).map((t) => <button key={t} className="jpt-tab" data-active={topic === t} onClick={() => setTopic(t)}>{t}</button>)}
        </div>

        {filtered.length === 0 ? (
          <div className="jpt-a-pop" style={{ textAlign: "center", padding: "64px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, color: "var(--text-muted)", fontSize: 14 }}>Nothing matches that search.</div>
        ) : (
          <div key={`${topic}-${query}`} className="jpt-masonry">
            {filtered.slice(0, shown).map((it, i) => <FeedCard key={it.uid} item={it} delay={Math.min(i % PAGE, 16) * 30} onOpen={setOpen} />)}
          </div>
        )}

        {shown < filtered.length && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => setShown((s) => s + PAGE)} className="jpt-lift" style={{ padding: "11px 26px", borderRadius: 999, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
              Load more
            </button>
          </div>
        )}

      </div>

      {open && <Detail item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Detail({ item, onClose }: { item: FeedItem; onClose: () => void }) {
  const recreate = useRecreate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const copy = async () => {
    if (!item.prompt) return;
    try { await navigator.clipboard.writeText(item.prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="jpt-a-pop" style={{ width: "100%", maxWidth: 1000, maxHeight: "90vh", display: "flex", flexWrap: "wrap", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ flex: "1 1 420px", minWidth: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", maxHeight: "90vh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.title} referrerPolicy="no-referrer" style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ flex: "1 1 320px", minWidth: 0, padding: 22, display: "flex", flexDirection: "column", gap: 14, maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{item.title}</h2>
            <button onClick={onClose} aria-label="Close" className="jpt-nav-item" style={{ display: "flex", padding: 6, borderRadius: 8, border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}><Icon name="close" size={18} /></button>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            by {item.authorUrl ? <a href={item.authorUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--accent)", fontWeight: 700 }}>{item.author}</a> : <strong>{item.author}</strong>} · {item.model} · <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-faint)" }}>CC BY 4.0</a>
          </div>
          {item.prompt ? (
            <div style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)", maxHeight: 260, overflowY: "auto", whiteSpace: "pre-wrap" }}>{item.prompt}</div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>This prompt is long — open its page to read and run it.</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
            <button onClick={() => recreate(item)} className="jpt-sheen" style={{ flex: "1 1 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 16px", borderRadius: 11, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
              <Icon name="wand" size={16} /> {item.needsPhoto ? "Try with my photo" : "Recreate this"}
            </button>
            {item.prompt && (
              <button onClick={copy} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" }}>
                <Icon name="copy" size={15} /> {copied ? "Copied" : "Copy"}
              </button>
            )}
            <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
              Details <Icon name="arrowRight" size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
