"use client";

import "../globals.css";
import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "ai-edit" | "remove-bg" | "upscale" | "resize" | "adjust" | "crop" | null;
type BgMode = "color" | "gradient" | "image" | "ai";

interface GradientPreset { label: string; from: string; to: string; angle: number }
interface User { email: string; name: string; picture?: string; credits: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_CREDITS = 10;
const CREDIT_COST = 2;

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
  { id: "crop", icon: "📐", label: "Crop" },
];

type CropBox = { x: number; y: number; w: number; h: number };

// ─── Utils ────────────────────────────────────────────────────────────────────

async function prepareImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      const MAX = 1536;
      if (w > MAX || h > MAX) { const sc = MAX / Math.max(w, h); w = Math.round(w * sc); h = Math.round(h * sc); }
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
    const k = sharpness / 100;
    const kernel = [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0];
    const imageData = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    const d = imageData.data; const o = out.data;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++)
            v += d[((y + ky) * W + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
          o[(y * W + x) * 4 + c] = Math.max(0, Math.min(255, v));
        }
        o[(y * W + x) * 4 + 3] = d[(y * W + x) * 4 + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }
  return canvas.toDataURL("image/png");
}

// Remove a chroma-key colour from an image using canvas pixel manipulation.
// Used after Gemini bg-removal (subject on magenta #FF00FF) to produce transparent PNG.
async function applyChromaKey(dataUrl: string, hexColor: string, tolerance = 80): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, W, H);
  const d = imageData.data;
  const tR = parseInt(hexColor.slice(0, 2), 16);
  const tG = parseInt(hexColor.slice(2, 4), 16);
  const tB = parseInt(hexColor.slice(4, 6), 16);
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.abs(d[i] - tR) + Math.abs(d[i + 1] - tG) + Math.abs(d[i + 2] - tB);
    if (dist < tolerance) {
      // Soft-edge: partial transparency near boundary
      d[i + 3] = dist < tolerance / 2 ? 0 : Math.round((dist / tolerance) * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

async function resizeOnCanvas(dataUrl: string, w: number, h: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageEditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  // Image state
  const [original, setOriginal] = useState<{ dataUrl: string; w: number; h: number; name: string } | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [removedBg, setRemovedBg] = useState<string | null>(null);

  // UI state
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [showOriginal, setShowOriginal] = useState(true); // Show original first
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCropMode, setShowCropMode] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);

  // Remove BG sub-state
  const [bgMode, setBgMode] = useState<BgMode>("color");
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("#6366F1");
  const [pendingGrad, setPendingGrad] = useState<GradientPreset | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [aiBgPrompt, setAiBgPrompt] = useState("");

  // Resize / Adjust
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);

  // Prompt
  const [prompt, setPrompt] = useState("");

  // Auth / credits
  const [user, setUser] = useState<User | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Restore pending state from landing page
    try {
      const pp = sessionStorage.getItem("jpt_pending_prompt");
      const pi = sessionStorage.getItem("jpt_pending_image");
      if (pp) { setPrompt(pp); setActiveTool("ai-edit"); sessionStorage.removeItem("jpt_pending_prompt"); }
      if (pi) {
        const img = new Image();
        img.onload = () => {
          setOriginal({ dataUrl: pi, w: img.naturalWidth, h: img.naturalHeight, name: "uploaded" });
          setResizeW(img.naturalWidth); setResizeH(img.naturalHeight);
        };
        img.src = pi;
        sessionStorage.removeItem("jpt_pending_image");
      }
    } catch {}

    // Load user + credits
    fetch("/api/auth/google/me")
      .then(r => r.json())
      .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string; credits?: number }) => {
        if (d.authenticated && d.email) {
          setUser({ email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? FREE_CREDITS });
        }
      })
      .catch(() => null);
  }, []);

  // ── Auth gate ─────────────────────────────────────────────────────────────────

  const requireSignIn = () => { if (!user) { setShowSignInModal(true); return true; } return false; };

  // ── API call helper (handles 401 / 402 and updates credits) ──────────────────

  const callApi = useCallback(async <T extends Record<string, unknown>>(
    url: string,
    body: object
  ): Promise<T | null> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as T & { error?: string; credits?: number };

    if (res.status === 401) { setShowSignInModal(true); return null; }
    if (res.status === 402) { setShowNoCreditsModal(true); return null; }
    if (!res.ok) { throw new Error(data.error || "Request failed"); }

    // Update credits from any successful transformation response
    if (typeof data.credits === "number") {
      setUser(u => u ? { ...u, credits: data.credits as number } : u);
    }
    return data;
  }, []);

  // ── File upload ───────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError(null); setWorking(null); setRemovedBg(null);
    setActiveTool(null); setShowOriginal(false);
    resetAdjust();
    try {
      const p = await prepareImage(file);
      setOriginal({ dataUrl: p.dataUrl, w: p.w, h: p.h, name: file.name.replace(/\.[^.]+$/, "") || "image" });
      setResizeW(p.w); setResizeH(p.h);
    } catch { setError("Failed to load image."); }
  }, []);

  const resetAdjust = () => { setBrightness(100); setContrast(100); setSaturation(100); setSharpness(0); };
  const currentDisplay = showOriginal ? original?.dataUrl : (working || original?.dataUrl);

  // ── Tool handlers ─────────────────────────────────────────────────────────────

  const handleRemoveBg = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setProcessingLabel("Removing background…"); setError(null);
    try {
      const match = src.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Invalid image");
      const [, mimeType, base64] = match;
      const data = await callApi<{ data: string; mimeType: string; chromaKey?: string }>(
        "/api/remove-bg", { imageData: base64, mimeType }
      );
      if (!data?.data) throw new Error("Removal failed");
      let raw = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      // If Gemini returned a chroma-key image, strip the colour client-side → transparent PNG
      if (data.chromaKey) {
        setProcessingLabel("Applying transparency…");
        raw = await applyChromaKey(raw, data.chromaKey);
      }
      setRemovedBg(raw); setWorking(raw);
      autoSaveToDrive(raw, "remove-bg"); // Auto-save history
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
    } catch { setError("Failed to apply background."); }
    finally { setProcessing(false); }
  };

  const handleApplyAiBg = async () => {
    const src = removedBg || working || original?.dataUrl;
    if (!src || !aiBgPrompt.trim() || processing) return;
    setProcessing(true); setProcessingLabel("Generating background with AI…"); setError(null);
    try {
      const data = await callApi<{ data: string; mimeType: string }>("/api/ai-background", { prompt: aiBgPrompt.trim() });
      if (!data?.data) throw new Error("Generation failed");
      const bgSrc = `data:${data.mimeType || "image/png"};base64,${data.data}`;
      const result = await compositeOnCanvas(src, { type: "image", src: bgSrc });
      setWorking(result);
      autoSaveToDrive(result, "ai-background"); // Auto-save history
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleUpscale = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setProcessingLabel("Upscaling image…"); setError(null);
    try {
      const data = await callApi<{ dataUrl: string }>("/api/upscale", { dataUrl: src });
      if (data?.dataUrl) {
        setWorking(data.dataUrl);
        autoSaveToDrive(data.dataUrl, "upscale"); // Auto-save history
      } else throw new Error("Upscale failed");
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleResize = async () => {
    const src = working || original?.dataUrl;
    if (!src || !resizeW || !resizeH || processing) return;
    setProcessing(true); setError(null);
    try { setWorking(await resizeOnCanvas(src, resizeW, resizeH)); }
    catch { setError("Resize failed."); }
    finally { setProcessing(false); }
  };

  const handleApplyAdjust = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try { setWorking(await applyFiltersToCanvas(src, brightness, contrast, saturation, sharpness)); resetAdjust(); }
    catch { setError("Adjust failed."); }
    finally { setProcessing(false); }
  };

  const handleCrop = async (cropBox: CropBox) => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try {
      const img = await loadImg(src);
      const canvas = document.createElement("canvas");
      canvas.width = cropBox.w;
      canvas.height = cropBox.h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.w, cropBox.h, 0, 0, cropBox.w, cropBox.h);
      setWorking(canvas.toDataURL("image/jpeg", 0.92));
      setShowCropMode(false);
      setResizeW(cropBox.w);
      setResizeH(cropBox.h);
    } catch { setError("Crop failed."); }
    finally { setProcessing(false); }
  };

  const handleAiEdit = async () => {
    const src = working || original?.dataUrl;
    if (!src || !prompt.trim() || processing) return;
    setProcessing(true); setProcessingLabel("Editing with JPT AI…"); setError(null);
    try {
      const data = await callApi<{ dataUrl: string }>("/api/ai-edit", { dataUrl: src, prompt: prompt.trim() });
      if (data?.dataUrl) {
        setWorking(data.dataUrl);
        autoSaveToDrive(data.dataUrl, "ai-edit"); // Auto-save history
        setPrompt("");
      } else throw new Error("Edit failed");
    } catch (e) { setError((e as Error).message); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleAspectW = (v: number) => { setResizeW(v); if (lockAspect && original) setResizeH(Math.round(v * original.h / original.w)); };
  const handleAspectH = (v: number) => { setResizeH(v); if (lockAspect && original) setResizeW(Math.round(v * original.w / original.h)); };

  const handleDownload = () => {
    const url = working || original?.dataUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = `${original?.name || "image"}-edited.${url.includes("image/png") ? "png" : "jpg"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Auto-save to Drive in background (no UI interruption)
  const autoSaveToDrive = async (imageUrl: string, toolUsed: string) => {
    if (!user) return;
    try {
      await fetch("/api/drive/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: imageUrl,
          name: `JPT-${toolUsed}-${Date.now()}`,
          meta: { tool: toolUsed, timestamp: new Date().toISOString(), auto: "true" },
        }),
      });
    } catch (e) {
      console.log("Auto-save failed (non-critical):", (e as Error).message);
    }
  };

  const handleSaveToDrive = async () => {
    const url = working || original?.dataUrl;
    if (!url || !user) return;
    setProcessing(true); setProcessingLabel("Saving to Google Drive…"); setError(null);
    try {
      const res = await fetch("/api/drive/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: url,
          name: `${original?.name || "image"}-edited-${Date.now()}`,
          meta: { tool: activeTool || "editor", timestamp: new Date().toISOString() },
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (data.ok) {
        setError(null);
        alert("✓ Saved to Google Drive!");
      } else {
        setError(data.error || "Save failed");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false); setProcessingLabel("");
    }
  };

  const resetAll = () => {
    setOriginal(null); setWorking(null); setRemovedBg(null);
    setActiveTool(null); setError(null); setShowOriginal(false);
    setPendingColor(null); setPendingGrad(null);
    setBgImageUrl(null); setAiBgPrompt(""); setPrompt("");
    resetAdjust();
  };

  const hasImage = !!original;
  const adjustFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const creditsLeft = user?.credits ?? 0;
  const creditsUsed = FREE_CREDITS - creditsLeft;
  const lowCredits = creditsLeft > 0 && creditsLeft <= CREDIT_COST * 2;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={s.pageHeader}>
        <div style={s.pageHeaderInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={s.pageIcon}>🖼</span>
            <span style={s.pageTitle}>AI Image Editor</span>
          </div>

          {/* Low credits warning */}
          {user && lowCredits && (
            <div style={s.lowCreditsBar}>
              ⚠️ Only {creditsLeft} credit{creditsLeft === 1 ? "" : "s"} left — each tool uses {CREDIT_COST} credits
            </div>
          )}

          <div style={s.pageHeaderRight}>
            {hasImage && (
              <>
                {working && (
                  <>
                    <button style={s.dlBtn} onClick={handleDownload}>⬇ Download</button>
                    {user && <button style={s.dlBtn} onClick={handleSaveToDrive}>☁️ Save to Drive</button>}
                  </>
                )}
                <button style={s.ghostBtn} onClick={resetAll}>+ New Image</button>
              </>
            )}
            {user ? (
              <button style={s.userChip} onClick={() => setShowAccountModal(true)}>
                {user.picture
                  ? <img src={user.picture} alt="" style={s.avatar} />
                  : <span style={s.avatarFallback}>{user.name[0]}</span>}
                <span style={s.userName}>{user.name.split(" ")[0]}</span>
                <span style={{ ...s.creditsBadge, ...(creditsLeft === 0 ? s.creditsEmpty : lowCredits ? s.creditsLow : {}) }}>
                  ⚡ {creditsLeft}
                </span>
              </button>
            ) : (
              <a href="/api/auth/google?next=/editor" style={s.googleBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div style={s.layout}>

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div style={s.sidebar}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              disabled={!hasImage}
              onClick={() => { if (requireSignIn()) return; setActiveTool(activeTool === t.id ? null : t.id); }}
              title={`${t.label} (${CREDIT_COST} credits)`}
              style={{ ...s.toolBtn, ...(activeTool === t.id ? s.toolBtnActive : {}), ...(!hasImage ? { opacity: 0.35, cursor: "not-allowed" } : {}) }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={s.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <div style={s.canvasArea}>

          {/* Upload Zone */}
          {!hasImage && (
            <div style={s.uploadZone}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div style={{ fontSize: 60, marginBottom: 16 }}>🖼</div>
              <p style={s.uploadTitle}>Drop an image or <span style={{ color: "#6366F1", fontWeight: 700 }}>click to browse</span></p>
              <p style={s.uploadHint}>JPG · PNG · WEBP — choose a tool from the left</p>
              <div style={s.featureRow}>
                {TOOLS.map((t) => <span key={t.id} style={s.featureChip}>{t.icon} {t.label}</span>)}
              </div>
              {!user && (
                <div style={s.signInHint}>
                  <a href="/api/auth/google?next=/editor" style={{ color: "#6366F1", fontWeight: 600, textDecoration: "none" }}>Sign in with Google</a> to use AI tools — 10 free credits included
                </div>
              )}
              {error && <div style={s.errBox}>{error}</div>}
            </div>
          )}

          {/* Image Canvas */}
          {hasImage && (
            <div style={s.canvasInner}>
              <div style={s.imgWrap}>
                {!showOriginal && (working?.includes("image/png") || removedBg) && <div style={s.checker} />}
                <img
                  src={currentDisplay || ""}
                  alt="working"
                  style={{ ...s.mainImg, ...(processing ? { opacity: 0.5 } : {}), filter: activeTool === "adjust" && !processing ? adjustFilter : undefined }}
                />
                {processing && (
                  <div style={s.imgOverlay}>
                    <div style={s.spinner} />
                    <span style={{ color: "#fff", fontSize: 13, marginTop: 10 }}>{processingLabel || "Processing…"}</span>
                  </div>
                )}
              </div>

              <div style={s.imgControls}>
                <div style={s.togglePill}>
                  <button style={{ ...s.toggleBtn, ...(!showOriginal ? s.toggleActive : {}) }} onClick={() => setShowOriginal(false)}>Result</button>
                  <button style={{ ...s.toggleBtn, ...(showOriginal ? s.toggleActive : {}) }} onClick={() => setShowOriginal(true)}>Original</button>
                </div>
                {working && !showOriginal && <button style={s.ghostBtn} onClick={() => { setWorking(null); setRemovedBg(null); }}>↺ Reset</button>}
                <span style={s.dimLabel}>{original?.w} × {original?.h}px</span>
              </div>

              {error && <div style={s.errBox}>{error}</div>}

              {/* Prompt bar */}
              <div style={s.promptBar}>
                <button
                  style={{ ...s.toolPillBtn, ...(activeTool === "ai-edit" ? s.toolPillActive : {}) }}
                  onClick={() => { if (requireSignIn()) return; setActiveTool(activeTool === "ai-edit" ? null : "ai-edit"); }}
                >✨</button>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (requireSignIn()) return; handleAiEdit(); } }}
                  placeholder="Describe what to change… e.g. 'Make background blurry', 'Change sky to sunset'"
                  style={s.promptInput}
                  disabled={processing || !hasImage}
                />
                <button
                  style={{ ...s.sendBtn, ...(!prompt.trim() || processing || !hasImage ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
                  disabled={!prompt.trim() || processing || !hasImage}
                  onClick={() => { if (requireSignIn()) return; handleAiEdit(); }}
                >
                  {processing && activeTool === "ai-edit" ? "…" : "✨ Apply"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Tool Panel ─────────────────────────────────────────────── */}
        {activeTool && hasImage && (
          <div style={s.toolPanel}>

            {/* Remove BG */}
            {activeTool === "remove-bg" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>✂️ Remove Background</div>
                <p style={s.panelSub}>JPT AI removes backgrounds with pixel precision</p>
                <div style={s.creditNote}>Uses {CREDIT_COST} credits · {creditsLeft} remaining</div>

                {!removedBg ? (
                  <>
                    <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleRemoveBg}>
                      {processing ? <span style={s.btnRow}><span style={s.spin} />Removing… (up to 30s)</span> : "✂️ Remove Background"}
                    </button>
                    {error && (
                      <div style={s.retryNote}>
                        ⚠️ AI model is warming up — please <button style={s.retryLink} onClick={handleRemoveBg}>try again</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={s.successNote}>✓ Background removed — add a new one:</div>
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
                          <button style={{ ...s.smallBtn, ...(pendingColor === customColor ? { background: "#10B981" } : {}) }} onClick={() => setPendingColor(customColor)}>
                            {pendingColor === customColor ? "✓" : "Select"}
                          </button>
                        </div>
                        {pendingColor && <div style={s.pendingRow}><div style={{ width: 18, height: 18, borderRadius: 4, background: pendingColor, border: "2px solid #DDD" }} /><span style={{ fontSize: 12, fontWeight: 600 }}>Selected</span><button style={s.xBtn} onClick={() => setPendingColor(null)}>✕</button></div>}
                        <button style={{ ...s.primaryBtn, ...(!pendingColor || processing ? s.btnOff : {}) }} disabled={!pendingColor || processing} onClick={() => pendingColor && handleApplyColorBg(pendingColor)}>
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Color Background"}
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
                          {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "Apply Image Background"}
                        </button>
                      </div>
                    )}

                    {bgMode === "ai" && (
                      <div style={s.panelSection}>
                        <span style={s.aiBadge}>✨ AI Background · {CREDIT_COST} credits</span>
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

            {/* AI Edit */}
            {activeTool === "ai-edit" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>✨ AI Edit</div>
                <p style={s.panelSub}>Describe any change — JPT AI enhances your prompt and edits the image</p>
                <div style={s.creditNote}>Uses {CREDIT_COST} credits · {creditsLeft} remaining</div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'e.g. "Make the background blurry"\n"Change the sky to sunset"\n"Add dramatic lighting"'} style={s.textarea} rows={4} disabled={processing} />
                <div style={s.suggestions}>
                  {["Make background blurry", "Add dramatic lighting", "Change to black and white", "Make it cinematic", "Add fog effect"].map((s2) => (
                    <button key={s2} style={s.chip} onClick={() => setPrompt(s2)} disabled={processing}>{s2}</button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(!prompt.trim() || processing ? s.btnOff : {}) }} disabled={!prompt.trim() || processing} onClick={handleAiEdit}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Editing…</span> : "✨ Apply Edit"}
                </button>
              </div>
            )}

            {/* Upscale */}
            {activeTool === "upscale" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔍 Upscale</div>
                <p style={s.panelSub}>Enhance image quality and sharpness with AI</p>
                <div style={s.creditNote}>Uses {CREDIT_COST} credits · {creditsLeft} remaining</div>
                <div style={s.infoCard}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>What it does</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                    <li>Sharpens fine details</li><li>Reduces noise</li><li>Enhances clarity</li><li>Preserves original content</li>
                  </ul>
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleUpscale}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Upscaling…</span> : "🔍 Upscale Image"}
                </button>
              </div>
            )}

            {/* Resize */}
            {activeTool === "resize" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>↔️ Resize</div>
                <p style={s.panelSub}>Change image dimensions — no credits used</p>
                <div style={s.panelSection}>
                  <label style={s.inputLabel}>Width (px)</label>
                  <input type="number" value={resizeW} min={1} max={4096} onChange={(e) => handleAspectW(parseInt(e.target.value) || 1)} style={s.numInput} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                    <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} id="lock-aspect" />
                    <label htmlFor="lock-aspect" style={{ fontSize: 13, cursor: "pointer" }}>Lock aspect ratio</label>
                  </div>
                  <label style={s.inputLabel}>Height (px)</label>
                  <input type="number" value={resizeH} min={1} max={4096} onChange={(e) => handleAspectH(parseInt(e.target.value) || 1)} style={s.numInput} />
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>Original: {original?.w} × {original?.h}px</div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleResize}>↔️ Apply Resize</button>
              </div>
            )}

            {/* Adjust */}
            {activeTool === "adjust" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🎨 Color Adjustments</div>
                <p style={s.panelSub}>Real-time preview · no credits used</p>
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
                    <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.value} onChange={(e) => ctrl.set(parseInt(e.target.value))} style={{ width: "100%" }} />
                    <button style={{ ...s.resetSliderBtn, opacity: ctrl.value === ctrl.default ? 0.3 : 1 }} onClick={() => ctrl.set(ctrl.default)} disabled={ctrl.value === ctrl.default}>Reset</button>
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

            {activeTool === "crop" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>📐 Crop Image</div>
                <p style={s.panelSub}>Draw a crop box on the image · no credits used</p>
                <div style={{ padding: "12px", background: "#F0F0F0", borderRadius: 8, fontSize: 12, color: "#666", marginBottom: 12 }}>
                  💡 Drag on the image to select crop area, then click "Apply Crop"
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing || !showCropMode} onClick={() => {
                  if (original && showCropMode && cropStart) {
                    const rect = document.querySelector("img[alt='working']")?.getBoundingClientRect();
                    if (rect) {
                      handleCrop({ x: 0, y: 0, w: original.w, h: original.h });
                    }
                  }
                }}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Cropping…</span> : "Apply Crop"}
                </button>
                <button style={{ ...s.ghostBtn, width: "100%", marginTop: 8 }} onClick={() => { setShowCropMode(false); setCropStart(null); }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Account Modal ─────────────────────────────────────────────────── */}
      {showAccountModal && user && (
        <div style={s.modalOverlay} onClick={() => setShowAccountModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              {user.picture
                ? <img src={user.picture} alt="" style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name[0]}</div>}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: "#777", marginTop: 2 }}>{user.email}</div>
              </div>
            </div>

            {/* Credits section */}
            <div style={s.creditsSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>⚡ AI Credits</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: creditsLeft === 0 ? "#EF4444" : "#6366F1" }}>
                  {creditsLeft} <span style={{ fontSize: 13, color: "#999", fontWeight: 400 }}>/ {FREE_CREDITS}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={s.creditBarBg}>
                <div style={{ ...s.creditBarFill, width: `${(creditsLeft / FREE_CREDITS) * 100}%`, background: creditsLeft === 0 ? "#EF4444" : creditsLeft <= 4 ? "#F59E0B" : "#6366F1" }} />
              </div>

              <div style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.6 }}>
                {creditsUsed} credits used · {creditsLeft} remaining
              </div>

              {creditsLeft === 0 && (
                <div style={s.noCreditsNote}>
                  You&apos;ve used all {FREE_CREDITS} free credits. More credits coming soon with paid plans.
                </div>
              )}
              {lowCredits && creditsLeft > 0 && (
                <div style={s.lowNote}>Running low! Resize and Adjust are free — no credits needed.</div>
              )}
            </div>

            {/* Usage breakdown */}
            <div style={s.usageGrid}>
              {[
                { icon: "✨", label: "AI Edit", cost: CREDIT_COST },
                { icon: "✂️", label: "Remove BG", cost: CREDIT_COST },
                { icon: "🔍", label: "Upscale", cost: CREDIT_COST },
                { icon: "🌅", label: "AI Background", cost: CREDIT_COST },
                { icon: "↔️", label: "Resize", cost: 0 },
                { icon: "🎨", label: "Adjust", cost: 0 },
                { icon: "📐", label: "Crop", cost: 0 },
              ].map((item) => (
                <div key={item.label} style={s.usageItem}>
                  <span>{item.icon} {item.label}</span>
                  <span style={{ fontWeight: 700, color: item.cost === 0 ? "#10B981" : "#6366F1" }}>
                    {item.cost === 0 ? "Free" : `${item.cost} cr`}
                  </span>
                </div>
              ))}
            </div>

            <button style={{ ...s.primaryBtn, background: "#111", marginTop: 4 }} disabled>
              🚀 Get More Credits — Coming Soon
            </button>
            <button style={{ ...s.ghostBtn, width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={async () => { await fetch("/api/auth/google/logout", { method: "POST" }); setUser(null); setShowAccountModal(false); }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Sign-in Modal ─────────────────────────────────────────────────── */}
      {showSignInModal && (
        <div style={s.modalOverlay} onClick={() => setShowSignInModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✨</div>
            <div style={s.modalTitle}>Sign in to use AI tools</div>
            <p style={s.modalSub}>Create a free account with Google. You get <strong>10 free credits</strong> to start editing right away.</p>
            <div style={s.modalFeatures}>
              {["✂️ Remove Background", "🔍 Upscale Image", "✨ AI Edit", "🌅 AI Background", "↔️ Resize (free)", "🎨 Adjust (free)", "📐 Crop (free)"].map((f) => (
                <div key={f} style={s.modalFeatureRow}><span style={{ color: "#10B981", fontWeight: 700 }}>✓</span> {f}</div>
              ))}
            </div>
            <a href="/api/auth/google?next=/editor" style={s.modalGoogleBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google — Free
            </a>
            <button style={s.modalDismiss} onClick={() => setShowSignInModal(false)}>Maybe later</button>
          </div>
        </div>
      )}

      {/* ── No Credits Modal ──────────────────────────────────────────────── */}
      {showNoCreditsModal && (
        <div style={s.modalOverlay} onClick={() => setShowNoCreditsModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={s.modalTitle}>You&apos;re out of credits</div>
            <p style={s.modalSub}>You&apos;ve used all {FREE_CREDITS} free AI credits. Paid plans with more credits are coming soon!</p>
            <div style={s.noCreditsInfo}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Free tools (no credits):</div>
              <div>↔️ Resize — change any dimension</div>
              <div>🎨 Adjust — brightness, contrast, saturation</div>
            </div>
            <button style={{ ...s.primaryBtn, background: "#111", opacity: 0.6, cursor: "not-allowed" }} disabled>
              🚀 Upgrade Plan — Coming Soon
            </button>
            <button style={s.modalDismiss} onClick={() => setShowNoCreditsModal(false)}>Continue with free tools</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#F6F7FB", fontFamily: "system-ui,-apple-system,sans-serif", color: "#111", display: "flex", flexDirection: "column" },

  pageHeader: { background: "rgba(255,255,255,0.97)", borderBottom: "1px solid #EAECF0", backdropFilter: "blur(8px)", position: "sticky", top: 52, zIndex: 90 },
  pageHeaderInner: { maxWidth: 1400, margin: "0 auto", padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 },
  pageIcon: { fontSize: 18 },
  pageTitle: { fontSize: 14, fontWeight: 700, color: "#222", marginRight: 8 },
  pageHeaderRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginLeft: "auto" },
  lowCreditsBar: { flex: 1, textAlign: "center" as const, fontSize: 12, fontWeight: 600, color: "#92400E", background: "#FEF3C7", borderRadius: 6, padding: "4px 12px" },
  dlBtn: { background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  ghostBtn: { background: "none", border: "1px solid #E0E0E8", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 },
  userChip: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid #E0E0E8", borderRadius: 10, padding: "5px 10px", cursor: "pointer" },
  avatar: { width: 26, height: 26, borderRadius: "50%", flexShrink: 0 },
  avatarFallback: { width: 26, height: 26, borderRadius: "50%", background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 13, fontWeight: 600, color: "#333" },
  creditsBadge: { fontSize: 11, fontWeight: 800, background: "#EEEEFF", color: "#6366F1", borderRadius: 6, padding: "2px 7px" },
  creditsEmpty: { background: "#FEE2E2", color: "#EF4444" },
  creditsLow: { background: "#FEF3C7", color: "#D97706" },
  googleBtn: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DDD", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#333", textDecoration: "none", whiteSpace: "nowrap" as const },

  layout: { display: "flex", flex: 1, minHeight: 0 },
  sidebar: { width: 72, flexShrink: 0, background: "#fff", borderRight: "1px solid #EAECF0", display: "flex", flexDirection: "column" as const, padding: "12px 6px", gap: 4 },
  toolBtn: { width: "100%", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: "#555" },
  toolBtnActive: { background: "#EEEEFF", color: "#6366F1" },
  toolLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, lineHeight: 1 },

  canvasArea: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, padding: "20px", gap: 16, overflowY: "auto" as const },
  canvasInner: { display: "flex", flexDirection: "column" as const, gap: 12, alignItems: "center", width: "100%" },
  uploadZone: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", border: "2px dashed #D2D4E0", borderRadius: 20, padding: "60px 40px", cursor: "pointer", textAlign: "center" as const, background: "#fff", minHeight: 400 },
  uploadTitle: { margin: "0 0 8px", fontSize: 17, fontWeight: 700 },
  uploadHint: { margin: "0 0 24px", fontSize: 14, color: "#888" },
  featureRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center", marginBottom: 16 },
  featureChip: { background: "#F0F0FA", border: "1px solid #E0E0F0", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#6366F1" },
  signInHint: { fontSize: 13, color: "#888", marginTop: 8 },

  imgWrap: { position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", maxWidth: "100%", background: "#fff" },
  checker: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)", backgroundSize: "14px 14px", backgroundPosition: "0 0,0 7px,7px -7px,-7px 0" },
  mainImg: { maxWidth: "min(800px, 100%)", maxHeight: "60vh", display: "block", position: "relative", zIndex: 1, transition: "opacity 0.2s" },
  imgOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  spinner: { width: 36, height: 36, border: "3.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  imgControls: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const },
  togglePill: { display: "flex", background: "#EBEBF0", borderRadius: 9, padding: 3 },
  toggleBtn: { padding: "5px 14px", borderRadius: 7, border: "none", background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#888" },
  toggleActive: { background: "#fff", color: "#111", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  dimLabel: { fontSize: 12, color: "#AAA" },

  promptBar: { display: "flex", gap: 8, width: "100%", maxWidth: 800, alignItems: "center" },
  promptInput: { flex: 1, border: "1.5px solid #E0E0EE", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111" },
  sendBtn: { background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const },
  toolPillBtn: { width: 38, height: 38, borderRadius: 10, border: "1px solid #E0E0EE", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  toolPillActive: { background: "#EEEEFF", borderColor: "#6366F1" },
  errBox: { background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C00", width: "100%", maxWidth: 800 },

  toolPanel: { width: 300, flexShrink: 0, background: "#fff", borderLeft: "1px solid #EAECF0", overflowY: "auto" as const },
  panelContent: { padding: "20px 18px", display: "flex", flexDirection: "column" as const, gap: 14 },
  panelTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" },
  panelSub: { margin: 0, fontSize: 12, color: "#777", lineHeight: 1.5 },
  panelSection: { display: "flex", flexDirection: "column" as const, gap: 10 },
  creditNote: { fontSize: 11, color: "#6366F1", fontWeight: 700, background: "#EEEEFF", borderRadius: 6, padding: "4px 8px", display: "inline-block", alignSelf: "flex-start" },

  successNote: { background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#047857", fontWeight: 600 },
  retryNote: { background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E" },
  retryLink: { background: "none", border: "none", color: "#7C3AED", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 },
  tabBar: { display: "flex", gap: 2, background: "#F0F0F8", borderRadius: 8, padding: 2 },
  tabBtn: { flex: 1, padding: "5px 2px", borderRadius: 6, border: "none", background: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", color: "#888" },
  tabActive: { background: "#fff", color: "#6366F1", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  swatchGrid: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  swatch: { width: 30, height: 30, borderRadius: 7, cursor: "pointer", flexShrink: 0 },
  colorPicker: { width: 36, height: 36, border: "2px solid #E0E0E8", borderRadius: 6, cursor: "pointer", padding: 2 },
  smallBtn: { background: "#6366F1", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  pendingRow: { display: "flex", alignItems: "center", gap: 8, background: "#F0F0FF", border: "1px solid #C4C4F0", borderRadius: 8, padding: "8px 10px" },
  xBtn: { background: "none", border: "none", color: "#AAA", cursor: "pointer", fontSize: 13, padding: 2, marginLeft: "auto" },
  gradGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  gradSwatch: { height: 44, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "0 6px 4px" },
  gradLabel: { fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 2px rgba(0,0,0,0.4)" },
  changeBgBtn: { position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  uploadBgBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", border: "2px dashed #D0D0E0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#555", background: "#FAFAFC" },
  aiBadge: { display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg,#4285F4,#8B5CF6)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700 },
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

  // Modals
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" },
  modalBox: { background: "#fff", borderRadius: 20, padding: "32px 28px", maxWidth: 420, width: "100%", textAlign: "center" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 },
  modalSub: { margin: "0 0 16px", fontSize: 14, color: "#666", lineHeight: 1.6 },
  modalFeatures: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, textAlign: "left" as const },
  modalFeatureRow: { fontSize: 13, color: "#333", display: "flex", alignItems: "center", gap: 6 },
  modalGoogleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1.5px solid #DDD", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, color: "#333", textDecoration: "none", cursor: "pointer", width: "100%", boxSizing: "border-box" as const, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  modalDismiss: { marginTop: 12, background: "none", border: "none", color: "#AAA", fontSize: 13, cursor: "pointer", textDecoration: "underline" },

  // Account modal specific
  creditsSection: { background: "#F7F8FC", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "left" as const },
  creditBarBg: { height: 8, background: "#E5E7EB", borderRadius: 100, overflow: "hidden" },
  creditBarFill: { height: "100%", borderRadius: 100, transition: "width 0.4s ease" },
  noCreditsNote: { marginTop: 10, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#B91C1C", textAlign: "left" as const },
  lowNote: { marginTop: 10, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", textAlign: "left" as const },
  usageGrid: { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16, textAlign: "left" as const },
  usageItem: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", padding: "4px 0", borderBottom: "1px solid #F0F0F0" },

  // No credits modal
  noCreditsInfo: { background: "#F0FFF4", border: "1px solid #A7F3D0", borderRadius: 10, padding: "14px", marginBottom: 16, fontSize: 13, color: "#047857", lineHeight: 1.8, textAlign: "left" as const },
};
