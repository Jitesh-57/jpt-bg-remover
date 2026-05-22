"use client";

import { useRef, useState } from "react";

type AttireKey = "keep" | "business-formal" | "smart-casual";
type CropKey = "head-and-shoulders" | "upper-body";
type AspectRatioKey = "1:1" | "4:5";
type Status = "idle" | "ready" | "processing" | "done" | "error";

const BACKGROUNDS = [
  { key: "light-gray-studio", name: "Light Gray", tone: "Studio", color: "#D8D8D8" },
  { key: "executive-office",  name: "Executive Office", tone: "Warm", color: "#C8A882" },
  { key: "glass-boardroom",   name: "Boardroom", tone: "Formal", color: "#7A9EBB" },
  { key: "city-window",       name: "City Window", tone: "Urban", color: "#8DAFC8" },
  { key: "brand-gradient",    name: "Brand Gradient", tone: "Custom", color: "#5B7AA8" },
  { key: "outdoor-campus",    name: "Campus", tone: "Natural", color: "#7BAF7A" },
] as const;

type BackgroundKey = typeof BACKGROUNDS[number]["key"];

const ATTIRE_LABELS: Record<AttireKey, string> = {
  keep: "Keep Outfit",
  "business-formal": "Business Formal",
  "smart-casual": "Smart Casual",
};

const CROP_LABELS: Record<CropKey, string> = {
  "head-and-shoulders": "Headshot",
  "upper-body": "Upper Body",
};

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function HeadshotPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [backgroundKey, setBackgroundKey] = useState<BackgroundKey>("light-gray-studio");
  const [customBg, setCustomBg] = useState("");
  const [attire, setAttire] = useState<AttireKey>("business-formal");
  const [crop, setCrop] = useState<CropKey>("head-and-shoulders");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("1:1");
  const [showOriginal, setShowOriginal] = useState(false);

  function handleFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultDataUrl(null);
    setStatus("ready");
    setErrorMsg("");
    setShowOriginal(false);
  }

  async function generate() {
    if (!file) return;
    setStatus("processing");
    setErrorMsg("");
    setResultDataUrl(null);
    setShowOriginal(false);

    const fd = new FormData();
    fd.append("image", file);
    fd.append("backgroundKey", backgroundKey);
    fd.append("customBackground", customBg);
    fd.append("attire", attire);
    fd.append("crop", crop);
    fd.append("aspectRatio", aspectRatio);

    try {
      const res = await fetch("/api/headshot", { method: "POST", body: fd });
      const data = (await res.json()) as { data?: string; mimeType?: string; error?: string };
      if (!res.ok || !data.data) throw new Error(data.error || "Generation failed");
      setResultDataUrl(`data:${data.mimeType || "image/png"};base64,${data.data}`);
      setStatus("done");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  const displayUrl = showOriginal ? previewUrl : (resultDataUrl || previewUrl);
  const selectedBg = BACKGROUNDS.find((b) => b.key === backgroundKey) ?? BACKGROUNDS[0];

  return (
    <div style={s.page}>
      <div style={s.bgDots} />

      <div style={s.workspace}>
        {/* ── Left Panel ──────────────────────────────────────────────── */}
        <aside style={s.leftPanel}>
          <div style={s.panelCard}>
            <p style={s.panelLabel}>Portrait Photo</p>
            <button style={s.uploadBtn} onClick={() => inputRef.current?.click()}>
              {file ? "↺ Replace Photo" : "⬆ Upload Photo"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file && <p style={s.fileName}>{file.name}</p>}
          </div>

          <div style={s.panelCard}>
            <p style={s.panelLabel}>Wardrobe</p>
            <div style={s.segmented}>
              {(["business-formal", "smart-casual", "keep"] as AttireKey[]).map((opt) => (
                <button
                  key={opt}
                  style={{ ...s.segBtn, ...(attire === opt ? s.segActive : {}) }}
                  onClick={() => setAttire(opt)}
                >
                  {ATTIRE_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          <div style={s.panelCard}>
            <p style={s.panelLabel}>Composition</p>
            <div style={s.twoGrid}>
              {(["head-and-shoulders", "upper-body"] as CropKey[]).map((opt) => (
                <button
                  key={opt}
                  style={{ ...s.optBtn, ...(crop === opt ? s.optActive : {}) }}
                  onClick={() => setCrop(opt)}
                >
                  {CROP_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          <div style={s.panelCard}>
            <p style={s.panelLabel}>Aspect Ratio</p>
            <div style={s.twoGrid}>
              {(["1:1", "4:5"] as AspectRatioKey[]).map((opt) => (
                <button
                  key={opt}
                  style={{ ...s.optBtn, ...(aspectRatio === opt ? s.optActive : {}) }}
                  onClick={() => setAspectRatio(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center Preview ──────────────────────────────────────────── */}
        <section style={s.centerCol}>
          <div style={s.previewHeader}>
            <h1 style={s.pageTitle}>AI Headshot Generator</h1>
            <p style={s.pageSub}>Upload a portrait photo and generate a professional corporate headshot</p>
          </div>

          <div style={s.previewGrid}>
            {/* Original */}
            <div style={s.imgCard}>
              <div style={s.imgCardTop}>
                <span style={s.cardLabel}>Reference</span>
                {file && <span style={s.cardBadge}>{file.type.replace("image/", "").toUpperCase()}</span>}
              </div>
              {previewUrl ? (
                <img src={previewUrl} alt="original" style={s.cardImg} />
              ) : (
                <button style={s.emptyCard} onClick={() => inputRef.current?.click()}>
                  <span style={{ fontSize: 36, marginBottom: 10 }}>🖼</span>
                  <span style={s.emptyLabel}>Add portrait photo</span>
                  <span style={s.emptyHint}>JPG · PNG · WEBP</span>
                </button>
              )}
            </div>

            {/* Result */}
            <div style={s.imgCard}>
              <div style={s.imgCardTop}>
                <span style={s.cardLabel}>Generated</span>
                {status === "done" && <span style={{ ...s.cardBadge, background: "#D1FAE5", color: "#059669" }}>✓ Ready</span>}
              </div>
              {status === "processing" ? (
                <div style={s.processingState}>
                  <div style={s.spinner} />
                  <p style={s.processingText}>Gemini is generating your headshot…</p>
                  <p style={s.processingHint}>Takes 15–30 seconds</p>
                </div>
              ) : resultDataUrl ? (
                <div style={{ position: "relative" }}>
                  <img src={resultDataUrl} alt="generated headshot" style={s.cardImg} />
                </div>
              ) : (
                <div style={s.emptyResult}>
                  <span style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>✨</span>
                  <span style={s.emptyLabel}>Headshot will appear here</span>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div style={s.statusBar}>
            <div style={{ ...s.statusDot, background: status === "done" ? "#10B981" : status === "processing" ? "#F59E0B" : status === "error" ? "#EF4444" : "#D1D5DB" }} />
            <span style={s.statusText}>
              {status === "idle" ? "Upload a portrait photo to begin" :
               status === "ready" ? "Photo ready — configure your options and generate" :
               status === "processing" ? "Generating professional headshot with Gemini AI…" :
               status === "done" ? "Headshot generated successfully" :
               `Error: ${errorMsg}`}
            </span>
          </div>

          {status === "error" && (
            <div style={s.errorBox}>{errorMsg}</div>
          )}

          {/* Action buttons */}
          {status === "done" && resultDataUrl && (
            <div style={s.actionRow}>
              <button style={s.dlBtn} onClick={() => downloadDataUrl(resultDataUrl, "headshot.png")}>
                ⬇ Download PNG
              </button>
              <button style={s.newBtn} onClick={() => { setResultDataUrl(null); setStatus(file ? "ready" : "idle"); }}>
                ↺ Generate Again
              </button>
            </div>
          )}
        </section>

        {/* ── Right Panel (Backgrounds) ───────────────────────────────── */}
        <aside style={s.rightPanel}>
          <div style={s.panelCard}>
            <div style={s.bgPanelHeader}>
              <p style={s.panelLabel}>Background</p>
              <span style={s.bgToneBadge}>{selectedBg.tone}</span>
            </div>
            <div style={s.bgList}>
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.key}
                  style={{ ...s.bgBtn, ...(backgroundKey === bg.key ? s.bgBtnActive : {}) }}
                  onClick={() => setBackgroundKey(bg.key)}
                >
                  <span style={{ ...s.bgSwatch, background: bg.color }} />
                  <span style={s.bgBtnName}>{bg.name}</span>
                  {backgroundKey === bg.key && <span style={s.checkmark}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={s.panelCard}>
            <p style={s.panelLabel}>Custom Background</p>
            <textarea
              value={customBg}
              onChange={(e) => setCustomBg(e.target.value)}
              placeholder="Describe a custom background, e.g. 'Soft white marble studio with warm side lighting'"
              style={s.textarea}
              rows={3}
            />
            {customBg.trim() && (
              <p style={s.customNote}>Custom description overrides the background selection above.</p>
            )}
          </div>

          <div style={s.generateSection}>
            <button
              style={{ ...s.generateBtn, ...(!file || status === "processing" ? s.generateOff : {}) }}
              disabled={!file || status === "processing"}
              onClick={generate}
            >
              {status === "processing" ? (
                <span style={s.btnInner}><span style={s.btnSpinner} /> Generating…</span>
              ) : (
                <span style={s.btnInner}>✨ Generate Headshot</span>
              )}
            </button>
            <p style={s.generateHint}>
              Powered by Gemini · ~15–30 seconds
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 52px)",
    background: "#F5F6FA",
    position: "relative",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  bgDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(#C8CAD8 1px, transparent 1px)",
    backgroundSize: "24px 24px", opacity: 0.3,
  },

  workspace: {
    position: "relative", zIndex: 1,
    maxWidth: 1280, margin: "0 auto",
    padding: "28px 20px",
    display: "flex", gap: 20, alignItems: "flex-start",
  },

  leftPanel: { width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 },
  rightPanel: { width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 },
  centerCol: { flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },

  panelCard: {
    background: "#fff", borderRadius: 14,
    padding: "16px 18px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column", gap: 10,
  },
  panelLabel: {
    margin: 0, fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.1em", color: "#888",
  },

  uploadBtn: {
    background: "#6366F1", color: "#fff",
    border: "none", borderRadius: 9,
    padding: "9px 14px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", width: "100%",
  },
  fileName: { margin: 0, fontSize: 11, color: "#888", wordBreak: "break-all" },

  segmented: { display: "flex", flexDirection: "column", gap: 4 },
  segBtn: {
    padding: "8px 12px", border: "1.5px solid #E8E8F0",
    borderRadius: 8, background: "#fff", fontSize: 12,
    fontWeight: 600, cursor: "pointer", color: "#555",
    textAlign: "left", transition: "all 0.15s",
  },
  segActive: { background: "#EEF0FF", borderColor: "#6366F1", color: "#6366F1" },

  twoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  optBtn: {
    padding: "8px 6px", border: "1.5px solid #E8E8F0",
    borderRadius: 8, background: "#fff", fontSize: 12,
    fontWeight: 600, cursor: "pointer", color: "#555",
    transition: "all 0.15s", textAlign: "center",
  },
  optActive: { background: "#EEF0FF", borderColor: "#6366F1", color: "#6366F1" },

  previewHeader: { marginBottom: 4 },
  pageTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px" },
  pageSub: { margin: 0, fontSize: 13, color: "#666" },

  previewGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
  },
  imgCard: {
    background: "#fff", borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    overflow: "hidden", display: "flex", flexDirection: "column",
  },
  imgCardTop: {
    padding: "12px 16px", display: "flex",
    justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #F0F0F6",
  },
  cardLabel: { fontSize: 12, fontWeight: 700, color: "#444" },
  cardBadge: {
    fontSize: 10, fontWeight: 700, background: "#F0F0F8",
    color: "#777", borderRadius: 5, padding: "2px 7px",
  },
  cardImg: { width: "100%", display: "block", aspectRatio: "1", objectFit: "cover" },
  emptyCard: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    border: "none", background: "#FAFAFC",
    cursor: "pointer", padding: "40px 20px", minHeight: 200,
  },
  emptyResult: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#FAFAFC", padding: "40px 20px", minHeight: 200,
  },
  emptyLabel: { fontSize: 13, fontWeight: 600, color: "#888" },
  emptyHint: { fontSize: 11, color: "#AAA", marginTop: 4 },

  processingState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "40px 20px", minHeight: 200, gap: 12,
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid rgba(99,102,241,0.2)",
    borderTopColor: "#6366F1",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  processingText: { margin: 0, fontWeight: 700, fontSize: 13, color: "#333" },
  processingHint: { margin: 0, fontSize: 12, color: "#999" },

  statusBar: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#fff", borderRadius: 10, padding: "10px 14px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  },
  statusDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  statusText: { fontSize: 13, color: "#555" },
  errorBox: {
    background: "#FFF1F0", border: "1px solid #FFC4C4",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, color: "#C00", lineHeight: 1.5,
  },
  actionRow: { display: "flex", gap: 10 },
  dlBtn: {
    flex: 1, background: "#111", color: "#fff",
    border: "none", borderRadius: 10,
    padding: "11px 16px", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  },
  newBtn: {
    flex: 1, background: "#fff", color: "#444",
    border: "1.5px solid #E0E0EA", borderRadius: 10,
    padding: "11px 16px", fontSize: 13, fontWeight: 700,
    cursor: "pointer",
  },

  bgPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  bgToneBadge: {
    fontSize: 10, fontWeight: 700, background: "#F0F0F8",
    color: "#6366F1", borderRadius: 5, padding: "2px 7px",
  },
  bgList: { display: "flex", flexDirection: "column", gap: 4 },
  bgBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 10px", border: "1.5px solid transparent",
    borderRadius: 9, background: "transparent",
    cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#444",
    transition: "all 0.15s", textAlign: "left",
  },
  bgBtnActive: { background: "#EEF0FF", borderColor: "#6366F1", color: "#6366F1" },
  bgSwatch: { width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" },
  bgBtnName: { flex: 1 },
  checkmark: { fontSize: 12, color: "#6366F1", flexShrink: 0 },

  textarea: {
    width: "100%", border: "1.5px solid #E0E0EE",
    borderRadius: 9, padding: "9px 11px",
    fontSize: 12, fontFamily: "inherit", resize: "vertical",
    outline: "none", lineHeight: 1.6, color: "#222",
    background: "#FAFAFA", boxSizing: "border-box",
  },
  customNote: { margin: 0, fontSize: 11, color: "#6366F1", fontWeight: 600 },

  generateSection: { display: "flex", flexDirection: "column", gap: 8 },
  generateBtn: {
    width: "100%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "14px 20px", fontSize: 14, fontWeight: 800,
    cursor: "pointer", transition: "opacity 0.2s",
    letterSpacing: "-0.2px",
  },
  generateOff: { opacity: 0.45, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSpinner: {
    display: "inline-block", width: 15, height: 15,
    border: "2.5px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  generateHint: { margin: 0, fontSize: 11, color: "#AAA", textAlign: "center" },
};
