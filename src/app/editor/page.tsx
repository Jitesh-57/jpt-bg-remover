"use client";

import "../globals.css";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  trackImageUploaded, trackImageUploadFailed, trackTransformButtonClicked, trackImageTransformed,
  trackImageTransformedFailed, trackGenerateButtonClicked, trackImageGenerated, trackImageGenerationFailed,
  trackPaymentPopupTriggered, trackBuyButtonClicked, trackDownloadButtonClicked, setAnalyticsUser,
  trackBeginCheckout, trackPurchase, trackPaymentFailed,
} from "@/lib/analytics";
import { PAID_FEATURES_ENABLED } from "@/lib/features";
import { applyWatermark, renderMeme, type WatermarkPosition } from "@/lib/tools-canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

type Tool = "ai-edit" | "generate-bg" | "upscale" | "resize" | "adjust" | "remove-bg" | "crop" | "rotate" | "compress" | "convert" | "pdf" | "watermark" | "meme" | "stickers" | null;
type BgMode = "color" | "gradient" | "image" | "ai";

interface GradientPreset { label: string; from: string; to: string; angle: number }
interface User { userId?: string; email: string; name: string; picture?: string; credits: number; plan?: string; dailyCreditResetAt?: string | null; trialToolsUsed?: string[]; trialsRemaining?: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_CREDITS = 10;
const FREE_TRIAL_LIMIT = 5;
const CREDIT_COST = 2;
const BASIC_UPSCALE_COST = 1;
const SUPPORTED_IMAGE_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_UPSCALE_OUTPUT_PX = 20000;

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

// `paid` tools are unavailable on the free plan (show the payment popup).
// `free` tools are always usable. Upscale is `free` because its Normal mode is
// free — the Pro mode is gated separately inside the panel.
const ALL_TOOLS: { id: Tool; icon: string; label: string; ai?: boolean; free?: boolean; paid?: boolean }[] = [
  { id: "ai-edit", icon: "✨", label: "AI Edit", ai: true, paid: true },
  { id: "generate-bg", icon: "🌅", label: "Generate BG", ai: true, paid: true },
  { id: "remove-bg", icon: "🪄", label: "Remove BG", paid: true },
  { id: "upscale", icon: "🔍", label: "Upscale", free: true },
  { id: "resize", icon: "↔️", label: "Resize", free: true },
  { id: "crop", icon: "✂️", label: "Crop", free: true },
  { id: "rotate", icon: "🔄", label: "Rotate", free: true },
  { id: "adjust", icon: "🎨", label: "Adjust", free: true },
  { id: "watermark", icon: "🔖", label: "Watermark", free: true },
  { id: "meme", icon: "😂", label: "Meme", free: true },
  { id: "stickers", icon: "😎", label: "Stickers", free: true },
  { id: "compress", icon: "🗜️", label: "Compress", free: true },
  { id: "convert", icon: "🔀", label: "Convert", free: true },
  { id: "pdf", icon: "📄", label: "To PDF", free: true },
];

// Free-only mode keeps just the on-device tools (Upscale/Resize/Adjust).
const TOOLS = PAID_FEATURES_ENABLED ? ALL_TOOLS : ALL_TOOLS.filter(t => t.free);

// Emoji "sticker pack" — colorful, zero-asset stickers rendered onto the canvas.
const STICKER_PACKS: { name: string; emojis: string[] }[] = [
  { name: "Smileys", emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😜","🤪","😝","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😴","🤤","😪","🫠","😵","🤯","🥵","🥶","😱","😨","😰","😢","😭","😤","😡","🤬","🤔","🤭","🫡","🤗"] },
  { name: "Gestures", emojis: ["👍","👎","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤝","👏","🙌","🫶","🙏","💪","🦾","✍️","👀","👁️","🫵"] },
  { name: "Love", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💕","💞","💓","💗","💖","💘","💝","💟","❣️","💔","❤️‍🔥","💯","💥","💫","⭐","🌟","✨","⚡","🔥","🎉","🎊","🎈","👑","💎","🏆","🥇","🌈"] },
  { name: "Fun", emojis: ["😺","😸","😹","😻","🙀","🐶","🐱","🦄","🐼","🐸","🐵","🙈","🙉","🙊","🦁","🐯","🍕","🍔","🍟","🌭","🍩","🍦","☕","🍺","🎮","🎧","📸","💩","🤡","👻","💀","☠️","👽","👾","🤖","🎃","👋"] },
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

// Center-crop to a target aspect ratio (ratioW:ratioH). ratioH<=0 → circle crop
// on the largest centered square (transparent corners, PNG output).
async function cropToAspect(dataUrl: string, ratioW: number, ratioH: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const circle = ratioH <= 0;
  const targetRatio = circle ? 1 : ratioW / ratioH;
  let cw = W, ch = Math.round(W / targetRatio);
  if (ch > H) { ch = H; cw = Math.round(H * targetRatio); }
  const sx = Math.round((W - cw) / 2), sy = Math.round((H - ch) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  if (circle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
  if (circle) ctx.restore();
  return canvas.toDataURL("image/png");
}

// Rotate by 0/90/180/270 degrees and optionally mirror horizontally/vertically.
async function rotateFlipOnCanvas(dataUrl: string, deg: number, flipH: boolean, flipV: boolean): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const rad = (deg * Math.PI) / 180;
  const swap = deg === 90 || deg === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? H : W;
  canvas.height = swap ? W : H;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -W / 2, -H / 2);
  const png = dataUrl.includes("image/png");
  return canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.92);
}

// Re-encode as JPEG at a given quality (0–1) to shrink file size.
async function compressOnCanvas(dataUrl: string, quality: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  // Flatten onto white so PNG transparency doesn't turn black in JPEG.
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", Math.min(1, Math.max(0.05, quality)));
}

// Convert to a target format. PNG/WEBP keep transparency; JPG flattens to white.
async function convertOnCanvas(dataUrl: string, format: "png" | "jpeg" | "webp"): Promise<string> {
  const img = await loadImg(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, 0);
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  return canvas.toDataURL(mime, format === "png" ? undefined : 0.92);
}

// Rough byte size of a base64 data URL (for the compress size read-out).
function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(b64.length * 3 / 4) - pad);
}
function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Build a single-page PDF (data URL) that embeds the image as a JPEG via
// /DCTDecode — no external library needed. Page is sized to the image.
async function imageToPdfDataUrl(dataUrl: string): Promise<string> {
  const img = await loadImg(dataUrl);
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0);
  const jpegBase64 = canvas.toDataURL("image/jpeg", 0.92).split(",", 2)[1];
  // Decode base64 JPEG → bytes
  const bin = atob(jpegBase64);
  const jpeg = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i);

  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array | string) => {
    const u8 = typeof chunk === "string" ? enc.encode(chunk) : chunk;
    parts.push(u8); length += u8.length;
  };
  const mark = () => { offsets.push(length); };

  push("%PDF-1.3\n");
  mark(); // obj 1
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  mark(); // obj 2
  push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  mark(); // obj 3
  push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  mark(); // obj 4 (image)
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push("\nendstream\nendobj\n");
  const content = `q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ\n`;
  mark(); // obj 5 (content)
  push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
  const xrefStart = length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  // Concatenate + base64-encode
  const out = new Uint8Array(length);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  let b64 = "";
  const CH = 0x8000;
  for (let i = 0; i < out.length; i += CH) {
    b64 += String.fromCharCode.apply(null, Array.from(out.subarray(i, i + CH)) as unknown as number[]);
  }
  return "data:application/pdf;base64," + btoa(b64);
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
  // Bounding box of the actual (possibly zoomed/panned) image content — used
  // instead of the outer container's rect so the divider tracks the cursor
  // correctly when scale()/translate() has shrunk or shifted the content.
  const sliderContentRef = useRef<HTMLDivElement>(null);
  const [workingSize, setWorkingSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Zoom via mouse wheel — React's onWheel is registered as a passive listener,
  // so e.preventDefault() inside it can't stop the page from scrolling too.
  // A native listener with { passive: false } is the only way to actually block it.
  useEffect(() => {
    const el = sliderContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.25 : 0.25;
      setZoom(z => {
        const nz = Math.max(1, Math.min(4, +(z + delta).toFixed(2)));
        if (nz === 1) { setPanX(0); setPanY(0); }
        return nz;
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [working]);

  // Generate BG sub-state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customBgPrompt, setCustomBgPrompt] = useState("");

  // Upscale sub-state
  const [upscaleScale, setUpscaleScale] = useState<"2x" | "4x">("2x");
  const [upscaleMode, setUpscaleMode] = useState<"normal" | "pro">("normal");
  const [appliedUpscale, setAppliedUpscale] = useState<"2x" | "4x" | null>(null);

  // Resize / Adjust
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);

  // Crop / Rotate / Compress / Convert
  const [cropRatio, setCropRatio] = useState<string>("1:1");
  const [compressQuality, setCompressQuality] = useState(70);
  const [convertFormat, setConvertFormat] = useState<"png" | "jpeg" | "webp">("png");
  // Watermark / Meme
  const [wmText, setWmText] = useState("");
  const [wmPosition, setWmPosition] = useState<WatermarkPosition>("bottom-right");
  const [wmFontScale, setWmFontScale] = useState(5);
  const [wmColor, setWmColor] = useState("#ffffff");
  const [wmOpacity, setWmOpacity] = useState(70);
  const [memeTop, setMemeTop] = useState("");
  const [memeBottom, setMemeBottom] = useState("");
  // Sticker Studio: placed stickers positioned as fractions (fx,fy) of the image
  // box; size is a fraction of image width. Baked onto the canvas on Apply.
  type PlacedSticker = { id: string; emoji: string; fx: number; fy: number; size: number };
  const [showStickerStudio, setShowStickerStudio] = useState(false);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [stickerPack, setStickerPack] = useState(0);
  const stickerStageRef = useRef<HTMLDivElement>(null);
  const stickerDrag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [stageW, setStageW] = useState(0); // displayed image width (px) for sizing emoji
  // Short "what just happened" summary shown with an in-panel Download button.
  const [toolResult, setToolResult] = useState<{ title: string; detail?: string } | null>(null);

  // Prompt
  const [prompt, setPrompt] = useState("");

  // Auth / credits
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInReason, setSignInReason] = useState<"default" | "unlimited">("default");
  const [anonUsed, setAnonUsed] = useState(0);   // free transforms a guest has used
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Initialise from the real viewport so the first paint already uses the
  // mobile (bottom-sheet) layout — avoids the panel flashing on the right.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [blockedTool, setBlockedTool] = useState<{ id: string | null; icon: string; label: string } | null>(null);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);

  // Central payment-popup tracking — covers every setShowUpgradeModal/setShowNoCreditsModal
  // call site without needing to touch each one individually.
  useEffect(() => {
    if (showUpgradeModal) trackPaymentPopupTriggered(blockedTool ? "tool_blocked" : "manual");
  }, [showUpgradeModal, blockedTool]);
  useEffect(() => {
    if (showNoCreditsModal) trackPaymentPopupTriggered("no_credits");
  }, [showNoCreditsModal]);
  useEffect(() => {
    if (user?.userId) setAnalyticsUser({ id: user.userId, plan: user.plan || "free" });
    else if (!user) setAnalyticsUser(null);
  }, [user]);

  const PLAN_PRICES: Record<string, number> = { starter: 499, creator: 999, pro: 2499 };

  async function handleBuyPlan(planKey: string) {
    const planValue = PLAN_PRICES[planKey] || 0;
    trackBuyButtonClicked(planKey, planValue);
    setBuyingPlan(planKey);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(s);
        });
      }
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const orderData = await orderRes.json() as { order_id?: string; amount?: number; currency?: string; credits?: number; error?: string };
      if (!orderRes.ok || !orderData.order_id) {
        trackPaymentFailed(planKey, orderData.error || "order_creation_failed");
        setBuyingPlan(null);
        return;
      }
      trackBeginCheckout(planKey, planValue);
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JPT AI",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan — ${orderData.credits} credits`,
        theme: { color: "#6366F1" },
        modal: { ondismiss() { trackPaymentFailed(planKey, "cancelled_by_user"); setBuyingPlan(null); } },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, plan: planKey }),
            });
            const data = await verifyRes.json() as { success?: boolean; credits?: number };
            if (data.success && data.credits) {
              setUser(u => u ? { ...u, credits: data.credits!, plan: planKey } : u);
              setShowUpgradeModal(false);
              setBlockedTool(null);
              trackPurchase(planKey, planValue, data.credits);
            } else {
              trackPaymentFailed(planKey, "verification_failed");
            }
          } catch {
            trackPaymentFailed(planKey, "verification_request_failed");
          }
          setBuyingPlan(null);
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
      });
      rzp.open();
    } catch (e) {
      trackPaymentFailed(planKey, (e as Error).message || "unknown_error");
      setBuyingPlan(null);
    }
  }

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
    // ── Auth init (must run unconditionally — never placed after an early return) ──
    const loadUser = (retries = 1): Promise<void> =>
      fetch("/api/auth/google/me")
        .then(r => r.json())
        .then((d: { authenticated: boolean; userId?: string; email?: string; name?: string; picture?: string; credits?: number; plan?: string; dailyCreditResetAt?: string | null; trialToolsUsed?: string[]; trialsRemaining?: number }) => {
          if (d.authenticated && d.email) {
            setUser({ userId: d.userId, email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? FREE_CREDITS, plan: d.plan || "free", dailyCreditResetAt: d.dailyCreditResetAt, trialToolsUsed: d.trialToolsUsed ?? [], trialsRemaining: d.trialsRemaining ?? 0 });
            setAuthChecked(true);
          } else if (retries > 0) {
            return new Promise<void>(res => setTimeout(() => loadUser(retries - 1).then(res), 300));
          } else {
            setAuthChecked(true);
          }
        }).catch(() => {
          if (retries > 0) return new Promise<void>(res => setTimeout(() => loadUser(retries - 1).then(res), 1000));
          setAuthChecked(true);
        });

    loadUser();
    // Safety net: always unblock the UI within 3s regardless of auth state
    const authTimeout = setTimeout(() => setAuthChecked(true), 3000);

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
          try {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ dataUrl: pi, name: "uploaded", w: img.naturalWidth, h: img.naturalHeight, ts: Date.now() }));
          } catch {}
          sessionStorage.removeItem("jpt_pending_image");
          sessionStorage.removeItem("jpt_pending_tool");
        };
        img.src = pi;
        // Don't delete sessionStorage items here — do it in onload above so
        // persistContextForAuth can still read them if sign-in is clicked quickly.
        return () => clearTimeout(authTimeout); // skip localStorage restore, auth already started
      }
    } catch {}

    // 3. Auto-restore saved session (24h) from localStorage — no prompt needed
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SessionData;
        if (Date.now() - s.ts < SESSION_TTL) {
          setOriginal({ dataUrl: s.dataUrl, w: s.w, h: s.h, name: s.name });
          setResizeW(s.w); setResizeH(s.h);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {}

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => { clearTimeout(authTimeout); window.removeEventListener("resize", checkMobile); };
  }, []);

  // ── Auth gate ─────────────────────────────────────────────────────────────────

  // Don't gate until the auth check has completed — avoids false sign-in
  // prompts during the brief window after OAuth redirect while cookies resolve.
  const requireSignIn = () => { if (!authChecked) return true; if (!user) { setShowSignInModal(true); return true; } return false; };

  // Free tools are unlimited for signed-in users. Anonymous visitors get 5
  // free transforms, then must sign up (unlimited afterwards, no credits).
  const ANON_FREE_TRANSFORMS = 5;
  const anonBlocked = (): boolean => {
    if (!authChecked || user) return false; // signed in → unlimited
    let used = 0;
    try { used = parseInt(localStorage.getItem("jpt_anon_transforms") || "0", 10) || 0; } catch {}
    if (used >= ANON_FREE_TRANSFORMS) { setSignInReason("unlimited"); setShowSignInModal(true); return true; }
    return false;
  };
  const recordAnonTransform = () => {
    if (user) return;
    try {
      const used = (parseInt(localStorage.getItem("jpt_anon_transforms") || "0", 10) || 0) + 1;
      localStorage.setItem("jpt_anon_transforms", String(used));
      setAnonUsed(used);
    } catch {}
  };
  const anonLeft = Math.max(0, ANON_FREE_TRANSFORMS - anonUsed);

  // Load the guest's used-count on mount so the "free edits left" counter is accurate.
  useEffect(() => {
    try { setAnonUsed(parseInt(localStorage.getItem("jpt_anon_transforms") || "0", 10) || 0); } catch {}
  }, []);

  // Clear the per-tool result summary when switching tools or loading a new image.
  useEffect(() => { setToolResult(null); }, [activeTool, original?.dataUrl]);

  // Keep the Sticker Studio stage width in sync so emoji scale with the image.
  const measureStage = () => { if (stickerStageRef.current) setStageW(stickerStageRef.current.getBoundingClientRect().width); };
  useEffect(() => {
    if (!showStickerStudio) return;
    measureStage();
    window.addEventListener("resize", measureStage);
    return () => window.removeEventListener("resize", measureStage);
  }, [showStickerStudio]);

  // ── Compress image to max 1024px before sending to API (avoids 4.5MB Vercel limit) ──
  const compressForApi = async (dataUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // ── API call helper (handles 401 / 402 and updates credits) ──────────────────

  const callApi = useCallback(async <T extends Record<string, unknown>>(
    url: string,
    body: object,
    onBlocked?: () => void
  ): Promise<T | null> => {
    const compressedBody: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    if (typeof compressedBody.dataUrl === "string") {
      compressedBody.dataUrl = await compressForApi(compressedBody.dataUrl as string);
      // Upload to Supabase so we send a URL instead of base64 (avoids 4.5MB Vercel limit)
      try {
        const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
        compressedBody.imageUrl = await uploadDataUrlToSupabase(compressedBody.dataUrl as string);
        delete compressedBody.dataUrl;
      } catch {
        // fallback: keep sending as dataUrl
      }
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compressedBody),
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

    // If API returned a CDN URL, fetch it client-side
    if (typeof data.url === "string" && data.url.startsWith("http")) {
      const dataUrlResult = await urlToDataUrl(data.url);
      return { ...data, dataUrl: dataUrlResult, image: dataUrlResult } as T;
    }
    // dataUrl returned directly (Gemini routes)
    return data;
  }, []);

  // ── File upload ───────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      trackImageUploadFailed("editor", "unsupported_format");
      setError(`Unsupported format: ${file.type.split("/")[1]?.toUpperCase() || "unknown"}. Please upload a JPG, PNG, or WEBP image.`);
      return;
    }
    setError(null); setWorking(null); setEditHistory([]);
    setActiveTool(null); setShowOriginal(true);
    setSavedSession(null); setAppliedUpscale(null);
    resetAdjust();
    try {
      const p = await prepareImage(file);
      const name = file.name.replace(/\.[^.]+$/, "") || "image";
      setOriginal({ dataUrl: p.dataUrl, w: p.w, h: p.h, name });
      setResizeW(p.w); setResizeH(p.h);
      trackImageUploaded("editor");
      // Persist session for 24h
      try {
        const sess: SessionData = { dataUrl: p.dataUrl, name, w: p.w, h: p.h, ts: Date.now() };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      } catch { /* storage full, ignore */ }
    } catch { trackImageUploadFailed("editor", "load_error"); setError("Failed to load image."); }
  }, []);

  const resetAdjust = () => { setBrightness(100); setContrast(100); setSaturation(100); setSharpness(0); };

  // Reset slider and measure result dimensions whenever a new result arrives
  useEffect(() => {
    if (working) {
      setSliderPos(50);
      setZoom(1); setPanX(0); setPanY(0);
      const img = new Image();
      img.onload = () => setWorkingSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = working;
    } else {
      setWorkingSize(null);
    }
  }, [working]);

  const getSliderPosFromEvent = useCallback((clientX: number): number => {
    // Use the transformed content's own rect, not the outer (unscaled)
    // container — getBoundingClientRect() already reflects any scale()/
    // translate() applied to it, so this stays accurate at any zoom/pan.
    const content = sliderContentRef.current || sliderContainerRef.current;
    if (!content) return 50;
    const rect = content.getBoundingClientRect();
    if (!rect.width) return 50;
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
    trackGenerateButtonClicked("generate-bg");
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
      trackImageGenerated("generate-bg");
      autoSaveToDrive(data.dataUrl, "generate-bg", templateOrPrompt.slice(0, 60));
    } catch (e) {
      setUser(u => u ? { ...u, credits: prevCreditsGBg } : u); // rollback on error
      trackImageGenerationFailed("generate-bg", (e as Error).message);
      setError((e as Error).message);
    }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleUpscale = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;

    const isPro = upscaleMode === "pro";
    // Pro upscale is an AI tool — gated by sign-in + trial/credits.
    // Normal upscale is free & unlimited for signed-in users; anonymous
    // visitors get one free transform, then are asked to sign up.
    if (isPro && requireSignIn()) return;
    if (!isPro && anonBlocked()) return;
    if (isPro) trackTransformButtonClicked("upscale-pro");
    setProcessing(true); setProcessingLabel(`${isPro ? "AI Pro" : ""} Upscaling ${upscaleScale}…`); setError(null);
    const prevCredits = user?.credits ?? 0;
    if (isPro) setUser(u => u ? { ...u, credits: Math.max(0, u.credits - CREDIT_COST) } : u);

    try {
      if (isPro) {
        // Pro: use Gemini AI — costs 2 credits, plan-gated
        const data = await callApi<{ dataUrl: string }>(
          "/api/upscale-pro",
          { dataUrl: src, scale: upscaleScale },
          () => setUser(u => u ? { ...u, credits: prevCredits } : u)
        );
        if (!data?.dataUrl) throw new Error("Pro upscale failed");
        setEditHistory(prev => working ? [...prev, working] : prev);
        setWorking(data.dataUrl);
        setAppliedUpscale(upscaleScale);
        setToolResult({ title: `Pro upscaled ${upscaleScale}`, detail: "AI super-resolution applied" });
        trackImageTransformed("upscale-pro");
        autoSaveToDrive(data.dataUrl, "upscale", `${upscaleScale} Pro Upscale`);
      } else {
        // Normal: canvas upscale — free, unlimited, no account or credits needed.
        const { upscaleImage } = await import("@/lib/upscale-client");
        const out = await upscaleImage(src, upscaleScale);
        const dim = await loadImg(out);
        setEditHistory(prev => working ? [...prev, working] : prev);
        setWorking(out);
        setAppliedUpscale(upscaleScale);
        setToolResult({ title: `Upscaled ${upscaleScale}`, detail: `${dim.naturalWidth}×${dim.naturalHeight}px` });
        recordAnonTransform();
        autoSaveToDrive(out, "upscale", `${upscaleScale} Upscale`);
      }
    } catch (e) {
      if (isPro) {
        setUser(u => u ? { ...u, credits: prevCredits } : u);
        trackImageTransformedFailed("upscale-pro", (e as Error).message);
      }
      setError((e as Error).message || "Upscale failed. Please try again.");
    }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  // Persist the current image + active tool so they survive the sign-in
  // round-trip (OAuth redirect or reload) and the editor reopens with context.
  const persistContextForAuth = () => {
    try {
      const cur = working || original?.dataUrl;
      if (cur) sessionStorage.setItem("jpt_pending_image", cur);
      if (activeTool) sessionStorage.setItem("jpt_pending_tool", activeTool);
    } catch {}
  };

  // Expose the persist fn so the global NavBar's sign-in can preserve editor
  // context (uploaded image + active tool) before its OAuth redirect / reload.
  useEffect(() => {
    (window as unknown as { __jptPersistContext?: () => void }).__jptPersistContext = persistContextForAuth;
    return () => { delete (window as unknown as { __jptPersistContext?: () => void }).__jptPersistContext; };
  });

  const handleGoogleSignIn = () => {
    persistContextForAuth();
    const next = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
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
      persistContextForAuth();
      window.location.reload();
    } catch { setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  const handleResize = async () => {
    const src = working || original?.dataUrl;
    if (!src || !resizeW || !resizeH || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await resizeOnCanvas(src, resizeW, resizeH);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: "Resized", detail: `${resizeW}×${resizeH}px · ~${humanSize(dataUrlBytes(result))}` });
      recordAnonTransform();
      autoSaveToDrive(result, "resize", `${resizeW}×${resizeH}`);
    }
    catch { setError("Resize failed."); }
    finally { setProcessing(false); }
  };

  const handleApplyAdjust = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await applyFiltersToCanvas(src, brightness, contrast, saturation, sharpness);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: "Adjustments applied", detail: "Brightness, contrast, saturation & sharpness baked in" });
      recordAnonTransform();
      resetAdjust();
      autoSaveToDrive(result, "adjust", "Color Adjustments");
    }
    catch { setError("Adjust failed."); }
    finally { setProcessing(false); }
  };

  const handleCrop = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const [rw, rh] = cropRatio === "circle" ? [1, 0] : cropRatio.split(":").map(Number);
      const result = await cropToAspect(src, rw, rh);
      const dim = await loadImg(result);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: cropRatio === "circle" ? "Cropped to circle" : `Cropped to ${cropRatio}`, detail: `${dim.naturalWidth}×${dim.naturalHeight}px` });
      recordAnonTransform();
      autoSaveToDrive(result, "crop", cropRatio);
    }
    catch { setError("Crop failed."); }
    finally { setProcessing(false); }
  };

  const applyRotateFlip = async (deg: number, flipH: boolean, flipV: boolean) => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await rotateFlipOnCanvas(src, deg, flipH, flipV);
      const dim = await loadImg(result);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: deg ? `Rotated ${deg}°` : flipH ? "Flipped horizontally" : "Flipped vertically", detail: `${dim.naturalWidth}×${dim.naturalHeight}px` });
      recordAnonTransform();
      autoSaveToDrive(result, "rotate", deg ? `${deg}°` : flipH ? "flip-h" : "flip-v");
    }
    catch { setError("Rotate failed."); }
    finally { setProcessing(false); }
  };

  const handleCompress = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const before = dataUrlBytes(src);
      const result = await compressOnCanvas(src, compressQuality / 100);
      const after = dataUrlBytes(result);
      const pct = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: `Compressed to ${humanSize(after)}`, detail: `${humanSize(before)} → ${humanSize(after)} · ${pct}% smaller` });
      recordAnonTransform();
      autoSaveToDrive(result, "compress", `${compressQuality}%`);
    }
    catch { setError("Compress failed."); }
    finally { setProcessing(false); }
  };

  const handleConvert = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await convertOnCanvas(src, convertFormat);
      const label = convertFormat === "jpeg" ? "JPG" : convertFormat.toUpperCase();
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: `Converted to ${label}`, detail: `${label} file · ~${humanSize(dataUrlBytes(result))}` });
      recordAnonTransform();
      autoSaveToDrive(result, "convert", convertFormat.toUpperCase());
    }
    catch { setError("Convert failed."); }
    finally { setProcessing(false); }
  };

  const handleDownloadPdf = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setProcessingLabel("Building PDF…"); setError(null);
    try {
      const pdf = await imageToPdfDataUrl(src);
      const a = document.createElement("a");
      a.href = pdf; a.download = `${original?.name || "image"}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      recordAnonTransform();
      trackDownloadButtonClicked("pdf");
    }
    catch { setError("PDF export failed."); }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const handleWatermark = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await applyWatermark(src, { text: wmText, position: wmPosition, fontScale: wmFontScale, color: wmColor, opacity: wmOpacity / 100 });
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: "Watermark added", detail: `"${wmText || "© JPT AI"}" · ${wmPosition.replace("-", " ")}` });
      recordAnonTransform();
      autoSaveToDrive(result, "watermark", wmText);
    }
    catch { setError("Watermark failed."); }
    finally { setProcessing(false); }
  };

  const handleMeme = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (!memeTop.trim() && !memeBottom.trim()) { setError("Enter top or bottom text for the meme."); return; }
    if (anonBlocked()) return;
    setProcessing(true); setError(null);
    try {
      const result = await renderMeme(src, memeTop, memeBottom);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: "Meme created", detail: "Classic Impact caption added" });
      recordAnonTransform();
      autoSaveToDrive(result, "meme", `${memeTop} / ${memeBottom}`.slice(0, 60));
    }
    catch { setError("Meme failed."); }
    finally { setProcessing(false); }
  };

  // ── Sticker Studio ──────────────────────────────────────────────────────────
  const openStickerStudio = () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (anonBlocked()) return;
    setStickers([]);
    setSelectedStickerId(null);
    setStickerPack(0);
    setShowStickerStudio(true);
  };

  const addSticker = (emoji: string) => {
    const id = `s${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
    // Drop new stickers near the center with a slight offset so stacks fan out.
    const jitter = (Math.random() - 0.5) * 0.12;
    setStickers(prev => [...prev, { id, emoji, fx: 0.5 + jitter, fy: 0.5 + jitter, size: 0.16 }]);
    setSelectedStickerId(id);
  };

  const onStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const stage = stickerStageRef.current;
    const st = stickers.find(s => s.id === id);
    if (!stage || !st) return;
    const rect = stage.getBoundingClientRect();
    // Offset between pointer and sticker center, in fractions, so it doesn't jump.
    stickerDrag.current = {
      id,
      dx: (e.clientX - rect.left) / rect.width - st.fx,
      dy: (e.clientY - rect.top) / rect.height - st.fy,
    };
    setSelectedStickerId(id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onStickerPointerMove = (e: React.PointerEvent) => {
    const drag = stickerDrag.current;
    const stage = stickerStageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width - drag.dx));
    const fy = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height - drag.dy));
    setStickers(prev => prev.map(s => s.id === drag.id ? { ...s, fx, fy } : s));
  };

  const onStickerPointerUp = () => { stickerDrag.current = null; };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setSelectedStickerId(cur => cur === id ? null : cur);
  };

  const applyStickers = async () => {
    const src = working || original?.dataUrl;
    if (!src || !stickers.length) { setShowStickerStudio(false); return; }
    setProcessing(true); setError(null);
    try {
      const img = await loadImg(src);
      const W = img.naturalWidth, H = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const s of stickers) {
        const fontPx = Math.max(8, s.size * W);
        ctx.font = `${fontPx}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.fillText(s.emoji, s.fx * W, s.fy * H);
      }
      const out = canvas.toDataURL(src.includes("image/png") ? "image/png" : "image/jpeg", 0.92);
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(out);
      setToolResult({ title: "Stickers added", detail: `${stickers.length} sticker${stickers.length === 1 ? "" : "s"} placed` });
      recordAnonTransform();
      autoSaveToDrive(out, "stickers", `${stickers.length} stickers`);
      setShowStickerStudio(false);
      setStickers([]);
    }
    catch { setError("Adding stickers failed."); }
    finally { setProcessing(false); }
  };

  const handleAiEdit = async () => {
    const src = working || original?.dataUrl;
    if (!src || !prompt.trim() || processing) return;
    trackTransformButtonClicked("ai-edit");
    setProcessing(true); setProcessingLabel("Editing with JPT AI…"); setError(null);
    const prevCreditsAI = user?.credits ?? 0;
    setUser(u => u ? { ...u, credits: Math.max(0, u.credits - CREDIT_COST) } : u);
    try {
      const data = await callApi<{ dataUrl: string }>("/api/ai-edit", { dataUrl: src, prompt: prompt.trim() }, () => setUser(u => u ? { ...u, credits: prevCreditsAI } : u));
      if (data?.dataUrl) {
        setEditHistory(prev => working ? [...prev, working] : prev);
        setWorking(data.dataUrl);
        trackImageTransformed("ai-edit");
        autoSaveToDrive(data.dataUrl, "ai-edit", prompt.trim().slice(0, 60));
        setPrompt("");
      } else throw new Error("Edit failed");
    } catch (e) {
      setUser(u => u ? { ...u, credits: prevCreditsAI } : u); // rollback on error
      trackImageTransformedFailed("ai-edit", (e as Error).message);
      setError((e as Error).message);
    }
    finally { setProcessing(false); setProcessingLabel(""); }
  };

  const [removeBgProgress, setRemoveBgProgress] = useState(0);

  const handleRemoveBg = async () => {
    const src = working || original?.dataUrl;
    if (!src || processing) return;
    if (requireSignIn()) return;
    trackTransformButtonClicked("remove-bg");

    // Remove BG is an AI (Gemini) tool. callApi handles the paywall statuses
    // (401 sign-in, 402 credits, 403 upgrade) by showing the right modal.
    setProcessing(true); setProcessingLabel("Removing background…"); setError(null); setRemoveBgProgress(20);
    try {
      const data = await callApi<{ dataUrl: string }>("/api/remove-bg", { dataUrl: src });
      setRemoveBgProgress(90);
      if (!data?.dataUrl) return; // blocked — callApi already surfaced the modal
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(data.dataUrl);
      setRemoveBgProgress(100);
      trackImageTransformed("remove-bg");
      autoSaveToDrive(data.dataUrl, "remove-bg", "Background Removed");
    } catch (e) {
      trackImageTransformedFailed("remove-bg", (e as Error).message || "remove_bg_failed");
      setError((e as Error).message || "Background removal failed");
    } finally {
      setProcessing(false); setProcessingLabel("");
    }
  };

  const handleAspectW = (v: number) => { setResizeW(v); if (lockAspect && original) setResizeH(Math.round(v * original.h / original.w)); };
  const handleAspectH = (v: number) => { setResizeH(v); if (lockAspect && original) setResizeW(Math.round(v * original.w / original.h)); };

  const handleDownload = () => {
    const url = working || original?.dataUrl;
    if (!url) return;
    trackDownloadButtonClicked(activeTool || "editor");
    const ext = url.includes("image/png") ? "png" : url.includes("image/webp") ? "webp" : "jpg";
    const a = document.createElement("a");
    a.href = url; a.download = `${original?.name || "image"}-edited.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Green "what just happened" summary + an in-panel Download button. Shown
  // inside each free tool's panel right after an operation completes.
  const resultBlock = () => toolResult && (
    <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#16A34A", display: "flex", alignItems: "center", gap: 6 }}>✓ {toolResult.title}</div>
      {toolResult.detail && <div style={{ fontSize: 12, color: "#4B5563", marginTop: 3 }}>{toolResult.detail}</div>}
      <button
        onClick={handleDownload}
        style={{ ...s.primaryBtn, marginTop: 10, background: "linear-gradient(135deg,#10B981,#059669)" }}
      >
        ⬇ Download
      </button>
    </div>
  );

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


  const hasImage = !!original;
  const adjustFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const creditsLeft = user?.credits ?? 0;
  // Denominator scales up once a user buys more than the free allotment,
  // so the bar/ratio never shows nonsense like "82 / 10" or negative "used".
  const creditsTotal = Math.max(creditsLeft, FREE_CREDITS);
  const lowCredits = creditsLeft > 0 && creditsLeft <= CREDIT_COST * 2;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      {/* Always-mounted file input so Upload New Image works after an image is loaded */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ""; } }} />

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
            <a href="/batch-editor" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#F0F0FF", color: "#6366F1", border: "1.5px solid #C7D2FE", borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" as const }}>
              ⚡ Batch (100 images)
            </a>
            {hasImage && working && (
              <button style={s.dlBtn} onClick={handleDownload}>⬇ Download</button>
            )}
            {user && (
              <button style={s.userChip} onClick={() => setShowAccountModal(true)}>
                {user.picture
                  ? <img src={user.picture} alt="" style={s.avatar} />
                  : <span style={s.avatarFallback}>{user.name[0]}</span>}
                <span style={s.userName}>{user.name.split(" ")[0]}</span>
                {!PAID_FEATURES_ENABLED ? (
                  <span style={{ ...s.creditsBadge, background: "#DCFCE7", color: "#16A34A" }}>♾️ Free</span>
                ) : user.plan === "free" ? (
                  <span style={{ ...s.creditsBadge, ...((user.trialsRemaining ?? 0) === 0 ? s.creditsEmpty : {}) }}>
                    🎁 {user.trialsRemaining ?? 0}
                  </span>
                ) : (
                  <span style={{ ...s.creditsBadge, ...(creditsLeft === 0 ? s.creditsEmpty : lowCredits ? s.creditsLow : {}) }}>
                    ⚡ {creditsLeft}
                  </span>
                )}
              </button>
            )}
            {!user && authChecked && (
              anonLeft > 0 ? (
                <button
                  style={{ ...s.userChip, cursor: "pointer" }}
                  onClick={() => { setSignInReason("default"); setShowSignInModal(true); }}
                  title="Sign up free for unlimited edits"
                >
                  <span style={{ ...s.creditsBadge, background: "#EEF2FF", color: "#6366F1" }}>
                    🎁 {anonLeft} free edit{anonLeft === 1 ? "" : "s"} left
                  </span>
                </button>
              ) : (
                <button
                  style={{ padding: "7px 14px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" as const, boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}
                  onClick={() => { setSignInReason("unlimited"); setShowSignInModal(true); }}
                >
                  Sign up free — unlimited →
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div style={s.layout}>

        {/* ── Left Sidebar (desktop only) ──────────────────────────────────── */}
        {!isMobile && <div style={s.sidebar}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              disabled={!hasImage}
              onClick={() => {
                // Free tools: always usable immediately (no auth needed to select panel).
                if (t.free) { setActiveTool(activeTool === t.id ? null : t.id); return; }
                // For paid tools, wait until auth is resolved before gating.
                if (!authChecked) { setActiveTool(activeTool === t.id ? null : t.id); return; }
                if (!user) { requireSignIn(); return; }
                const isPaidUser = !!(user.plan && user.plan !== "free");
                const trialUsedForTool = !!(t.id && user.trialToolsUsed?.includes(t.id));
                const trialAvailable = !trialUsedForTool && (user.trialsRemaining ?? 0) > 0;
                if (t.paid && !isPaidUser && !trialAvailable) {
                  setBlockedTool(t);
                  setShowUpgradeModal(true);
                  return;
                }
                setActiveTool(activeTool === t.id ? null : t.id);
              }}
              title={`${t.label}${t.free || ["resize", "adjust"].includes(t.id ?? "") ? " (Free)" : ` (${CREDIT_COST} credits, or a free trial)`}`}
              style={{ ...s.toolBtn, ...(activeTool === t.id ? s.toolBtnActive : {}), ...(!hasImage ? { opacity: 0.35, cursor: "not-allowed" } : {}) }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={s.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>}

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <div style={{ ...s.canvasArea, ...(isMobile ? { padding: "12px", paddingBottom: 72 } : {}) }}>

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
              <div style={{ fontSize: 60, marginBottom: 16 }}>🖼</div>
              <p style={s.uploadTitle}>Drop an image or <span style={{ color: "#6366F1", fontWeight: 700 }}>click to browse</span></p>
              <p style={s.uploadHint}>JPG · PNG · WEBP — choose a tool from the left</p>
              <div style={s.featureRow}>
                {TOOLS.map((t) => <span key={t.id} style={s.featureChip}>{t.icon} {t.label}</span>)}
              </div>
              {!user && (
                <div style={s.signInHint}>
                  <button onClick={() => setShowSignInModal(true)} style={{ color: "#6366F1", fontWeight: 600, textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign up free</button> to transform unlimited images — no limits on any tool
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
                  {/* Zoom controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "flex-end" }}>
                    {zoom > 1 && <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>Drag the ⟺ handle to compare · drag elsewhere to pan</span>}
                    <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>🔍 {Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E0EE", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#555" }}>+</button>
                    <button onClick={() => { setZoom(z => { const nz = Math.max(1, +(z - 0.25).toFixed(2)); if (nz === 1) { setPanX(0); setPanY(0); } return nz; }); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E0EE", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#555" }}>−</button>
                    {zoom > 1 && <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E0E0EE", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#6366F1" }}>Reset</button>}
                  </div>
                  <div
                    ref={sliderContainerRef}
                    style={{
                      position: "relative",
                      width: "100%",
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                      background: "#eee",
                      cursor: isDragging ? "ew-resize" : zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => {
                      if (zoom > 1) { setIsPanning(true); panStart.current = { x: e.clientX, y: e.clientY, px: panX, py: panY }; }
                    }}
                    onMouseMove={(e) => {
                      if (isDragging) {
                        onSliderMouseMove(e);
                      } else if (zoom > 1 && isPanning && panStart.current) {
                        setPanX(panStart.current.px + e.clientX - panStart.current.x);
                        setPanY(panStart.current.py + e.clientY - panStart.current.y);
                      }
                    }}
                    onMouseUp={() => { setIsPanning(false); panStart.current = null; onSliderEnd(); }}
                    onMouseLeave={() => { setIsPanning(false); panStart.current = null; onSliderEnd(); }}
                    onTouchMove={onSliderTouchMove}
                    onTouchEnd={onSliderEnd}
                  >
                    {/* Before/after slider — scales and pans together as one unit when zoomed.
                        position:relative is required here: it's what the clipped overlay and
                        divider (position:absolute children below) anchor to. Without it, they
                        fall back to the outer, untransformed container and don't actually move
                        with the zoom/pan. */}
                    <div
                      ref={sliderContentRef}
                      style={{
                        position: "relative",
                        ...(zoom > 1 ? { transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`, transformOrigin: "center center" } : {}),
                      }}
                    >
                      {/* Result image (behind) */}
                      <div style={{ position: "relative" }}>
                        {working?.includes("image/png") && <div style={s.checker} />}
                        <img src={working} alt="result" style={{ display: "block", maxWidth: "100%", maxHeight: "65vh", width: "100%", objectFit: "contain", position: "relative", zIndex: 1, filter: activeTool === "adjust" && !processing ? adjustFilter : undefined }} />
                      </div>
                      {/* Original image (clipped over result) */}
                      <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`, zIndex: 2 }}>
                        <img src={original?.dataUrl} alt="original" style={{ display: "block", maxWidth: "100%", maxHeight: "65vh", width: "100%", objectFit: "contain" }} />
                      </div>
                      {/* Divider + handle */}
                      <div
                        style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.4)", transform: "translateX(-50%)", cursor: "ew-resize", zIndex: 3 }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
                      >
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 44, height: 44, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#555" }}>⟺</div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>Original</div>
                      {original && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{original.w} × {original.h}px</div>}
                    </div>
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4, background: "rgba(99,102,241,0.85)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>✨ Result</div>
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

              {/* Upload New Image button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "#fff", border: "2px solid #6366F1", borderRadius: 10, color: "#6366F1", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  🖼 Upload New Image
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ── Right Tool Panel ─────────────────────────────────────────────── */}
        {activeTool && hasImage && (
          <div style={isMobile ? {
            position: "fixed" as const, bottom: 0, left: 0, right: 0, zIndex: 150,
            background: "#fff", borderRadius: "18px 18px 0 0",
            boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
            maxHeight: mobileSheetOpen ? "72vh" : 0,
            overflow: "hidden", transition: "max-height 0.3s ease",
            display: "flex", flexDirection: "column" as const,
          } : s.toolPanel}>

            {/* Mobile sheet handle */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 4px", flexShrink: 0 }}>
                <div style={{ flex: 1 }} />
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D0D0D0", cursor: "pointer" }} onClick={() => setMobileSheetOpen(false)} />
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => { setMobileSheetOpen(false); setActiveTool(null); }} style={{ background: "none", border: "none", fontSize: 20, color: "#888", cursor: "pointer", padding: "0 4px" }}>×</button>
                </div>
              </div>
            )}
            <div style={isMobile ? { overflowY: "auto" as const, flex: 1, paddingBottom: 80 } : {}}>

            {/* Generate Background */}
            {activeTool === "generate-bg" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🌅 Generate Background</div>
                <p style={s.panelSub}>Choose a template or describe your own background</p>
                <div style={s.creditNote}>
                  {user?.plan === "free"
                    ? user.trialToolsUsed?.includes("generate-bg") ? `Free trial used · ${CREDIT_COST} credits after upgrading` : (user.trialsRemaining ?? 0) > 0 ? "1 free trial available" : "No free trials left · upgrade to use"
                    : `Uses ${CREDIT_COST} credits · ${creditsLeft} remaining`}
                </div>

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
                    style={{ ...s.primaryBtn, marginBottom: 12, ...((processing || !authChecked) ? s.btnOff : {}) }}
                    disabled={processing || !authChecked}
                    onClick={() => {
                      const tpl = BG_TEMPLATES.find(t => t.id === selectedTemplate);
                      if (tpl) handleGenerateBg(tpl.prompt);
                    }}
                  >
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Generating…</span> : !authChecked ? <span style={s.btnRow}><span style={s.spin} />Loading…</span> : "🎨 Generate Selected"}
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
                    style={{ ...s.primaryBtn, background: "linear-gradient(135deg,#4285F4,#8B5CF6)", marginTop: 10, ...(customBgPrompt.trim().length === 0 || processing || !authChecked ? s.btnOff : {}) }}
                    disabled={customBgPrompt.trim().length === 0 || processing || !authChecked}
                    onClick={() => handleGenerateBg(customBgPrompt.trim())}
                  >
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Generating…</span> : !authChecked ? <span style={s.btnRow}><span style={s.spin} />Loading…</span> : "✨ Generate Custom"}
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
                <div style={s.creditNote}>
                  {user?.plan === "free"
                    ? user.trialToolsUsed?.includes("ai-edit") ? `Free trial used · ${CREDIT_COST} credits after upgrading` : (user.trialsRemaining ?? 0) > 0 ? "1 free trial available" : "No free trials left · upgrade to use"
                    : `Uses ${CREDIT_COST} credits · ${creditsLeft} remaining`}
                </div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={'e.g. "Make the background blurry"\n"Change the sky to sunset"\n"Add dramatic lighting"'} style={s.textarea} rows={4} disabled={processing} />
                <div style={s.suggestions}>
                  {["Make background blurry", "Add dramatic lighting", "Change to black and white", "Make it cinematic", "Add fog effect"].map((s2) => (
                    <button key={s2} style={s.chip} onClick={() => setPrompt(s2)} disabled={processing}>{s2}</button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(!prompt.trim() || processing || !authChecked ? s.btnOff : {}) }} disabled={!prompt.trim() || processing || !authChecked} onClick={handleAiEdit}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Editing…</span> : !authChecked ? <span style={s.btnRow}><span style={s.spin} />Loading…</span> : "✨ Apply Edit"}
                </button>
              </div>
            )}

            {/* Upscale */}
            {activeTool === "upscale" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔍 Upscale</div>
                <p style={s.panelSub}>Enhance image quality, sharpness and detail</p>

                {/* Mode toggle: Normal / Pro AI — Pro is hidden in free-only mode */}
                {PAID_FEATURES_ENABLED && (
                <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#F3F4F6", borderRadius: 10, padding: 4 }}>
                  {([
                    { key: "normal", label: "⚡ Normal", sub: "Free · unlimited" },
                    { key: "pro", label: "✨ Pro AI", sub: "2 credits · AI" },
                  ] as const).map(m => (
                    <button
                      key={m.key}
                      onClick={() => {
                        // Pro upscale is paid-only — free users get one trial, then the payment popup.
                        const isPaidUser = !!(user && user.plan && user.plan !== "free");
                        const trialUsedForUpscalePro = !!user?.trialToolsUsed?.includes("upscale-pro");
                        const trialAvailable = !trialUsedForUpscalePro && (user?.trialsRemaining ?? 0) > 0;
                        if (m.key === "pro" && !isPaidUser && !trialAvailable) {
                          setBlockedTool({ id: "upscale", icon: "✨", label: "Upscale (Pro)" });
                          setShowUpgradeModal(true);
                          return;
                        }
                        setUpscaleMode(m.key);
                      }}
                      style={{
                        flex: 1, padding: "8px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: upscaleMode === m.key ? "#fff" : "transparent",
                        boxShadow: upscaleMode === m.key ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: upscaleMode === m.key ? "#6366F1" : "#888" }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: upscaleMode === m.key ? "#6366F1" : "#AAA", marginTop: 1 }}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                )}

                {/* 2x / 4x toggle */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "#888", marginBottom: 8 }}>Enhancement Level</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["2x", "4x"] as const).map((sc) => {
                      const curW = workingSize?.w || original?.w || 0;
                      const curH = workingSize?.h || original?.h || 0;
                      const maxDim = Math.max(curW, curH);
                      const mult = sc === "4x" ? 4 : 2;
                      const tooLarge = maxDim > 0 && maxDim * mult > MAX_UPSCALE_OUTPUT_PX;
                      return (
                        <button
                          key={sc}
                          onClick={() => setUpscaleScale(sc)}
                          title={tooLarge ? `Image too large for ${sc} upscaling (output would exceed 8000px)` : undefined}
                          style={{
                            flex: 1, padding: "12px 8px", borderRadius: 10,
                            border: upscaleScale === sc ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                            background: upscaleScale === sc ? "#EEEEFF" : "#FAFAFA",
                            cursor: tooLarge ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 18,
                            color: tooLarge ? "#CCC" : upscaleScale === sc ? "#6366F1" : "#999", transition: "all 0.15s",
                            opacity: tooLarge ? 0.5 : 1,
                          }}
                        >
                          {sc}
                          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: tooLarge ? "#CCC" : upscaleScale === sc ? "#6366F1" : "#AAA" }}>
                            {tooLarge ? "Too large" : sc === "2x" ? "Enhance" : "Ultra"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    // Only warn before any upscale is applied — once upscaled, the
                    // "Already upscaled" note covers it (the result is naturally large).
                    if (appliedUpscale) return null;
                    const curW = workingSize?.w || original?.w || 0;
                    const curH = workingSize?.h || original?.h || 0;
                    const maxDim = Math.max(curW, curH);
                    const mult = upscaleScale === "4x" ? 4 : 2;
                    if (maxDim > 0 && maxDim * mult > MAX_UPSCALE_OUTPUT_PX) {
                      const tooLargeFor2x = maxDim * 2 > MAX_UPSCALE_OUTPUT_PX;
                      return (
                        <div style={{ marginTop: 8, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#92400E", display: "flex", alignItems: "flex-start", gap: 6 }}>
                          ⚠️ {tooLargeFor2x
                            ? `Image is already very high-res (${curW}×${curH}px). Upscaling is not needed.`
                            : `Image is too large for 4× upscale (output would be ${curW * 4}×${curH * 4}px). Use 2× instead.`}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>


                {appliedUpscale === upscaleScale && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                    😅 Already upscaled {upscaleScale}
                  </div>
                )}
                <button
                  style={{
                    ...s.primaryBtn,
                    ...((processing || appliedUpscale === upscaleScale) ? s.btnOff : {}),
                    background: upscaleMode === "pro"
                      ? "linear-gradient(135deg,#7C3AED,#EC4899)"
                      : upscaleScale === "4x"
                      ? "linear-gradient(135deg,#6366F1,#7C3AED)"
                      : "linear-gradient(135deg,#6366F1,#8B5CF6)",
                  }}
                  disabled={processing || appliedUpscale === upscaleScale || !authChecked || (() => { const m = Math.max(workingSize?.w || original?.w || 0, workingSize?.h || original?.h || 0); return m > 0 && m * (upscaleScale === "4x" ? 4 : 2) > MAX_UPSCALE_OUTPUT_PX; })()}
                  onClick={handleUpscale}
                >
                  {processing
                    ? <span style={s.btnRow}><span style={s.spin} />{upscaleMode === "pro" ? "AI Processing…" : `Upscaling ${upscaleScale}…`}</span>
                    : !authChecked
                    ? <span style={s.btnRow}><span style={s.spin} />Loading…</span>
                    : appliedUpscale === upscaleScale
                    ? `✓ Already ${upscaleScale}`
                    : (() => { const m = Math.max(workingSize?.w || original?.w || 0, workingSize?.h || original?.h || 0); return m > 0 && m * (upscaleScale === "4x" ? 4 : 2) > MAX_UPSCALE_OUTPUT_PX; })()
                    ? `⚠️ Resolution Limit Reached`
                    : upscaleMode === "pro"
                    ? `✨ Pro Upscale ${upscaleScale}`
                    : `🔍 Upscale ${upscaleScale}`}
                </button>
                {resultBlock()}
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
                {resultBlock()}
              </div>
            )}

            {/* Remove BG */}
            {activeTool === "remove-bg" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🪄 Remove Background</div>
                <p style={s.panelSub}>Automatically remove the background from any image</p>
                <div style={s.creditNote}>
                  {user?.plan === "free"
                    ? "AI background removal · paid plan"
                    : `Uses ${CREDIT_COST} credits · ${creditsLeft} remaining`}
                </div>
                {processing && removeBgProgress > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                        {removeBgProgress < 15 ? "Loading model…" : "Removing background…"}
                      </span>
                      <span style={{ fontSize: 13, color: "#6366F1", fontWeight: 700 }}>{removeBgProgress}%</span>
                    </div>
                    <div style={{ background: "#F1F5F9", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,#6366F1,#8B5CF6)", borderRadius: 6, width: `${removeBgProgress}%`, transition: "width 0.3s" }} />
                    </div>
                    {removeBgProgress < 15 && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, textAlign: "center" }}>First run may take ~10s to load the model</p>}
                  </div>
                )}
                <button
                  style={{ ...s.primaryBtn, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", ...(processing ? s.btnOff : {}) }}
                  disabled={processing}
                  onClick={handleRemoveBg}
                >
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Processing…</span> : "🪄 Remove Background"}
                </button>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>
                  Result is a transparent PNG. Use Generate BG to swap in a new background.
                </p>
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
                {resultBlock()}
              </div>
            )}

            {/* Crop */}
            {activeTool === "crop" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>✂️ Crop</div>
                <p style={s.panelSub}>Crop to a ready-made size — free, no credits</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { id: "1:1", label: "Square", sub: "1:1 · Instagram" },
                    { id: "4:5", label: "Portrait", sub: "4:5 · IG Post" },
                    { id: "9:16", label: "Story", sub: "9:16 · Reels" },
                    { id: "16:9", label: "Wide", sub: "16:9 · YouTube" },
                    { id: "3:2", label: "Classic", sub: "3:2 · Photo" },
                    { id: "circle", label: "Circle", sub: "Profile pic" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setCropRatio(r.id)}
                      style={{
                        padding: "10px 8px", borderRadius: 10, textAlign: "center",
                        border: cropRatio === r.id ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                        background: cropRatio === r.id ? "#EEEEFF" : "#FAFAFA",
                        cursor: "pointer", color: cropRatio === r.id ? "#6366F1" : "#666",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{r.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: cropRatio === r.id ? "#6366F1" : "#AAA" }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleCrop}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Cropping…</span> : "✂️ Apply Crop"}
                </button>
                {resultBlock() || <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>Center crop to the chosen ratio.</p>}
              </div>
            )}

            {/* Rotate & Flip */}
            {activeTool === "rotate" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔄 Rotate &amp; Flip</div>
                <p style={s.panelSub}>Straighten or mirror your image — free</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button style={s.ghostBtn} disabled={processing} onClick={() => applyRotateFlip(270, false, false)}>↺ Rotate Left</button>
                  <button style={s.ghostBtn} disabled={processing} onClick={() => applyRotateFlip(90, false, false)}>↻ Rotate Right</button>
                  <button style={s.ghostBtn} disabled={processing} onClick={() => applyRotateFlip(180, false, false)}>⤴ 180°</button>
                  <button style={s.ghostBtn} disabled={processing} onClick={() => applyRotateFlip(0, true, false)}>⇄ Flip H</button>
                  <button style={s.ghostBtn} disabled={processing} onClick={() => applyRotateFlip(0, false, true)}>⇅ Flip V</button>
                </div>
                {processing && <p style={{ fontSize: 12, color: "#6366F1", marginTop: 10, textAlign: "center" }}><span style={s.spin} /> Working…</p>}
                {resultBlock()}
              </div>
            )}

            {/* Compress */}
            {activeTool === "compress" && (() => {
              const src = working || original?.dataUrl || "";
              return (
                <div style={s.panelContent}>
                  <div style={s.panelTitle}>🗜️ Compress</div>
                  <p style={s.panelSub}>Shrink file size for web &amp; email — free</p>
                  <div style={s.sliderRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={s.inputLabel}>Quality</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{compressQuality}%</span>
                    </div>
                    <input type="range" min={10} max={95} value={compressQuality} onChange={(e) => setCompressQuality(parseInt(e.target.value))} style={{ width: "100%" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#AAA", marginTop: 2 }}>
                      <span>Smaller file</span><span>Higher quality</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Current size: ~{humanSize(dataUrlBytes(src))}</div>
                  <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleCompress}>
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Compressing…</span> : "🗜️ Compress Image"}
                  </button>
                  {resultBlock() || <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>Compress, then download the smaller JPG.</p>}
                </div>
              );
            })()}

            {/* Convert */}
            {activeTool === "convert" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔀 Convert Format</div>
                <p style={s.panelSub}>JPG · PNG · WEBP — free, no credits</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {(["png", "jpeg", "webp"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setConvertFormat(f)}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10,
                        border: convertFormat === f ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                        background: convertFormat === f ? "#EEEEFF" : "#FAFAFA",
                        cursor: "pointer", fontWeight: 800, fontSize: 14,
                        color: convertFormat === f ? "#6366F1" : "#999", textTransform: "uppercase",
                      }}
                    >
                      {f === "jpeg" ? "JPG" : f}
                    </button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleConvert}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Converting…</span> : `🔀 Convert to ${convertFormat === "jpeg" ? "JPG" : convertFormat.toUpperCase()}`}
                </button>
                {resultBlock() || (
                  <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>
                    {convertFormat === "jpeg" ? "JPG flattens transparency to white." : "PNG & WEBP keep transparency."}
                  </p>
                )}
              </div>
            )}

            {/* Watermark */}
            {activeTool === "watermark" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>🔖 Watermark</div>
                <p style={s.panelSub}>Add a text watermark — free, no credits</p>
                <div style={s.panelSection}>
                  <label style={s.inputLabel}>Watermark text</label>
                  <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="Add your watermark here" style={s.numInput} />
                </div>
                <label style={s.inputLabel}>Position</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, margin: "6px 0 12px" }}>
                  {(["tiled", "top-left", "top-right", "center", "bottom-left", "bottom-right"] as WatermarkPosition[]).map((p) => (
                    <button key={p} onClick={() => setWmPosition(p)} style={{
                      padding: "9px 4px", borderRadius: 9, fontSize: 10.5, fontWeight: 700, cursor: "pointer",
                      border: wmPosition === p ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                      background: wmPosition === p ? "#EEEEFF" : "#FAFAFA", color: wmPosition === p ? "#6366F1" : "#888",
                      textTransform: "capitalize",
                    }}>{p.replace("-", " ")}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={s.inputLabel}>Size</span><span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{wmFontScale}%</span></div>
                    <input type="range" min={2} max={15} value={wmFontScale} onChange={(e) => setWmFontScale(parseInt(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={s.inputLabel}>Color</div>
                    <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} style={{ width: 42, height: 34, borderRadius: 8, border: "1.5px solid #E0E0EE", cursor: "pointer", padding: 2 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={s.inputLabel}>Opacity</span><span style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{wmOpacity}%</span></div>
                <input type="range" min={10} max={100} value={wmOpacity} onChange={(e) => setWmOpacity(parseInt(e.target.value))} style={{ width: "100%", marginBottom: 12 }} />
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleWatermark}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : "🔖 Add Watermark"}
                </button>
                {resultBlock()}
              </div>
            )}

            {/* Meme Generator */}
            {activeTool === "meme" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>😂 Meme Generator</div>
                <p style={s.panelSub}>Classic top/bottom caption — free, no watermark</p>
                <div style={s.panelSection}>
                  <label style={s.inputLabel}>Top text</label>
                  <input type="text" value={memeTop} onChange={(e) => setMemeTop(e.target.value)} placeholder="TOP TEXT" style={s.numInput} />
                </div>
                <div style={s.panelSection}>
                  <label style={s.inputLabel}>Bottom text</label>
                  <input type="text" value={memeBottom} onChange={(e) => setMemeBottom(e.target.value)} placeholder="BOTTOM TEXT" style={s.numInput} />
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleMeme}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Creating…</span> : "😂 Create Meme"}
                </button>
                {resultBlock()}
              </div>
            )}

            {/* Stickers */}
            {activeTool === "stickers" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>😎 Stickers</div>
                <p style={s.panelSub}>Add emoji stickers and drag them anywhere — free</p>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={openStickerStudio}>
                  😎 Open Sticker Studio
                </button>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>Pick from 150+ emoji stickers, place and resize them on your photo, then apply.</p>
                {resultBlock()}
              </div>
            )}

            {/* Image to PDF */}
            {activeTool === "pdf" && (
              <div style={s.panelContent}>
                <div style={s.panelTitle}>📄 Image to PDF</div>
                <p style={s.panelSub}>Turn your photo into a PDF — free, no watermark</p>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleDownloadPdf}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Building PDF…</span> : "📄 Download as PDF"}
                </button>
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>The PDF page matches your image size and downloads instantly.</p>
              </div>
            )}

            </div>{/* end mobile scroll wrapper */}
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Tool Strip ──────────────────────────────────────── */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "#fff", borderTop: "1.5px solid #EAEAEA", display: "flex", overflowX: "auto", padding: "6px 8px 10px", gap: 4, WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
          {TOOLS.filter(t => t.id !== null).map(t => (
            <button
              key={t.id}
              disabled={!hasImage}
              onClick={() => {
                if (!hasImage) return;
                if (t.free) { const next = activeTool === t.id ? null : t.id; setActiveTool(next); setMobileSheetOpen(!!next); return; }
                if (!authChecked) { const next = activeTool === t.id ? null : t.id; setActiveTool(next); setMobileSheetOpen(!!next); return; }
                if (!user) { requireSignIn(); return; }
                const isPaidUser = !!(user.plan && user.plan !== "free");
                const trialUsedForTool = !!(t.id && user.trialToolsUsed?.includes(t.id));
                const trialAvailable = !trialUsedForTool && (user.trialsRemaining ?? 0) > 0;
                if (t.paid && !isPaidUser && !trialAvailable) { setBlockedTool(t); setShowUpgradeModal(true); return; }
                const next = activeTool === t.id ? null : t.id;
                setActiveTool(next);
                setMobileSheetOpen(!!next);
              }}
              style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: 10, border: "none", background: activeTool === t.id ? "#EEEEFF" : "transparent", cursor: "pointer", minWidth: 52, flexShrink: 0, opacity: !hasImage ? 0.35 : 1 }}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: activeTool === t.id ? "#6366F1" : "#888", whiteSpace: "nowrap" as const }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Sticker Studio Modal ──────────────────────────────────────────── */}
      {showStickerStudio && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,23,42,0.72)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowStickerStudio(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 620, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #EEF0F4" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#111" }}>😎 Sticker Studio</div>
              <button onClick={() => setShowStickerStudio(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#9CA3AF", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Stage */}
            <div style={{ flex: 1, overflow: "auto", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 240 }}>
              <div
                ref={stickerStageRef}
                onPointerMove={onStickerPointerMove}
                onPointerUp={onStickerPointerUp}
                onPointerLeave={onStickerPointerUp}
                onClick={() => setSelectedStickerId(null)}
                style={{ position: "relative", display: "inline-block", lineHeight: 0, touchAction: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={working || original?.dataUrl || ""}
                  alt="Add stickers"
                  onLoad={measureStage}
                  style={{ display: "block", maxWidth: "100%", maxHeight: "56vh", width: "auto", height: "auto", userSelect: "none" }}
                  draggable={false}
                />
                {stickers.map((st) => {
                  const selected = selectedStickerId === st.id;
                  return (
                    <span
                      key={st.id}
                      onPointerDown={(e) => onStickerPointerDown(e, st.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedStickerId(st.id); }}
                      style={{
                        position: "absolute",
                        left: `${st.fx * 100}%`,
                        top: `${st.fy * 100}%`,
                        transform: "translate(-50%,-50%)",
                        fontSize: `${Math.max(10, st.size * stageW)}px`,
                        lineHeight: 1,
                        cursor: "grab",
                        userSelect: "none",
                        touchAction: "none",
                        outline: selected ? "2px dashed #6366F1" : "none",
                        outlineOffset: 3,
                        borderRadius: 4,
                      }}
                    >
                      {st.emoji}
                      {selected && (
                        <button
                          onPointerDown={(e) => { e.stopPropagation(); }}
                          onClick={(e) => { e.stopPropagation(); removeSticker(st.id); }}
                          style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#EF4444", color: "#fff", fontSize: 13, lineHeight: "20px", cursor: "pointer", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                        >×</button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Selected sticker size control */}
            {selectedStickerId && (() => {
              const st = stickers.find(s => s.id === selectedStickerId);
              if (!st) return null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderTop: "1px solid #EEF0F4" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>Size</span>
                  <input type="range" min={4} max={60} value={Math.round(st.size * 100)}
                    onChange={(e) => { const v = parseInt(e.target.value) / 100; setStickers(prev => prev.map(s => s.id === st.id ? { ...s, size: v } : s)); }}
                    style={{ flex: 1, accentColor: "#6366F1" }} />
                  <button onClick={() => removeSticker(st.id)} style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", background: "none", border: "1px solid #FCA5A5", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>Remove</button>
                </div>
              );
            })()}

            {/* Emoji picker */}
            <div style={{ borderTop: "1px solid #EEF0F4", padding: "10px 14px 6px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto" }}>
                {STICKER_PACKS.map((p, i) => (
                  <button key={p.name} onClick={() => setStickerPack(i)}
                    style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: stickerPack === i ? "2px solid #6366F1" : "1.5px solid #E5E7EB",
                      background: stickerPack === i ? "#EEF2FF" : "#fff", color: stickerPack === i ? "#6366F1" : "#6B7280" }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))", gap: 4, maxHeight: 132, overflowY: "auto", paddingBottom: 4 }}>
                {STICKER_PACKS[stickerPack].emojis.map((em, i) => (
                  <button key={`${em}-${i}`} onClick={() => addSticker(em)}
                    title="Add to image"
                    style={{ fontSize: 24, lineHeight: "38px", height: 38, border: "none", background: "none", cursor: "pointer", borderRadius: 8 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ display: "flex", gap: 10, padding: "12px 18px", borderTop: "1px solid #EEF0F4" }}>
              <button onClick={() => setShowStickerStudio(false)} style={{ ...s.ghostBtn, flex: 1 }}>Cancel</button>
              <button onClick={applyStickers} disabled={processing || !stickers.length}
                style={{ ...s.primaryBtn, flex: 2, ...((processing || !stickers.length) ? s.btnOff : {}) }}>
                {processing ? <span style={s.btnRow}><span style={s.spin} />Applying…</span> : `✓ Apply ${stickers.length || ""} Sticker${stickers.length === 1 ? "" : "s"}`.trim()}
              </button>
            </div>
          </div>
          <div style={{ color: "#CBD5E1", fontSize: 12, marginTop: 10 }}>Tap an emoji to add · drag to position · use the slider to resize</div>
        </div>
      )}

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

            {/* Credits / trials section — hidden in free-only mode */}
            {PAID_FEATURES_ENABLED && (user.plan === "free" ? (
              <div style={s.creditsSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>🎁 Free Trials</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: (user.trialsRemaining ?? 0) === 0 ? "#EF4444" : "#6366F1" }}>
                    {user.trialsRemaining ?? 0} <span style={{ fontSize: 13, color: "#999", fontWeight: 400 }}>/ {FREE_TRIAL_LIMIT}</span>
                  </div>
                </div>
                <div style={s.creditBarBg}>
                  <div style={{ ...s.creditBarFill, width: `${((user.trialsRemaining ?? 0) / FREE_TRIAL_LIMIT) * 100}%`, background: (user.trialsRemaining ?? 0) === 0 ? "#EF4444" : "#6366F1" }} />
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.6 }}>
                  One free trial per tool — Resize, Adjust and Normal Upscale are always free, no trial needed.
                </div>
                {(user.trialsRemaining ?? 0) === 0 && (
                  <div style={s.noCreditsNote}>
                    You&apos;ve used all {FREE_TRIAL_LIMIT} free trials. Upgrade to a paid plan to keep using AI tools.
                  </div>
                )}
              </div>
            ) : (
              <div style={s.creditsSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>⚡ AI Credits</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: creditsLeft === 0 ? "#EF4444" : "#6366F1" }}>
                    {creditsLeft} <span style={{ fontSize: 13, color: "#999", fontWeight: 400 }}>/ {creditsTotal}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={s.creditBarBg}>
                  <div style={{ ...s.creditBarFill, width: `${(creditsLeft / creditsTotal) * 100}%`, background: creditsLeft === 0 ? "#EF4444" : creditsLeft <= 4 ? "#F59E0B" : "#6366F1" }} />
                </div>

                <div style={{ fontSize: 12, color: "#888", marginTop: 8, lineHeight: 1.6 }}>
                  {creditsLeft} credit{creditsLeft === 1 ? "" : "s"} remaining
                </div>

                {creditsLeft === 0 && (
                  <div style={s.noCreditsNote}>
                    No credits remaining. Purchase more to continue.
                  </div>
                )}
                {lowCredits && creditsLeft > 0 && (
                  <div style={s.lowNote}>Running low! Resize, Adjust and Normal Upscale are free — no credits needed.</div>
                )}
              </div>
            ))}

            {/* Usage breakdown */}
            <div style={s.usageGrid}>
              {[
                { icon: "✨", label: "AI Edit", id: "ai-edit", cost: CREDIT_COST },
                { icon: "🌅", label: "Generate BG", id: "generate-bg", cost: CREDIT_COST },
                { icon: "🪄", label: "Remove BG", id: "remove-bg", cost: CREDIT_COST },
                { icon: "✨", label: "Upscale (Pro)", id: "upscale-pro", cost: CREDIT_COST },
                { icon: "🔍", label: "Upscale (Normal)", id: "upscale", cost: 0 },
                { icon: "↔️", label: "Resize", id: "resize", cost: 0 },
                { icon: "🎨", label: "Adjust", id: "adjust", cost: 0 },
              ].filter(item => PAID_FEATURES_ENABLED || item.cost === 0).map((item) => {
                const trialUsed = user.plan === "free" && !!user.trialToolsUsed?.includes(item.id);
                const trialAvailable = user.plan === "free" && item.cost > 0 && !trialUsed && (user.trialsRemaining ?? 0) > 0;
                return (
                  <div key={item.label} style={s.usageItem}>
                    <span>{item.icon} {item.label}</span>
                    <span style={{ fontWeight: 700, color: item.cost === 0 ? "#10B981" : trialAvailable ? "#16A34A" : "#6366F1" }}>
                      {item.cost === 0 ? "Free" : trialAvailable ? "1 free trial" : user.plan === "free" ? `${item.cost} cr (after trial)` : `${item.cost} cr`}
                    </span>
                  </div>
                );
              })}
            </div>

            {PAID_FEATURES_ENABLED ? (
              <>
                {user.plan === "free" && (
                  <div style={{ fontSize: 12, color: "#888", textAlign: "center" as const, marginBottom: 8 }}>
                    Free plan · {user.trialsRemaining ?? 0} of {FREE_TRIAL_LIMIT} free trials left
                  </div>
                )}
                <button style={{ ...s.primaryBtn, marginTop: 4 }} onClick={() => { setShowAccountModal(false); setShowUpgradeModal(true); }}>
                  🚀 {user.plan === "free" ? "Upgrade Plan" : "Get More Credits"}
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#10B981", textAlign: "center" as const, fontWeight: 700, margin: "4px 0 8px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px" }}>
                ♾️ Unlimited · 100% Free — no limits on any tool
              </div>
            )}
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
              <div style={{ fontSize: 40, marginBottom: 8 }}>{signInReason === "unlimited" ? "🚀" : "✨"}</div>
              <div style={{ ...s.modalTitle, fontSize: 20 }}>
                {signInReason === "unlimited" ? "Sign up to keep going — it's free" : "Sign in to JPT AI Editor"}
              </div>
              <p style={{ ...s.modalSub, marginBottom: 0 }}>
                {signInReason === "unlimited"
                  ? <>Create a free account and transform <strong>unlimited images</strong> — no limits on Upscale, Resize, or Adjust.</>
                  : <>Get <strong>unlimited free transforms</strong> when you sign up</>}
              </p>
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
                  onClick={handleGoogleSignIn}
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
            <div style={s.modalTitle}>No credits remaining</div>

            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16, textAlign: "center" as const }}>
              You&apos;ve used up your purchased credits. <strong>Buy more to keep using AI features</strong> —<br />
              your credits never expire.
            </div>

            <div style={s.noCreditsInfo}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Always free (no credits needed):</div>
              <div>↔️ Resize &nbsp;·&nbsp; 🎨 Color Adjust &nbsp;·&nbsp; 🔍 Normal Upscale</div>
            </div>
            <button style={s.primaryBtn} onClick={() => { setShowNoCreditsModal(false); setShowUpgradeModal(true); }}>
              💳 Get More Credits
            </button>
            <button style={s.modalDismiss} onClick={() => setShowNoCreditsModal(false)}>Maybe later</button>
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
                  {["↔️ Resize", "🎨 Color Adjust", "🔢 Basic Crop", "🔍 Unlimited Basic Upscale", "🎁 5 free AI trials"].map(f => (
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
                  { name: "Starter", planKey: "starter", price: "₹499", credits: 50, perCredit: "₹9.98", color: "#6366F1", features: ["50 AI credits", "~25 transformations", "All AI tools", "No expiry"] },
                  { name: "Creator", planKey: "creator", price: "₹999", credits: 100, perCredit: "₹9.99", color: "#7C3AED", popular: true, features: ["100 AI credits", "~50 transformations", "All AI tools", "No expiry"] },
                  { name: "Pro", planKey: "pro", price: "₹2499", credits: 300, perCredit: "₹8.33", color: "#5B21B6", features: ["300 AI credits", "~150 transformations", "All AI tools", "No expiry"] },
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
                    <button
                      onClick={() => handleBuyPlan(plan.planKey)}
                      disabled={buyingPlan !== null}
                      style={{ display: "block", width: "100%", marginTop: 14, background: buyingPlan === plan.planKey ? "#9CA3AF" : plan.popular ? plan.color : "#111", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: buyingPlan !== null ? "not-allowed" : "pointer" }}
                    >
                      {buyingPlan === plan.planKey ? "Processing…" : "Buy Now →"}
                    </button>
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
