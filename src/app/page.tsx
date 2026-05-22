"use client";

import "./globals.css";
import { useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "removing" | "result";
type BgTab = "colors" | "gradients" | "image" | "ai";

interface GradientPreset {
  label: string;
  from: string;
  to: string;
  angle: number;
}

interface HistoryItem {
  id: string;
  name: string;
  resultDataUrl: string;
  savedAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SOLID_COLORS = [
  { label: "White", hex: "#FFFFFF" },
  { label: "Light Gray", hex: "#F2F2F2" },
  { label: "Cream", hex: "#FFF8F0" },
  { label: "Sky", hex: "#C8E6FA" },
  { label: "Mint", hex: "#B2EAD3" },
  { label: "Lavender", hex: "#D4C9F5" },
  { label: "Peach", hex: "#FFDDC1" },
  { label: "Rose", hex: "#FFD6D6" },
  { label: "Navy", hex: "#1B2A4A" },
  { label: "Forest", hex: "#1E4A2E" },
  { label: "Slate", hex: "#2E3A4A" },
  { label: "Black", hex: "#0A0A0A" },
];

const GRADIENTS: GradientPreset[] = [
  { label: "Sunrise", from: "#FF9A8B", to: "#FFD700", angle: 135 },
  { label: "Ocean", from: "#4FACFE", to: "#00F2FE", angle: 135 },
  { label: "Purple Rain", from: "#A18CD1", to: "#FBC2EB", angle: 135 },
  { label: "Forest Dawn", from: "#56AB2F", to: "#A8E063", angle: 135 },
  { label: "Twilight", from: "#3A1C71", to: "#D76D77", angle: 135 },
  { label: "Golden Hour", from: "#F7971E", to: "#FFD200", angle: 135 },
  { label: "Arctic", from: "#E0EAFC", to: "#CFDEF3", angle: 135 },
  { label: "Midnight", from: "#141E30", to: "#243B55", angle: 135 },
];

const AI_SUGGESTIONS = [
  "Soft studio bokeh",
  "Mountain sunset",
  "City skyline at night",
  "Forest with sunlight",
  "Ocean beach waves",
  "Abstract gradient",
  "Marble texture",
  "Cozy coffee shop interior",
];

const STORAGE_KEY = "jpt-bgr-history";
const MAX_DIMENSION = 1024;

// ─── Utils ───────────────────────────────────────────────────────────────────

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function addToHistory(item: HistoryItem) {
  const existing = loadHistory().filter((i) => i.id !== item.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...existing].slice(0, 20)));
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Resize image and return { base64, mimeType, dataUrl, width, height }
async function prepareImage(file: File): Promise<{
  base64: string;
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, 0.92);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType, dataUrl, width: w, height: h });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Canvas compositor
async function compositeOnCanvas(
  subjectDataUrl: string,
  bg:
    | { type: "color"; value: string }
    | { type: "gradient"; preset: GradientPreset }
    | { type: "image"; src: string }
): Promise<string> {
  const subjectImg = await loadImg(subjectDataUrl);
  const W = subjectImg.naturalWidth;
  const H = subjectImg.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  if (bg.type === "color") {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, W, H);
  } else if (bg.type === "gradient") {
    const { from, to, angle } = bg.preset;
    const rad = (angle * Math.PI) / 180;
    const cx = W / 2, cy = H / 2;
    const len = Math.sqrt(W * W + H * H) / 2;
    const grad = ctx.createLinearGradient(
      cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
    );
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const bgImg = await loadImg(bg.src);
    ctx.drawImage(bgImg, 0, 0, W, H);
  }

  ctx.drawImage(subjectImg, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BgRemoverPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);

  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [removedDataUrl, setRemovedDataUrl] = useState<string | null>(null);
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");

  const [removing, setRemoving] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [compositing, setCompositing] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showOriginal, setShowOriginal] = useState(false);
  const [bgTab, setBgTab] = useState<BgTab>("colors");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const [customColor, setCustomColor] = useState("#6366F1");
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [pendingGradient, setPendingGradient] = useState<GradientPreset | null>(null);
  const [bgImageDataUrl, setBgImageDataUrl] = useState<string | null>(null);
  const [bgImageName, setBgImageName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const displayUrl = showOriginal
    ? originalPreview
    : compositeDataUrl || removedDataUrl;

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setError(null);
    setRemovedDataUrl(null);
    setCompositeDataUrl(null);
    setPendingColor(null);
    setPendingGradient(null);
    setBgImageDataUrl(null);
    setBgImageName("");
    setAiPrompt("");
    setShowOriginal(false);
    setFileName(file.name.replace(/\.[^.]+$/, "") || "image");

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setOriginalPreview(localUrl);
    setStep("removing");
    setRemoving(true);
    setProgressLabel("Preparing image…");

    try {
      setProgressLabel("Resizing image…");
      const prepared = await prepareImage(file);

      setProgressLabel("Removing background with Gemini…");
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: prepared.base64, mimeType: prepared.mimeType }),
      });

      const data = (await res.json()) as { data?: string; mimeType?: string; error?: string };

      if (!res.ok || !data.data) {
        throw new Error(data.error || "Background removal failed");
      }

      const resultDataUrl = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      setRemovedDataUrl(resultDataUrl);
      setStep("result");

      const item: HistoryItem = {
        id: `bgr-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, "") || "image",
        resultDataUrl,
        savedAt: Date.now(),
      };
      addToHistory(item);
      setHistory(loadHistory());
    } catch (err) {
      setError((err as Error).message);
      setStep("upload");
    } finally {
      setRemoving(false);
      setProgressLabel("");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ── Background editing ───────────────────────────────────────────────────

  const applyColorBg = async (hex: string) => {
    if (!removedDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "color", value: hex });
      setCompositeDataUrl(url);
      setPendingColor(null);
    } catch {
      setError("Failed to apply color.");
    } finally {
      setCompositing(false);
    }
  };

  const applyGradientBg = async (preset: GradientPreset) => {
    if (!removedDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "gradient", preset });
      setCompositeDataUrl(url);
      setPendingGradient(null);
    } catch {
      setError("Failed to apply gradient.");
    } finally {
      setCompositing(false);
    }
  };

  const applyImageBg = async () => {
    if (!removedDataUrl || !bgImageDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "image", src: bgImageDataUrl });
      setCompositeDataUrl(url);
    } catch {
      setError("Failed to apply image background.");
    } finally {
      setCompositing(false);
    }
  };

  const applyAiBg = async () => {
    if (!removedDataUrl || !aiPrompt.trim() || generatingAi) return;
    setGeneratingAi(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = (await res.json()) as { data?: string; mimeType?: string; error?: string };
      if (!res.ok || !data.data) throw new Error(data.error || "Generation failed");

      const bgSrc = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      const url = await compositeOnCanvas(removedDataUrl, { type: "image", src: bgSrc });
      setCompositeDataUrl(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDownload = async () => {
    const url = compositeDataUrl || removedDataUrl;
    if (!url) return;
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 80));
    downloadDataUrl(url, `${fileName}-no-bg`);
    setDownloading(false);
  };

  const reset = () => {
    setStep("upload");
    setOriginalPreview(null);
    setRemovedDataUrl(null);
    setCompositeDataUrl(null);
    setError(null);
    setShowOriginal(false);
    setPendingColor(null);
    setPendingGradient(null);
    setBgImageDataUrl(null);
    setBgImageName("");
    setAiPrompt("");
    setShowHistory(false);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo} onClick={reset}>
            <span style={s.logoEmoji}>✂️</span>
            <span style={s.logoText}>JPT Background Remover</span>
            <span style={s.gemBadge}>✨ Gemini AI</span>
          </div>
          <div style={s.headerRight}>
            {step === "result" && !showHistory && (
              <button className="ghost-btn" style={s.ghostBtn} onClick={reset}>
                + New Image
              </button>
            )}
            {step === "result" && (removedDataUrl || compositeDataUrl) && (
              <button
                style={{ ...s.dlHeaderBtn, ...(downloading ? { opacity: 0.6 } : {}) }}
                disabled={downloading}
                onClick={handleDownload}
              >
                {downloading ? "Saving…" : "⬇ Download PNG"}
              </button>
            )}
            <button
              className="ghost-btn"
              style={{
                ...s.ghostBtn,
                ...(showHistory ? { background: "#EEEEFF", borderColor: "#6366F1", color: "#6366F1" } : {}),
              }}
              onClick={() => setShowHistory((v) => !v)}
            >
              📂 History
              {history.length > 0 && <span style={s.badge}>{history.length}</span>}
            </button>
          </div>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.bgDots} />

        {/* ── History Panel ─────────────────────────────────────────────── */}
        {showHistory && (
          <div style={s.histPanel}>
            <div style={s.histHeader}>
              <div>
                <h2 style={s.h2}>History</h2>
                <p style={s.sub2}>Saved in your browser (last 20)</p>
              </div>
              {history.length > 0 && (
                <button
                  style={s.clearBtn}
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    setHistory([]);
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 52 }}>✂️</div>
                <p style={{ margin: "12px 0 4px", fontWeight: 700, fontSize: 16 }}>No history yet</p>
                <p style={{ margin: "0 0 20px", color: "#888", fontSize: 13 }}>
                  Remove backgrounds and they&apos;ll appear here
                </p>
                <button style={s.primaryBtn} onClick={() => setShowHistory(false)}>
                  + Remove a Background
                </button>
              </div>
            ) : (
              <div style={s.histGrid}>
                {history.map((item) => (
                  <div key={item.id} style={s.histCard} className="card-hover">
                    <div style={s.histImgWrap}>
                      <div style={s.checker} />
                      <img src={item.resultDataUrl} alt={item.name} style={s.histImg} />
                    </div>
                    <div style={s.histMeta}>
                      <span style={s.histName}>{item.name}</span>
                      <button
                        style={s.dlIconBtn}
                        title="Download PNG"
                        onClick={() => downloadDataUrl(item.resultDataUrl, item.name)}
                      >⬇</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upload ────────────────────────────────────────────────────── */}
        {!showHistory && step === "upload" && (
          <div style={s.uploadCard}>
            <div style={s.heroSection}>
              <div style={s.heroIcon}>✂️</div>
              <h1 style={s.h1}>Remove Image Background</h1>
              <p style={s.sub}>
                Powered by <strong>Gemini AI</strong> — remove any background instantly,
                then replace it with a color, gradient, custom image, or AI-generated scene.
              </p>
            </div>

            <div
              className="drop-zone"
              style={{ ...s.dropZone, ...(dragOver ? s.dropActive : {}) }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div style={s.dropInner}>
                <div style={s.checkerSmall} />
                <div style={{ fontSize: 48, marginBottom: 14, position: "relative", zIndex: 1 }}>📎</div>
                <p style={{ ...s.dropTitle, position: "relative", zIndex: 1 }}>
                  Drop your image or{" "}
                  <span style={{ color: "#6366F1", fontWeight: 700 }}>click to browse</span>
                </p>
                <p style={{ ...s.dropHint, position: "relative", zIndex: 1 }}>
                  JPG · PNG · WEBP — People, products, objects, pets
                </p>
              </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.featureGrid}>
              {[
                { icon: "🤖", label: "Gemini AI removal" },
                { icon: "🎨", label: "12 solid colors" },
                { icon: "🌈", label: "8 gradients" },
                { icon: "✨", label: "AI-generated scenes" },
                { icon: "🖼", label: "Custom backgrounds" },
                { icon: "📥", label: "PNG download" },
              ].map((f) => (
                <div key={f.label} style={s.featureItem}>
                  <span>{f.icon}</span>
                  <span style={s.featureLabel}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Removing (processing) ────────────────────────────────────── */}
        {!showHistory && step === "removing" && (
          <div style={s.processingCard}>
            {originalPreview && (
              <div style={s.processingImgWrap}>
                <img src={originalPreview} alt="original" style={s.processingImg} />
                <div style={s.processingOverlay}>
                  <div style={s.bigSpinner} />
                </div>
              </div>
            )}
            <p style={s.processingLabel}>{progressLabel || "Removing background…"}</p>
            <p style={s.processingNote}>
              Gemini AI is analyzing your image — takes about 10–20 seconds
            </p>
          </div>
        )}

        {/* ── Result ───────────────────────────────────────────────────── */}
        {!showHistory && step === "result" && (
          <div style={s.resultLayout}>
            {/* Left: Preview */}
            <div style={s.previewCol}>
              <div style={s.toggleRow}>
                <div style={s.togglePill}>
                  <button
                    style={{ ...s.toggleBtn, ...(!showOriginal ? s.toggleActive : {}) }}
                    onClick={() => setShowOriginal(false)}
                  >
                    Result
                  </button>
                  <button
                    style={{ ...s.toggleBtn, ...(showOriginal ? s.toggleActive : {}) }}
                    onClick={() => setShowOriginal(true)}
                  >
                    Original
                  </button>
                </div>
                {compositeDataUrl && !showOriginal && (
                  <button className="ghost-btn" style={s.resetBtn} onClick={() => setCompositeDataUrl(null)}>
                    ↺ Reset
                  </button>
                )}
              </div>

              <div style={s.imageFrame}>
                {!showOriginal && !compositeDataUrl && <div style={s.checker} />}
                {displayUrl && (
                  <img
                    src={displayUrl}
                    alt="result"
                    style={{ ...s.resultImg, ...(compositing || generatingAi ? { opacity: 0.45 } : {}) }}
                  />
                )}
                {(compositing || generatingAi) && (
                  <div style={s.frameOverlay}>
                    <div style={s.smallSpinner} />
                    <span style={{ color: "#fff", fontSize: 13, marginTop: 8 }}>
                      {generatingAi ? "Generating with Gemini AI…" : "Applying background…"}
                    </span>
                  </div>
                )}
              </div>

              {error && <div style={s.errorBox}>{error}</div>}
            </div>

            {/* Right: Edit Panel */}
            <div style={s.editPanel}>
              <h2 style={s.h2}>Edit Background</h2>
              <p style={s.sub2}>Add a color, gradient, custom image, or AI-generated scene</p>

              {/* Tabs */}
              <div style={s.tabBar}>
                {(
                  [
                    { id: "colors", icon: "🎨", label: "Colors" },
                    { id: "gradients", icon: "🌈", label: "Gradients" },
                    { id: "image", icon: "🖼", label: "Image" },
                    { id: "ai", icon: "✨", label: "AI" },
                  ] as { id: BgTab; icon: string; label: string }[]
                ).map(({ id, icon, label }) => (
                  <button
                    key={id}
                    className="tab-btn"
                    style={{ ...s.tabBtn, ...(bgTab === id ? s.tabActive : {}) }}
                    onClick={() => setBgTab(id)}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* ── Colors ────────────────────────────────────────────── */}
              {bgTab === "colors" && (
                <div style={s.tabContent}>
                  <p style={s.sLabel}>Preset Colors</p>
                  <div style={s.swatchGrid}>
                    {SOLID_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        title={c.label}
                        className="swatch"
                        disabled={compositing}
                        style={{
                          ...s.swatch,
                          background: c.hex,
                          border: c.hex === "#FFFFFF" ? "2px solid #DDD" : `2px solid ${c.hex}`,
                          outline: pendingColor === c.hex ? "3px solid #6366F1" : "none",
                          outlineOffset: 2,
                        }}
                        onClick={() => setPendingColor(c.hex)}
                      />
                    ))}
                  </div>

                  <p style={{ ...s.sLabel, marginTop: 14 }}>Custom Color</p>
                  <div style={s.customRow}>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      style={s.colorPicker}
                    />
                    <span style={s.hexLabel}>{customColor}</span>
                    <button
                      style={{
                        ...s.selectBtn,
                        ...(pendingColor === customColor ? { background: "#10B981" } : {}),
                      }}
                      disabled={compositing}
                      onClick={() => setPendingColor(customColor)}
                    >
                      {pendingColor === customColor ? "✓ Selected" : "Select"}
                    </button>
                  </div>

                  {pendingColor && (
                    <div style={s.pendingRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: pendingColor, border: "2px solid #DDD" }} />
                        <span style={s.pendingLabel}>Color selected</span>
                      </div>
                      <button style={s.xBtn} onClick={() => setPendingColor(null)}>✕</button>
                    </div>
                  )}

                  <button
                    style={{ ...s.primaryBtn, ...(!pendingColor || compositing || !removedDataUrl ? s.btnOff : {}) }}
                    disabled={!pendingColor || compositing || !removedDataUrl}
                    onClick={() => pendingColor && applyColorBg(pendingColor)}
                  >
                    {compositing
                      ? <span style={s.btnRow}><span style={s.spinInBtn} />Applying…</span>
                      : "Apply Color"}
                  </button>
                </div>
              )}

              {/* ── Gradients ─────────────────────────────────────────── */}
              {bgTab === "gradients" && (
                <div style={s.tabContent}>
                  <p style={s.sLabel}>Preset Gradients</p>
                  <div style={s.gradientGrid}>
                    {GRADIENTS.map((g) => (
                      <button
                        key={g.label}
                        disabled={compositing}
                        style={{
                          ...s.gradSwatch,
                          background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
                          outline: pendingGradient?.label === g.label ? "3px solid #6366F1" : "none",
                          outlineOffset: 2,
                        }}
                        onClick={() => setPendingGradient(g)}
                      >
                        <span style={s.gradLabel}>{g.label}</span>
                      </button>
                    ))}
                  </div>

                  {pendingGradient && (
                    <div style={s.pendingRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(${pendingGradient.angle}deg,${pendingGradient.from},${pendingGradient.to})` }} />
                        <span style={s.pendingLabel}>{pendingGradient.label} selected</span>
                      </div>
                      <button style={s.xBtn} onClick={() => setPendingGradient(null)}>✕</button>
                    </div>
                  )}

                  <button
                    style={{ ...s.primaryBtn, ...(!pendingGradient || compositing || !removedDataUrl ? s.btnOff : {}) }}
                    disabled={!pendingGradient || compositing || !removedDataUrl}
                    onClick={() => pendingGradient && applyGradientBg(pendingGradient)}
                  >
                    {compositing
                      ? <span style={s.btnRow}><span style={s.spinInBtn} />Applying…</span>
                      : "Apply Gradient"}
                  </button>
                </div>
              )}

              {/* ── Image ─────────────────────────────────────────────── */}
              {bgTab === "image" && (
                <div style={s.tabContent}>
                  <p style={s.sLabel}>Upload Background Image</p>
                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setBgImageName(f.name);
                      const reader = new FileReader();
                      reader.onloadend = () => setBgImageDataUrl(reader.result as string);
                      reader.readAsDataURL(f);
                    }}
                  />

                  {bgImageDataUrl ? (
                    <div style={s.bgPreviewWrap}>
                      <img src={bgImageDataUrl} alt="bg" style={s.bgPreview} />
                      <button className="ghost-btn" style={s.changeBgBtn} onClick={() => bgFileInputRef.current?.click()}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <button className="ghost-btn" style={s.uploadBgBtn} onClick={() => bgFileInputRef.current?.click()}>
                      <span>🖼</span>
                      <span>Choose Background Image</span>
                    </button>
                  )}

                  {bgImageName && !bgImageDataUrl && (
                    <p style={s.smallNote}>{bgImageName}</p>
                  )}
                  <p style={s.smallNote}>
                    The subject is composited on top of your image with clean edges.
                  </p>

                  <button
                    style={{ ...s.primaryBtn, ...(!bgImageDataUrl || compositing || !removedDataUrl ? s.btnOff : {}) }}
                    disabled={!bgImageDataUrl || compositing || !removedDataUrl}
                    onClick={applyImageBg}
                  >
                    {compositing
                      ? <span style={s.btnRow}><span style={s.spinInBtn} />Applying…</span>
                      : "Apply Background"}
                  </button>
                </div>
              )}

              {/* ── AI ────────────────────────────────────────────────── */}
              {bgTab === "ai" && (
                <div style={s.tabContent}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={s.geminiBadge}>✨ Gemini Imagen 3</span>
                    <p style={s.sLabel}>Generate any background</p>
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={"Describe a background…\ne.g. \"Warm golden sunset over the ocean\"\n\"Modern minimalist office with plants\""}
                    style={s.promptBox}
                    rows={3}
                    disabled={generatingAi}
                  />

                  <div style={s.suggestions}>
                    {AI_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        className="chip-btn"
                        style={s.chipBtn}
                        onClick={() => setAiPrompt(sug)}
                        disabled={generatingAi}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <button
                    style={{
                      ...s.primaryBtn,
                      background: "linear-gradient(135deg,#4285F4,#8B5CF6)",
                      ...(!aiPrompt.trim() || generatingAi || !removedDataUrl ? s.btnOff : {}),
                    }}
                    disabled={!aiPrompt.trim() || generatingAi || !removedDataUrl}
                    onClick={applyAiBg}
                  >
                    {generatingAi
                      ? <span style={s.btnRow}><span style={s.spinInBtn} />Generating with Gemini…</span>
                      : <span style={s.btnRow}>✨ Generate Background</span>}
                  </button>
                  <p style={s.smallNote}>
                    Takes ~15–20 seconds. Imagen 3 generates a photorealistic scene.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#F6F7FB", fontFamily: "system-ui,-apple-system,sans-serif", color: "#111" },

  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #EAECF0" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 },
  logoEmoji: { fontSize: 22 },
  logoText: { fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" },
  gemBadge: { fontSize: 11, fontWeight: 700, background: "#F0F4FF", color: "#4285F4", border: "1px solid #C8D8FF", borderRadius: 6, padding: "3px 8px" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  ghostBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" },
  dlHeaderBtn: { background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  badge: { background: "#6366F1", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 },

  main: { position: "relative", minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "44px 20px" },
  bgDots: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(#C8CAD8 1px,transparent 1px)", backgroundSize: "24px 24px", opacity: 0.35, pointerEvents: "none" },

  // Upload
  uploadCard: { position: "relative", zIndex: 1, background: "#fff", borderRadius: 24, padding: "44px 48px", maxWidth: 560, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 28 },
  heroSection: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  heroIcon: { width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#EEF0FF,#E8F0FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 },
  h1: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" },
  sub: { margin: 0, fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 400 },
  dropZone: { border: "2px dashed #D2D4E0", borderRadius: 16, minHeight: 220, cursor: "pointer", overflow: "hidden", position: "relative", transition: "border-color 0.2s,background 0.2s" },
  dropActive: { borderColor: "#6366F1", background: "#FAFAFF" },
  dropInner: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center", position: "relative", minHeight: 220 },
  checkerSmall: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#F0F0F0 25%,transparent 25%),linear-gradient(-45deg,#F0F0F0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#F0F0F0 75%),linear-gradient(-45deg,transparent 75%,#F0F0F0 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0", opacity: 0.6 },
  dropTitle: { margin: "0 0 6px", fontWeight: 700, fontSize: 15 },
  dropHint: { margin: 0, fontSize: 13, color: "#999" },
  errorBox: { background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "11px 15px", fontSize: 13, color: "#C00", lineHeight: 1.5 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
  featureItem: { display: "flex", alignItems: "center", gap: 8, background: "#F7F8FC", borderRadius: 10, padding: "10px 12px", fontSize: 13 },
  featureLabel: { fontWeight: 600, color: "#444" },

  // Processing card
  processingCard: { position: "relative", zIndex: 1, background: "#fff", borderRadius: 24, padding: "40px 48px", maxWidth: 480, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 },
  processingImgWrap: { position: "relative", width: 200, height: 200, borderRadius: 16, overflow: "hidden" },
  processingImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  processingOverlay: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" },
  bigSpinner: { width: 48, height: 48, border: "4px solid rgba(99,102,241,0.15)", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.85s linear infinite" },
  processingLabel: { margin: 0, fontWeight: 700, fontSize: 16, color: "#333" },
  processingNote: { margin: 0, fontSize: 13, color: "#888", textAlign: "center" },

  // Result layout
  resultLayout: { position: "relative", zIndex: 1, display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 980, width: "100%" },
  previewCol: { flexShrink: 0, width: 380, display: "flex", flexDirection: "column", gap: 12 },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  togglePill: { display: "flex", background: "#EBEBF0", borderRadius: 9, padding: 3 },
  toggleBtn: { padding: "6px 18px", borderRadius: 7, border: "none", background: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  toggleActive: { background: "#fff", color: "#111", boxShadow: "0 1px 5px rgba(0,0,0,0.1)" },
  resetBtn: { fontSize: 12, padding: "5px 10px" },
  imageFrame: { position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minHeight: 300, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  checker: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)", backgroundSize: "14px 14px", backgroundPosition: "0 0,0 7px,7px -7px,-7px 0" },
  resultImg: { width: "100%", display: "block", position: "relative", zIndex: 1, transition: "opacity 0.2s" },
  frameOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  smallSpinner: { width: 28, height: 28, border: "3px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Edit panel
  editPanel: { flex: 1, background: "#fff", borderRadius: 20, padding: "28px 30px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 18 },
  h2: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" },
  sub2: { margin: 0, fontSize: 13, color: "#777" },
  tabBar: { display: "flex", gap: 3, background: "#F0F0F8", borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  tabActive: { background: "#fff", color: "#6366F1", boxShadow: "0 1px 5px rgba(0,0,0,0.1)" },
  tabContent: { display: "flex", flexDirection: "column", gap: 14 },
  sLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888" },

  swatchGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  swatch: { width: 36, height: 36, borderRadius: 9, cursor: "pointer", transition: "transform 0.12s", flexShrink: 0 },
  customRow: { display: "flex", gap: 10, alignItems: "center" },
  colorPicker: { width: 44, height: 44, border: "2px solid #E0E0E8", borderRadius: 8, cursor: "pointer", padding: 2 },
  hexLabel: { fontSize: 13, color: "#666", fontFamily: "monospace", flex: 1 },
  selectBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" },

  gradientGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
  gradSwatch: { height: 52, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "0 6px 5px", transition: "transform 0.12s, outline 0.1s" },
  gradLabel: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 2px rgba(0,0,0,0.4)", lineHeight: 1 },

  bgPreviewWrap: { position: "relative", borderRadius: 10, overflow: "hidden", height: 100 },
  bgPreview: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  changeBgBtn: { position: "absolute", top: 8, right: 8, padding: "4px 10px", fontSize: 12 },
  uploadBgBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 20px", border: "2px dashed #D0D0E0", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#555", background: "#FAFAFC", transition: "all 0.15s" },
  smallNote: { margin: 0, fontSize: 12, color: "#888", lineHeight: 1.5 },

  geminiBadge: { display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg,#4285F4,#8B5CF6)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
  promptBox: { width: "100%", borderRadius: 10, border: "1.5px solid #E0E0EE", padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, color: "#222", background: "#FAFAFA" },
  suggestions: { display: "flex", flexWrap: "wrap", gap: 6 },
  chipBtn: { fontSize: 12, color: "#6366F1", background: "#EEEEFF", border: "1px solid #C4C4F4", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600, transition: "background 0.15s" },

  pendingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0F0FF", border: "1.5px solid #C4C4F0", borderRadius: 10, padding: "10px 14px", gap: 10 },
  pendingLabel: { fontSize: 13, fontWeight: 600, color: "#444" },
  xBtn: { background: "none", border: "none", color: "#AAA", cursor: "pointer", fontSize: 14, padding: 4, flexShrink: 0 },
  primaryBtn: { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnOff: { opacity: 0.4, cursor: "not-allowed" },
  btnRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinInBtn: { display: "inline-block", width: 15, height: 15, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  histPanel: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100, width: "100%" },
  histHeader: { background: "#fff", borderRadius: 16, padding: "20px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  clearBtn: { fontSize: 13, color: "#C00", background: "none", border: "1px solid #FFC4C4", borderRadius: 7, padding: "6px 12px", cursor: "pointer" },
  histGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 },
  histCard: { borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "transform 0.15s,box-shadow 0.15s" },
  histImgWrap: { position: "relative", aspectRatio: "1", overflow: "hidden" },
  histImg: { width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 },
  histMeta: { padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  histName: { fontSize: 12, fontWeight: 700, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  dlIconBtn: { width: 30, height: 30, borderRadius: 7, border: "1px solid #E0E0EE", background: "#F7F8FC", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", flexShrink: 0 },
  emptyState: { background: "#fff", borderRadius: 20, padding: "60px 40px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center" },
};
