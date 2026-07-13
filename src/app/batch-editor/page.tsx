"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import PricingModal from "@/app/_components/PricingModal";
import { removeBackgroundSmart } from "@/lib/remove-bg-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransformType = "resize" | "adjust" | "upscale" | "ai-edit" | "remove-bg" | "generate-bg";
type ItemStatus = "pending" | "processing" | "done" | "error";

interface BatchItem {
  id: string;
  file: File;
  name: string;
  originalDataUrl: string;
  w: number;
  h: number;
  resultDataUrl: string | null;
  status: ItemStatus;
  error?: string;
}

interface User { email: string; name: string; credits: number; plan?: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 100;
const MAX_DIMENSION = 1024;

const TRANSFORMS: { id: TransformType; label: string; icon: string; desc: string; creditsEach: number; aiOnly?: boolean }[] = [
  { id: "resize",      label: "Resize",       icon: "↔️", desc: "Resize to custom dimensions",                creditsEach: 0 },
  { id: "adjust",      label: "Color Adjust", icon: "🎨", desc: "Brightness / contrast / saturation",        creditsEach: 0 },
  { id: "upscale",     label: "Upscale",      icon: "🔍", desc: "2× or 4× super-resolution",                 creditsEach: 1 },
  { id: "ai-edit",     label: "AI Edit",      icon: "✨", desc: "Transform with text prompt via Gemini",     creditsEach: 2, aiOnly: true },
  { id: "remove-bg",   label: "Remove BG",    icon: "🪄", desc: "Remove background — free, in your browser",  creditsEach: 0 },
  { id: "generate-bg", label: "Generate BG",  icon: "🌅", desc: "Replace background with AI scene",          creditsEach: 2, aiOnly: true },
];

// ─── Utils ────────────────────────────────────────────────────────────────────

async function fileToDataUrl(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const sc = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * sc); h = Math.round(h * sc);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.92), w, h });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src;
  });
}

async function canvasResize(dataUrl: string, w: number, h: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function canvasAdjust(dataUrl: string, brightness: number, contrast: number, saturation: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BatchEditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<TransformType>>(new Set<TransformType>(["resize"]));
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // Per-tool options
  const [resizeW, setResizeW] = useState(800);
  const [resizeH, setResizeH] = useState(600);
  const [lockAspect, setLockAspect] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [aiPrompt, setAiPrompt] = useState("");
  const [bgPrompt, setBgPrompt] = useState("Soft blurred white background, professional studio style");
  const [upscaleScale, setUpscaleScale] = useState<"2x" | "4x">("2x");
  const [upscaleMode, setUpscaleMode] = useState<"normal" | "pro">("normal");
  const [removeBgOutput, setRemoveBgOutput] = useState<"transparent" | "white" | "color" | "image">("transparent");
  const [removeBgColor, setRemoveBgColor] = useState("#ffffff");
  const [removeBgImageDataUrl, setRemoveBgImageDataUrl] = useState<string | null>(null);
  const removeBgImageRef = useRef<HTMLInputElement>(null);
  const [openOptionsFor, setOpenOptionsFor] = useState<TransformType | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then(r => r.json())
      .then((d: { authenticated: boolean; email?: string; name?: string; credits?: number; plan?: string }) => {
        if (d.authenticated && d.email) setUser({ email: d.email, name: d.name!, credits: d.credits ?? 0, plan: d.plan });
      }).catch(() => null);
  }, []);

  const toggleTool = (id: TransformType) => {
    const transform = TRANSFORMS.find(t => t.id === id);
    // If selecting a paid AI tool and user lacks plan/credits, show pricing modal
    if (transform?.aiOnly && !selectedTools.has(id)) {
      if (user?.plan === "free" || (user && user.credits < transform.creditsEach)) {
        setShowPricingModal(true);
        return;
      }
    }
    setSelectedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setOpenOptionsFor(p => p === id ? null : p);
      } else {
        next.add(id);
        setOpenOptionsFor(id);
      }
      return next;
    });
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    const toAdd = arr.slice(0, MAX_IMAGES - items.length);
    if (!toAdd.length) return;
    const newItems = (await Promise.all(toAdd.map(async (file) => {
      try {
        const { dataUrl, w, h } = await fileToDataUrl(file);
        return { id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, file, name: file.name.replace(/\.[^.]+$/, ""), originalDataUrl: dataUrl, w, h, resultDataUrl: null, status: "pending" as ItemStatus };
      } catch { return null; }
    }))).filter(Boolean) as BatchItem[];
    setItems(prev => [...prev, ...newItems]);
  }, [items.length]);

  // Credits needed: sum of (creditsEach * images) for all selected tools
  const effectiveCredits = (t: typeof TRANSFORMS[0]) => t.id === "upscale" && upscaleMode === "pro" ? 2 : t.creditsEach;
  const creditsNeeded = TRANSFORMS
    .filter(t => selectedTools.has(t.id))
    .reduce((sum, t) => sum + effectiveCredits(t) * items.filter(i => i.status === "pending").length, 0);

  const pendingItems = items.filter(i => i.status === "pending");

  // Upload dataUrl to Supabase and return public URL (avoids 4.5MB Vercel body limit).
  // Falls back to passing the dataUrl directly if upload fails.
  const uploadOrFallback = async (dataUrl: string): Promise<{ imageUrl?: string; dataUrl?: string }> => {
    try {
      const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
      const imageUrl = await uploadDataUrlToSupabase(dataUrl);
      return { imageUrl };
    } catch {
      return { dataUrl };
    }
  };

  const applyToolToSrc = async (tool: TransformType, src: string, originalW: number, originalH: number): Promise<string> => {
    if (tool === "resize") {
      const targetH = lockAspect ? Math.round(resizeW * originalH / originalW) : resizeH;
      return canvasResize(src, resizeW, targetH);
    }
    if (tool === "adjust") {
      return canvasAdjust(src, brightness, contrast, saturation);
    }
    if (tool === "upscale") {
      if (upscaleMode === "pro") {
        const imgPayload = await uploadOrFallback(src);
        const res = await fetch("/api/upscale-pro", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...imgPayload, scale: upscaleScale }),
        });
        const data = await res.json() as { dataUrl?: string; credits?: number; error?: string };
        if (!res.ok) throw new Error(data.error || "Pro upscale failed");
        if (typeof data.credits === "number") setUser(u => u ? { ...u, credits: data.credits! } : u);
        return data.dataUrl!;
      } else {
        const deductRes = await fetch("/api/credits/deduct", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "basic-upscale" }),
        });
        if (!deductRes.ok) throw new Error("Not enough credits for upscale");
        const dd = await deductRes.json() as { credits?: number };
        if (typeof dd.credits === "number") setUser(u => u ? { ...u, credits: dd.credits! } : u);
        const { upscaleImage } = await import("@/lib/upscale-client");
        return upscaleImage(src, upscaleScale);
      }
    }
    if (tool === "ai-edit") {
      const imgPayload = await uploadOrFallback(src);
      const res = await fetch("/api/ai-edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...imgPayload, prompt: aiPrompt }),
      });
      const data = await res.json() as { dataUrl?: string; credits?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "AI edit failed");
      if (typeof data.credits === "number") setUser(u => u ? { ...u, credits: data.credits! } : u);
      return data.dataUrl!;
    }
    if (tool === "remove-bg") {
      // Free removal — in-browser engine with automatic server fallback.
      const cutout = await removeBackgroundSmart(src);
      // Composite onto background if needed
      if (removeBgOutput === "transparent") return cutout;
      const bgImg = await loadImg(cutout);
      const W = bgImg.naturalWidth, H = bgImg.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      if (removeBgOutput === "white" || removeBgOutput === "color") {
        ctx.fillStyle = removeBgOutput === "white" ? "#ffffff" : removeBgColor;
        ctx.fillRect(0, 0, W, H);
      } else if (removeBgOutput === "image" && removeBgImageDataUrl) {
        const bgSrc = await loadImg(removeBgImageDataUrl);
        ctx.drawImage(bgSrc, 0, 0, W, H);
      }
      ctx.drawImage(bgImg, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.93);
    }
    if (tool === "generate-bg") {
      const imgPayload = await uploadOrFallback(src);
      const res = await fetch("/api/ai-edit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...imgPayload, prompt: `Replace the background with: ${bgPrompt}. Keep the subject exactly as-is.` }),
      });
      const data = await res.json() as { dataUrl?: string; credits?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Generate BG failed");
      if (typeof data.credits === "number") setUser(u => u ? { ...u, credits: data.credits! } : u);
      return data.dataUrl!;
    }
    throw new Error("Unknown tool");
  };

  const runBatch = async () => {
    if (!pendingItems.length || processing || !selectedTools.size) return;

    const hasAiTool = TRANSFORMS.some(t => selectedTools.has(t.id) && t.aiOnly);
    if (hasAiTool && user?.plan === "free") {
      setShowPricingModal(true);
      return;
    }
    if (creditsNeeded > (user?.credits ?? 0)) {
      setShowPricingModal(true);
      return;
    }

    // Ordered tools to apply in sequence
    const toolOrder: TransformType[] = ["resize", "adjust", "upscale", "remove-bg", "ai-edit", "generate-bg"];
    const activeTools = toolOrder.filter(t => selectedTools.has(t));

    setProcessing(true);
    setProcessedCount(0);

    for (const item of pendingItems) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "processing" } : i));
      try {
        let src = item.originalDataUrl;
        for (const tool of activeTools) {
          src = await applyToolToSrc(tool, src, item.w, item.h);
        }
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "done", resultDataUrl: src } : i));
      } catch (e) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", error: (e as Error).message } : i));
      }
      setProcessedCount(c => c + 1);
    }

    setProcessing(false);
  };

  const downloadAll = async () => {
    const done = items.filter(i => i.resultDataUrl);
    if (!done.length) return;
    if (done.length === 1) {
      const a = document.createElement("a");
      a.href = done[0].resultDataUrl!;
      a.download = `${done[0].name}-edited.${done[0].resultDataUrl!.includes("image/png") ? "png" : "jpg"}`;
      a.click();
      return;
    }
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    done.forEach(item => {
      const ext = item.resultDataUrl!.includes("image/png") ? "png" : "jpg";
      zip.file(`${item.name}-edited.${ext}`, item.resultDataUrl!.split(",")[1], { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jpt-batch-edited.zip"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (item: BatchItem) => {
    if (!item.resultDataUrl) return;
    const a = document.createElement("a");
    a.href = item.resultDataUrl;
    a.download = `${item.name}-edited.${item.resultDataUrl.includes("image/png") ? "png" : "jpg"}`;
    a.click();
  };

  const doneCount = items.filter(i => i.status === "done").length;
  const errorCount = items.filter(i => i.status === "error").length;
  const totalPending = pendingItems.length;
  const totalToProcess = processing ? items.filter(i => i.status !== "pending").length + processedCount : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "system-ui, sans-serif" }}>

      {showPricingModal && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          onPurchaseSuccess={(_, newCredits) => {
            setUser(u => u ? { ...u, credits: newCredits, plan: "paid" } : u);
            setShowPricingModal(false);
          }}
          prefillUser={user ? { name: user.name, email: user.email } : undefined}
        />
      )}

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ color: "#6366F1", fontWeight: 900, fontSize: 17, textDecoration: "none" }}>✦ JPT AI</a>
          <span style={{ color: "#D1D5DB" }}>|</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>⚡ Batch Editor</span>
          <span style={{ background: "#EEF2FF", color: "#6366F1", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Up to 100 images</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <span style={{ background: "#F3F4F6", padding: "6px 12px", borderRadius: 20, fontSize: 13, color: "#374151", fontWeight: 600 }}>
              ⚡ {user.credits} credits
            </span>
          )}
          {doneCount > 0 && (
            <button onClick={downloadAll} style={{ padding: "9px 20px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              ⬇ Download All ({doneCount})
            </button>
          )}
          <a href="/editor" style={{ padding: "8px 14px", background: "#fff", color: "#6366F1", border: "1.5px solid #6366F1", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            Single Editor
          </a>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: isMobile ? undefined : "calc(100vh - 61px)", minHeight: isMobile ? "calc(100vh - 61px)" : undefined }}>

        {/* ── Mobile: Tool Tab Strip ────────────────────────────────────────── */}
        {isMobile && (
          <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #EAEAEA", padding: "8px 12px", gap: 8, WebkitOverflowScrolling: "touch" as unknown as React.CSSProperties["WebkitOverflowScrolling"], flexShrink: 0 }}>
            {TRANSFORMS.map(t => {
              const active = selectedTools.has(t.id);
              return (
                <button key={t.id} onClick={() => toggleTool(t.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 12, border: "2px solid", borderColor: active ? "#6366F1" : "transparent", background: active ? "#EEEEFF" : "#F5F5F5", cursor: "pointer", minWidth: 64, flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#6366F1" : "#666", whiteSpace: "nowrap" }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Mobile: Options Section ───────────────────────────────────────── */}
        {isMobile && openOptionsFor && (() => {
          const t = TRANSFORMS.find(x => x.id === openOptionsFor)!;
          return (
            <div style={{ width: "100%", background: "#fff", borderBottom: "1px solid #E5E7EB", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{t.icon} {t.label} Options</div>
                <button onClick={() => setOpenOptionsFor(null)} style={{ background: "none", border: "none", fontSize: 18, color: "#9CA3AF", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>

              {openOptionsFor === "resize" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={optionLabel}>Width</label>
                      <input type="number" value={resizeW} min={1} max={8000} onChange={e => setResizeW(+e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={optionLabel}>Height</label>
                      <input type="number" value={resizeH} min={1} max={8000} onChange={e => setResizeH(+e.target.value)} disabled={lockAspect} style={{ ...inputStyle, opacity: lockAspect ? 0.5 : 1 }} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
                    <input type="checkbox" checked={lockAspect} onChange={e => setLockAspect(e.target.checked)} />
                    Lock aspect ratio (height auto)
                  </label>
                </div>
              )}

              {openOptionsFor === "adjust" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Brightness", value: brightness, set: setBrightness },
                    { label: "Contrast",   value: contrast,   set: setContrast   },
                    { label: "Saturation", value: saturation, set: setSaturation },
                  ].map(({ label, value, set }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                        <span style={{ fontSize: 12, color: "#6366F1", fontWeight: 700 }}>{value}%</span>
                      </div>
                      <input type="range" min={0} max={200} value={value} onChange={e => set(+e.target.value)} style={{ width: "100%", accentColor: "#6366F1" }} />
                    </div>
                  ))}
                </div>
              )}

              {openOptionsFor === "upscale" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={optionLabel}>Mode</label>
                    <div style={{ display: "flex", gap: 0, background: "#F3F4F6", borderRadius: 10, padding: 4, marginTop: 6 }}>
                      {([
                        { key: "normal", label: "⚡ Normal", sub: "1 credit/image" },
                        { key: "pro", label: "✨ Pro AI", sub: "2 credits · AI" },
                      ] as const).map(m => (
                        <button key={m.key} onClick={() => {
                          if (m.key === "pro" && (user?.plan === "free" || (user && user.credits < 2))) {
                            setShowPricingModal(true); return;
                          }
                          setUpscaleMode(m.key);
                        }} style={{
                          flex: 1, padding: "8px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                          background: upscaleMode === m.key ? "#fff" : "transparent",
                          boxShadow: upscaleMode === m.key ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                          transition: "all 0.15s",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: upscaleMode === m.key ? "#6366F1" : "#888" }}>{m.label}</div>
                          <div style={{ fontSize: 10, color: upscaleMode === m.key ? "#6366F1" : "#AAA", marginTop: 1 }}>{m.sub}</div>
                        </button>
                      ))}
                    </div>
                    {upscaleMode === "pro" && (
                      <p style={{ fontSize: 11, color: "#7C3AED", margin: "6px 0 0", fontWeight: 600 }}>✨ AI-enhanced — sharper detail & texture recovery</p>
                    )}
                  </div>
                  <div>
                    <label style={optionLabel}>Resolution boost</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      {(["2x", "4x"] as const).map(s => (
                        <button key={s} onClick={() => setUpscaleScale(s)} style={{
                          flex: 1, padding: "12px 0", borderRadius: 8,
                          border: upscaleScale === s ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                          background: upscaleScale === s ? "#EEF2FF" : "#fff",
                          color: upscaleScale === s ? "#6366F1" : "#6B7280",
                          fontWeight: 800, fontSize: 15, cursor: "pointer",
                        }}>
                          {s === "2x" ? "2×" : "4×"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                    {upscaleMode === "pro"
                      ? `Pro ${upscaleScale} — AI texture recovery, 2 credits/image`
                      : upscaleScale === "2x" ? "2× Standard — faster, 1 credit/image" : "4× Ultra HD — 1 credit/image"}
                  </p>
                </div>
              )}

              {openOptionsFor === "ai-edit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={optionLabel}>Prompt (applied to all images)</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Make the background blurry, add cinematic lighting"
                    rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
                </div>
              )}

              {openOptionsFor === "remove-bg" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={optionLabel}>Output background</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {([
                      { val: "transparent", label: "⬜ Transparent", hint: "PNG with transparency" },
                      { val: "white",       label: "◻ White",        hint: "White background" },
                      { val: "color",       label: "🎨 Custom Color", hint: "Pick any color" },
                      { val: "image",       label: "🖼 Custom Image",  hint: "Upload a background" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setRemoveBgOutput(opt.val)} style={{
                        padding: "10px 8px", borderRadius: 8, border: removeBgOutput === opt.val ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                        background: removeBgOutput === opt.val ? "#EEF2FF" : "#fff",
                        color: removeBgOutput === opt.val ? "#6366F1" : "#374151",
                        fontWeight: removeBgOutput === opt.val ? 800 : 600, fontSize: 11, cursor: "pointer", textAlign: "left",
                      }}>
                        <div>{opt.label}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                  {removeBgOutput === "color" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="color" value={removeBgColor} onChange={e => setRemoveBgColor(e.target.value)}
                        style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #E5E7EB", cursor: "pointer", padding: 2 }} />
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{removeBgColor}</span>
                    </div>
                  )}
                  {removeBgOutput === "image" && (
                    <div>
                      <input ref={removeBgImageRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const r = new FileReader(); r.onloadend = () => setRemoveBgImageDataUrl(r.result as string); r.readAsDataURL(f);
                          e.target.value = "";
                        }} />
                      {removeBgImageDataUrl ? (
                        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 70 }}>
                          <img src={removeBgImageDataUrl} alt="bg" style={{ width: "100%", height: 70, objectFit: "cover" }} />
                          <button onClick={() => setRemoveBgImageDataUrl(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer" }}>×</button>
                        </div>
                      ) : (
                        <button onClick={() => removeBgImageRef.current?.click()} style={{ width: "100%", padding: "10px", border: "1.5px dashed #C7D2FE", borderRadius: 8, background: "#F5F3FF", color: "#6366F1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          + Upload background image
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {openOptionsFor === "generate-bg" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={optionLabel}>Background description</label>
                  <textarea value={bgPrompt} onChange={e => setBgPrompt(e.target.value)}
                    rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Mobile: Run button + status ───────────────────────────────────── */}
        {isMobile && (
          <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            {items.length > 0 && selectedTools.size > 0 && (
              <div style={{ background: creditsNeeded > (user?.credits ?? 0) && creditsNeeded > 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: 10, padding: "8px 12px", border: `1px solid ${creditsNeeded > (user?.credits ?? 0) && creditsNeeded > 0 ? "#FECACA" : "#BBF7D0"}`, fontSize: 12 }}>
                {TRANSFORMS.filter(t => selectedTools.has(t.id) && effectiveCredits(t) > 0).map(t => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", marginBottom: 2 }}>
                    <span>{t.icon} {t.label}</span>
                    <span>{effectiveCredits(t)} × {totalPending} = <strong>{effectiveCredits(t) * totalPending}</strong></span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 4, paddingTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: creditsNeeded > (user?.credits ?? 0) ? "#EF4444" : "#10B981" }}>{creditsNeeded} credits</span>
                </div>
              </div>
            )}
            <button
              onClick={runBatch}
              disabled={processing || !totalPending || !selectedTools.size}
              style={{
                padding: "12px",
                background: processing || !totalPending || !selectedTools.size ? "#C7D2FE" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15,
                cursor: processing || !totalPending || !selectedTools.size ? "not-allowed" : "pointer",
              }}
            >
              {processing
                ? `Processing… ${processedCount}/${totalToProcess}`
                : `⚡ Run on ${totalPending} Image${totalPending !== 1 ? "s" : ""}`}
            </button>
            {processing && (
              <div>
                <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #6366F1, #8B5CF6)", width: `${totalToProcess ? Math.round((processedCount / totalToProcess) * 100) : 0}%`, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 5, textAlign: "center" }}>
                  {totalToProcess ? Math.round((processedCount / totalToProcess) * 100) : 0}% — {processedCount}/{totalToProcess} images
                </div>
              </div>
            )}
            {!processing && doneCount > 0 && (
              <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>✅ {doneCount} done{errorCount > 0 ? ` · ${errorCount} failed` : ""}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Desktop: Left Panel ───────────────────────────────────────────────────── */}
        {!isMobile && <div style={{ width: 300, minWidth: 280, background: "#fff", borderRight: "1px solid #E5E7EB", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Tool multi-select */}
          <div>
            <div style={sectionLabel}>Select Transformations</div>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 10px" }}>Pick one or more — applied in sequence to each image</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TRANSFORMS.map(t => {
                const active = selectedTools.has(t.id);
                const optOpen = openOptionsFor === t.id;
                return (
                  <button key={t.id} onClick={() => toggleTool(t.id)} style={{
                    padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                    border: active ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                    background: optOpen ? "#EEF2FF" : active ? "#F5F3FF" : "#FAFAFA",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, border: active ? "2px solid #6366F1" : "2px solid #D1D5DB",
                      background: active ? "#6366F1" : "transparent", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {active && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#6366F1" : "#111" }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {t.creditsEach === 0 ? "Free" : `${t.creditsEach} credit/image`}
                        {t.aiOnly && " · Paid plan"}
                      </div>
                    </div>
                    {active && <span style={{ fontSize: 14, color: "#6366F1", fontWeight: 700 }}>›</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credit summary */}
          {items.length > 0 && selectedTools.size > 0 && (
            <div style={{ background: creditsNeeded > (user?.credits ?? 0) && creditsNeeded > 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: 10, padding: "12px 14px", border: `1px solid ${creditsNeeded > (user?.credits ?? 0) && creditsNeeded > 0 ? "#FECACA" : "#BBF7D0"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>💳 Credit Summary</div>
              {TRANSFORMS.filter(t => selectedTools.has(t.id) && effectiveCredits(t) > 0).map(t => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
                  <span>{t.icon} {t.label}{t.id === "upscale" && upscaleMode === "pro" ? " (Pro)" : ""}</span>
                  <span>{effectiveCredits(t)} × {totalPending} = <strong>{effectiveCredits(t) * totalPending}</strong></span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: creditsNeeded > (user?.credits ?? 0) ? "#EF4444" : "#10B981" }}>{creditsNeeded} credits</span>
              </div>
              {user && creditsNeeded > 0 && (
                <div style={{ fontSize: 12, marginTop: 4, color: creditsNeeded > user.credits ? "#EF4444" : "#6B7280" }}>
                  {creditsNeeded > user.credits ? `⚠ Need ${creditsNeeded - user.credits} more` : `✓ You have ${user.credits}`}
                </div>
              )}
              {creditsNeeded === 0 && <div style={{ fontSize: 12, color: "#10B981", marginTop: 2 }}>✓ Free — no credits needed</div>}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={runBatch}
            disabled={processing || !totalPending || !selectedTools.size}
            style={{
              padding: "14px",
              background: processing || !totalPending || !selectedTools.size ? "#C7D2FE" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15,
              cursor: processing || !totalPending || !selectedTools.size ? "not-allowed" : "pointer",
              boxShadow: !processing && totalPending && selectedTools.size ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
            }}
          >
            {processing
              ? `Processing… ${processedCount}/${totalToProcess}`
              : `⚡ Run on ${totalPending} Image${totalPending !== 1 ? "s" : ""}`}
          </button>

          {processing && (
            <div>
              <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #6366F1, #8B5CF6)", width: `${totalToProcess ? Math.round((processedCount / totalToProcess) * 100) : 0}%`, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 5, textAlign: "center" }}>
                {totalToProcess ? Math.round((processedCount / totalToProcess) * 100) : 0}% — {processedCount}/{totalToProcess} images
              </div>
            </div>
          )}

          {!processing && doneCount > 0 && (
            <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46" }}>✅ {doneCount} done{errorCount > 0 ? ` · ${errorCount} failed` : ""}</div>
            </div>
          )}
        </div>}

        {/* ── Desktop: Options Side Panel ───────────────────────────────────── */}
        {!isMobile && openOptionsFor && (() => {
          const t = TRANSFORMS.find(x => x.id === openOptionsFor)!;
          return (
            <div style={{ width: 270, minWidth: 250, background: "#fff", borderRight: "1px solid #E5E7EB", overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{t.icon} {t.label} Options</div>
                <button onClick={() => setOpenOptionsFor(null)} style={{ background: "none", border: "none", fontSize: 18, color: "#9CA3AF", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>

              {openOptionsFor === "resize" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={optionLabel}>Width</label>
                      <input type="number" value={resizeW} min={1} max={8000} onChange={e => setResizeW(+e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={optionLabel}>Height</label>
                      <input type="number" value={resizeH} min={1} max={8000} onChange={e => setResizeH(+e.target.value)} disabled={lockAspect} style={{ ...inputStyle, opacity: lockAspect ? 0.5 : 1 }} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
                    <input type="checkbox" checked={lockAspect} onChange={e => setLockAspect(e.target.checked)} />
                    Lock aspect ratio (height auto)
                  </label>
                </div>
              )}

              {openOptionsFor === "adjust" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: "Brightness", value: brightness, set: setBrightness },
                    { label: "Contrast",   value: contrast,   set: setContrast   },
                    { label: "Saturation", value: saturation, set: setSaturation },
                  ].map(({ label, value, set }) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                        <span style={{ fontSize: 12, color: "#6366F1", fontWeight: 700 }}>{value}%</span>
                      </div>
                      <input type="range" min={0} max={200} value={value} onChange={e => set(+e.target.value)} style={{ width: "100%", accentColor: "#6366F1" }} />
                    </div>
                  ))}
                </div>
              )}

              {openOptionsFor === "upscale" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={optionLabel}>Mode</label>
                    <div style={{ display: "flex", gap: 0, background: "#F3F4F6", borderRadius: 10, padding: 4, marginTop: 6 }}>
                      {([
                        { key: "normal", label: "⚡ Normal", sub: "1 credit/image" },
                        { key: "pro", label: "✨ Pro AI", sub: "2 credits · AI" },
                      ] as const).map(m => (
                        <button key={m.key} onClick={() => {
                          if (m.key === "pro" && (user?.plan === "free" || (user && user.credits < 2))) {
                            setShowPricingModal(true); return;
                          }
                          setUpscaleMode(m.key);
                        }} style={{
                          flex: 1, padding: "8px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                          background: upscaleMode === m.key ? "#fff" : "transparent",
                          boxShadow: upscaleMode === m.key ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                          transition: "all 0.15s",
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: upscaleMode === m.key ? "#6366F1" : "#888" }}>{m.label}</div>
                          <div style={{ fontSize: 10, color: upscaleMode === m.key ? "#6366F1" : "#AAA", marginTop: 1 }}>{m.sub}</div>
                        </button>
                      ))}
                    </div>
                    {upscaleMode === "pro" && (
                      <p style={{ fontSize: 11, color: "#7C3AED", margin: "6px 0 0", fontWeight: 600 }}>✨ AI-enhanced — sharper detail & texture recovery</p>
                    )}
                  </div>
                  <div>
                    <label style={optionLabel}>Resolution boost</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      {(["2x", "4x"] as const).map(s => (
                        <button key={s} onClick={() => setUpscaleScale(s)} style={{
                          flex: 1, padding: "12px 0", borderRadius: 8,
                          border: upscaleScale === s ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                          background: upscaleScale === s ? "#EEF2FF" : "#fff",
                          color: upscaleScale === s ? "#6366F1" : "#6B7280",
                          fontWeight: 800, fontSize: 15, cursor: "pointer",
                        }}>
                          {s === "2x" ? "2×" : "4×"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                    {upscaleMode === "pro"
                      ? `Pro ${upscaleScale} — AI texture recovery, 2 credits/image`
                      : upscaleScale === "2x" ? "2× Standard — faster, 1 credit/image" : "4× Ultra HD — 1 credit/image"}
                  </p>
                </div>
              )}

              {openOptionsFor === "ai-edit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={optionLabel}>Prompt (applied to all images)</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Make the background blurry, add cinematic lighting"
                    rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
                </div>
              )}

              {openOptionsFor === "remove-bg" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={optionLabel}>Output background</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {([
                      { val: "transparent", label: "⬜ Transparent", hint: "PNG with transparency" },
                      { val: "white",       label: "◻ White",        hint: "White background" },
                      { val: "color",       label: "🎨 Custom Color", hint: "Pick any color" },
                      { val: "image",       label: "🖼 Custom Image",  hint: "Upload a background" },
                    ] as const).map(opt => (
                      <button key={opt.val} onClick={() => setRemoveBgOutput(opt.val)} style={{
                        padding: "10px 8px", borderRadius: 8, border: removeBgOutput === opt.val ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                        background: removeBgOutput === opt.val ? "#EEF2FF" : "#fff",
                        color: removeBgOutput === opt.val ? "#6366F1" : "#374151",
                        fontWeight: removeBgOutput === opt.val ? 800 : 600, fontSize: 11, cursor: "pointer", textAlign: "left",
                      }}>
                        <div>{opt.label}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                  {removeBgOutput === "color" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="color" value={removeBgColor} onChange={e => setRemoveBgColor(e.target.value)}
                        style={{ width: 40, height: 40, borderRadius: 8, border: "1.5px solid #E5E7EB", cursor: "pointer", padding: 2 }} />
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{removeBgColor}</span>
                    </div>
                  )}
                  {removeBgOutput === "image" && (
                    <div>
                      <input ref={removeBgImageRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          const r = new FileReader(); r.onloadend = () => setRemoveBgImageDataUrl(r.result as string); r.readAsDataURL(f);
                          e.target.value = "";
                        }} />
                      {removeBgImageDataUrl ? (
                        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 70 }}>
                          <img src={removeBgImageDataUrl} alt="bg" style={{ width: "100%", height: 70, objectFit: "cover" }} />
                          <button onClick={() => setRemoveBgImageDataUrl(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer" }}>×</button>
                        </div>
                      ) : (
                        <button onClick={() => removeBgImageRef.current?.click()} style={{ width: "100%", padding: "10px", border: "1.5px dashed #C7D2FE", borderRadius: 8, background: "#F5F3FF", color: "#6366F1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          + Upload background image
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {openOptionsFor === "generate-bg" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={optionLabel}>Background description</label>
                  <textarea value={bgPrompt} onChange={e => setBgPrompt(e.target.value)}
                    rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Right: Image Grid ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Drop zone / header */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => !items.length && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#6366F1" : "#D1D5DB"}`,
              borderRadius: 16, padding: items.length ? "14px 20px" : "48px 24px",
              background: dragOver ? "#EEF2FF" : "#fff",
              display: "flex", alignItems: "center",
              justifyContent: items.length ? "space-between" : "center",
              flexWrap: "wrap", gap: 12,
              cursor: items.length ? "default" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {items.length === 0 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#111", marginBottom: 6 }}>
                  Drop images here or <span style={{ color: "#6366F1" }}>click to browse</span>
                </div>
                <div style={{ fontSize: 14, color: "#9CA3AF" }}>JPG · PNG · WEBP — up to {MAX_IMAGES} images</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: "#6B7280" }}>
                  <strong style={{ color: "#111" }}>{items.length}</strong> image{items.length !== 1 ? "s" : ""} loaded
                  {items.length < MAX_IMAGES && <span style={{ color: "#9CA3AF" }}> · drag more to add</span>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 16px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    + Add More
                  </button>
                  <button onClick={() => setItems(prev => prev.filter(i => i.status !== "done"))} style={{ padding: "8px 14px", background: "#fff", color: "#6B7280", border: "1.5px solid #E5E7EB", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Clear Done
                  </button>
                  <button onClick={() => setItems([])} style={{ padding: "8px 14px", background: "#fff", color: "#EF4444", border: "1.5px solid #FCA5A5", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; } }} />

          {/* Grid */}
          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  background: "#fff", borderRadius: 12, overflow: "hidden",
                  border: `2px solid ${item.status === "done" ? "#10B981" : item.status === "error" ? "#EF4444" : item.status === "processing" ? "#6366F1" : "#E5E7EB"}`,
                  boxShadow: item.status === "done" ? "0 2px 8px rgba(16,185,129,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ position: "relative", aspectRatio: "1", background: "#F3F4F6", overflow: "hidden" }}>
                    <img src={item.resultDataUrl || item.originalDataUrl} alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

                    {item.status === "processing" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, border: "3px solid rgba(255,255,255,0.35)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Processing…</span>
                      </div>
                    )}
                    {item.status === "done" && (
                      <div style={{ position: "absolute", top: 6, left: 6, background: "#10B981", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</div>
                    )}
                    {item.status === "error" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "center" }}>⚠ {item.error || "Failed"}</span>
                      </div>
                    )}
                    {item.status === "pending" && (
                      <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                        style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                    )}
                  </div>

                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={item.name}>{item.name}</span>
                    {item.resultDataUrl && (
                      <button onClick={() => downloadSingle(item)} title="Download" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6366F1", padding: 2, flexShrink: 0 }}>⬇</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" };
const optionBox: React.CSSProperties = { background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 };
const optionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 2 };
const optionLabel: React.CSSProperties = { fontSize: 12, color: "#6B7280", fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
