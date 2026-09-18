"use client";

import { useEffect, useMemo, useState } from "react";
import { parseTarget, type PageTarget } from "@/lib/page-target";
import CreativeUploader, { type App } from "./CreativeUploader";
import SeoEditor from "./SeoEditor";

/**
 * The admin console: one token, one target, tabs for the rest.
 *
 * A target is a *page*, not an app. It used to be an app chosen from a list,
 * which covered the 200 creative pages and left the other three hundred — the
 * tool landing pages, the prompt pages, the blog, pricing, the homepage — with
 * no way to receive an image at all. Paste a URL and that page is the target.
 *
 * Token and target live here rather than in each panel, because moving from a
 * page's creative to its text and back is the normal way to work on a page, and
 * re-typing a token or re-finding the page each time is the friction that stops
 * a tool getting used.
 */
export default function AdminShell({ apps }: { apps: App[] }) {
  const [tab, setTab] = useState<"creative" | "seo">("creative");
  const [token, setToken] = useState("");
  const [target, setTarget] = useState<PageTarget | null>(null);
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

  /** The app behind the target, when the target is a creative app page. */
  const selected = target?.slug ? apps.find((a) => a.slug === target.slug) || null : null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps.slice(0, 12);
    return apps.filter((a) => a.slug.includes(q) || a.name.toLowerCase().includes(q)).slice(0, 12);
  }, [apps, query]);

  /*
    What the box is typed into means two things at once, so both are offered
    rather than guessed at. "pricing" is a plausible app search *and* a real
    page; picking one silently would be wrong half the time.
  */
  const typedPage = useMemo(() => {
    const t = parseTarget(query);
    if (!t || t.slug) return null;
    return t;
  }, [query]);

  const choose = (t: PageTarget | null) => {
    setTarget(t);
    setQuery("");
    // Only an app page has text to edit, so the SEO tab cannot stay selected.
    if (t && !t.slug) setTab("creative");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 24px 90px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 18px" }}>Admin</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
          {([["creative", "🖼️ Creatives"], ["seo", "🔎 SEO"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...tabBtn, ...(tab === id ? tabOn : {}) }}>{l}</button>
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

        <label style={label}>Page</label>
        {target ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20 }}>{selected?.emoji ?? "🔗"}</span>
            <strong style={{ fontSize: 15 }}>{selected?.name ?? target.path}</strong>
            <code style={{ fontSize: 12, color: "var(--text-faint)" }}>{target.key}</code>
            <a href={target.path} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--accent-strong)" }}>open page ↗</a>
            <button onClick={() => choose(null)} style={linkBtn}>change</button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && typedPage) choose(typedPage); }}
              placeholder="Paste any page URL — or search the apps by name"
              /*
                A pasted URL is a decision already made, so it is taken as one.
                Anything else stays typed, and the two lists below say what it
                could mean.
              */
              onPaste={(e) => {
                const t = parseTarget(e.clipboardData.getData("text"));
                if (t) { e.preventDefault(); choose(t); }
              }}
              style={{ ...input, maxWidth: 560 }}
            />
            <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "8px 0 0", lineHeight: 1.55 }}>
              Any page on the site: <code>https://www.sjpt.io/pricing</code>, <code>/upscale</code>, <code>/blog/some-post</code>, or just <code>/</code> for the homepage.
            </p>

            {typedPage && (
              <button onClick={() => choose(typedPage)} style={{ ...chip, ...chipOn, marginTop: 12, padding: "9px 16px" }}>
                🔗 Use the page {typedPage.path}
              </button>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 26px" }}>
              {matches.map((a) => (
                <button key={a.slug} onClick={() => choose({ key: `creative/${a.slug}`, path: `/creative/${a.slug}`, slug: a.slug })} style={chip}>
                  {a.emoji} {a.name}
                </button>
              ))}
              {!matches.length && !typedPage && (
                <span style={{ fontSize: 13, color: "var(--text-faint)" }}>No app matches “{query}”, and that is not a page path either.</span>
              )}
            </div>
          </>
        )}

        {target && tab === "creative" && <CreativeUploader target={target} token={token} />}
        {target && tab === "seo" && (selected ? (
          <SeoEditor app={selected} token={token} />
        ) : (
          <p style={{ fontSize: 13.5, color: "var(--text-faint)", lineHeight: 1.6, maxWidth: 620 }}>
            Text editing is wired up for the creative app pages only — their copy all comes from one place, so the boxes
            can be filled with what the page actually says. <strong style={{ color: "var(--text)" }}>{target.path}</strong>{" "}
            writes its own copy, so there is nothing here to prefill yet. Images work on it: the Creatives tab.
          </p>
        ))}
        {!target && <p style={{ fontSize: 13.5, color: "var(--text-faint)" }}>Pick a page to start.</p>}
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
