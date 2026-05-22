"use client";

import "./globals.css";
import { useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "result";
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
  removedDataUrl: string;
  compositeDataUrl?: string;
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
  "Abstract geometric shapes",
  "Marble texture",
  "Cozy coffee shop",
];

const STORAGE_KEY = "jpt-bgr-history";

// ─── Utils ───────────────────────────────────────────────────────────────────

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

function downloadBlob(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Canvas compositor ───────────────────────────────────────────────────────

async function compositeOnCanvas(
  subjectDataUrl: string,
  bg: { type: "color"; value: string } | { type: "gradient"; preset: GradientPreset } | { type: "image"; src: string }
): Promise<string> {
  const subjectImg = await loadImage(subjectDataUrl);
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
    const x0 = W / 2 - (Math.cos(rad) * W) / 2;
    const y0 = H / 2 - (Math.sin(rad) * H) / 2;
    const x1 = W / 2 + (Math.cos(rad) * W) / 2;
    const y1 = H / 2 + (Math.sin(rad) * H) / 2;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (bg.type === "image") {
    const bgImg = await loadImage(bg.src);
    ctx.drawImage(bgImg, 0, 0, W, H);
  }

  ctx.drawImage(subjectImg, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
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

  // Image state
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [removedDataUrl, setRemovedDataUrl] = useState<string | null>(null);
  const [compositeDataUrl, setCompositeDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");

  // Processing state
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [compositing, setCompositing] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [showOriginal, setShowOriginal] = useState(false);
  const [bgTab, setBgTab] = useState<BgTab>("colors");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  // Edit state
  const [customColor, setCustomColor] = useState("#6366F1");
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [pendingGradient, setPendingGradient] = useState<GradientPreset | null>(null);
  const [bgImageDataUrl, setBgImageDataUrl] = useState<string | null>(null);
  const [bgImageName, setBgImageName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const currentDisplayUrl = showOriginal
    ? originalPreview
    : compositeDataUrl || removedDataUrl;

  // ── Background removal ──────────────────────────────────────────────────────

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

    const preview = URL.createObjectURL(file);
    setOriginalPreview(preview);
    setStep("result");
    setRemoving(true);
    setProgress(0);
    setProgressLabel("Loading AI model…");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgress(pct);
          if (key.startsWith("fetch")) {
            setProgressLabel(pct < 50 ? "Loading AI model…" : "Preparing model…");
          } else {
            setProgressLabel("Removing background…");
          }
        },
        output: { format: "image/png" as const, quality: 1.0 },
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setRemovedDataUrl(dataUrl);
        setRemoving(false);
        setProgress(0);

        // Persist to history
        const item: HistoryItem = {
          id: `bgr-${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, "") || "image",
          removedDataUrl: dataUrl,
          savedAt: Date.now(),
        };
        const updated = [item, ...loadHistory()].slice(0, 20);
        saveHistory(updated);
        setHistory(updated);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("bg removal error:", err);
      setError("Background removal failed. Please try a different image.");
      setRemoving(false);
      setProgress(0);
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

  // ── Background editing ──────────────────────────────────────────────────────

  const applyColor = async (hex: string) => {
    if (!removedDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "color", value: hex });
      setCompositeDataUrl(url);
      updateHistory(url);
    } catch {
      setError("Failed to apply background.");
    } finally {
      setCompositing(false);
      setPendingColor(null);
    }
  };

  const applyGradient = async (preset: GradientPreset) => {
    if (!removedDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "gradient", preset });
      setCompositeDataUrl(url);
      updateHistory(url);
    } catch {
      setError("Failed to apply gradient.");
    } finally {
      setCompositing(false);
      setPendingGradient(null);
    }
  };

  const applyBgImage = async () => {
    if (!removedDataUrl || !bgImageDataUrl || compositing) return;
    setCompositing(true);
    setError(null);
    try {
      const url = await compositeOnCanvas(removedDataUrl, { type: "image", src: bgImageDataUrl });
      setCompositeDataUrl(url);
      updateHistory(url);
    } catch {
      setError("Failed to apply background image.");
    } finally {
      setCompositing(false);
    }
  };

  const applyAiBackground = async () => {
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
      updateHistory(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const updateHistory = (compositeUrl: string) => {
    const items = loadHistory();
    if (items.length === 0) return;
    items[0] = { ...items[0], compositeDataUrl: compositeUrl };
    saveHistory(items);
    setHistory(items);
  };

  const handleDownload = async () => {
    const url = compositeDataUrl || removedDataUrl;
    if (!url) return;
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 100));
    downloadBlob(url, `${fileName}-no-bg`);
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
    setRemoving(false);
    setShowHistory(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo} onClick={reset}>
            <span style={s.logoEmoji}>✂️</span>
            <span style={s.logoText}>JPT Background Remover</span>
            <span style={s.gemBadge}>Gemini AI</span>
          </div>
          <div style={s.headerRight}>
            {step === "result" && !showHistory && (
              <button className="ghost-btn" style={s.ghostBtn} onClick={reset}>
                + New Image
              </button>
            )}
            {step === "result" && !showHistory && (removedDataUrl || compositeDataUrl) && (
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

        {/* ── History Panel ─────────────────────────────────────────────────── */}
        {showHistory && (
          <div style={s.histPanel} className="animate-in">
            <div style={s.histHeader}>
              <div>
                <h2 style={s.h2}>History</h2>
                <p style={s.sub2}>Your recent background removals (stored locally)</p>
              </div>
              {history.length > 0 && (
                <button
                  style={s.clearHistBtn}
                  onClick={() => { saveHistory([]); setHistory([]); }}
                >
                  Clear all
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>✂️</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>No history yet</p>
                <p style={{ margin: "6px 0 16px", color: "#888", fontSize: 14 }}>
                  Remove some backgrounds and they&apos;ll appear here
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
                      <img
                        src={item.compositeDataUrl || item.removedDataUrl}
                        alt={item.name}
                        style={s.histImg}
                      />
                      {item.compositeDataUrl && (
                        <div style={s.editedBadge}>edited</div>
                      )}
                    </div>
                    <div style={s.histMeta}>
                      <span style={s.histName}>{item.name}</span>
                      <button
                        style={s.dlIconBtn}
                        title="Download PNG"
                        onClick={() =>
                          downloadBlob(
                            item.compositeDataUrl || item.removedDataUrl,
                            item.name
                          )
                        }
                      >
                        ⬇
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upload Step ──────────────────────────────────────────────────── */}
        {!showHistory && step === "upload" && (
          <div style={s.uploadCard} className="animate-in">
            <div style={s.heroSection}>
              <div style={s.heroIconWrap}>✂️</div>
              <h1 style={s.h1}>Remove Image Background</h1>
              <p style={s.sub}>
                AI-powered background removal — runs in your browser, instant results.
                <br />Generate new backgrounds with <strong>Gemini AI</strong>.
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
                <div style={{ fontSize: 48, marginBottom: 16, position: "relative", zIndex: 1 }}>
                  📎
                </div>
                <p style={{ ...s.dropTitle, position: "relative", zIndex: 1 }}>
                  Drop your image here or <span style={{ color: "#6366F1" }}>click to browse</span>
                </p>
                <p style={{ ...s.dropHint, position: "relative", zIndex: 1 }}>
                  JPG · PNG · WEBP · GIF — People, products, objects, pets
                </p>
              </div>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.featureList}>
              {[
                { icon: "⚡", text: "Instant removal" },
                { icon: "🎨", text: "Custom backgrounds" },
                { icon: "🤖", text: "Gemini AI scenes" },
                { icon: "📥", text: "PNG download" },
              ].map((f) => (
                <div key={f.text} style={s.featureItem}>
                  <span style={s.featureIcon}>{f.icon}</span>
                  <span style={s.featureText}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Result Step ──────────────────────────────────────────────────── */}
        {!showHistory && step === "result" && (
          <div style={s.resultLayout} className="animate-in">
            {/* Left: Preview */}
            <div style={s.previewCol}>
              {/* Toggle bar */}
              <div style={s.toggleRow}>
                <div style={s.togglePill}>
                  <button
                    style={{ ...s.toggleBtn, ...(showOriginal ? {} : s.toggleActive) }}
                    onClick={() => setShowOriginal(false)}
                  >
                    Result
                  </button>
                  <button
                    style={{ ...s.toggleBtn, ...(showOriginal ? s.toggleActive : {}), ...(removing ? { opacity: 0.5 } : {}) }}
                    onClick={() => !removing && setShowOriginal(true)}
                  >
                    Original
                  </button>
                </div>
                {compositeDataUrl && !showOriginal && (
                  <button
                    className="ghost-btn"
                    style={s.resetBtn}
                    onClick={() => setCompositeDataUrl(null)}
                  >
                    ↺ Reset
                  </button>
                )}
              </div>

              {/* Image frame */}
              <div style={s.imageFrame}>
                {/* Checkerboard (only for transparent result) */}
                {!showOriginal && !compositeDataUrl && <div style={s.checker} />}

                {removing ? (
                  <div style={s.processingBox}>
                    <div style={s.processingCard}>
                      <div style={s.bigSpinner} />
                      <p style={s.progressLabel}>{progressLabel || "Processing…"}</p>
                      {progress > 0 && (
                        <>
                          <div style={s.progressBarWrap}>
                            <div style={{ ...s.progressBar, width: `${progress}%` }} />
                          </div>
                          <p style={s.progressPct}>{progress}%</p>
                        </>
                      )}
                      <p style={s.progressNote}>
                        First load downloads the AI model (~25 MB) — cached afterwards
                      </p>
                    </div>
                  </div>
                ) : currentDisplayUrl ? (
                  <img
                    src={currentDisplayUrl}
                    alt="result"
                    style={{
                      ...s.resultImg,
                      ...(compositing || generatingAi ? { opacity: 0.45 } : {}),
                    }}
                  />
                ) : null}

                {(compositing || generatingAi) && (
                  <div style={s.imgOverlay}>
                    <div style={s.spinnerSmall} />
                    <span style={{ color: "#fff", fontSize: 13, marginTop: 8 }}>
                      {generatingAi ? "Generating with Gemini…" : "Applying background…"}
                    </span>
                  </div>
                )}
              </div>

              {error && <div style={s.errorBox}>{error}</div>}
            </div>

            {/* Right: Edit Panel */}
            <div style={s.editPanel}>
              <div style={s.editPanelHead}>
                <h2 style={s.h2}>Edit Background</h2>
                <p style={s.sub2}>Replace the background or keep it transparent</p>
              </div>

              {/* Tab Bar */}
              <div style={s.tabBar}>
                {(
                  [
                    { id: "colors", label: "🎨 Colors" },
                    { id: "gradients", label: "🌈 Gradients" },
                    { id: "image", label: "🖼 Image" },
                    { id: "ai", label: "✨ AI" },
                  ] as { id: BgTab; label: string }[]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    className="tab-btn"
                    style={{ ...s.tabBtn, ...(bgTab === id ? s.tabActive : {}) }}
                    onClick={() => setBgTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Colors Tab ─────────────────────────────────────────────── */}
              {bgTab === "colors" && (
                <div style={s.tabContent}>
                  <p style={s.sectionLabel}>Preset Colors</p>
                  <div style={s.swatchGrid}>
                    {SOLID_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        title={c.label}
                        className="swatch"
                        disabled={compositing || removing}
                        style={{
                          ...s.swatch,
                          background: c.hex,
                          border:
                            c.hex === "#FFFFFF"
                              ? "2px solid #DDD"
                              : `2px solid ${c.hex}`,
                          outline:
                            pendingColor === c.hex
                              ? "3px solid #6366F1"
                              : "none",
                          outlineOffset: 2,
                        }}
                        onClick={() => setPendingColor(c.hex)}
                      />
                    ))}
                  </div>

                  <p style={{ ...s.sectionLabel, marginTop: 16 }}>Custom Color</p>
                  <div style={s.customColorRow}>
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
                      disabled={compositing || removing}
                      onClick={() => setPendingColor(customColor)}
                    >
                      {pendingColor === customColor ? "✓ Selected" : "Select"}
                    </button>
                  </div>

                  {pendingColor && (
                    <div style={s.pendingRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: pendingColor,
                            border: "2px solid #DDD",
                          }}
                        />
                        <span style={s.pendingLabel}>Color selected</span>
                      </div>
                      <button style={s.xBtn} onClick={() => setPendingColor(null)}>
                        ✕
                      </button>
                    </div>
                  )}

                  <button
                    style={{
                      ...s.primaryBtn,
                      ...(!pendingColor || compositing || removing || !removedDataUrl
                        ? s.btnOff
                        : {}),
                    }}
                    disabled={!pendingColor || compositing || removing || !removedDataUrl}
                    onClick={() => pendingColor && applyColor(pendingColor)}
                  >
                    {compositing ? (
                      <span style={s.btnInner}>
                        <span style={s.spinnerInBtn} /> Applying…
                      </span>
                    ) : (
                      "Apply Color"
                    )}
                  </button>
                </div>
              )}

              {/* ── Gradients Tab ───────────────────────────────────────────── */}
              {bgTab === "gradients" && (
                <div style={s.tabContent}>
                  <p style={s.sectionLabel}>Preset Gradients</p>
                  <div style={s.gradientGrid}>
                    {GRADIENTS.map((g) => (
                      <button
                        key={g.label}
                        disabled={compositing || removing}
                        style={{
                          ...s.gradientSwatch,
                          background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
                          outline:
                            pendingGradient?.label === g.label
                              ? "3px solid #6366F1"
                              : "none",
                          outlineOffset: 2,
                        }}
                        onClick={() => setPendingGradient(g)}
                        title={g.label}
                      >
                        <span style={s.gradientLabel}>{g.label}</span>
                      </button>
                    ))}
                  </div>

                  {pendingGradient && (
                    <div style={s.pendingRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: `linear-gradient(${pendingGradient.angle}deg, ${pendingGradient.from}, ${pendingGradient.to})`,
                          }}
                        />
                        <span style={s.pendingLabel}>{pendingGradient.label} selected</span>
                      </div>
                      <button style={s.xBtn} onClick={() => setPendingGradient(null)}>
                        ✕
                      </button>
                    </div>
                  )}

                  <button
                    style={{
                      ...s.primaryBtn,
                      ...(!pendingGradient || compositing || removing || !removedDataUrl
                        ? s.btnOff
                        : {}),
                    }}
                    disabled={!pendingGradient || compositing || removing || !removedDataUrl}
                    onClick={() => pendingGradient && applyGradient(pendingGradient)}
                  >
                    {compositing ? (
                      <span style={s.btnInner}>
                        <span style={s.spinnerInBtn} /> Applying…
                      </span>
                    ) : (
                      "Apply Gradient"
                    )}
                  </button>
                </div>
              )}

              {/* ── Image Tab ────────────────────────────────────────────────── */}
              {bgTab === "image" && (
                <div style={s.tabContent}>
                  <p style={s.sectionLabel}>Upload Background Image</p>
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
                      <button
                        className="ghost-btn"
                        style={s.changeBgBtn}
                        onClick={() => bgFileInputRef.current?.click()}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      className="ghost-btn"
                      style={s.uploadBgBtn}
                      onClick={() => bgFileInputRef.current?.click()}
                      disabled={compositing || removing}
                    >
                      <span style={{ fontSize: 22 }}>🖼</span>
                      <span>Choose Background Image</span>
                    </button>
                  )}

                  {bgImageName && (
                    <div style={s.pendingRow}>
                      <span style={s.pendingLabel}>🖼 {bgImageName}</span>
                      <button
                        style={s.xBtn}
                        onClick={() => { setBgImageDataUrl(null); setBgImageName(""); }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <p style={s.noteText}>
                    Your background image is used as-is. The subject is composited on top with clean edges.
                  </p>

                  <button
                    style={{
                      ...s.primaryBtn,
                      ...(!bgImageDataUrl || compositing || removing || !removedDataUrl
                        ? s.btnOff
                        : {}),
                    }}
                    disabled={!bgImageDataUrl || compositing || removing || !removedDataUrl}
                    onClick={applyBgImage}
                  >
                    {compositing ? (
                      <span style={s.btnInner}>
                        <span style={s.spinnerInBtn} /> Applying…
                      </span>
                    ) : (
                      "Apply Background"
                    )}
                  </button>
                </div>
              )}

              {/* ── AI Tab ───────────────────────────────────────────────────── */}
              {bgTab === "ai" && (
                <div style={s.tabContent}>
                  <div style={s.aiLabel}>
                    <span style={s.geminiChip}>✨ Gemini AI</span>
                    <p style={s.sectionLabel} >Generate any background</p>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={
                      'Describe a background…\ne.g. "Warm sunset over the ocean"\n"Modern minimalist office"\n"Abstract purple gradient"'
                    }
                    style={s.promptBox}
                    rows={3}
                    disabled={generatingAi || removing}
                  />

                  <p style={s.sectionLabel}>Quick Suggestions</p>
                  <div style={s.suggestionGrid}>
                    {AI_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        className="chip-btn"
                        style={s.chipBtn}
                        onClick={() => setAiPrompt(sug)}
                        disabled={generatingAi || removing}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <button
                    style={{
                      ...s.primaryBtn,
                      ...s.aiBtnGrad,
                      ...(!aiPrompt.trim() || generatingAi || removing || !removedDataUrl
                        ? s.btnOff
                        : {}),
                    }}
                    disabled={!aiPrompt.trim() || generatingAi || removing || !removedDataUrl}
                    onClick={applyAiBackground}
                  >
                    {generatingAi ? (
                      <span style={s.btnInner}>
                        <span style={s.spinnerInBtn} /> Generating with Gemini…
                      </span>
                    ) : (
                      <span style={s.btnInner}>✨ Generate Background</span>
                    )}
                  </button>
                  <p style={s.noteText}>
                    Takes ~10–20 seconds. Imagen 3 generates a scene that matches your description.
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

  // Header
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #EAECF0" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  logo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 },
  logoEmoji: { fontSize: 22 },
  logoText: { fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" },
  gemBadge: { fontSize: 11, fontWeight: 700, background: "#F0F4FF", color: "#4285F4", border: "1px solid #C8D8FF", borderRadius: 6, padding: "2px 8px" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  ghostBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" },
  dlHeaderBtn: { background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  badge: { background: "#6366F1", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 },

  // Main layout
  main: { position: "relative", minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "44px 20px" },
  bgDots: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(#C8CAD8 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.35, pointerEvents: "none" },

  // Upload card
  uploadCard: { position: "relative", zIndex: 1, background: "#fff", borderRadius: 24, padding: "44px 48px", maxWidth: 540, width: "100%", boxShadow: "0 4px 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 28, animation: "fadeIn 0.3s ease" },
  heroSection: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  heroIconWrap: { width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#EEF0FF,#E8F0FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 },
  h1: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2 },
  sub: { margin: 0, fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 380 },
  dropZone: { border: "2px dashed #D2D4E0", borderRadius: 16, minHeight: 220, cursor: "pointer", overflow: "hidden", position: "relative", transition: "border-color 0.2s, background 0.2s" },
  dropActive: { borderColor: "#6366F1", background: "#FAFAFF" },
  dropInner: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", textAlign: "center", position: "relative", minHeight: 220 },
  checkerSmall: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#F0F0F0 25%,transparent 25%),linear-gradient(-45deg,#F0F0F0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#F0F0F0 75%),linear-gradient(-45deg,transparent 75%,#F0F0F0 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0", opacity: 0.55 },
  dropTitle: { margin: "0 0 6px", fontWeight: 700, fontSize: 15 },
  dropHint: { margin: 0, fontSize: 13, color: "#999" },
  errorBox: { background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "11px 15px", fontSize: 13, color: "#C00", lineHeight: 1.5 },
  featureList: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  featureItem: { display: "flex", alignItems: "center", gap: 10, background: "#F7F8FC", borderRadius: 10, padding: "10px 14px" },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: 13, fontWeight: 600, color: "#444" },

  // Result layout
  resultLayout: { position: "relative", zIndex: 1, display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1000, width: "100%", animation: "fadeIn 0.3s ease" },
  previewCol: { flexShrink: 0, width: 380, display: "flex", flexDirection: "column", gap: 12 },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  togglePill: { display: "flex", background: "#EBEBF0", borderRadius: 9, padding: 3 },
  toggleBtn: { padding: "6px 18px", borderRadius: 7, border: "none", background: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  toggleActive: { background: "#fff", color: "#111", boxShadow: "0 1px 5px rgba(0,0,0,0.1)" },
  resetBtn: { fontSize: 12, padding: "5px 10px" },
  imageFrame: { position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minHeight: 320, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  checker: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)", backgroundSize: "14px 14px", backgroundPosition: "0 0,0 7px,7px -7px,-7px 0" },
  resultImg: { width: "100%", display: "block", position: "relative", zIndex: 1, transition: "opacity 0.2s" },
  processingBox: { width: "100%", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 },
  processingCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 24px", textAlign: "center" },
  bigSpinner: { width: 48, height: 48, border: "4px solid rgba(99,102,241,0.15)", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.85s linear infinite" },
  progressLabel: { margin: 0, fontWeight: 700, fontSize: 15, color: "#333" },
  progressBarWrap: { width: 200, height: 6, background: "#E8E8F0", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", background: "linear-gradient(90deg,#6366F1,#8B5CF6)", borderRadius: 3, transition: "width 0.3s ease" },
  progressPct: { margin: 0, fontSize: 12, color: "#888", fontWeight: 600 },
  progressNote: { margin: 0, fontSize: 11, color: "#AAA", maxWidth: 220, lineHeight: 1.5 },
  imgOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  spinnerSmall: { width: 28, height: 28, border: "3px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Edit panel
  editPanel: { flex: 1, background: "#fff", borderRadius: 20, padding: "28px 30px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 20 },
  editPanelHead: { display: "flex", flexDirection: "column", gap: 4 },
  h2: { margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" },
  sub2: { margin: 0, fontSize: 13, color: "#777" },
  tabBar: { display: "flex", gap: 3, background: "#F0F0F8", borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#888", transition: "all 0.15s" },
  tabActive: { background: "#fff", color: "#6366F1", boxShadow: "0 1px 5px rgba(0,0,0,0.1)" },
  tabContent: { display: "flex", flexDirection: "column", gap: 14 },
  sectionLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888" },

  // Colors
  swatchGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  swatch: { width: 36, height: 36, borderRadius: 9, cursor: "pointer", transition: "transform 0.12s", flexShrink: 0 },
  customColorRow: { display: "flex", gap: 10, alignItems: "center" },
  colorPicker: { width: 44, height: 44, border: "2px solid #E0E0E8", borderRadius: 8, cursor: "pointer", padding: 2 },
  hexLabel: { fontSize: 13, color: "#666", fontFamily: "monospace", flex: 1 },
  selectBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" },

  // Gradients
  gradientGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  gradientSwatch: { height: 56, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "0 6px 6px", transition: "transform 0.12s, outline 0.1s" },
  gradientLabel: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 2px rgba(0,0,0,0.4)", lineHeight: 1 },

  // Image bg
  bgPreviewWrap: { position: "relative", borderRadius: 10, overflow: "hidden", height: 100 },
  bgPreview: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  changeBgBtn: { position: "absolute", top: 8, right: 8, padding: "4px 10px", fontSize: 12 },
  uploadBgBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 20px", border: "2px dashed #D0D0E0", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#555", background: "#FAFAFC", transition: "all 0.15s" },
  noteText: { margin: 0, fontSize: 12, color: "#888", lineHeight: 1.5 },

  // AI
  aiLabel: { display: "flex", flexDirection: "column", gap: 6 },
  geminiChip: { display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg,#4285F4,#8B5CF6)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  promptBox: { width: "100%", borderRadius: 10, border: "1.5px solid #E0E0EE", padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, color: "#222", background: "#FAFAFA" },
  suggestionGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  chipBtn: { fontSize: 12, color: "#6366F1", background: "#EEEEFF", border: "1px solid #C4C4F4", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600, transition: "background 0.15s" },
  aiBtnGrad: { background: "linear-gradient(135deg,#4285F4,#8B5CF6)" },

  // Shared
  pendingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0F0FF", border: "1.5px solid #C4C4F0", borderRadius: 10, padding: "10px 14px", gap: 10 },
  pendingLabel: { fontSize: 13, fontWeight: 600, color: "#444" },
  xBtn: { background: "none", border: "none", color: "#AAA", cursor: "pointer", fontSize: 14, padding: 4, flexShrink: 0 },
  primaryBtn: { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnOff: { opacity: 0.4, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinnerInBtn: { display: "inline-block", width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // History
  histPanel: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100, width: "100%", animation: "fadeIn 0.3s ease" },
  histHeader: { background: "#fff", borderRadius: 16, padding: "20px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  clearHistBtn: { fontSize: 13, color: "#C00", background: "none", border: "1px solid #FFC4C4", borderRadius: 7, padding: "6px 12px", cursor: "pointer" },
  histGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16 },
  histCard: { borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "transform 0.15s, box-shadow 0.15s" },
  histImgWrap: { position: "relative", aspectRatio: "1", overflow: "hidden" },
  histImg: { width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 },
  editedBadge: { position: "absolute", top: 8, right: 8, background: "#6366F1", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 5, padding: "2px 6px", zIndex: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  histMeta: { padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  histName: { fontSize: 12, fontWeight: 700, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  dlIconBtn: { width: 30, height: 30, borderRadius: 7, border: "1px solid #E0E0EE", background: "#F7F8FC", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", flexShrink: 0 },
  emptyState: { background: "#fff", borderRadius: 20, padding: "60px 40px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center" },
};
