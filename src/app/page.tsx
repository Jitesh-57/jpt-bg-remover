"use client";

import "./globals.css";
import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "ai-edit" | "remove-bg" | "upscale" | "resize" | "adjust" | null;
type BgMode = "color" | "gradient" | "image" | "ai";

interface GradientPreset { label: string; from: string; to: string; angle: number }
interface DriveUser { email: string; name: string; picture?: string }
interface DriveItem { id: string; name: string; createdTime: string; description?: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const SOLID_COLORS = [
  { label: "White", hex: "#FFFFFF" }, { label: "Light Gray", hex: "#F2F2F2" },
  { label: "Cream", hex: "#FFF8F0" }, { label: "Sky", hex: "#C8E6FA" },
  { label: "Mint", hex: "#B2EAD3" }, { label: "Lavender", hex: "#D4C9F5" },
  { label: "Navy", hex: "#1B2A4A" }, { label: "Forest", hex: "#1E4A2E" },
  { label: "Slate", hex: "#2E3A4A" }, { label: "Black", hex: "#0A0A0A" },
];

const GRADIENTS: GradientPreset[] = [
  { label: "Sunrise", from: "#FF9A8B", to: "#FFD700", angle: 135 },
  { label: "Ocean", from: "#4FACFE", to: "#00F2FE", angle: 135 },
  { label: "Purple Rain", from: "#A18CD1", to: "#FBC2EB", angle: 135 },
  { label: "Forest Dawn", from: "#56AB2F", to: "#A8E063", angle: 135 },
  { label: "Twilight", from: "#3A1C71", to: "#D76D77", angle: 135 },
  { label: "Golden Hour", from: "#F7971E", to: "#FFD200", angle: 135 },
];

const AI_BG_SUGGESTIONS = [
  "Soft studio bokeh", "Mountain sunset", "City skyline at night",
  "Forest with sunlight", "Ocean beach waves", "Abstract gradient",
];

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: "ai-edit", icon: "✨", label: "AI Edit" },
  { id: "remove-bg", icon: "✂️", label: "Remove BG" },
  { id: "upscale", icon: "🔍", label: "Upscale" },
  { id: "resize", icon: "↔️", label: "Resize" },
  { id: "adjust", icon: "🎨", label: "Adjust" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────

async function prepareImage(file: File): Promise<{ base64: string; mimeType: string; dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      const MAX = 1536;
      if (w > MAX || h > MAX) { const s = MAX / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg", dataUrl, w, h });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compositeOnCanvas(
  subjectUrl: string,
  bg: { type: "color"; value: string } | { type: "gradient"; preset: GradientPreset } | { type: "image"; src: string }
): Promise<string> {
  const subject = await loadImg(subjectUrl);
  const W = subject.naturalWidth, H = subject.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  if (bg.type === "color") {
    ctx.fillStyle = bg.value; ctx.fillRect(0, 0, W, H);
  } else if (bg.type === "gradient") {
    const { from, to, angle } = bg.preset;
    const rad = (angle * Math.PI) / 180;
    const cx = W / 2, cy = H / 2, len = Math.sqrt(W * W + H * H) / 2;
    const grad = ctx.createLinearGradient(cx - Math.cos(rad) * len, cy - Math.sin(rad) * len, cx + Math.cos(rad) * len, cy + Math.sin(rad) * len);
    grad.addColorStop(0, from); grad.addColorStop(1, to);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  } else {
    ctx.drawImage(await loadImg(bg.src), 0, 0, W, H);
  }
  ctx.drawImage(subject, 0, 0);
  return canvas.toDataURL("image/png");
}

async function applyFiltersToCanvas(dataUrl: string, brightness: number, contrast: number, saturation: number, sharpness: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(img, 0, 0);
  if (sharpness > 0) {
    const sharpenKernel = [0, -sharpness / 100, 0, -sharpness / 100, 1 + 4 * sharpness / 100, -sharpness / 100, 0, -sharpness / 100, 0];
    const imageData = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    const d = imageData.data; const o = out.data;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++)
            v += d[((y + ky) * W + (x + kx)) * 4 + c] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
          o[(y * W + x) * 4 + c] = Math.max(0, Math.min(255, v));
        }
        o[(y * W + x) * 4 + 3] = d[(y * W + x) * 4 + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }
  return canvas.toDataURL("image/png");
}

async function resizeOnCanvas(dataUrl: string, w: number, h: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function saveDrive(dataUrl: string, name: string, meta: Record<string, string>) {
  fetch("/api/drive/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, name, meta }),
  }).catch(() => null);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageEditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  // Image state
  const [original, setOriginal] = useState<{ dataUrl: string; w: number; h: number; name: string } | null>(null);
  const [working, setWorking] = useState<string | null>(null); // current result
  const [removedBg, setRemovedBg] = useState<string | null>(null); // bg-removed layer

  // UI state
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Remove BG sub-state
  const [bgMode, setBgMode] = useState<BgMode>("color");
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("#6366F1");
  const [pendingGrad, setPendingGrad] = useState<GradientPreset | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [aiBgPrompt, setAiBgPrompt] = useState("");

  // Resize
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  // Adjust
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);

  // Prompt (AI Edit)
  const [prompt, setPrompt] = useState("");

  // Google Drive / history
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then((r) => r.json())
      .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string }) => {
        if (d.authenticated && d.email) setDriveUser({ email: d.email, name: d.name!, picture: d.picture });
      })
      .catch(() => null);
  }, []);

  const loadDriveHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const r = await fetch("/api/drive/history");
      if (r.ok) setDriveItems(await r.json() as DriveItem[]);
    } catch {}
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (showHistory && driveUser) loadDriveHistory();
  }, [showHistory, driveUser, loadDriveHistory]);

  // ── File upload ──────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError(null);
    setWorking(null);
    setRemovedBg(null);
    setActiveTool(null);
    setShowOriginal(false);
    resetAdjust();
    try {
      const p = await prepareImage(file);
      setOriginal({ dataUrl: p.dataUrl, w: p.w, h: p.h, name: file.name.replace(/\.[^.]+$/, "") || "image" });
      setResizeW(p.w); setResizeH(p.h);
    } catch { setError("Failed to load image."); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const resetAdjust = () => { setBrightness(100); setContrast(100); setSaturation(100); setSharpness(0); };

  const currentDisplay = showOriginal ? original?.dataUrl : (working || original?.dataUrl);

  // ── Tool handlers ────────────────────────────────────────────────────────────

  const handleRemoveBg = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setProcessingLabel("Removing background with Gemini…"); setError(null);
    try {
      const match = src.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Invalid image");
      const [, mimeType, base64] = match;
      const res = await fetch("/api/remove-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: base64, mimeType }) });
      const data = await res.json() as { data?: string; mimeType?: string; error?: string };
      if (!res.ok || !data.data) throw new Error(data.error || "Removal failed");
      const result = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      setRemovedBg(result);
      setWorking(result);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-nobg`, { tool: "remove-bg" });
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleApplyColorBg = async (hex: string) => {
    const src = removedBg || working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await compositeOnCanvas(src, { type: "color", value: hex });
      setWorking(result); setPendingColor(null);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-color-bg`, { tool: "bg-color", color: hex });
    } catch { setError("Failed to apply background."); }
    finally { setProcessing(false); }
  };

  const handleApplyGradientBg = async (g: GradientPreset) => {
    const src = removedBg || working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await compositeOnCanvas(src, { type: "gradient", preset: g });
      setWorking(result); setPendingGrad(null);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-gradient-bg`, { tool: "bg-gradient", gradient: g.label });
    } catch { setError("Failed to apply gradient."); }
    finally { setProcessing(false); }
  };

  const handleApplyImageBg = async () => {
    const src = removedBg || working || original?.dataUrl;
    if (!src || !bgImageUrl || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await compositeOnCanvas(src, { type: "image", src: bgImageUrl });
      setWorking(result);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-image-bg`, { tool: "bg-image" });
    } catch { setError("Failed to apply background."); }
    finally { setProcessing(false); }
  };

  const handleApplyAiBg = async () => {
    const src = removedBg || working || original?.dataUrl;
    if (!src || !aiBgPrompt.trim() || processing) return;
    setProcessing(true); setProcessingLabel("Generating background with AI…"); setError(null);
    try {
      const res = await fetch("/api/ai-background", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiBgPrompt.trim() }) });
      const data = await res.json() as { data?: string; mimeType?: string; error?: string };
      if (!res.ok || !data.data) throw new Error(data.error || "Generation failed");
      const bgSrc = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      const result = await compositeOnCanvas(src, { type: "image", src: bgSrc });
      setWorking(result);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-ai-bg`, { tool: "bg-ai", prompt: aiBgPrompt });
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleUpscale = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setProcessingLabel("Upscaling image…"); setError(null);
    try {
      const res = await fetch("/api/upscale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: src }) });
      const data = await res.json() as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) throw new Error(data.error || "Upscale failed");
      setWorking(data.dataUrl);
      if (driveUser) saveDrive(data.dataUrl, `${original?.name || "image"}-upscaled`, { tool: "upscale" });
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleResize = async () => {
    const src = working || original?.dataUrl;
    if (!src || !resizeW || !resizeH || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await resizeOnCanvas(src, resizeW, resizeH);
      setWorking(result);
      if (driveUser) saveDrive(result, `${original?.name || "image"}-resized`, { tool: "resize", w: String(resizeW), h: String(resizeH) });
    } catch { setError("Resize failed."); }
    finally { setProcessing(false); }
  };

  const handleApplyAdjust = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await applyFiltersToCanvas(src, brightness, contrast, saturation, sharpness);
      setWorking(result); resetAdjust();
      if (driveUser) saveDrive(result, `${original?.name || "image"}-adjusted`, { tool: "adjust" });
    } catch { setError("Adjust failed."); }
    finally { setProcessing(false); }
  };

  const handleAiEdit = async () => {
    const src = working || original?.dataUrl;
    if (!src || !prompt.trim() || processing) return;
    setProcessing(true); setProcessingLabel("Editing with Gemini…"); setError(null);
    try {
      const res = await fetch("/api/ai-edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: src, prompt: prompt.trim() }) });
      const data = await res.json() as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) throw new Error(data.error || "Edit failed");
      setWorking(data.dataUrl); setPrompt("");
      if (driveUser) saveDrive(data.dataUrl, `${original?.name || "image"}-ai-edit`, { tool: "ai-edit", prompt: prompt.trim() });
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleAspectW = (v: number) => {
    setResizeW(v);
    if (lockAspect && original) setResizeH(Math.round(v * original.h / original.w));
  };
  const handleAspectH = (v: number) => {
    setResizeH(v);
    if (lockAspect && original) setResizeW(Math.round(v * original.w / original.h));
  };

  const handleDownload = () => {
    const url = working || original?.dataUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = `${original?.name || "image"}-edited.${url.includes("image/png") ? "png" : "jpg"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDeleteDriveItem = async (id: string) => {
    if (!confirm("Delete this image from Google Drive?")) return;
    await fetch(`/api/drive/delete?id=${id}`, { method: "DELETE" });
    setDriveItems((prev) => prev.filter((i) => i.id !== id));
  };

  const resetAll = () => {
    setOriginal(null); setWorking(null); setRemovedBg(null);
    setActiveTool(null); setError(null); setShowOriginal(false);
    setShowHistory(false); setPendingColor(null); setPendingGrad(null);
    setBgImageUrl(null); setAiBgPrompt(""); setPrompt("");
    resetAdjust();
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasImage = !!original;
  const adjustFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  return (
    <div style={s.root}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={s.pageHeader}>
        <div style={s.pageHeaderInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={s.pageIcon}>🖼</span>
            <span style={s.pageTitle}>AI Image Editor</span>
          </div>
          <div style={s.pageHeaderRight}>
            {hasImage && !showHistory && (
              <>
                {working && (
                  <button style={s.dlBtn} onClick={handleDownload}>⬇ Download</button>
                )}
                <button style={s.ghostBtn} onClick={resetAll}>+ New Image</button>
              </>
            )}
            {driveUser ? (
              <div style={s.userChip}>
                {driveUser.picture
                  ? <img src={driveUser.picture} alt="" style={s.avatar} />
                  : <span style={s.avatarFallback}>{driveUser.name[0]}</span>}
                <span style={s.userName}>{driveUser.name.split(" ")[0]}</span>
                <button
                  style={{ ...s.ghostBtn, ...(showHistory ? { background: "#EEEEFF", borderColor: "#6366F1", color: "#6366F1" } : {}) }}
                  onClick={() => setShowHistory((v) => !v)}
                >
                  📂 Drive History
                </button>
                <button style={{ ...s.ghostBtn, fontSize: 12 }} onClick={async () => { await fetch("/api/auth/google/logout", { method: "POST" }); setDriveUser(null); }}>
                  Sign out
                </button>
              </div>
            ) : (
              <a href="/api/auth/google" style={s.googleBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google to save history
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <div style={s.layout}>

        {/* ── Left Sidebar (tools) ──────────────────────────────────────────── */}
        <div style={s.sidebar}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              disabled={!hasImage}
              onClick={() => setActiveTool(activeTool === t.id ? null : t.id)}
              style={{
                ...s.toolBtn,
                ...(activeTool === t.id ? s.toolBtnActive : {}),
                ...(hasImage ? {} : { opacity: 0.35, cursor: "not-allowed" }),
              }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={s.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <div style={s.canvasArea}>

          {/* Drive History Panel */}
          {showHistory && (
            <div style={s.histPanel}>
              <div style={s.histHeader}>
                <div>
                  <div style={s.h2}>Google Drive History</div>
                  <div style={s.sub2}>Saved to your "JPT AI" folder in Google Drive</div>
                </div>
                <button style={s.refreshBtn} onClick={loadDriveHistory} disabled={loadingHistory}>
                  {loadingHistory ? "Loading…" : "↺ Refresh"}
                </button>
              </div>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading Drive history…</div>
              ) : driveItems.length === 0 ? (
                <div style={s.emptyState}>
                  <div style={{ fontSize: 48 }}>📂</div>
                  <p style={{ fontWeight: 700, margin: "12px 0 6px" }}>No images saved yet</p>
                  <p style={{ color: "#888", fontSize: 13 }}>Images are auto-saved to Drive after each edit operation</p>
                </div>
              ) : (
                <div style={s.histGrid}>
                  {driveItems.map((item) => {
                    let meta: Record<string, string> = {};
                    try { meta = JSON.parse(item.description || "{}"); } catch {}
                    return (
                      <div key={item.id} style={s.histCard}>
                        <img src={`/api/drive/image?id=${item.id}`} alt={item.name} style={s.histImg} loading="lazy" />
                        <div style={s.histMeta}>
                          <div style={{ minWidth: 0 }}>
                            <div style={s.histName}>{item.name}</div>
                            {meta.tool && <div style={s.histTag}>{meta.tool}</div>}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <a href={`/api/drive/image?id=${item.id}`} download={item.name} style={s.iconBtn}>⬇</a>
                            <button style={{ ...s.iconBtn, borderColor: "#FFD0D0", background: "#FFF1F1", color: "#C62828" }} onClick={() => handleDeleteDriveItem(item.id)}>×</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upload Zone */}
          {!showHistory && !hasImage && (
            <div style={s.uploadZone}
              className={dragOver ? "" : ""}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div style={{ fontSize: 60, marginBottom: 16 }}>🖼</div>
              <p style={s.uploadTitle}>Drop an image or <span style={{ color: "#6366F1", fontWeight: 700 }}>click to browse</span></p>
              <p style={s.uploadHint}>JPG · PNG · WEBP — then choose a tool from the left</p>
              <div style={s.featureRow}>
                {TOOLS.filter(t => t.id !== null).map((t) => (
                  <span key={t.id} style={s.featureChip}>{t.icon} {t.label}</span>
                ))}
              </div>
              {error && <div style={s.errBox}>{error}</div>}
            </div>
          )}

          {/* Image Canvas */}
          {!showHistory && hasImage && (
            <div style={s.canvasInner}>
              <div style={s.imgWrap}>
                {/* Checkerboard for transparent images */}
                {!showOriginal && (working?.includes("image/png") || removedBg) && <div style={s.checker} />}
                <img
                  src={currentDisplay || ""}
                  alt="working"
                  style={{
                    ...s.mainImg,
                    ...(processing ? { opacity: 0.5 } : {}),
                    filter: activeTool === "adjust" && !processing ? adjustFilter : undefined,
                  }}
                />
                {processing && (
                  <div style={s.imgOverlay}>
                    <div style={s.spinner} />
                    <span style={{ color: "#fff", fontSize: 13, marginTop: 10 }}>{processingLabel || "Processing…"}</span>
                  </div>
                )}
              </div>

              {/* Toggle original / result */}
              <div style={s.imgControls}>
                <div style={s.togglePill}>
                  <button style={{ ...s.toggleBtn, ...(!showOriginal ? s.toggleActive : {}) }} onClick={() => setShowOriginal(false)}>Result</button>
                  <button style={{ ...s.toggleBtn, ...(showOriginal ? s.toggleActive : {}) }} onClick={() => setShowOriginal(true)}>Original</button>
                </div>
                {working && !showOriginal && (
                  <button style={s.ghostBtn} onClick={() => { setWorking(null); setRemovedBg(null); }}>↺ Reset</button>
                )}
                <span style={s.dimLabel}>{original?.w} × {original?.h}px</span>
              </div>

              {error && <div style={s.errBox}>{error}</div>}

              {/* Prompt Box (always visible when image is loaded) */}
              <div style={s.promptBar}>
                <button
                  style={{ ...s.toolPillBtn, ...(activeTool === "ai-edit" ? s.toolPillActive : {}) }}
                  onClick={() => setActiveTool(activeTool === "ai-edit" ? null : "ai-edit")}
                >✨</button>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiEdit(); } }}
                  placeholder="Describe what to change… e.g. 'Make the background blurry', 'Change sky to sunset'"
                  style={s.promptInput}
                  disabled={processing || !hasImage}
                />
                <button
                  style={{ ...s.sendBtn, ...(!prompt.trim() || processing || !hasImage ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
                  disabled={!prompt.trim() || processing || !hasImage}
                  onClick={handleAiEdit}
                >
                  {processing && activeTool === "ai-edit" ? "…" : "✨ Apply"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Tool Panel ──────────────────────────────────────────────── */}
        {activeTool && hasImage && !showHistory && (
          <div style={s.toolPanel}>

            {/* ── Remove BG ────────────────────────────────────────────────── */}
            {activeTool === "remove-bg" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>✂️ Remove Background</div>
                <p style={s.panelSub}>Powered by Gemini AI — remove any background instantly</p>

                {!removedBg ? (
                  <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleRemoveBg}>
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Removing…</span> : "Remove Background"}
                  </button>
                ) : (
                  <>
                    <div style={s.successNote}>✓ Background removed — now add a new one:</div>

                    {/* BG Mode Tabs */}
                    <div style={s.tabBar}>
                      {(["color", "gradient", "image", "ai"] as BgMode[]).map((m) => (
                        <button key={m} style={{ ...s.tabBtn, ...(bgMode === m ? s.tabActive : {}) }} onClick={() => setBgMode(m)}>
                          {{ color: "🎨 Color", gradient: "🌈 Gradient", image: "🖼 Image", ai: "✨ AI" }[m]}
                        </button>
                      ))}
                    </div>

                    {bgMode === "color" && (
                      <div style={s.panelSection}>
                        <div style={s.swatchGrid}>
                          {SOLID_COLORS.map((c) => (
                            <button key={c.hex} title={c.label} disabled={processing}
                              style={{ ...s.swatch, background: c.hex, border: c.hex === "#FFFFFF" ? "2px solid #DDD" : `2px solid ${c.hex}`, outline: pendingColor === c.hex ? "3px solid #6366F1" : "none", outlineOffset: 2 }}
                              onClick={() => setPendingColor(c.hex)} />
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} style={s.colorPicker} />
                          <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>{customColor}</span>
                          <button style={{ ...s.smallBtn, ...(pendingColor === customColor ? { background: "#10B981", color: "#fff" } : {}) }} onClick={() => setPendingColor(customColor)}>
                            {pendingColor === customColor ? "✓" : "Select"}
                          </button>
                        </div>
                        {pendingColor && <div style={s.pendingRow}><div style={{ width: 18, height: 18, borderRadius: 4, background: pendingColor, border: "2px solid #DDD" }} /><span style={{ fontSize: 12, fontWeight: 600 }}>Color selected</span><button style={s.xBtn} onClick={() => setPendingColor(null)}>✕</button></div>}
                        <button style={{ ...s.primaryBtn, ...(!pendingColor || processing ? s.btnOff : {}) }} disabled={!pendingColor || processing} onClick={() => pendingColor && handleApplyColorBg(pendingColor)}>
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Color"}
                        </button>
                      </div>
                    )}

                    {bgMode === "gradient" && (
                      <div style={s.panelSection}>
                        <div style={s.gradGrid}>
                          {GRADIENTS.map((g) => (
                            <button key={g.label} disabled={processing}
                              style={{ ...s.gradSwatch, background: `linear-gradient(${g.angle}deg,${g.from},${g.to})`, outline: pendingGrad?.label === g.label ? "3px solid #6366F1" : "none", outlineOffset: 2 }}
                              onClick={() => setPendingGrad(g)}>
                              <span style={s.gradLabel}>{g.label}</span>
                            </button>
                          ))}
                        </div>
                        {pendingGrad && <div style={s.pendingRow}><div style={{ width: 18, height: 18, borderRadius: 4, background: `linear-gradient(${pendingGrad.angle}deg,${pendingGrad.from},${pendingGrad.to})` }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{pendingGrad.label}</span><button style={s.xBtn} onClick={() => setPendingGrad(null)}>✕</button></div>}
                        <button style={{ ...s.primaryBtn, ...(!pendingGrad || processing ? s.btnOff : {}) }} disabled={!pendingGrad || processing} onClick={() => pendingGrad && handleApplyGradientBg(pendingGrad)}>
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Gradient"}
                        </button>
                      </div>
                    )}

                    {bgMode === "image" && (
                      <div style={s.panelSection}>
                        <input ref={bgFileRef} type="file" accept="image/*" style={{ display: "none" }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setBgImageUrl(r.result as string); r.readAsDataURL(f); }} />
                        {bgImageUrl
                          ? <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 80 }}><img src={bgImageUrl} alt="bg" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button style={s.changeBgBtn} onClick={() => bgFileRef.current?.click()}>Change</button></div>
                          : <button style={s.uploadBgBtn} onClick={() => bgFileRef.current?.click()}>🖼 Choose Background Image</button>}
                        <button style={{ ...s.primaryBtn, ...(!bgImageUrl || processing ? s.btnOff : {}) }} disabled={!bgImageUrl || processing} onClick={handleApplyImageBg}>
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Background"}
                        </button>
                      </div>
                    )}

                    {bgMode === "ai" && (
                      <div style={s.panelSection}>
                        <span style={s.geminiBadge}>✨ Gemini Imagen</span>
                        <textarea value={aiBgPrompt} onChange={(e) => setAiBgPrompt(e.target.value)} placeholder={'Describe a background…\ne.g. "Warm golden sunset"\n"Modern office with plants"'} style={s.textarea} rows={3} disabled={processing} />
                        <div style={s.suggestions}>{AI_BG_SUGGESTIONS.map((sug) => <button key={sug} style={s.chip} onClick={() => setAiBgPrompt(sug)} disabled={processing}>{sug}</button>)}</div>
                        <button style={{ ...s.primaryBtn, background: "linear-gradient(135deg,#4285F4,#8B5CF6)", ...(!aiBgPrompt.trim() || processing ? s.btnOff : {}) }} disabled={!aiBgPrompt.trim() || processing} onClick={handleApplyAiBg}>
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Generating…</span> : "✨ Generate Background"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── AI Edit ──────────────────────────────────────────────────── */}
            {activeTool === "ai-edit" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>✨ AI Edit</div>
                <p style={s.panelSub}>Describe any change — Gemini will edit the image</p>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'e.g. "Make the background blurry"\n"Change the background to a sunset"\n"Add dramatic lighting"'} style={s.textarea} rows={4} disabled={processing} />
                <div style={s.suggestions}>
                  {["Make background blurry", "Add dramatic lighting", "Change to black and white", "Make it look cinematic", "Add fog effect"].map((s2) => (
                    <button key={s2} style={s.chip} onClick={() => setPrompt(s2)} disabled={processing}>{s2}</button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(!prompt.trim() || processing ? s.btnOff : {}) }} disabled={!prompt.trim() || processing} onClick={handleAiEdit}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Editing…</span> : "✨ Apply Edit"}
                </button>
              </div>
            )}

            {/* ── Upscale ──────────────────────────────────────────────────── */}
            {activeTool === "upscale" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔍 Upscale</div>
                <p style={s.panelSub}>Enhance image quality and sharpness using AI</p>
                <div style={s.infoCard}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>What it does</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                    <li>Sharpens fine details</li>
                    <li>Reduces noise and artifacts</li>
                    <li>Enhances overall clarity</li>
                    <li>Preserves original content</li>
                  </ul>
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleUpscale}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Upscaling…</span> : "🔍 Upscale Image"}
                </button>
              </div>
            )}

            {/* ── Resize ───────────────────────────────────────────────────── */}
            {activeTool === "resize" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>↔️ Resize</div>
                <p style={s.panelSub}>Change image dimensions</p>
                <div style={s.panelSection}>
                  <label style={s.inputLabel}>Width (px)</label>
                  <input type="number" value={resizeW} min={1} max={4096}
                    onChange={(e) => handleAspectW(parseInt(e.target.value) || 1)} style={s.numInput} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                    <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} id="lock-aspect" />
                    <label htmlFor="lock-aspect" style={{ fontSize: 13, cursor: "pointer" }}>Lock aspect ratio</label>
                  </div>
                  <label style={s.inputLabel}>Height (px)</label>
                  <input type="number" value={resizeH} min={1} max={4096}
                    onChange={(e) => handleAspectH(parseInt(e.target.value) || 1)} style={s.numInput} />
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>Original: {original?.w} × {original?.h}px</div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleResize}>
                  ↔️ Apply Resize
                </button>
              </div>
            )}

            {/* ── Adjust ───────────────────────────────────────────────────── */}
            {activeTool === "adjust" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🎨 Color Adjustments</div>
                <p style={s.panelSub}>Real-time preview • click Apply to save</p>
                {[
                  { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200, default: 100, unit: "%" },
                  { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200, default: 100, unit: "%" },
                  { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200, default: 100, unit: "%" },
                  { label: "Sharpness", value: sharpness, set: setSharpness, min: 0, max: 100, default: 0, unit: "" },
                ].map((ctrl) => (
                  <div key={ctrl.label} style={s.sliderRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={s.inputLabel}>{ctrl.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{ctrl.value}{ctrl.unit}</span>
                    </div>
                    <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.value}
                      onChange={(e) => ctrl.set(parseInt(e.target.value))} style={{ width: "100%" }} />
                    <button style={{ ...s.resetSliderBtn, opacity: ctrl.value === ctrl.default ? 0.3 : 1 }}
                      onClick={() => ctrl.set(ctrl.default)} disabled={ctrl.value === ctrl.default}>Reset</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ ...s.ghostBtn, flex: 1 }} onClick={resetAdjust}>Reset All</button>
                  <button style={{ ...s.primaryBtn, flex: 2, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleApplyAdjust}>
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Adjustments"}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#F6F7FB", fontFamily: "system-ui,-apple-system,sans-serif", color: "#111", display: "flex", flexDirection: "column" },

  pageHeader: { background: "rgba(255,255,255,0.97)", borderBottom: "1px solid #EAECF0", backdropFilter: "blur(8px)", position: "sticky", top: 52, zIndex: 90 },
  pageHeaderInner: { maxWidth: 1400, margin: "0 auto", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  pageIcon: { fontSize: 18 },
  pageTitle: { fontSize: 14, fontWeight: 700, color: "#222" },
  pageHeaderRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const },
  dlBtn: { background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  ghostBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" },
  userChip: { display: "flex", alignItems: "center", gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: "50%", flexShrink: 0 },
  avatarFallback: { width: 26, height: 26, borderRadius: "50%", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "#333" },
  googleBtn: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DDD", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#333", textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap" as const },

  layout: { display: "flex", flex: 1, minHeight: 0 },

  sidebar: { width: 72, flexShrink: 0, background: "#fff", borderRight: "1px solid #EAECF0", display: "flex", flexDirection: "column" as const, padding: "12px 6px", gap: 4 },
  toolBtn: { width: "100%", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", transition: "background 0.15s", color: "#555" },
  toolBtnActive: { background: "#EEEEFF", color: "#6366F1" },
  toolLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, lineHeight: 1 },

  canvasArea: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, padding: "20px", gap: 16, overflowY: "auto" as const },
  canvasInner: { display: "flex", flexDirection: "column" as const, gap: 12, alignItems: "center", width: "100%" },

  uploadZone: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", border: "2px dashed #D2D4E0", borderRadius: 20, padding: "60px 40px", cursor: "pointer", textAlign: "center" as const, transition: "all 0.2s", background: "#fff", minHeight: 400 },
  uploadTitle: { margin: "0 0 8px", fontSize: 17, fontWeight: 700 },
  uploadHint: { margin: "0 0 24px", fontSize: 14, color: "#888" },
  featureRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center" },
  featureChip: { background: "#F0F0FA", border: "1px solid #E0E0F0", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#6366F1" },

  imgWrap: { position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", maxWidth: "100%", background: "#fff" },
  checker: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)", backgroundSize: "14px 14px", backgroundPosition: "0 0,0 7px,7px -7px,-7px 0" },
  mainImg: { maxWidth: "min(800px, 100%)", maxHeight: "60vh", display: "block", position: "relative", zIndex: 1, transition: "opacity 0.2s" },
  imgOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  spinner: { width: 36, height: 36, border: "3.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  imgControls: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const },
  togglePill: { display: "flex", background: "#EBEBF0", borderRadius: 9, padding: 3 },
  toggleBtn: { padding: "5px 14px", borderRadius: 7, border: "none", background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  toggleActive: { background: "#fff", color: "#111", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  dimLabel: { fontSize: 12, color: "#AAA" },

  promptBar: { display: "flex", gap: 8, width: "100%", maxWidth: 800, alignItems: "center" },
  promptInput: { flex: 1, border: "1.5px solid #E0E0EE", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111" },
  sendBtn: { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const },
  toolPillBtn: { width: 38, height: 38, borderRadius: 10, border: "1px solid #E0E0EE", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" },
  toolPillActive: { background: "#EEEEFF", borderColor: "#6366F1" },

  errBox: { background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C00", width: "100%", maxWidth: 800 },

  // Tool panel
  toolPanel: { width: 300, flexShrink: 0, background: "#fff", borderLeft: "1px solid #EAECF0", overflowY: "auto" as const, display: "flex", flexDirection: "column" as const },
  panelContent: { padding: "20px 18px", display: "flex", flexDirection: "column" as const, gap: 14 },
  panelTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" },
  panelSub: { margin: 0, fontSize: 12, color: "#777", lineHeight: 1.5 },
  panelSection: { display: "flex", flexDirection: "column" as const, gap: 10 },

  successNote: { background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#047857", fontWeight: 600 },
  tabBar: { display: "flex", gap: 2, background: "#F0F0F8", borderRadius: 8, padding: 2 },
  tabBtn: { flex: 1, padding: "5px 2px", borderRadius: 6, border: "none", background: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  tabActive: { background: "#fff", color: "#6366F1", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },

  swatchGrid: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  swatch: { width: 30, height: 30, borderRadius: 7, cursor: "pointer", transition: "transform 0.1s, outline 0.1s", flexShrink: 0 },
  colorPicker: { width: 36, height: 36, border: "2px solid #E0E0E8", borderRadius: 6, cursor: "pointer", padding: 2 },
  smallBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  pendingRow: { display: "flex", alignItems: "center", gap: 8, background: "#F0F0FF", border: "1px solid #C4C4F0", borderRadius: 8, padding: "8px 10px" },
  xBtn: { background: "none", border: "none", color: "#AAA", cursor: "pointer", fontSize: 13, padding: 2, marginLeft: "auto", flexShrink: 0 },

  gradGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  gradSwatch: { height: 44, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "0 6px 4px", transition: "transform 0.1s, outline 0.1s" },
  gradLabel: { fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 2px rgba(0,0,0,0.4)" },

  changeBgBtn: { position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  uploadBgBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", border: "2px dashed #D0D0E0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#555", background: "#FAFAFC" },
  geminiBadge: { display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg,#4285F4,#8B5CF6)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700 },
  textarea: { width: "100%", borderRadius: 8, border: "1.5px solid #E0E0EE", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, lineHeight: 1.5, color: "#222", background: "#FAFAFA" },
  suggestions: { display: "flex", flexWrap: "wrap" as const, gap: 5 },
  chip: { fontSize: 11, color: "#6366F1", background: "#EEEEFF", border: "1px solid #C4C4F4", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 },

  infoCard: { background: "#F7F8FC", borderRadius: 10, padding: "12px 14px", fontSize: 13 },

  inputLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "#888" },
  numInput: { width: "100%", border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },

  sliderRow: { display: "flex", flexDirection: "column" as const, gap: 2 },
  resetSliderBtn: { background: "none", border: "none", color: "#6366F1", fontSize: 10, cursor: "pointer", textAlign: "right" as const, padding: 0, alignSelf: "flex-end" },

  primaryBtn: { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnOff: { opacity: 0.4, cursor: "not-allowed" as const },
  btnRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spin: { display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // History
  histPanel: { display: "flex", flexDirection: "column" as const, gap: 16, width: "100%" },
  histHeader: { background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  h2: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px" },
  sub2: { fontSize: 12, color: "#777", marginTop: 2 },
  refreshBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#555" },
  emptyState: { background: "#fff", borderRadius: 14, padding: "48px 24px", textAlign: "center" as const, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  histGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 },
  histCard: { borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  histImg: { width: "100%", aspectRatio: "1", objectFit: "cover" as const, display: "block" },
  histMeta: { padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 },
  histName: { fontSize: 11, fontWeight: 700, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  histTag: { fontSize: 10, color: "#6366F1", background: "#EEEEF8", borderRadius: 4, padding: "1px 5px", marginTop: 2, display: "inline-block" },
  iconBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: "1px solid #E0E0EE", background: "#F7F8FC", cursor: "pointer", fontSize: 12, color: "#555", textDecoration: "none" },
};
