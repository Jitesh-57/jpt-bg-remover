"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GenItem {
  id: string;
  tool: string;
  category: "generation" | "edit";
  label: string;
  thumb: string;
  imageUrl?: string;  // hosted URL — full quality (reserved for future CDN support)
  timestamp: number;
  originalName?: string;
}

const TOOL_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  "headshot":      { icon: "🎯", color: "#EC4899", bg: "#FDF2F8", label: "Headshot" },
  "headshot-edit": { icon: "✏️", color: "#F97316", bg: "#FFF7ED", label: "Headshot Edit" },
  "generate-bg":   { icon: "🌅", color: "#F59E0B", bg: "#FFFBEB", label: "Generate BG" },
  "ai-background": { icon: "🌄", color: "#F97316", bg: "#FFF7ED", label: "AI Background" },
  "upscale":       { icon: "🔍", color: "#6366F1", bg: "#EEF2FF", label: "Upscale" },
  "ai-edit":       { icon: "✨", color: "#8B5CF6", bg: "#F5F3FF", label: "AI Edit" },
  "remove-bg":     { icon: "✂️", color: "#10B981", bg: "#ECFDF5", label: "Remove BG" },
  "resize":        { icon: "↔️", color: "#06B6D4", bg: "#ECFEFF", label: "Resize" },
  "adjust":        { icon: "🎨", color: "#EC4899", bg: "#FDF2F8", label: "Adjust" },
};

function getToolMeta(tool: string) {
  return TOOL_META[tool] ?? { icon: "🖼️", color: "#6B7280", bg: "#F3F4F6", label: tool };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function getLocalImage(id: string): string | null {
  try { return localStorage.getItem(`jpt_img_${id}`); } catch { return null; }
}

// Best image src: hosted URL > localStorage > EC thumb
function bestSrc(item: GenItem): string {
  if (item.imageUrl) return item.imageUrl;
  const local = getLocalImage(item.id);
  if (local) return local;
  return item.thumb;
}

function isFullQuality(item: GenItem): boolean {
  if (item.imageUrl) return true;
  return !!getLocalImage(item.id);
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  item, onClose, onOpenInEditor, onDelete,
}: {
  item: GenItem;
  onClose: () => void;
  onOpenInEditor: (item: GenItem) => void;
  onDelete: (id: string) => void;
}) {
  const meta = getToolMeta(item.tool);
  const src = bestSrc(item);
  const full = isFullQuality(item);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      if (item.imageUrl) {
        const res = await fetch(item.imageUrl);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `jpt-ai-${item.tool}-${item.id}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      } else {
        const a = document.createElement("a");
        a.href = src;
        a.download = `jpt-ai-${item.tool}-${item.id}.jpg`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch { window.open(src, "_blank"); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 780, width: "100%",
          maxHeight: "calc(100vh - 32px)",
          display: "flex", flexDirection: "column",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {/* Close button — floating top-right */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%", width: 36, height: 36,
            cursor: "pointer", fontSize: 14, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700,
          }}
        >✕</button>

        {/* Image area — dark bg, image fills naturally */}
        <div style={{
          background: "linear-gradient(145deg, #111118, #0a0a12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexGrow: 1, overflow: "hidden",
          minHeight: 320,
          position: "relative",
        }}>
          {/* Subtle blurred bg copy for visual depth */}
          <img
            src={src} alt=""
            aria-hidden
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", filter: "blur(40px) brightness(0.25) saturate(1.5)",
              transform: "scale(1.1)",
            }}
          />
          <img
            src={src}
            alt={item.label}
            style={{
              position: "relative", zIndex: 1,
              maxWidth: "100%",
              maxHeight: "62vh",
              minHeight: 200,
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              display: "block",
            }}
          />
        </div>

        {/* Bottom bar — glass dark */}
        <div style={{
          background: "rgba(10,10,18,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 18px",
          flexShrink: 0,
        }}>
          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `${meta.color}22`, border: `1px solid ${meta.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
            }}>
              {meta.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label || "Image"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                <span>·</span>
                <span>{timeAgo(item.timestamp)}</span>
                {full
                  ? <span style={{ color: "#34D399", fontWeight: 700 }}>✓ Full Quality</span>
                  : <span style={{ color: "#F59E0B" }}>⚠ Low-res preview</span>
                }
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onOpenInEditor(item)}
              style={{
                flex: 2, padding: "11px 16px",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff", border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
              }}
            >
              🖼️ Open in AI Editor
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1, padding: "11px 12px",
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              ⬇ Download
            </button>
            <button
              onClick={() => { onClose(); onDelete(item.id); }}
              style={{
                padding: "11px 14px",
                background: "rgba(239,68,68,0.12)", color: "#F87171",
                border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12,
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function ItemCard({
  item, onPreview, onOpenInEditor, onDelete, deleting,
}: {
  item: GenItem;
  onPreview: (item: GenItem) => void;
  onOpenInEditor: (item: GenItem) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const meta = getToolMeta(item.tool);
  const [cardImg, setCardImg] = useState<string>(() => bestSrc(item));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // If no hosted URL, upgrade to localStorage 900px image if available
    if (!item.imageUrl) {
      const local = getLocalImage(item.id);
      if (local) setCardImg(local);
    }
  }, [item.id, item.imageUrl]);

  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, overflow: "hidden",
        boxShadow: isHovered ? "0 10px 30px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #E5E7EB",
        opacity: deleting ? 0.4 : 1,
        transform: isHovered ? "translateY(-3px)" : "none",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div
        onClick={() => onPreview(item)}
        style={{ position: "relative", aspectRatio: "4/3", background: "#111", overflow: "hidden", cursor: "pointer" }}
      >
        {/* Blurred bg fill for letterboxed images */}
        {cardImg && <img src={cardImg} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(0.4) saturate(1.3)", transform: "scale(1.1)" }} />}
        {cardImg ? (
          <img
            src={cardImg}
            alt={item.label}
            style={{
              position: "relative", zIndex: 1,
              width: "100%", height: "100%", objectFit: "contain",
              transform: isHovered ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.25s ease",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{meta.icon}</div>
        )}

        {/* View overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: isHovered ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.18s", pointerEvents: "none",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.95)", borderRadius: 30,
            padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#111",
            opacity: isHovered ? 1 : 0, transition: "opacity 0.18s",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            🔍 View
          </div>
        </div>

        {/* Tool badge */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: "rgba(255,255,255,0.92)", color: meta.color,
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
          display: "flex", alignItems: "center", gap: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        }}>
          {meta.icon} {meta.label}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "11px 12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
          {item.label || item.originalName || "Image"}
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>{timeAgo(item.timestamp)}</div>

        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={() => onOpenInEditor(item)}
            style={{
              flex: 1, padding: "7px 4px", fontSize: 11, fontWeight: 700,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff", border: "none", borderRadius: 7, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            🖼️ Edit
          </button>
          <button
            onClick={async () => {
              try {
                if (item.imageUrl) {
                  const res = await fetch(item.imageUrl);
                  const blob = await res.blob();
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `jpt-ai-${item.tool}-${item.id}.jpg`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
                } else {
                  const src = getLocalImage(item.id) || item.thumb;
                  const a = document.createElement("a");
                  a.href = src; a.download = `jpt-ai-${item.tool}-${item.id}.jpg`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }
              } catch { if (item.imageUrl) window.open(item.imageUrl, "_blank"); }
            }}
            style={{ flex: 1, padding: "7px 4px", fontSize: 11, fontWeight: 700, background: "#EEF2FF", color: "#6366F1", border: "none", borderRadius: 7, cursor: "pointer" }}
          >
            ⬇ Save
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            style={{ padding: "7px 10px", fontSize: 12, background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 7, cursor: deleting ? "not-allowed" : "pointer" }}
          >
            {deleting ? "…" : "🗑"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────

function Section({
  title, subtitle, icon, accentColor, items,
  onPreview, onOpenInEditor, onDelete, deleting, emptyMsg,
}: {
  title: string; subtitle: string; icon: string; accentColor: string;
  items: GenItem[];
  onPreview: (item: GenItem) => void;
  onOpenInEditor: (item: GenItem) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
  emptyMsg: string;
}) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, paddingBottom: 16, borderBottom: `2px solid ${accentColor}25` }}>
        <div style={{ width: 44, height: 44, background: `${accentColor}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#111" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>{subtitle}</p>
        </div>
        <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 20 }}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ background: "#F9FAFB", border: "2px dashed #E5E7EB", borderRadius: 12, padding: "44px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
          <p style={{ margin: 0, color: "#9CA3AF", fontSize: 14 }}>{emptyMsg}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
          {items.map(item => (
            <ItemCard
              key={item.id} item={item}
              onPreview={onPreview} onOpenInEditor={onOpenInEditor}
              onDelete={onDelete} deleting={deleting === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadLocalGens(): GenItem[] {
  try {
    const raw = localStorage.getItem("jpt_gens_v1");
    return raw ? (JSON.parse(raw) as GenItem[]) : [];
  } catch { return []; }
}

function removeLocalGen(id: string) {
  try {
    const raw = localStorage.getItem("jpt_gens_v1");
    if (!raw) return;
    const items = JSON.parse(raw) as GenItem[];
    localStorage.setItem("jpt_gens_v1", JSON.stringify(items.filter(i => i.id !== id)));
    localStorage.removeItem(`jpt_img_${id}`);
  } catch { /* silent */ }
}

function mergeItems(ecItems: GenItem[], localItems: GenItem[]): GenItem[] {
  const ecIds = new Set(ecItems.map(i => i.id));
  // Prefer EC items (cross-device); add local-only items that aren't in EC
  const merged = [...ecItems, ...localItems.filter(i => !ecIds.has(i.id))];
  return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 40);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GenerationsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<GenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(true);
  const [previewItem, setPreviewItem] = useState<GenItem | null>(null);
  const [openingEditor, setOpeningEditor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    // 1. Load localStorage items immediately (always works, no auth needed)
    const localItems = loadLocalGens();
    if (localItems.length > 0) {
      setItems(localItems);
      setLoading(false);
    }

    // 2. Also try EC (for cross-device sync) — merge with local
    try {
      const r = await fetch("/api/generations/list");
      if (r.status === 401) {
        if (localItems.length === 0) setAuthenticated(false);
        setLoading(false);
        return;
      }
      const d = await r.json() as { items?: GenItem[]; error?: string };
      if (d.items) {
        setItems(mergeItems(d.items, localItems));
      }
    } catch { /* EC unavailable — use localStorage items */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this generation? This can't be undone.")) return;
    setDeleting(id);
    setPreviewItem(null);
    // Always remove from localStorage immediately
    removeLocalGen(id);
    setItems(prev => prev.filter(i => i.id !== id));
    // Also try EC delete (best-effort)
    try {
      await fetch("/api/generations/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* silent */ }
    finally { setDeleting(null); }
  };

  const handleOpenInEditor = async (item: GenItem) => {
    setOpeningEditor(item.id);
    try {
      let imgData: string;

      if (item.imageUrl) {
        // Hosted image — fetch and convert to base64
        try {
          const res = await fetch(item.imageUrl);
          const blob = await res.blob();
          imgData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          imgData = item.imageUrl; // fallback: pass URL directly
        }
      } else {
        // Base64 image (AI editor) — use localStorage 900px or EC thumb
        imgData = getLocalImage(item.id) || item.thumb;
      }

      try {
        sessionStorage.setItem("jpt_pending_image", imgData);
        // Pass the tool context so editor opens with the right panel
        const toolMap: Record<string, string> = {
          "upscale": "upscale",
          "ai-edit": "ai-edit",
          "generate-bg": "generate-bg",
          "headshot": "ai-edit",
          "headshot-edit": "ai-edit",
        };
        const toolHint = toolMap[item.tool] || "ai-edit";
        sessionStorage.setItem("jpt_pending_tool", toolHint);
      } catch {}
      window.location.href = "/editor";
    } catch {
      setOpeningEditor(null);
    }
  };

  const generations = items.filter(i => i.category === "generation");
  const edits = items.filter(i => !i.category || i.category === "edit");

  if (!authenticated) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 52 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0, textAlign: "center" }}>Sign in to view your generations</h2>
        <p style={{ color: "#666", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 320 }}>All your AI transformations are saved here automatically.</p>
        <a href="/api/auth/google?next=/generations" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#6366F1", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          Sign In to JPT AI
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FC", paddingBottom: 80 }}>

      {/* Opening editor overlay */}
      {openingEditor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, backdropFilter: "blur(6px)" }}>
          <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0 }}>Opening in AI Editor…</p>
        </div>
      )}

      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onOpenInEditor={handleOpenInEditor}
          onDelete={handleDelete}
        />
      )}

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#111", letterSpacing: "-0.5px" }}>✦ {t.generationsTitle}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>
              {items.length} image{items.length !== 1 ? "s" : ""} · click any card to preview · JPT AI
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="/headshot" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#FDF2F8", color: "#EC4899", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              🎯 Headshots
            </a>
            <a href="/editor" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", background: "#6366F1", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              + New Edit
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px 0" }}>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0" }}>
            <div style={{ width: 38, height: 38, border: "3px solid #E5E7EB", borderTop: "3px solid #6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>Loading your generations…</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", color: "#EF4444", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: 16 }}>
            <div style={{ fontSize: 64 }}>🎨</div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>{t.generationsEmpty}</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#6B7280", textAlign: "center", maxWidth: 380 }}>
              Every image you generate or edit — from the AI Editor or Headshot tool — appears here automatically.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/headshot" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 22px", background: "#FDF2F8", color: "#EC4899", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                🎯 Try Headshots
              </a>
              <a href="/editor" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 22px", background: "#6366F1", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                🖼️ Open Editor
              </a>
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <Section
              title="Generations" subtitle="AI-generated headshots and backgrounds"
              icon="🌅" accentColor="#F59E0B"
              items={generations}
              onPreview={setPreviewItem} onOpenInEditor={handleOpenInEditor}
              onDelete={handleDelete} deleting={deleting}
              emptyMsg="No generations yet — generate a headshot or AI background"
            />
            <Section
              title="Edits" subtitle="Upscaled, AI-edited, and transformed images"
              icon="✨" accentColor="#6366F1"
              items={edits}
              onPreview={setPreviewItem} onOpenInEditor={handleOpenInEditor}
              onDelete={handleDelete} deleting={deleting}
              emptyMsg="No edits yet — use Upscale, AI Edit, or Headshot Edit"
            />
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
