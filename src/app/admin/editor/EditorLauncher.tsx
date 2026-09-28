"use client";

import { useCallback, useEffect, useState } from "react";
import { label, input, chip, primary, danger } from "../creatives/AdminShell";
import { GLOBAL_SCOPE, normPath, type PageEdits } from "@/lib/page-edits";

/**
 * /admin/editor — opens any page in the visual editor, and lists every page
 * that has changes so they can be revisited or undone.
 */

const QUICK = [
  ["Home", "/"], ["Pricing", "/pricing"], ["AI apps", "/creative"], ["Prompts", "/prompts"],
  ["80s prompts", "/80s-ai-photo-prompts"], ["Free tools", "/tools"], ["Blog", "/blog"], ["Upscale", "/upscale"],
  ["Remove background", "/remove-bg"], ["Dashboard", "/app"], ["Create image", "/app/create"],
] as const;

export default function EditorLauncher() {
  const [token, setToken] = useState("");
  const [target, setTarget] = useState("");
  const [edits, setEdits] = useState<PageEdits | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { try { const t = localStorage.getItem("jpt-admin-token"); if (t) setToken(t); } catch {} }, []);

  const load = useCallback(async () => {
    if (!token.trim()) return;
    setErr("");
    const r = await fetch(`/api/admin/page-edits?token=${encodeURIComponent(token.trim())}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setErr(d.error ? `${d.error}${d.fix ? ` ${d.fix}` : ""}` : `HTTP ${r.status}`); setEdits(null); return; }
    setEdits(d as PageEdits);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const open = (raw: string) => {
    let path = raw.trim();
    if (!path) return;
    try { if (/^https?:\/\//i.test(path)) path = new URL(path).pathname; } catch { return; }
    if (!path.startsWith("/")) path = `/${path}`;
    try { localStorage.setItem("jpt-admin-token", token.trim()); } catch {}
    window.open(`${path}${path.includes("?") ? "&" : "?"}jpt_edit=1`, "_blank");
  };

  const undo = async (scope: string) => {
    if (!confirm(`Undo every change on ${scope === GLOBAL_SCOPE ? "every page (the shared ones)" : scope}?`)) return;
    await fetch(`/api/admin/page-edits?token=${encodeURIComponent(token.trim())}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset-page", scope }),
    });
    await load();
  };

  const pages = Object.entries(edits?.pages || {}).sort(([a], [b]) => (a === GLOBAL_SCOPE ? -1 : b === GLOBAL_SCOPE ? 1 : a.localeCompare(b)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 20px 90px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "10px 0 6px" }}>✏️ Page editor</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 660 }}>
          Open any page, then <strong>click any text to rewrite it</strong> or <strong>click any image to replace it</strong>.
          Save it for that page only, or for every page (for the header and footer). Changes go live within a minute, with no deploy.
        </p>

        <label style={label}>Admin token</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_IMAGE_TOKEN" style={input} />
          <button style={chip} onClick={() => { try { localStorage.setItem("jpt-admin-token", token.trim()); } catch {} void load(); }}>Load</button>
        </div>

        <label style={label}>Page to edit</label>
        <form onSubmit={(e) => { e.preventDefault(); open(target); }} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Paste a URL or path, e.g. https://www.sjpt.io/pricing" style={input} />
          <button type="submit" style={{ ...primary, padding: "10px 18px", fontSize: 14, whiteSpace: "nowrap" }} disabled={!token.trim()}>Open editor</button>
        </form>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          {QUICK.map(([l, p]) => <button key={p} style={chip} disabled={!token.trim()} onClick={() => open(p)}>{l}</button>)}
        </div>

        {err && <div style={danger}>{err}</div>}

        {edits && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
              Pages with changes
            </div>
            {pages.length === 0 && <div style={{ padding: 16, fontSize: 14, color: "var(--text-muted)" }}>Nothing changed yet.</div>}
            {pages.map(([scope, rules]) => {
              const t = Object.keys(rules.text || {}).length;
              const i = Object.keys(rules.images || {}).length;
              return (
                <div key={scope} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5 }}>{scope === GLOBAL_SCOPE ? "🌐 Every page" : normPath(scope)}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 3 }}>{t} text · {i} image{i === 1 ? "" : "s"}</div>
                  </div>
                  {scope !== GLOBAL_SCOPE && <button style={chip} onClick={() => open(scope)}>Open</button>}
                  <button style={{ ...chip, color: "var(--danger)" }} onClick={() => undo(scope)}>Undo all</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
