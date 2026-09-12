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
import { CREDIT_COST } from "@/lib/plans";
import { savePendingContext, loadPendingContext, clearPendingContext } from "@/lib/pending-image";
import { applyWatermark, renderMeme, type WatermarkPosition } from "@/lib/tools-canvas";
import ToolIcon from "./ToolIcon";
import UnlimitedModal from "@/app/_components/UnlimitedModal";
import SignInModal from "@/app/_components/SignInModal";
import SharePrompt, { shouldShowSharePrompt } from "@/app/_components/SharePrompt";

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
// CREDIT_COST now comes from @/lib/plans so the price of a generation is defined once.
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

// Re-encode a JPEG at a target width/height and quality.
async function jpegAtScale(dataUrl: string, scale: number, quality: number): Promise<string> {
  const img = await loadImg(dataUrl);
  const w = Math.max(48, Math.round(img.naturalWidth * scale));
  const h = Math.max(48, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", Math.min(1, Math.max(0.05, quality)));
}

// Compress to at most `targetKb` KB: binary-search JPEG quality, then
// progressively downscale if the image can't fit at full resolution.
async function compressToTargetKb(dataUrl: string, targetKb: number): Promise<string> {
  const target = targetKb * 1024;
  const bestUnder = async (url: string): Promise<string | null> => {
    let lo = 0.05, hi = 0.95, best: string | null = null;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const out = await compressOnCanvas(url, q);
      if (dataUrlBytes(out) <= target) { best = out; lo = q; } else { hi = q; }
    }
    return best;
  };
  let best = await bestUnder(dataUrl);
  if (best) return best;
  // Too big even at low quality — downscale in steps and retry.
  let scale = 1;
  for (let i = 0; i < 7 && !best; i++) {
    scale *= 0.8;
    const scaled = await jpegAtScale(dataUrl, scale, 0.85);
    best = await bestUnder(scaled);
  }
  return best || jpegAtScale(dataUrl, scale, 0.4);
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
  const [compressTargetKb, setCompressTargetKb] = useState(0); // 0 = quality mode
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
  // Single "Unlimited" plan gate — used for 4× upscaling (a Pro feature).
  const [showUnlimitedModal, setShowUnlimitedModal] = useState(false);
  const [unlimitedReason, setUnlimitedReason] = useState<string>("");
  const [sharePromptOpen, setSharePromptOpen] = useState(false);
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
        theme: { color: "var(--accent)" },
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

  // (Sign-in form state now lives in the shared SignInModal component.)

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
    const qs = new URLSearchParams(window.location.search);
    const toolParam = qs.get("tool") as Tool;
    if (toolParam && TOOLS.some(t => t.id === toolParam)) {
      setActiveTool(toolParam);
    }
    // Optional target format for the Convert tool — e.g. /editor?tool=convert&to=jpeg
    // (used by the /convert/<slug> landing pages to preselect the output).
    if (toolParam === "convert") {
      const to = (qs.get("to") || "").toLowerCase();
      const fmt = to === "jpg" ? "jpeg" : to;
      if (fmt === "png" || fmt === "jpeg" || fmt === "webp") setConvertFormat(fmt);
    }
    // Optional target size (KB) for Compress — e.g. /editor?tool=compress&target=100
    if (toolParam === "compress") {
      const tk = parseInt(qs.get("target") || "0", 10);
      if (tk > 0) setCompressTargetKb(tk);
    }
    // Optional aspect ratio for Crop — e.g. /editor?tool=crop&ratio=1:1
    if (toolParam === "crop") {
      const ratio = (qs.get("ratio") || "").toLowerCase();
      if (/^\d+:\d+$/.test(ratio) || ratio === "circle") setCropRatio(ratio);
    }

    // 2. A prompt handed over from My Library "Open in Editor" (still sync).
    try {
      const pp = sessionStorage.getItem("jpt_pending_prompt");
      if (pp) { setPrompt(pp); setActiveTool("ai-edit"); sessionStorage.removeItem("jpt_pending_prompt"); }
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
  // Single $3 Unlimited plan — the one and only upgrade popup across the app.
  // The single $3 Unlimited plan gate. Not signed in → show the sign-in popup
  // first; signed in but not unlimited → show the $3 pricing popup.
  const openUnlimited = (reason = "") => {
    if (!user) { setSignInReason("default"); setShowSignInModal(true); return; }
    setUnlimitedReason(reason); setShowUnlimitedModal(true);
  };

  // Free basic tools give anonymous visitors 5 trials, then they must sign in
  // (basic tools stay free for signed-in users; 4× upscale & batch are Pro).
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
      if (data.upgradeRequired) { openUnlimited(); } else { setShowNoCreditsModal(true); }
      return null;
    }
    if (res.status === 403) { onBlocked?.(); openUnlimited(); return null; }
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
    // Normal 4× is the paid tier of the free upscaler: it needs a credit
    // balance. (It used to check for an "unlimited" plan that no longer exists,
    // which made the unlock unreachable.)
    const canRun4x = (user?.credits ?? 0) >= CREDIT_COST;
    // Pro (AI) upscale is gated by sign-in + credits.
    // Normal 2× upscale is a free basic tool (5 trials for guests, then sign in).
    if (isPro && requireSignIn()) return;
    if (!isPro && upscaleScale === "4x" && !canRun4x) {
      openUnlimited("4× upscaling");
      return;
    }
    // Normal 2× upscale is a free basic tool — counts toward a guest's 5 trials.
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

  // Restore an image stashed before a sign-in redirect (or handed over from My
  // Library). Async because it may come from IndexedDB, which is the only store
  // big enough for a full-resolution data URL.
  useEffect(() => {
    let alive = true;
    (async () => {
      const ctx = await loadPendingContext();
      if (!alive || !ctx?.image) return;
      const pi = ctx.image;
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        setOriginal({ dataUrl: pi, w: img.naturalWidth, h: img.naturalHeight, name: "uploaded" });
        setResizeW(img.naturalWidth); setResizeH(img.naturalHeight);
        const pt = ctx.tool as Tool | undefined;
        if (pt && TOOLS.some((t) => t.id === pt)) setActiveTool(pt);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify({ dataUrl: pi, name: "uploaded", w: img.naturalWidth, h: img.naturalHeight, ts: Date.now() }));
        } catch {}
        void clearPendingContext();
      };
      img.onerror = () => { void clearPendingContext(); };
      img.src = pi;
    })();
    return () => { alive = false; };
  }, []);

  // Persist the current image + active tool so they survive the sign-in
  // round-trip (OAuth redirect or reload) and the editor reopens with context.
  const persistContextForAuth = async () => {
    const cur = working || original?.dataUrl;
    if (!cur && !activeTool) return;
    // Awaited: the caller navigates straight after, and a full-resolution data
    // URL is too big for sessionStorage, so this has to reach IndexedDB first.
    await savePendingContext({ image: cur || undefined, tool: activeTool || undefined });
  };

  // Expose the persist fn so the global NavBar's sign-in can preserve editor
  // context (uploaded image + active tool) before its OAuth redirect / reload.
  useEffect(() => {
    (window as unknown as { __jptPersistContext?: () => void }).__jptPersistContext = persistContextForAuth;
    return () => { delete (window as unknown as { __jptPersistContext?: () => void }).__jptPersistContext; };
  });

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
      const result = compressTargetKb > 0
        ? await compressToTargetKb(src, compressTargetKb)
        : await compressOnCanvas(src, compressQuality / 100);
      const after = dataUrlBytes(result);
      const pct = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
      setEditHistory(prev => working ? [...prev, working] : prev);
      setWorking(result);
      setToolResult({ title: `Compressed to ${humanSize(after)}`, detail: `${humanSize(before)} → ${humanSize(after)} · ${pct}% smaller` });
      recordAnonTransform();
      autoSaveToDrive(result, "compress", compressTargetKb > 0 ? `${compressTargetKb}KB` : `${compressQuality}%`);
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
    if (shouldShowSharePrompt()) setSharePromptOpen(true);
  };

  // Green "what just happened" summary + an in-panel Download button. Shown
  // inside each free tool's panel right after an operation completes.
  const resultBlock = () => toolResult && (
    <div style={{ marginTop: 12, background: "var(--success-soft)", border: "1px solid var(--success-soft)", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>✓ {toolResult.title}</div>
      {toolResult.detail && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{toolResult.detail}</div>}
      <button
        onClick={handleDownload}
        style={{ ...s.primaryBtn, marginTop: 10, background: "linear-gradient(135deg,var(--success),var(--success))" }}
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

  // Overlay shown over the image while a transformation is processing.
  const processingOverlay = (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(15,23,42,0.58)", backdropFilter: "blur(2px)" }}>
      {/* sweeping scan line across the image */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "42%", background: "linear-gradient(180deg, transparent, var(--accent-soft), var(--accent-soft), transparent)", animation: "jptScan 1.5s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "relative", width: 52, height: 52, border: "4px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ position: "relative", color: "#fff", fontWeight: 800, fontSize: 15, textAlign: "center", padding: "0 18px" }}>Please wait — we&apos;re processing your image…</div>
      <div style={{ position: "relative", color: "rgba(255,255,255,0.82)", fontSize: 12.5 }}>{processingLabel || "This usually takes just a moment"}</div>
    </div>
  );

  return (
    <div style={{ ...s.root, ...(!isMobile ? { height: "calc(100dvh - 56px)", overflow: "hidden" } : {}) }}>
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
            <a href="/batch-editor" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--accent-soft)", color: "var(--accent)", border: "1.5px solid var(--accent-border)", borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" as const }}>
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
                  <span style={{ ...s.creditsBadge, background: "var(--surface-3)", color: "var(--success)" }}>♾️ Free</span>
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
                  <span style={{ ...s.creditsBadge, background: "var(--accent-soft)", color: "var(--accent)" }}>
                    🎁 {anonLeft} free edit{anonLeft === 1 ? "" : "s"} left
                  </span>
                </button>
              ) : (
                <button
                  style={{ padding: "7px 14px", background: "var(--accent-fill)", color: "#fff", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" as const, boxShadow: "0 2px 8px rgba(255,106,26,0.40)" }}
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
                  openUnlimited();
                  return;
                }
                setActiveTool(activeTool === t.id ? null : t.id);
              }}
              title={`${t.label}${t.free || ["resize", "adjust"].includes(t.id ?? "") ? " (Free)" : ` (${CREDIT_COST} credits, or a free trial)`}`}
              style={{ ...s.toolBtn, ...(activeTool === t.id ? s.toolBtnActive : {}), ...(!hasImage ? { opacity: 0.35, cursor: "not-allowed" } : {}) }}
            >
              <ToolIcon id={t.id ?? "default"} active={activeTool === t.id} size={38} />
              <span style={s.toolLabel}>{t.label}</span>
            </button>
          ))}
        </div>}

        {/* ── Canvas Area ───────────────────────────────────────────────────── */}
        <div style={{ ...s.canvasArea, ...(isMobile ? { padding: "12px", paddingBottom: 72 } : {}) }}>

          {/* Saved session banner */}
          {!hasImage && savedSession && (
            <div style={{ background: "linear-gradient(135deg,var(--accent-soft),var(--surface-2))", border: "2px solid var(--accent)", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>↩ Continue where you left off</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  <strong>{savedSession.name}</strong> · {savedSession.w}×{savedSession.h}px · saved {Math.round((Date.now() - savedSession.ts) / 60000)}m ago
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => restoreSession(savedSession)}
                  style={{ padding: "10px 20px", background: "var(--accent-fill)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Resume Editing
                </button>
                <button
                  onClick={discardSession}
                  style={{ padding: "10px 16px", background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
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
              <p style={s.uploadTitle}>Drop an image or <span style={{ color: "var(--accent)", fontWeight: 700 }}>click to browse</span></p>
              <p style={s.uploadHint}>JPG · PNG · WEBP — choose a tool from the left</p>
              <div style={s.featureRow}>
                {TOOLS.map((t) => <span key={t.id} style={s.featureChip}>{t.icon} {t.label}</span>)}
              </div>
              {!user && (
                <div style={s.signInHint}>
                  <button onClick={() => setShowSignInModal(true)} style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign up free</button> to transform unlimited images — no limits on any tool
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
                    {zoom > 1 && <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Drag the ⟺ handle to compare · drag elsewhere to pan</span>}
                    <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>🔍 {Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>+</button>
                    <button onClick={() => { setZoom(z => { const nz = Math.max(1, +(z - 0.25).toFixed(2)); if (nz === 1) { setPanX(0); setPanY(0); } return nz; }); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>−</button>
                    {zoom > 1 && <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>Reset</button>}
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
                        style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: "var(--surface)", boxShadow: "0 0 8px rgba(0,0,0,0.4)", transform: "translateX(-50%)", cursor: "ew-resize", zIndex: 3 }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
                      >
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 44, height: 44, borderRadius: "50%", background: "var(--surface)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--text-muted)" }}>⟺</div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>Original</div>
                      {original && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{original.w} × {original.h}px</div>}
                    </div>
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4, background: "rgba(255,106,26,0.40)", backdropFilter: "blur(4px)", color: "#fff", padding: "4px 10px", borderRadius: 6, pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>✨ Result</div>
                      {workingSize && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>{workingSize.w} × {workingSize.h}px</div>}
                    </div>

                    {/* Processing overlay */}
                    {processing && processingOverlay}
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
                    <button style={{ ...s.ghostBtn, color: "var(--danger)", borderColor: "var(--danger-soft)" }} onClick={() => { setWorking(null); setEditHistory([]); setSelectedTemplate(null); setCustomBgPrompt(""); }}>⏮ Reset</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={s.imgWrap}>
                    <img src={original?.dataUrl || ""} alt="original" style={s.mainImg} />
                    {processing && processingOverlay}
                  </div>
                  <span style={s.dimLabel}>{original?.w} × {original?.h}px</span>
                </div>
              )}

              {/* Upload New Image button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 8 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "var(--surface)", border: "2px solid var(--accent)", borderRadius: 10, color: "var(--accent)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
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
            background: "var(--surface)", borderRadius: "18px 18px 0 0",
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
                  <button onClick={() => { setMobileSheetOpen(false); setActiveTool(null); }} style={{ background: "none", border: "none", fontSize: 20, color: "var(--text-faint)", cursor: "pointer", padding: "0 4px" }}>×</button>
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
                        border: selectedTemplate === tpl.id ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                        background: selectedTemplate === tpl.id ? "var(--border)" : "var(--surface-2)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
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
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
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
                    style={{ ...s.primaryBtn, background: "linear-gradient(135deg,#4285F4,var(--accent-2))", marginTop: 10, ...(customBgPrompt.trim().length === 0 || processing || !authChecked ? s.btnOff : {}) }}
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
                <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "var(--surface-2)", borderRadius: 10, padding: 4 }}>
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
                          openUnlimited();
                          return;
                        }
                        setUpscaleMode(m.key);
                      }}
                      style={{
                        flex: 1, padding: "8px 6px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: upscaleMode === m.key ? "var(--surface-3)" : "transparent",
                        boxShadow: upscaleMode === m.key ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: upscaleMode === m.key ? "var(--accent)" : "var(--text-faint)" }}>{m.label}</div>
                      <div style={{ fontSize: 10, color: upscaleMode === m.key ? "var(--accent)" : "var(--text-faint)", marginTop: 1 }}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                )}

                {/* 2x / 4x toggle */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "var(--text-faint)", marginBottom: 8 }}>Enhancement Level</div>
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
                            position: "relative",
                            flex: 1, padding: "12px 8px", borderRadius: 10,
                            border: upscaleScale === sc ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                            background: upscaleScale === sc ? "var(--border)" : "var(--surface-2)",
                            cursor: tooLarge ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 18,
                            color: tooLarge ? "#CCC" : upscaleScale === sc ? "var(--accent)" : "var(--text-faint)", transition: "all 0.15s",
                            opacity: tooLarge ? 0.5 : 1,
                          }}
                        >
                          {sc === "4x" && upscaleMode !== "pro" && user?.plan !== "unlimited" && (
                            <span style={{ position: "absolute", top: -8, right: -6, background: "linear-gradient(120deg,var(--accent-2),#EC4899)", color: "#fff", fontSize: 8.5, fontWeight: 900, letterSpacing: "0.06em", borderRadius: 999, padding: "2px 6px", boxShadow: "0 2px 6px rgba(124,58,237,0.4)" }}>PRO</span>
                          )}
                          {sc}
                          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: tooLarge ? "#CCC" : upscaleScale === sc ? "var(--accent)" : "var(--text-faint)" }}>
                            {tooLarge ? "Too large" : sc === "2x" ? "Enhance · Free" : "Ultra · Pro"}
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
                        <div style={{ marginTop: 8, background: "var(--surface-3)", border: "1px solid #FED7AA", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#92400E", display: "flex", alignItems: "flex-start", gap: 6 }}>
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
                  <div style={{ background: "var(--surface-3)", border: "1px solid var(--surface-3)", borderRadius: 8, padding: "7px 12px", marginBottom: 10, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                    😅 Already upscaled {upscaleScale}
                  </div>
                )}
                <button
                  style={{
                    ...s.primaryBtn,
                    ...((processing || appliedUpscale === upscaleScale) ? s.btnOff : {}),
                    background: upscaleMode === "pro"
                      ? "linear-gradient(135deg,var(--accent-2),#EC4899)"
                      : upscaleScale === "4x"
                      ? "linear-gradient(135deg,var(--accent),var(--accent-2))"
                      : "linear-gradient(135deg,var(--accent),var(--accent-2))",
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
                    : upscaleScale === "4x" && (user?.credits ?? 0) < CREDIT_COST
                    ? `🔒 Unlock 4× — Buy credits`
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
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Original: {original?.w} × {original?.h}px</div>
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
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                        {removeBgProgress < 15 ? "Loading model…" : "Removing background…"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{removeBgProgress}%</span>
                    </div>
                    <div style={{ background: "var(--surface-2)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,var(--accent),var(--accent-2))", borderRadius: 6, width: `${removeBgProgress}%`, transition: "width 0.3s" }} />
                    </div>
                    {removeBgProgress < 15 && <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, textAlign: "center" }}>First run may take ~10s to load the model</p>}
                  </div>
                )}
                <button
                  style={{ ...s.primaryBtn, background: "linear-gradient(135deg,var(--accent),var(--accent-2))", ...(processing ? s.btnOff : {}) }}
                  disabled={processing}
                  onClick={handleRemoveBg}
                >
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Processing…</span> : "🪄 Remove Background"}
                </button>
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{ctrl.value}{ctrl.unit}</span>
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
                        border: cropRatio === r.id ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                        background: cropRatio === r.id ? "var(--border)" : "var(--surface-2)",
                        cursor: "pointer", color: cropRatio === r.id ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{r.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: cropRatio === r.id ? "var(--accent)" : "var(--text-faint)" }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
                <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleCrop}>
                  {processing ? <span style={s.btnRow}><span style={s.spin} />Cropping…</span> : "✂️ Apply Crop"}
                </button>
                {resultBlock() || <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>Center crop to the chosen ratio.</p>}
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
                {processing && <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 10, textAlign: "center" }}><span style={s.spin} /> Working…</p>}
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
                  {/* Mode toggle: by quality vs to a target size */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button onClick={() => setCompressTargetKb(0)} style={{ flex: 1, padding: "9px 8px", borderRadius: 9, border: compressTargetKb === 0 ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: compressTargetKb === 0 ? "var(--border)" : "var(--surface-2)", color: compressTargetKb === 0 ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontWeight: 800, fontSize: 12.5 }}>By quality</button>
                    <button onClick={() => setCompressTargetKb(compressTargetKb || 100)} style={{ flex: 1, padding: "9px 8px", borderRadius: 9, border: compressTargetKb > 0 ? "2px solid var(--accent)" : "1.5px solid var(--border)", background: compressTargetKb > 0 ? "var(--border)" : "var(--surface-2)", color: compressTargetKb > 0 ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontWeight: 800, fontSize: 12.5 }}>Target size</button>
                  </div>
                  {compressTargetKb > 0 ? (
                    <div style={s.sliderRow}>
                      <span style={s.inputLabel}>Target size (KB)</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <input type="number" min={5} max={5000} value={compressTargetKb} onChange={(e) => setCompressTargetKb(Math.max(5, parseInt(e.target.value) || 0))} style={{ width: 100, padding: "9px 10px", borderRadius: 9, border: "1.5px solid var(--border)", fontSize: 14, fontWeight: 700 }} />
                        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>KB or smaller</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {[20, 50, 100, 200, 500].map((k) => (
                          <button key={k} onClick={() => setCompressTargetKb(k)} style={{ padding: "5px 11px", borderRadius: 999, border: compressTargetKb === k ? "1.5px solid var(--accent)" : "1px solid var(--border)", background: compressTargetKb === k ? "var(--border)" : "var(--surface-3)", color: compressTargetKb === k ? "var(--accent)" : "var(--text-faint)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{k}KB</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={s.sliderRow}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={s.inputLabel}>Quality</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{compressQuality}%</span>
                      </div>
                      <input type="range" min={10} max={95} value={compressQuality} onChange={(e) => setCompressQuality(parseInt(e.target.value))} style={{ width: "100%" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                        <span>Smaller file</span><span>Higher quality</span>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>Current size: ~{humanSize(dataUrlBytes(src))}</div>
                  <button style={{ ...s.primaryBtn, ...(processing ? s.btnOff : {}) }} disabled={processing} onClick={handleCompress}>
                    {processing ? <span style={s.btnRow}><span style={s.spin} />Compressing…</span> : compressTargetKb > 0 ? `🗜️ Compress to ${compressTargetKb}KB` : "🗜️ Compress Image"}
                  </button>
                  {resultBlock() || <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>Compress, then download the smaller JPG.</p>}
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
                        border: convertFormat === f ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                        background: convertFormat === f ? "var(--border)" : "var(--surface-2)",
                        cursor: "pointer", fontWeight: 800, fontSize: 14,
                        color: convertFormat === f ? "var(--accent)" : "var(--text-faint)", textTransform: "uppercase",
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
                  <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>
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
                      border: wmPosition === p ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                      background: wmPosition === p ? "var(--border)" : "var(--surface-2)", color: wmPosition === p ? "var(--accent)" : "var(--text-faint)",
                      textTransform: "capitalize",
                    }}>{p.replace("-", " ")}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={s.inputLabel}>Size</span><span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{wmFontScale}%</span></div>
                    <input type="range" min={2} max={15} value={wmFontScale} onChange={(e) => setWmFontScale(parseInt(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <div style={s.inputLabel}>Color</div>
                    <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} style={{ width: 42, height: 34, borderRadius: 8, border: "1.5px solid var(--border)", cursor: "pointer", padding: 2 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={s.inputLabel}>Opacity</span><span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{wmOpacity}%</span></div>
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
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>Pick from 150+ emoji stickers, place and resize them on your photo, then apply.</p>
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
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10, textAlign: "center" }}>The PDF page matches your image size and downloads instantly.</p>
              </div>
            )}

            </div>{/* end mobile scroll wrapper */}
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Tool Strip ──────────────────────────────────────── */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "var(--surface)", borderTop: "1.5px solid #EAEAEA", display: "flex", overflowX: "auto", padding: "6px 8px 10px", gap: 4, WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
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
                if (t.paid && !isPaidUser && !trialAvailable) { setBlockedTool(t); openUnlimited(); return; }
                const next = activeTool === t.id ? null : t.id;
                setActiveTool(next);
                setMobileSheetOpen(!!next);
              }}
              style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "6px 10px", borderRadius: 10, border: "none", background: activeTool === t.id ? "var(--border)" : "transparent", cursor: "pointer", minWidth: 52, flexShrink: 0, opacity: !hasImage ? 0.35 : 1 }}
            >
              <ToolIcon id={t.id ?? "default"} active={activeTool === t.id} size={30} />
              <span style={{ fontSize: 9, fontWeight: 700, color: activeTool === t.id ? "var(--accent)" : "var(--text-faint)", whiteSpace: "nowrap" as const }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Sticker Studio Modal ──────────────────────────────────────────── */}
      {showStickerStudio && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(15,23,42,0.72)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowStickerStudio(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 620, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #EEF0F4" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>😎 Sticker Studio</div>
              <button onClick={() => setShowStickerStudio(false)} style={{ background: "none", border: "none", fontSize: 22, color: "var(--text-faint)", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Stage */}
            <div style={{ flex: 1, overflow: "auto", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 240 }}>
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
                        outline: selected ? "2px dashed var(--accent)" : "none",
                        outlineOffset: 3,
                        borderRadius: 4,
                      }}
                    >
                      {st.emoji}
                      {selected && (
                        <button
                          onPointerDown={(e) => { e.stopPropagation(); }}
                          onClick={(e) => { e.stopPropagation(); removeSticker(st.id); }}
                          style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", border: "none", background: "var(--danger)", color: "#fff", fontSize: 13, lineHeight: "20px", cursor: "pointer", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Size</span>
                  <input type="range" min={4} max={60} value={Math.round(st.size * 100)}
                    onChange={(e) => { const v = parseInt(e.target.value) / 100; setStickers(prev => prev.map(s => s.id === st.id ? { ...s, size: v } : s)); }}
                    style={{ flex: 1, accentColor: "var(--accent)" }} />
                  <button onClick={() => removeSticker(st.id)} style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", background: "none", border: "1px solid var(--danger-soft)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>Remove</button>
                </div>
              );
            })()}

            {/* Emoji picker */}
            <div style={{ borderTop: "1px solid #EEF0F4", padding: "10px 14px 6px" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto" }}>
                {STICKER_PACKS.map((p, i) => (
                  <button key={p.name} onClick={() => setStickerPack(i)}
                    style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: stickerPack === i ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                      background: stickerPack === i ? "var(--accent-soft)" : "var(--surface-3)", color: stickerPack === i ? "var(--accent)" : "var(--text-muted)" }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))", gap: 4, maxHeight: 132, overflowY: "auto", paddingBottom: 4 }}>
                {STICKER_PACKS[stickerPack].emojis.map((em, i) => (
                  <button key={`${em}-${i}`} onClick={() => addSticker(em)}
                    title="Add to image"
                    style={{ fontSize: 24, lineHeight: "38px", height: 38, border: "none", background: "none", cursor: "pointer", borderRadius: 8 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
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
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 10 }}>Tap an emoji to add · drag to position · use the slider to resize</div>
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
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent-2))", color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name[0]}</div>}
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
                  <div style={{ fontWeight: 900, fontSize: 20, color: (user.trialsRemaining ?? 0) === 0 ? "var(--danger)" : "var(--accent)" }}>
                    {user.trialsRemaining ?? 0} <span style={{ fontSize: 13, color: "var(--text-faint)", fontWeight: 400 }}>/ {FREE_TRIAL_LIMIT}</span>
                  </div>
                </div>
                <div style={s.creditBarBg}>
                  <div style={{ ...s.creditBarFill, width: `${((user.trialsRemaining ?? 0) / FREE_TRIAL_LIMIT) * 100}%`, background: (user.trialsRemaining ?? 0) === 0 ? "var(--danger)" : "var(--accent)" }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8, lineHeight: 1.6 }}>
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
                  <div style={{ fontWeight: 900, fontSize: 20, color: creditsLeft === 0 ? "var(--danger)" : "var(--accent)" }}>
                    {creditsLeft} <span style={{ fontSize: 13, color: "var(--text-faint)", fontWeight: 400 }}>/ {creditsTotal}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={s.creditBarBg}>
                  <div style={{ ...s.creditBarFill, width: `${(creditsLeft / creditsTotal) * 100}%`, background: creditsLeft === 0 ? "var(--danger)" : creditsLeft <= 4 ? "var(--warn)" : "var(--accent)" }} />
                </div>

                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8, lineHeight: 1.6 }}>
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
                    <span style={{ fontWeight: 700, color: item.cost === 0 ? "var(--success)" : trialAvailable ? "var(--success)" : "var(--accent)" }}>
                      {item.cost === 0 ? "Free" : trialAvailable ? "1 free trial" : user.plan === "free" ? `${item.cost} cr (after trial)` : `${item.cost} cr`}
                    </span>
                  </div>
                );
              })}
            </div>

            {PAID_FEATURES_ENABLED ? (
              <>
                {user.plan === "free" && (
                  <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" as const, marginBottom: 8 }}>
                    Free plan · {user.trialsRemaining ?? 0} of {FREE_TRIAL_LIMIT} free trials left
                  </div>
                )}
                <button style={{ ...s.primaryBtn, marginTop: 4 }} onClick={() => { setShowAccountModal(false); openUnlimited(); }}>
                  🚀 {user.plan === "free" ? "Upgrade Plan" : "Get More Credits"}
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--success)", textAlign: "center" as const, fontWeight: 700, margin: "4px 0 8px", background: "var(--success-soft)", border: "1px solid var(--success-soft)", borderRadius: 10, padding: "10px 12px" }}>
                ♾️ Unlimited · 100% Free — no limits on any tool
              </div>
            )}
            <button style={{ ...s.ghostBtn, width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={async () => { await fetch("/api/auth/google/logout", { method: "POST" }); setUser(null); setShowAccountModal(false); }}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Sign-in Modal ─────────────────────────────────────────────────── */}
      {showSignInModal && (
        <SignInModal
          reason={signInReason}
          onClose={() => setShowSignInModal(false)}
          onBeforeAuth={persistContextForAuth}
        />
      )}

      {/* ── No Credits Modal ──────────────────────────────────────────────── */}
      {showNoCreditsModal && (
        <div style={s.modalOverlay} onClick={() => setShowNoCreditsModal(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <div style={s.modalTitle}>No credits remaining</div>

            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16, textAlign: "center" as const }}>
              You&apos;ve used up your purchased credits. <strong>Buy more to keep using AI features</strong> —<br />
              your credits never expire.
            </div>

            <div style={s.noCreditsInfo}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Always free (no credits needed):</div>
              <div>↔️ Resize &nbsp;·&nbsp; 🎨 Color Adjust &nbsp;·&nbsp; 🔍 Normal Upscale</div>
            </div>
            <button style={s.primaryBtn} onClick={() => { setShowNoCreditsModal(false); openUnlimited(); }}>
              💳 Get More Credits
            </button>
            <button style={s.modalDismiss} onClick={() => setShowNoCreditsModal(false)}>Maybe later</button>
          </div>
        </div>
      )}

      {/* ── Unlimited plan modal (4× upscale gate) ────────────────────────── */}
      {showUnlimitedModal && (
        <UnlimitedModal
          onClose={() => setShowUnlimitedModal(false)}
          loggedIn={!!user}
          reason={unlimitedReason}
          prefillUser={{ name: user?.name, email: user?.email }}
          onSuccess={() => {
            setUser(u => u ? { ...u, plan: "unlimited" } : u);
            setShowUnlimitedModal(false);
          }}
        />
      )}

      {/* ── Post-download share prompt (viral loop) ──────────────────────── */}
      <SharePrompt
        open={sharePromptOpen}
        onClose={() => setSharePromptOpen(false)}
        tool={activeTool || "editor"}
      />

      {/* ── Upgrade Modal ─────────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div style={s.modalOverlay} onClick={() => { setShowUpgradeModal(false); setBlockedTool(null); }}>
          <div style={{ background: "var(--surface)", borderRadius: 24, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", position: "relative" }} onClick={(e) => e.stopPropagation()}>

            {/* Gradient header */}
            <div style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 50%, #A78BFA 100%)", borderRadius: "24px 24px 0 0", padding: "32px 32px 28px", color: "#fff", position: "relative" }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-faint)", textAlign: "center" as const, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: 1 }}>Choose a plan · one-time payment · credits never expire</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { name: "Starter", planKey: "starter", price: "₹499", credits: 50, perCredit: "₹9.98", color: "var(--accent)", features: ["50 AI credits", "~25 transformations", "All AI tools", "No expiry"] },
                  { name: "Creator", planKey: "creator", price: "₹999", credits: 100, perCredit: "₹9.99", color: "var(--accent-strong)", popular: true, features: ["100 AI credits", "~50 transformations", "All AI tools", "No expiry"] },
                  { name: "Pro", planKey: "pro", price: "₹2499", credits: 300, perCredit: "₹8.33", color: "#5B21B6", features: ["300 AI credits", "~150 transformations", "All AI tools", "No expiry"] },
                ].map((plan) => (
                  <div key={plan.name} style={{ border: `2px solid ${plan.popular ? plan.color : "var(--text-muted)"}`, borderRadius: 16, padding: "18px 14px", textAlign: "center" as const, position: "relative", background: plan.popular ? "var(--surface-2)" : "var(--surface-2)", transition: "transform 0.1s" }}>
                    {plan.popular && (
                      <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" as const, letterSpacing: 0.5 }}>
                        ✦ MOST POPULAR
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 13, color: plan.popular ? plan.color : "var(--text-muted)", marginBottom: 6 }}>{plan.name}</div>
                    <div style={{ fontWeight: 900, fontSize: 30, color: "var(--text)", lineHeight: 1 }}>{plan.price}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10 }}>{plan.perCredit}/credit</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: plan.color, marginBottom: 4 }}>{plan.credits}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 14 }}>AI Credits</div>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3, textAlign: "left" as const }}>✓ {f}</div>
                    ))}
                    <button
                      onClick={() => handleBuyPlan(plan.planKey)}
                      disabled={buyingPlan !== null}
                      style={{ display: "block", width: "100%", marginTop: 14, background: buyingPlan === plan.planKey ? "var(--text-faint)" : plan.popular ? plan.color : "var(--text)", color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: buyingPlan !== null ? "not-allowed" : "pointer" }}
                    >
                      {buyingPlan === plan.planKey ? "Processing…" : "Buy Now →"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center" as const }}>
                <button style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }} onClick={() => { setShowUpgradeModal(false); setBlockedTool(null); }}>
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
  root: { minHeight: "100vh", background: "var(--surface-2)", fontFamily: "system-ui,-apple-system,sans-serif", color: "var(--text)", display: "flex", flexDirection: "column" },

  pageHeader: { background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(8px)", position: "relative" as const, zIndex: 90, flexShrink: 0 },
  pageHeaderInner: { maxWidth: 1400, margin: "0 auto", padding: "8px 20px", display: "flex", alignItems: "center", gap: 12 },
  pageIcon: { fontSize: 18 },
  pageTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)", marginRight: 8 },
  pageHeaderRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginLeft: "auto" },
  lowCreditsBar: { flex: 1, textAlign: "center" as const, fontSize: 12, fontWeight: 600, color: "var(--warn)", background: "var(--surface-3)", borderRadius: 6, padding: "4px 12px" },
  dlBtn: { background: "var(--bg-elevated)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  ghostBtn: { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 },
  userChip: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "5px 10px", cursor: "pointer" },
  avatar: { width: 26, height: 26, borderRadius: "50%", flexShrink: 0 },
  avatarFallback: { width: 26, height: 26, borderRadius: "50%", background: "var(--accent-fill)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)" },
  creditsBadge: { fontSize: 11, fontWeight: 800, background: "var(--surface-2)", color: "var(--accent)", borderRadius: 6, padding: "2px 7px" },
  creditsEmpty: { background: "var(--danger-soft)", color: "var(--danger)" },
  creditsLow: { background: "var(--surface-3)", color: "var(--warn)" },
  googleBtn: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid #DDD", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none", whiteSpace: "nowrap" as const },

  layout: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" },
  sidebar: { width: 72, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" as const, padding: "12px 6px", gap: 4, overflowY: "auto" as const },
  toolBtn: { width: "100%", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)" },
  toolBtnActive: { background: "var(--surface-2)", color: "var(--accent)" },
  toolLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, lineHeight: 1 },

  canvasArea: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, padding: "20px", gap: 16, overflowY: "auto" as const },
  canvasInner: { display: "flex", flexDirection: "column" as const, gap: 12, alignItems: "center", width: "100%" },
  uploadZone: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", border: "2px dashed #D2D4E0", borderRadius: 20, padding: "60px 40px", cursor: "pointer", textAlign: "center" as const, background: "var(--surface)", minHeight: 400 },
  uploadTitle: { margin: "0 0 8px", fontSize: 17, fontWeight: 700 },
  uploadHint: { margin: "0 0 24px", fontSize: 14, color: "var(--text-faint)" },
  featureRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, justifyContent: "center", marginBottom: 16 },
  featureChip: { background: "var(--surface-2)", border: "1px solid #E0E0F0", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "var(--accent)" },
  signInHint: { fontSize: 13, color: "var(--text-faint)", marginTop: 8 },

  imgWrap: { position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", maxWidth: "100%", background: "var(--surface)" },
  checker: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg,#E5E5E5 25%,transparent 25%),linear-gradient(-45deg,#E5E5E5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#E5E5E5 75%),linear-gradient(-45deg,transparent 75%,#E5E5E5 75%)", backgroundSize: "14px 14px", backgroundPosition: "0 0,0 7px,7px -7px,-7px 0" },
  mainImg: { maxWidth: "min(800px, 100%)", maxHeight: "60vh", display: "block", position: "relative", zIndex: 1, transition: "opacity 0.2s" },
  imgOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" },
  spinner: { width: 36, height: 36, border: "3.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  imgControls: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const },
  togglePill: { display: "flex", background: "#EBEBF0", borderRadius: 9, padding: 3 },
  toggleBtn: { padding: "5px 14px", borderRadius: 7, border: "none", background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-faint)" },
  toggleActive: { background: "var(--surface)", color: "var(--text)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  dimLabel: { fontSize: 12, color: "var(--text-faint)" },

  promptBar: { display: "flex", gap: 8, width: "100%", maxWidth: 800, alignItems: "center" },
  promptInput: { flex: 1, border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "var(--surface)", color: "var(--text)" },
  sendBtn: { background: "linear-gradient(135deg,var(--accent),var(--accent-2))", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const },
  toolPillBtn: { width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  toolPillActive: { background: "var(--surface-2)", borderColor: "var(--accent)" },
  errBox: { background: "var(--danger-soft)", border: "1px solid var(--danger-soft)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C00", width: "100%", maxWidth: 800 },

  toolPanel: { width: 300, flexShrink: 0, background: "var(--surface)", borderLeft: "1px solid var(--border)", overflowY: "auto" as const },
  panelContent: { padding: "20px 18px", display: "flex", flexDirection: "column" as const, gap: 14 },
  panelTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" },
  panelSub: { margin: 0, fontSize: 12, color: "#777", lineHeight: 1.5 },
  panelSection: { display: "flex", flexDirection: "column" as const, gap: 10 },
  creditNote: { fontSize: 11, color: "var(--accent)", fontWeight: 700, background: "var(--surface-2)", borderRadius: 6, padding: "4px 8px", display: "inline-block", alignSelf: "flex-start" },

  successNote: { background: "var(--success-soft)", border: "1px solid var(--surface-3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#047857", fontWeight: 600 },
  retryNote: { background: "var(--surface-3)", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E" },
  retryLink: { background: "none", border: "none", color: "var(--accent-strong)", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 },
  tabBar: { display: "flex", gap: 2, background: "var(--surface-2)", borderRadius: 8, padding: 2 },
  tabBtn: { flex: 1, padding: "5px 2px", borderRadius: 6, border: "none", background: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", color: "var(--text-faint)" },
  tabActive: { background: "var(--surface)", color: "var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  swatchGrid: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  swatch: { width: 30, height: 30, borderRadius: 7, cursor: "pointer", flexShrink: 0 },
  colorPicker: { width: 36, height: 36, border: "2px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: 2 },
  smallBtn: { background: "var(--accent-fill)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  pendingRow: { display: "flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", border: "1px solid #C4C4F0", borderRadius: 8, padding: "8px 10px" },
  xBtn: { background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 13, padding: 2, marginLeft: "auto" },
  gradGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  gradSwatch: { height: 44, borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "flex-end", padding: "0 6px 4px" },
  gradLabel: { fontSize: 9, fontWeight: 700, color: "rgba(12,12,22,0.80)", textShadow: "0 1px 2px rgba(0,0,0,0.4)" },
  changeBgBtn: { position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  uploadBgBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", border: "2px dashed #D0D0E0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)" },
  aiBadge: { display: "inline-flex", alignSelf: "flex-start", background: "linear-gradient(135deg,#4285F4,var(--accent-2))", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700 },
  textarea: { width: "100%", borderRadius: 8, border: "1.5px solid var(--border)", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, lineHeight: 1.5, color: "var(--text)", background: "var(--surface-2)" },
  suggestions: { display: "flex", flexWrap: "wrap" as const, gap: 5 },
  chip: { fontSize: 11, color: "var(--accent)", background: "var(--surface-2)", border: "1px solid #C4C4F4", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 },
  infoCard: { background: "var(--surface-2)", borderRadius: 10, padding: "12px 14px", fontSize: 13 },
  inputLabel: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "var(--text-faint)" },
  numInput: { width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
  sliderRow: { display: "flex", flexDirection: "column" as const, gap: 2 },
  resetSliderBtn: { background: "none", border: "none", color: "var(--accent)", fontSize: 10, cursor: "pointer", textAlign: "right" as const, padding: 0, alignSelf: "flex-end" },
  primaryBtn: { background: "linear-gradient(135deg,var(--accent),var(--accent-2))", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", transition: "opacity 0.2s" },
  btnOff: { opacity: 0.4, cursor: "not-allowed" as const },
  btnRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spin: { display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Modals
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" },
  modalBox: { background: "var(--surface)", borderRadius: 20, padding: "32px 28px", maxWidth: 420, width: "100%", textAlign: "center" as const, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 },
  modalSub: { margin: "0 0 16px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 },
  modalFeatures: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, textAlign: "left" as const },
  modalFeatureRow: { fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 },
  modalGoogleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--surface)", border: "1.5px solid #DDD", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none", cursor: "pointer", width: "100%", boxSizing: "border-box" as const, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  modalDismiss: { marginTop: 12, background: "none", border: "none", color: "var(--text-faint)", fontSize: 13, cursor: "pointer", textDecoration: "underline" },

  // Account modal specific
  creditsSection: { background: "var(--surface-2)", borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "left" as const },
  creditBarBg: { height: 8, background: "var(--surface-2)", borderRadius: 100, overflow: "hidden" },
  creditBarFill: { height: "100%", borderRadius: 100, transition: "width 0.4s ease" },
  noCreditsNote: { marginTop: 10, background: "var(--danger-soft)", border: "1px solid var(--danger-soft)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#B91C1C", textAlign: "left" as const },
  lowNote: { marginTop: 10, background: "var(--surface-3)", border: "1px solid var(--surface-3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", textAlign: "left" as const },
  usageGrid: { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16, textAlign: "left" as const },
  usageItem: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", padding: "4px 0", borderBottom: "1px solid #F0F0F0" },

  // No credits modal
  noCreditsInfo: { background: "var(--surface-3)", border: "1px solid var(--surface-3)", borderRadius: 10, padding: "14px", marginBottom: 16, fontSize: 13, color: "#047857", lineHeight: 1.8, textAlign: "left" as const },
};
