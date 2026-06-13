"use client";

import "../globals.css";
import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "ai-edit" | "generate-bg" | "upscale" | "resize" | "adjust" | null;
type BgMode = "color" | "gradient" | "image" | "ai";

interface GradientPreset { label: string; from: string; to: string; angle: number }
interface User { email: string; name: string; picture?: string; credits: number; plan?: string }

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

const BG_TEMPLATES = [
  { id: "blur-white", label: "Blur White", prompt: "Soft blurred white background, professional studio style", icon: "⚪" },
  { id: "gradient-blue", label: "Gradient Blue", prompt: "Light blue to dark blue gradient background", icon: "🔵" },
  { id: "gradient-sunset", label: "Sunset", prompt: "Warm sunset gradient with orange and pink colors", icon: "🌅" },
  { id: "bokeh-warm", label: "Warm Bokeh", prompt: "Soft warm bokeh background with golden lights", icon: "✨" },
  { id: "dark-minimal", label: "Dark Minimal", prompt: "Dark professional background, minimalist style", icon: "⬛" },
  { id: "nature-blur", label: "Nature Blur", prompt: "Blurred green nature background with plants", icon: "🌿" },
  { id: "gradient-purple", label: "Purple Gradient", prompt: "Purple to pink gradient background, modern aesthetic", icon: "💜" },
  { id: "abstract-art", label: "Abstract Art", prompt: "Abstract colorful art background with brush strokes", icon: "🎨" },
];

const TOOLS: { id: Tool; icon: string; label: string; ai?: boolean }[] = [
  { id: "ai-edit", icon: "✨", label: "AI Edit", ai: true },
  { id: "generate-bg", icon: "🌅", label: "Generate BG", ai: true },
  { id: "upscale", icon: "🔍", label: "Upscale" },
  { id: "resize", icon: "↔️", label: "Resize" },
  { id: "adjust", icon: "🎨", label: "Adjust" },
];

const AI_TOOL_DESCRIPTIONS: Record<string, string> = {
  "ai-edit": "AI Edit lets you transform images with text prompts — change backgrounds, add effects, relight scenes and more.",
  "generate-bg": "Generate Background creates stunning AI-generated backgrounds behind your subject automatically.",
  "upscale": "AI Upscale enhances your image to 2× or 4× resolution using super-resolution AI — crystal clear results.",
};

const SESSION_KEY = "jpt_editor_session";
const SESSION_TTL = 24 * 60 * 60 * 1000;
interface SessionData { dataUrl: string; name: string; w: number; h: number; ts: number; }

// ─── Utils ────────────────────────────────────────────────────────────────────

async function prepareImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      const MAX = 1024;
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
async function applyChromaKey(dataUrl: string, hexColor: string, tolerance = 50): Promise<string> {
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
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // Calculate distance using Euclidean distance
    const dist = Math.sqrt(Math.pow(r - tR, 2) + Math.pow(g - tG, 2) + Math.pow(b - tB, 2));

    if (dist < tolerance) {
      // Full transparency for exact matches, soft edges for near matches
      if (dist < tolerance * 0.4) {
        d[i + 3] = 0; // Fully transparent
      } else {
        d[i + 3] = Math.round(((dist - tolerance * 0.4) / (tolerance * 0.6)) * 255);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Fetch a CDN URL and convert to data URL in the browser (avoids sending large base64 over API)
async function urlToDataUrl(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

  // Image state
  const [original, setOriginal] = useState<{ dataUrl: string; w: number; h: number; name: string } | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [savedSession, setSavedSession] = useState<SessionData | null>(null);

  // UI state
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [showOriginal, setShowOriginal] = useState(true); // Show original first
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Before/After slider state
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [workingSize, setWorkingSize] = useState<{ w: number; h: number } | null>(null);

  // Generate BG sub-state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customBgPrompt, setCustomBgPrompt] = useState("");

  // Upscale sub-state
  const [upscaleScale, setUpscaleScale] = useState<"2x" | "4x">("2x");
  const [appliedUpscale, setAppliedUpscale] = useState<"2x" | "4x" | null>(null);

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedTool, setBlockedTool] = useState<{ id: string | null; icon: string; label: string } | null>(null);

  // Email auth form state
  const [authTab, setAuthTab] = useState<"google" | "email">("google");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // 1. URL tool param — e.g. /editor?tool=upscale
    const toolParam = new URLSearchParams(window.location.search).get("tool") as Tool;
    if (toolParam && TOOLS.some(t => t.id === toolParam)) {
      setActiveTool(toolParam);
    }

    // 2. Pending image/prompt from sessionStorage (from My Library "Open in Editor")
    try {
      const pp = sessionStorage.getItem("jpt_pending_prompt");
      const pi = sessionStorage.getItem("jpt_pending_image");
      const pt = sessionStorage.getItem("jpt_pending_tool") as Tool | null;
      if (pp) { setPrompt(pp); setActiveTool("ai-edit"); sessionStorage.removeItem("jpt_pending_prompt"); }
      if (pi) {
        const img = new Image();
        img.onload = () => {
          setOriginal({ dataUrl: pi, w: img.naturalWidth, h: img.naturalHeight, name: "uploaded" });
          setResizeW(img.naturalWidth); setResizeH(img.naturalHeight);
          if (pt && TOOLS.some(t => t.id === pt)) setActiveTool(pt);
        };
        img.src = pi;
        sessionStorage.removeItem("jpt_pending_image");
        sessionStorage.removeItem("jpt_pending_tool");
        return; // skip session restore if we have a pending image
      }
    } catch {}

    // 3. Restore saved session (24h) from localStorage
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SessionData;
        if (Date.now() - s.ts < SESSION_TTL) {
          setSavedSession(s);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {}

    // 4. Always check server-side session on mount (cookies are the source of truth)
    const loadUser = () =>
      fetch("/api/auth/google/me")
        .then(r => r.json())
        .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string; credits?: number; plan?: string }) => {
          if (d.authenticated && d.email) {
            setUser({ email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? FREE_CREDITS, plan: d.plan || "free" });
          }
        }).catch(() => null);

    loadUser();

    import("@/lib/supabase").then(({ createSupabaseClient }) => {
      const supabase = createSupabaseClient();
      supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          loadUser();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      });
    });
  }, []);

  // ── Auth gate ─────────────────────────────────────────────────────────────────

  const requireSignIn = () => { if (!user) { setShowSignInModal(true); return true; } return false; };

  // ── API call helper (handles 401 / 402 and updates credits) ──────────────────

  const callApi = useCallback(async <T extends Record<string, unknown>>(
    url: string,
    body: object,
    onBlocked?: () => void
  ): Promise<T | null> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as T & { error?: string; credits?: number };

    if (res.status === 401) { onBlocked?.(); setShowSignInModal(true); return null; }
    if (res.status === 402) {
      onBlocked?.();
      if (data.upgradeRequired) { setShowUpgradeModal(true); } else { setShowNoCreditsModal(true); }
      return null;
    }
    if (res.status === 403) { onBlocked?.(); setShowUpgradeModal(true); return null; }
    if (res.status === 429) { throw new Error("Too many requests. Please wait a minute and try again."); }
    if (!res.ok) { throw new Error(data.error || "Request failed"); }

    if (typeof data.credits === "number") {
      setUser(u => u ? { ...u, credits: data.credits as number } : u);
    }

    // If API returned a CDN URL, fetch it client-side (avoids Vercel memory/bandwidth)
    if (typeof data.url === "string" && data.url.startsWith("http")) {
      const dataUrlResult = await urlToDataUrl(data.url);
      return { ...data, dataUrl: dataUrlResult, image: dataUrlResult } as T;
    }
    return data;
  }, []);

  // ── File upload ───────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setError(null); setWorking(null); setEditHistory([]);
    setActiveTool(null); setShowOriginal(true);
    setSavedSession(null); setAppliedUpscale(null);
    resetAdjust();
    try {
      const p = await prepareImage(file);
      const name = file.name.replace(/\.[^.]+$/, "") || "image";
      setOriginal({ dataUrl: p.dataUrl, w: p.w, h: p.h, name });
      setResizeW(p.w); setResizeH(p.h);
      // Persist session for 24h
      try {
        const sess: SessionData = { dataUrl: p.dataUrl, name, w: p.w, h: p.h, ts: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      } catch { /* storage full, ignore */ }
    } catch { setError("Failed to load image."); }
  }, []);

  const resetAdjust = () => { setBrightness(100); setContrast(100); setSaturation(100); setSharpness(0); };

  // Reset slider and measure result dimensions whenever a new result arrives
  useEffect(() => {
    if (working) {
      setSliderPos(50);
      const img = new Image();
      img.onload = () => setWorkingSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = working;
    } else {
      setWorkingSize(null);
    }
  }, [working]);

  const getSliderPosFromEvent = useCallback((clientX: number): number => {
    const container = sliderContainerRef.current;
    if (!container) return 50;
    const rect = container.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const onSliderMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setSliderPos(getSliderPosFromEvent(e.clientX));
  }, [isDragging, getSliderPosFromEvent]);

  const onSliderTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    e.preventDefault();
    setSliderPos(getSliderPosFromEvent(e.touches[0].clientX));
  }, [isDragging, getSliderPosFromEvent]);

  const onSliderEnd = useCallback(() => setIsDragging(false), []);
  const currentDisplay = showOriginal ? original?.dataUrl : (working || original?.dataUrl);

  // ── Tool handlers ─────────────────────────────────────────────────────────────

  const handleGenerateBg = async (templateOrPrompt: string) => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setProcessingLabel("Generating background…"); setError(null);
    const prevCreditsGBg = user?.credits ?? 0;
    setUser(u => u ? { ...u, credits: Math.max(0, u.credits - CREDIT_COST) } : u);
    try {
      // Use AI Edit to directly replace the background — keeps subject intact
      const aiPrompt = `Replace the background of this image with: ${templateOrPrompt}. Keep the person/subject exactly as they are — same pose, appearance, clothing. Only change the background behind them.`;
      const data = await callApi<{ dataUrl: string }>("/api/ai-edit", { dataUrl: src, prompt: aiPrompt }, () => setUser(u => u ? { ...u, credits: prevCreditsGBg } : u));
      if (!data?.dataUrl) throw new Error("Background generation failed");
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(data.dataUrl);
      autoSaveToDrive(data.dataUrl, "generate-bg", templateOrPrompt.slice(0, 60));
    } catch (e) {
      setUser(u => u ? { ...u, credits: prevCreditsGBg } : u); // rollback on error
      setError((e as Error).message);
    }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleUpscale = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (requireSignIn()) return;
    setProcessing(true); setProcessingLabel(`Upscaling ${upscaleScale}…`); setError(null);
    // Optimistic deduction — immediately show -1 credit in UI
    const prevCredits = user?.credits ?? 0;
    setUser(u => u ? { ...u, credits: Math.max(0, u.credits - 1) } : u);
    try {
      // Deduct 1 credit server-side before processing
      const deductRes = await fetch("/api/credits/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "basic-upscale" }),
      });
      const deductData = await deductRes.json() as { credits?: number; error?: string; upgradeRequired?: boolean };
      if (!deductRes.ok) {
        setUser(u => u ? { ...u, credits: prevCredits } : u); // rollback
        if (deductRes.status === 402) {
          if (deductData.upgradeRequired) { setShowUpgradeModal(true); } else { setShowNoCreditsModal(true); }
        } else if (deductRes.status === 401) {
          setShowSignInModal(true);
        } else {
          setError(deductData.error || "Failed to deduct credits.");
        }
        return;
      }
      if (typeof deductData.credits === "number") {
        setUser(u => u ? { ...u, credits: deductData.credits! } : u);
      }

      const { upscaleImage } = await import("@/lib/upscale-client");
      const out = await upscaleImage(src, upscaleScale);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(out);
      setAppliedUpscale(upscaleScale);
      autoSaveToDrive(out, "upscale", `${upscaleScale} Upscale`);
    } catch (e) { setError((e as Error).message || "Upscale failed. Please try again."); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleEmailAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) { setAuthError("Email and password required"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const url  = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = authMode === "signup"
        ? { email: authEmail.trim(), password: authPassword, name: authName.trim() }
        : { email: authEmail.trim(), password: authPassword };
      const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { ok?: boolean; email?: string; name?: string; credits?: number; error?: string; needsConfirmation?: boolean };
      if (!res.ok) {
        if (res.status === 503) setAuthError("Email auth not yet enabled. Please use Google Sign-in.");
        else setAuthError(data.error || "Authentication failed");
        return;
      }
      if (data.needsConfirmation) {
        setAuthError("✅ Check your email and click the confirmation link, then sign in.");
        return;
      }
      setShowSignInModal(false);
      setAuthEmail(""); setAuthPassword(""); setAuthName(""); setAuthError("");
      window.location.reload();
    } catch { setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  const handleResize = async () => {
    const src = working || original?.dataUrl;
    if (!src || !resizeW || !resizeH || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await resizeOnCanvas(src, resizeW, resizeH);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      autoSaveToDrive(result, "resize", `${resizeW}×${resizeH}`);
    }
    catch { setError("Resize failed."); }
    finally { setProcessing(false); }
  };

  const handleApplyAdjust = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    setProcessing(true); setError(null);
    try {
      const result = await applyFiltersToCanvas(src, brightness, contrast, saturation, sharpness);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      resetAdjust();
      autoSaveToDrive(result, "adjust", "Color Adjustments");
    }
    catch { setError("Adjust failed."); }
    finally { setProcessing(false); }
  };

  const handleAiEdit = async () => {
    const src = working || original?.dataUrl;
    if (!src || !prompt.trim() || processing) return;
    setProcessing(true); setProcessingLabel("Editing with JPT AI…"); setError(null);
    const prevCreditsAI = user?.credits ?? 0;
    setUser(u => u ? { ...u, credits: Math.max(0, u.credits - CREDIT_COST) } : u);
    try {
      const data = await callApi<{ dataUrl: string }>("/api/ai-edit", { dataUrl: src, prompt: prompt.trim() }, () => setUser(u => u ? { ...u, credits: prevCreditsAI } : u));
      if (data?.dataUrl) {
        setEditHistory(prev => working ? [...prev, working] : prev);
        setWorking(data.dataUrl);
        autoSaveToDrive(data.dataUrl, "ai-edit", prompt.trim().slice(0, 60));
        setPrompt("");
      } else throw new Error("Edit failed");
    } catch (e) {
      setUser(u => u ? { ...u, credits: prevCreditsAI } : u); // rollback on error
      setError((e as Error).message);
    }
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

  // Small fallback thumbnail (~150px, ~7-10KB base64) — stored in Edge Config for cross-device
  const makeThumbnail = async (dataUrl: string): Promise<string> => {
    try {
      const img = await loadImg(dataUrl);
      const SIZE = 150;
      const ratio = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", 0.65);
    } catch { return ""; }
  };

  // High-quality preview (~900px, ~150-250KB) — stored in localStorage, used for grid + full preview
  const makePreview = async (dataUrl: string): Promise<string> => {
    try {
      const img = await loadImg(dataUrl);
      const SIZE = 900;
      const ratio = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight, 1); // never upscale
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", 0.88);
    } catch { return ""; }
  };

  // Categorise tool: generate-bg/ai-background = "generation", rest = "edit"
  const toolCategory = (tool: string): "generation" | "edit" =>
    (tool === "generate-bg" || tool === "ai-background") ? "generation" : "edit";

  // ── localStorage helpers ──────────────────────────────────────────────────────

  const saveLocalGen = (item: {
    id: string; tool: string; category: "generation" | "edit";
    label: string; thumb: string; timestamp: number; originalName?: string;
  }) => {
    try {
      const raw = localStorage.getItem("jpt_gens_v1");
      const existing: typeof item[] = raw ? JSON.parse(raw) : [];
      const updated = [item, ...existing.filter(i => i.id !== item.id)].slice(0, 30);
      localStorage.setItem("jpt_gens_v1", JSON.stringify(updated));
    } catch {
      // storage full — evict 10 oldest and retry
      try {
        localStorage.setItem("jpt_gens_v1", JSON.stringify([item]));
      } catch { /* silent */ }
    }
  };

  const deleteLocalGen = (id: string) => {
    try {
      const raw = localStorage.getItem("jpt_gens_v1");
      if (!raw) return;
      const existing = JSON.parse(raw) as { id: string }[];
      localStorage.setItem("jpt_gens_v1", JSON.stringify(existing.filter(i => i.id !== id)));
      localStorage.removeItem(`jpt_img_${id}`);
    } catch { /* silent */ }
  };

  // ── Auto-save to My Generations (PRIMARY: localStorage, SECONDARY: EC best-effort) ──

  const autoSaveToDrive = async (imageUrl: string, toolUsed: string, label?: string) => {
    if (!user) return;
    try {
      const [thumb, preview] = await Promise.all([makeThumbnail(imageUrl), makePreview(imageUrl)]);
      if (!thumb) return;

      const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item = {
        id, tool: toolUsed,
        category: toolCategory(toolUsed),
        label: label || original?.name || "Image",
        thumb, timestamp: Date.now(),
        originalName: original?.name,
      };

      // 1. Save metadata to localStorage immediately — always works, no token needed
      saveLocalGen(item);

      // 2. Save 900px preview to localStorage
      if (preview) {
        try { localStorage.setItem(`jpt_img_${id}`, preview); }
        catch {
          try {
            // Clear oldest previews to make space
            Object.keys(localStorage).filter(k => k.startsWith("jpt_img_")).slice(0, 5)
              .forEach(k => localStorage.removeItem(k));
            localStorage.setItem(`jpt_img_${id}`, preview);
          } catch { /* silent */ }
        }
      }

      // 3. Also try Edge Config (best-effort — fails silently if token lacks permission)
      fetch("/api/generations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolUsed, category: item.category, label: item.label, thumb, originalName: original?.name }),
      }).catch(() => { /* EC not available — localStorage copy is the source of truth */ });

    } catch (e) {
      console.error("Generation save error:", (e as Error).message);
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

  const restoreSession = (s: SessionData) => {
    setOriginal({ dataUrl: s.dataUrl, w: s.w, h: s.h, name: s.name });
    setResizeW(s.w); setResizeH(s.h);
    setSavedSession(null);
  };

  const discardSession = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSavedSession(null);
  };

  const resetAll = () => {
    setOriginal(null); setWorking(null); setEditHistory([]);
    setActiveTool(null); setError(null); setShowOriginal(true);
    setSelectedTemplate(null); setCustomBgPrompt(""); setPrompt("");
    setAppliedUpscale(null);
    resetAdjust();
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setSavedSession(null);
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
            <span style={s.pageTitle}>JPT AI Editor</span>
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
                {working && <button style={s.dlBtn} onClick={handleDownload}>⬇ Download</button>}
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
              <button style={s.googleBtn} onClick={() => setShowSignInModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in
              </button>
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
              onClick={() => {
                if (requireSignIn()) return;
                if (t.ai && user?.plan === "free") {
                  setBlockedTool(t);
                  setShowUpgradeModal(true);
                  return;
                }
                setActiveTool(activeTool === t.id ? null : t.id);
              }}
              title={`${t.label}${["upscale", "resize", "adjust"].includes(t.id ?? "") ? " (Free)" : ` (${CREDIT_COST} credits)`}`}
              style={{ ...s.toolBtn, ...(activeTool === t.id ? s.toolBtnActive : {}), ...(!hasImage ? { opacity: 0.35, cursor: "not-allowed" } : {}) }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={s.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <div style={s.canvasArea}>

          {/* Saved session banner */}
          {!hasImage && savedSession && (
            <div style={{ background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", border: "2px solid #6366F1", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 4 }}>↩ Continue where you left off</div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  <strong>{savedSession.name}</strong> · {savedSession.w}×{savedSession.h}px · saved {Math.round((Date.now() - savedSession.ts) / 60000)}m ago
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => restoreSession(savedSession)}
                  style={{ padding: "10px 20px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Resume Editing
                </button>
                <button
                  onClick={discardSession}
                  style={{ padding: "10px 16px", background: "#fff", color: "#666", border: "1px solid #E0E0EE", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

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
                  <button onClick={() => setShowSignInModal(true)} style={{ color: "#6366F1", fontWeight: 600, textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign in</button> to use AI tools — 10 free credits included
                </div>
              )}
              {error && <div style={s.errBox}>{error}</div>}
            </div>
          )}

          {/* Image Canvas */}
          {hasImage && (
            <div style={s.canvasInner}>
              {/* Error */}
              {error && <div style={{ ...s.errBox, maxWidth: "100%", marginBottom: 16 }}>{error}</div>}

              {/* Before/After Slider */}
              {working ? (
                <div style={{ width: "100%", maxWidth: 860 }}>
                  <div
                    ref={sliderContainerRef}
                    style={{
                      position: "relative",
                      width: "100%",
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                      background: "#eee",
                      cursor: isDragging ? "ew-resize" : "default",
                      userSelect: "none",
                    }}
                    onMouseMove={onSliderMouseMove}
                    onMouseUp={onSliderEnd}
                    onMouseLeave={onSliderEnd}
                    onTouchMove={onSliderTouchMove}
                    onTouchEnd={onSliderEnd}
                  >
                    {/* Result image (behind) */}
                    <div style={{ position: "relative" }}>
                      {working?.includes("image/png") && <div style={s.checker} />}
                      <img
                        src={working}
                        alt="result"
                        style={{ display: "block", maxWidth: "100%", maxHeight: "65vh", width: "100%", objectFit: "contain", position: "relative", zIndex: 1, filter: activeTool === "adjust" && !processing ? adjustFilter : undefined }}
                      />
                    </div>

                    {/* Original image (clipped over result — left portion) */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                        zIndex: 2,
                      }}
                    >
                      <img
                        src={original?.dataUrl}
                        alt="original"
                        style={{ display: "block", maxWidth: "100%", maxHeight: "65vh", width: "100%", objectFit: "contain" }}
                      />
                    </div>

                    {/* Divider line + handle */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0, bottom: 0,
                        left: `${sliderPos}%`,
                        width: 3,
                        background: "#fff",
                        boxShadow: "0 0 8px rgba(0,0,0,0.4)",
                        transform: "translateX(-50%)",
                        cursor: "ew-resize",
                        zIndex: 3,
                        pointerEvents: "auto",
                      }}
                      onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 44, height: 44,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, color: "#555",
                      }}>
                        ⟺
                      </div>
                    </div>

                    {/* Labels */}
                    <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>Original</div>
                      {original && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{original.w} × {original.h}px</div>}
                    </div>
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4, background: "rgba(99,102,241,0.85)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>✨ Result</div>
                      {workingSize && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>{workingSize.w} × {workingSize.h}px</div>}
                    </div>

                    {/* Processing overlay */}
                    {processing && (
                      <div style={{ ...s.imgOverlay, position: "absolute", inset: 0, zIndex: 5 }}>
                        <div style={s.spinner} />
                        <span style={{ color: "#fff", fontSize: 13, marginTop: 10 }}>{processingLabel || "Processing…"}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons below slider */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" as const }}>
                    <button style={s.dlBtn} onClick={handleDownload}>⬇️ Download</button>
                    {editHistory.length > 0 && (
                      <button style={s.ghostBtn} onClick={() => {
                        const prev = editHistory[editHistory.length - 1];
                        setEditHistory(h => h.slice(0, -1));
                        setWorking(prev ?? null);
                      }}>↩ Undo</button>
                    )}
                    <button style={{ ...s.ghostBtn, color: "#EF4444", borderColor: "#FCA5A5" }} onClick={() => { setWorking(null); setEditHistory([]); setSelectedTemplate(null); setCustomBgPrompt(""); }}>⏮ Reset</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={s.imgWrap}>
                    <img src={original?.dataUrl || ""} alt="original" style={s.mainImg} />
                  </div>
                  <span style={s.dimLabel}>{original?.w} × {original?.h}px</span>
                </div>
              )}

              {/* AI Edit Prompt - Below Images - Larger & Prominent */}
              <div style={{ background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F8 100%)", borderTop: "2px solid #6366F1", borderBottom: "2px solid #6366F1", padding: "24px", marginTop: 24, marginBottom: 16, maxWidth: "100%", borderRadius: 12, boxShadow: "0 2px 8px rgba(99, 102, 241, 0.1)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: "#6366F1" }}>✨ Describe Your Edits:</label>
                  <div style={{ display: "flex", gap: 12, width: "100%" }}>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (requireSignIn()) return; handleAiEdit(); } }}
                      placeholder="✨ 'Make the background blurry', 'Change to black and white', 'Add dramatic lighting', 'Make it cinematic'"
                      style={{ ...s.promptInput, flex: 1, padding: "14px 16px", fontSize: 15, minHeight: 50 }}
                      disabled={processing || !hasImage}
                    />
                    <button
                      style={{ ...s.sendBtn, minWidth: 140, padding: "14px 24px", fontSize: 15, fontWeight: 700, ...(processing ? { opacity: 0.7 } : {}) }}
                      disabled={processing || !hasImage}
                      onClick={() => { if (requireSignIn()) return; handleAiEdit(); }}
                    >
                      {processing && activeTool === "ai-edit" ? <span style={s.btnRow}><span style={s.spin} />Generating</span> : "✨ Generate"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Right Tool Panel ─────────────────────────────────────────────── */}
        {activeTool && hasImage && (
          <div style={s.toolPanel}>

            {/* Generate Background */}
            {activeTool === "generate-bg" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🌅 Generate Background</div>
                <p style={s.panelSub}>Choose a template or describe your own background</p>
                <div style={s.creditNote}>Uses {CREDIT_COST} credits · {creditsLeft} remaining</div>

                {/* Background Templates Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {BG_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      disabled={processing}
                      onClick={() => setSelectedTemplate(selectedTemplate === tpl.id ? null : tpl.id)}
                      style={{
                        padding: "10px",
                        borderRadius: 8,
                        border: selectedTemplate === tpl.id ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                        background: selectedTemplate === tpl.id ? "#EEEEFF" : "#FAFAFC",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{tpl.icon}</span>
                      <span>{tpl.label}</span>
                    </button>
                  ))}
                </div>

                {/* Generate Selected Template */}
                {selectedTemplate && (
                  <button
                    style={{ ...s.primaryBtn, marginBottom: 12, ...(processing ? s.btnOff : {}) }}
                    disabled={processing}
                    onClick={() => {
                      const tpl = BG_TEMPLATES.find(t => t.id === selectedTemplate);
                      if (tpl) handleGenerateBg(tpl.prompt);
                    }}
                  >
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Generating…</span> : "🎨 Generate Selected"}
                  </button>
                )}

                {/* Custom Prompt */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #E0E0EE" }}>
                  <label style={{ ...s.inputLabel, marginBottom: 6, display: "block" }}>Or create custom:</label>
                  <textarea
                    value={customBgPrompt}
                    onChange={(e) => setCustomBgPrompt(e.target.value)}
                    placeholder={'Describe a background…\ne.g. "Warm golden sunset beach"\n"Modern minimalist office"\n"Galaxy with stars"'}
                    style={s.textarea}
                    rows={3}
                    disabled={processing}
                  />
                  <button
                    style={{ ...s.primaryBtn, background: "linear-gradient(135deg,#4285F4,#8B5CF6)", marginTop: 10, ...(customBgPrompt.trim().length === 0 || processing ? s.btnOff : {}) }}
                    disabled={customBgPrompt.trim().length === 0 || processing}
                    onClick={() => handleGenerateBg(customBgPrompt.trim())}
                  >
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Generating…</span> : "✨ Generate Custom"}
                  </button>
                </div>

                {error && (
                  <div style={s.retryNote}>
                    ⚠️ Generation failed — please <button style={s.retryLink} onClick={() => selectedTemplate ? handleGenerateBg(BG_TEMPLATES.find(t => t.id === selectedTemplate)?.prompt || "") : handleGenerateBg(customBgPrompt.trim())}>try again</button>
                  </div>
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
                <div style={s.panelTitle}>🔍 AI Upscale</div>
                <p style={s.panelSub}>Enhance image quality, sharpness and detail with AI</p>
                <div style={s.creditNote}>Free · runs in your browser</div>

                {/* 2x / 4x toggle */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#888", marginBottom: 8 }}>Enhancement Level</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["2x", "4x"] as const).map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setUpscaleScale(sc)}
                        style={{
                          flex: 1,
                          padding: "12px 8px",
                          borderRadius: 10,
                          border: upscaleScale === sc ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                          background: upscaleScale === sc ? "#EEEEFF" : "#FAFAFA",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 18,
                          color: upscaleScale === sc ? "#6366F1" : "#999",
                          transition: "all 0.15s",
                        }}
                      >
                        {sc}
                        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: upscaleScale === sc ? "#6366F1" : "#AAA" }}>
                          {sc === "2x" ? "Enhance" : "Ultra"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={s.infoCard}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {upscaleScale === "4x" ? "4x Ultra Enhancement" : "2x Enhancement"}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                    {upscaleScale === "4x" ? (
                      <>
                        <li>Maximum sharpness &amp; fine detail</li>
                        <li>Hair strands, skin pores, fabric texture</li>
                        <li>Full noise &amp; artifact removal</li>
                        <li>Vivid colors, punchy contrast</li>
                      </>
                    ) : (
                      <>
                        <li>Sharpens fine details</li>
                        <li>Reduces noise &amp; blur</li>
                        <li>Enhances clarity</li>
                        <li>Preserves original content</li>
                      </>
                    )}
                  </ul>
                </div>

                {appliedUpscale === upscaleScale && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                    😅 Already upscaled {upscaleScale}
                  </div>
                )}
                <button
                  style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}), background: upscaleScale === "4x" ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
                  disabled={processing}
                  onClick={handleUpscale}
                >
                  {processing
                    ? <span style={s.btnRow}><span style={s.spin} />Upscaling {upscaleScale}…</span>
                    : `🔍 Upscale ${upscaleScale}`}
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
                { icon: "🌅", label: "Generate BG", cost: CREDIT_COST },
                { icon: "🔍", label: "Upscale", cost: 0 },
                { icon: "↔️", label: "Resize", cost: 0 },
                { icon: "🎨", label: "Adjust", cost: 0 },
              ].map((item) => (
                <div key={item.label} style={s.usageItem}>
                  <span>{item.icon} {item.label}</span>
                  <span style={{ fontWeight: 700, color: item.cost === 0 ? "#10B981" : "#6366F1" }}>
                    {item.cost === 0 ? "Free" : `${item.cost} cr`}
                  </span>
                </div>
              ))}
            </div>

            {user.plan === "free" && (
              <div style={{ fontSize: 12, color: "#888", textAlign: "center" as const, marginBottom: 8 }}>
                Free plan · 10 credits/day · resets every 24h
              </div>
            )}
            <button style={{ ...s.primaryBtn, marginTop: 4 }} onClick={() => { setShowAccountModal(false); setShowUpgradeModal(true); }}>
              🚀 {user.plan === "free" ? "Upgrade Plan" : "Get More Credits"}
            </button>
            <button style={{ ...s.ghostBtn, width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={async () => { await fetch("/api/auth/google/logout", { method: "POST" }); setUser(null); setShowAccountModal(false); setAuthTab("google"); setAuthEmail(""); setAuthPassword(""); }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Sign-in Modal ─────────────────────────────────────────────────── */}
      {showSignInModal && (
        <div style={s.modalOverlay} onClick={() => { setShowSignInModal(false); setAuthError(""); }}>
          <div style={{ ...s.modalBox, maxWidth: 460, textAlign: "left" as const }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
              <div style={{ ...s.modalTitle, fontSize: 20 }}>Sign in to JPT AI Editor</div>
              <p style={{ ...s.modalSub, marginBottom: 0 }}>Get <strong>10 free AI credits</strong> to start editing</p>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", background: "#F0F0F8", borderRadius: 10, padding: 3, marginBottom: 20 }}>
              {(["google", "email"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setAuthTab(tab); setAuthError(""); }}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, border: "none",
                    background: authTab === tab ? "#fff" : "none",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    color: authTab === tab ? "#6366F1" : "#888",
                    boxShadow: authTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {tab === "google" ? "🔵 Google" : "📧 Email"}
                </button>
              ))}
            </div>

            {/* Google tab */}
            {authTab === "google" && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                <button
                  onClick={() => { window.location.href = "/api/auth/google?next=/editor"; }}
                  style={{ ...s.modalGoogleBtn, justifyContent: "center" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google — Free
                </button>
                <div style={{ fontSize: 12, color: "#888", textAlign: "center" as const }}>
                  Quick · No password needed · Works with any Google account
                </div>
              </div>
            )}

            {/* Email tab */}
            {authTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                {/* Login / Signup toggle */}
                <div style={{ display: "flex", gap: 4, fontSize: 13, justifyContent: "center" }}>
                  <button
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: authMode === "login" ? 800 : 400, color: authMode === "login" ? "#6366F1" : "#888", borderBottom: authMode === "login" ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 12px" }}
                  >Sign in</button>
                  <button
                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: authMode === "signup" ? 800 : 400, color: authMode === "signup" ? "#6366F1" : "#888", borderBottom: authMode === "signup" ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 12px" }}
                  >Create account</button>
                </div>

                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                />

                {authError && (
                  <div style={{ background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#C00" }}>
                    {authError}
                  </div>
                )}

                <button
                  onClick={handleEmailAuth}
                  disabled={authLoading}
                  style={{ ...s.primaryBtn, opacity: authLoading ? 0.7 : 1 }}
                >
                  {authLoading
                    ? <span style={s.btnRow}><span style={s.spin} />{authMode === "signup" ? "Creating account…" : "Signing in…"}</span>
                    : authMode === "signup" ? "Create Account — Free" : "Sign In"
                  }
                </button>
              </div>
            )}

            <button style={{ ...s.modalDismiss, display: "block", margin: "16px auto 0" }} onClick={() => { setShowSignInModal(false); setAuthError(""); }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── No Credits Modal ──────────────────────────────────────────────── */}
      {showNoCreditsModal && (
        <div style={s.modalOverlay} onClick={() => setShowNoCreditsModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={s.modalTitle}>Daily credits used up</div>
            <p style={s.modalSub}>Your 10 free daily credits reset in 24 hours. Upgrade for unlimited AI access.</p>
            <div style={s.noCreditsInfo}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Always free (no credits needed):</div>
              <div>↔️ Resize &nbsp;·&nbsp; 🎨 Color Adjust</div>
            </div>
            <button style={s.primaryBtn} onClick={() => { setShowNoCreditsModal(false); setShowUpgradeModal(true); }}>
              🚀 Upgrade Plan
            </button>
            <button style={s.modalDismiss} onClick={() => setShowNoCreditsModal(false)}>Wait for daily reset</button>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ─────────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div style={s.modalOverlay} onClick={() => { setShowUpgradeModal(false); setBlockedTool(null); }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", position: "relative" }} onClick={(e) => e.stopPropagation()}>

            {/* Gradient header */}
            <div style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)", borderRadius: "24px 24px 0 0", padding: "32px 32px 28px", color: "#fff", position: "relative" }}>
              <button onClick={() => { setShowUpgradeModal(false); setBlockedTool(null); }} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

              {blockedTool && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  <span>{blockedTool.icon}</span>
                  <span>{blockedTool.label} requires AI credits</span>
                </div>
              )}

              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>
                {blockedTool ? `Unlock ${blockedTool.label}` : "Unlock AI Features"}
              </div>
              <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>
                {blockedTool
                  ? (blockedTool.id ? AI_TOOL_DESCRIPTIONS[blockedTool.id] : null) || "This AI tool requires a paid plan."
                  : "You're on the free plan. Upgrade to access all AI transformations."}
              </div>

              {/* Free vs Paid comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
                <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, opacity: 0.8 }}>✅ FREE (Your Plan)</div>
                  {["↔️ Resize", "🎨 Color Adjust", "🔢 Basic Crop", "🔍 Basic Upscale (1 cr/day)"].map(f => (
                    <div key={f} style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>{f}</div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>🚀 PAID PLANS</div>
                  {["✨ AI Edit (prompts)", "🌅 Generate BG", "🗑️ Remove BG", "⬆️ AI Upscale (4K)"].map(f => (
                    <div key={f} style={{ fontSize: 12, marginBottom: 4 }}>{f}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing cards */}
            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center" as const, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: 1 }}>Choose a plan · one-time payment · credits never expire</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { name: "Starter", price: "$5", credits: 50, perCredit: "$0.10", color: "#6366F1", features: ["50 AI credits", "~25 transformations", "All AI tools", "No expiry"] },
                  { name: "Creator", price: "$10", credits: 100, perCredit: "$0.10", color: "#7C3AED", popular: true, features: ["100 AI credits", "~50 transformations", "All AI tools", "No expiry"] },
                  { name: "Pro", price: "$25", credits: 300, perCredit: "$0.08", color: "#5B21B6", features: ["300 AI credits", "~150 transformations", "All AI tools", "No expiry"] },
                ].map((plan) => (
                  <div key={plan.name} style={{ border: `2px solid ${plan.popular ? plan.color : "#E5E7EB"}`, borderRadius: 16, padding: "18px 14px", textAlign: "center" as const, position: "relative", background: plan.popular ? "#F5F3FF" : "#FAFAFA", transition: "transform 0.1s" }}>
                    {plan.popular && (
                      <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" as const, letterSpacing: 0.5 }}>
                        ✦ MOST POPULAR
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 13, color: plan.popular ? plan.color : "#666", marginBottom: 6 }}>{plan.name}</div>
                    <div style={{ fontWeight: 900, fontSize: 30, color: "#111", lineHeight: 1 }}>{plan.price}</div>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>{plan.perCredit}/credit</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: plan.color, marginBottom: 4 }}>{plan.credits}</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>AI Credits</div>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 11, color: "#555", marginBottom: 3, textAlign: "left" as const }}>✓ {f}</div>
                    ))}
                    <a href="/pricing" style={{ display: "block", marginTop: 14, background: plan.popular ? plan.color : "#111", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}>
                      Get Started →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center" as const }}>
                <button style={{ background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer", textDecoration: "underline" }} onClick={() => { setShowUpgradeModal(false); setBlockedTool(null); }}>
                  Maybe later — stay on free plan
                </button>
              </div>
            </div>
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
