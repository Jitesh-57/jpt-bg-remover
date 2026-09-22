"use client";

import { useCallback, useEffect, useState } from "react";

interface GenItem {
  id: string;
  tool: string;
  category: "generation" | "edit";
  label: string;
  thumb: string;
  imageUrl?: string;
  timestamp: number;
  originalName?: string;
}

const TOOL_META: Record<string, { icon: string; label: string }> = {
  "headshot": { icon: "🎯", label: "Headshot" },
  "headshot-edit": { icon: "✏️", label: "Headshot Edit" },
  "generate-bg": { icon: "🌅", label: "Generate BG" },
  "ai-background": { icon: "🌄", label: "AI Background" },
  "upscale": { icon: "🔍", label: "Upscale" },
  "ai-edit": { icon: "✨", label: "AI Edit" },
  "remove-bg": { icon: "✂️", label: "Remove BG" },
  "resize": { icon: "↔️", label: "Resize" },
  "adjust": { icon: "🎨", label: "Adjust" },
  "creative": { icon: "🪄", label: "Creative App" },
};
const metaFor = (tool: string) => TOOL_META[tool] ?? { icon: "🖼️", label: tool };

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function loadLocalGens(): GenItem[] {
  try { const raw = localStorage.getItem("jpt_gens_v1"); return raw ? (JSON.parse(raw) as GenItem[]) : []; } catch { return []; }
}
function removeLocalGen(id: string) {
  try {
    const raw = localStorage.getItem("jpt_gens_v1");
    if (raw) localStorage.setItem("jpt_gens_v1", JSON.stringify((JSON.parse(raw) as GenItem[]).filter((i) => i.id !== id)));
    localStorage.removeItem(`jpt_img_${id}`);
  } catch { /* silent */ }
}
function mergeItems(server: GenItem[], local: GenItem[]): GenItem[] {
  const ids = new Set(server.map((i) => i.id));
  return [...server, ...local.filter((i) => !ids.has(i.id))].sort((a, b) => b.timestamp - a.timestamp).slice(0, 40);
}

type Tab = "all" | "generation" | "edit";

export default function LibraryPage() {
  const [items, setItems] = useState<GenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [preview, setPreview] = useState<GenItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const local = loadLocalGens();
    if (local.length > 0) { setItems(local); setLoading(false); }
    try {
      const r = await fetch("/api/generations/list");
      const d = (await r.json()) as { items?: GenItem[] };
      if (d.items) setItems(mergeItems(d.items, local));
    } catch { /* local items still shown */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this creation? This can't be undone.")) return;
    setDeleting(id);
    removeLocalGen(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setPreview(null);
    try { await fetch("/api/generations/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); } catch {}
    setDeleting(null);
  };

  const filtered = items.filter((i) => tab === "all" || (i.category || "edit") === tab);
  const counts = { all: items.length, generation: items.filter((i) => i.category === "generation").length, edit: items.filter((i) => (i.category || "edit") === "edit").length };

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem,2.6vw,1.8rem)", fontWeight: 900, margin: "0 0 20px", color: "var(--text)" }}>My Creations</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {([["all", "All"], ["generation", "Generations"], ["edit", "Edits"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              cursor: "pointer", fontFamily: "inherit", padding: "8px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 700,
              background: tab === id ? "var(--accent-soft)" : "var(--surface-2)", color: tab === id ? "var(--accent-strong)" : "var(--text-muted)",
              border: `1px solid ${tab === id ? "var(--accent-border)" : "var(--border)"}`,
            }}>
              {label} <span style={{ opacity: 0.6 }}>({counts[id]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ aspectRatio: "4 / 5", borderRadius: 14, background: "var(--surface-2)" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🖼️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No creations yet</div>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 18px" }}>Pick a tool and your results will appear here.</p>
            <a href="/app/apps" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 999, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 13.5, textDecoration: "none" }}>Browse AI apps</a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
            {filtered.map((item) => {
              const meta = metaFor(item.tool);
              const src = item.imageUrl || item.thumb;
              return (
                <button key={item.id} onClick={() => setPreview(item)} className="jpt-hover" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 16, overflow: "hidden", fontFamily: "inherit", opacity: deleting === item.id ? 0.4 : 1 }}>
                  <div style={{ aspectRatio: "4 / 5", background: "var(--surface-2)" }}>
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.icon} {item.label || meta.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>{timeAgo(item.timestamp)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: "100%", background: "var(--surface)", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)" }}>
            <div style={{ background: "var(--surface-2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.imageUrl || preview.thumb} alt={preview.label} style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", display: "block" }} />
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{metaFor(preview.tool).icon} {preview.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 4 }}>{timeAgo(preview.timestamp)}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <a href={preview.imageUrl || preview.thumb} download={`${preview.tool}.png`} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 11, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 13.5, textDecoration: "none" }}>⬇ Download</a>
                <button onClick={() => handleDelete(preview.id)} style={{ padding: "11px 18px", borderRadius: 11, background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)", fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
