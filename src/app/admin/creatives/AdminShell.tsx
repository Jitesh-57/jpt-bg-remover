"use client";

import { useEffect, useState } from "react";
import CreativeUploader, { type App } from "./CreativeUploader";
import SeoEditor from "./SeoEditor";

/**
 * The admin console: one token, one app picker, tabs for the rest.
 *
 * Token and chosen app live here rather than in each panel, because moving
 * from a page's creative to its SEO copy and back is the normal way to work
 * on a page — and re-typing a token or re-finding the app each time is the
 * friction that stops a tool getting used.
 */
export default function AdminShell({ apps }: { apps: App[] }) {
  const [tab, setTab] = useState<"creative" | "seo">("creative");
  const [token, setToken] = useState("");
  const [slug, setSlug] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const t = localStorage.getItem("jpt-admin-token");
      if (t) setToken(t);
    } catch { /* blocked storage — typing it each time still works */ }
  }, []);

  const saveToken = (t: string) => {
    setToken(t);
    try { localStorage.setItem("jpt-admin-token", t.trim()); } catch { /* fine */ }
  };

  const selected = apps.find((a) => a.slug === slug) || null;
  const matches = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps.slice(0, 12);
    return apps.filter((a) => a.slug.includes(q) || a.name.toLowerCase().includes(q)).slice(0, 12);
  })();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 24px 90px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 18px" }}>Admin</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
          {([["creative", "🖼️ Creatives"], ["seo", "🔎 SEO"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabOn : {}) }}>{label}</button>
          ))}
        </div>

        <label style={label}>Admin token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          placeholder="ADMIN_IMAGE_TOKEN"
          style={{ ...input, maxWidth: 420, marginBottom: 22 }}
        />

        <label style={label}>App</label>
        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20 }}>{selected.emoji}</span>
            <strong style={{ fontSize: 15 }}>{selected.name}</strong>
            <code style={{ fontSize: 12, color: "var(--text-faint)" }}>{selected.slug}</code>
            <a href={`/creative/${selected.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--accent-strong)" }}>open page ↗</a>
            <button onClick={() => setSlug("")} style={linkBtn}>change</button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${apps.length} apps — name or slug, or paste a /creative/… URL`}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                const m = /\/creative\/([a-z0-9-]+)/.exec(t);
                if (m && apps.some((a) => a.slug === m[1])) { e.preventDefault(); setSlug(m[1]); setQuery(""); }
              }}
              style={{ ...input, maxWidth: 520 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 26px" }}>
              {matches.map((a) => (
                <button key={a.slug} onClick={() => setSlug(a.slug)} style={chip}>{a.emoji} {a.name}</button>
              ))}
              {!matches.length && <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Nothing matches “{query}”.</span>}
            </div>
          </>
        )}

        {slug && tab === "creative" && <CreativeUploader apps={apps} slug={slug} token={token} />}
        {slug && tab === "seo" && selected && <SeoEditor app={selected} token={token} />}
        {!slug && <p style={{ fontSize: 13.5, color: "var(--text-faint)" }}>Pick an app to start.</p>}
      </div>
    </div>
  );
}

export const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 7 };
export const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, fontFamily: "inherit", fontSize: 14, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)" };
export const chip: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "7px 12px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)" };
export const chipOn: React.CSSProperties = { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-strong)" };
export const linkBtn: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", background: "none", border: "none", padding: 0, fontSize: 12.5, fontWeight: 700, color: "var(--accent-strong)", textDecoration: "underline" };
export const primary: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 12, padding: "13px 22px", fontSize: 15, fontWeight: 800, background: "var(--grad-strong)", color: "#fff", boxShadow: "var(--glow)" };
export const danger: React.CSSProperties = { marginTop: 18, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.55 };
export const success: React.CSSProperties = { marginTop: 18, background: "var(--success-soft)", color: "var(--success)", borderRadius: 10, padding: "12px 15px", fontSize: 14, fontWeight: 700, lineHeight: 1.5 };
const tabBtn: React.CSSProperties = { ...chip, padding: "9px 18px", fontSize: 14 };
const tabOn: React.CSSProperties = { ...chipOn, fontWeight: 800 };
