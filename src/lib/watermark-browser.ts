"use client";

/*
  Watermark removal entirely in the visitor's browser.

  The same two models as gpu-image-server/watermark, exported to ONNX by
  `python -m watermark.export_onnx` and run with onnxruntime-web (WebGPU when
  the browser has it, WebAssembly otherwise):

    detector  — our trained U-Net: per-pixel "text" and "logo" probabilities
    LaMa      — fills the masked area from its surroundings (fixed 512x512)

  This file mirrors watermark/remover.py step for step — detect at the scale
  the detector was trained at, drop specks, close and grow the mask, then
  inpaint each marked region with context and paste back only the masked
  pixels — so the browser and the server give the same result.

  The model files (~100 MB + ~50 MB) are downloaded once and kept in the
  Cache API, so later visits start immediately.
*/

import type * as Ort from "onnxruntime-web";

// LaMa ships with the site, split into parts (GitHub refuses files over 100 MB):
// public/models/lama-512-v1.json lists them. Either URL may also point at a
// single hosted .onnx file instead.
export const LAMA_URL = process.env.NEXT_PUBLIC_WM_LAMA_URL || "/models/lama-512-v1.json";
export const DETECTOR_URL = process.env.NEXT_PUBLIC_WM_DETECTOR_URL || "/models/wm-detector.onnx";

const CACHE_NAME = "wm-models-v1";
const LAMA_SIZE = 512;
const DETECT_LONG = 1536;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export type Stage = "download" | "load" | "detect" | "inpaint";
export type Progress = (p: { stage: Stage; label: string; fraction?: number }) => void;

export class ModelUnavailableError extends Error {}

// ── Runtime and model loading ─────────────────────────────────────────────

let ortPromise: Promise<typeof Ort> | null = null;
let gpuPromise: Promise<boolean> | null = null;

/** Does this browser actually hand out a WebGPU adapter? (`navigator.gpu` alone isn't enough.) */
function webgpuWorks(): Promise<boolean> {
  gpuPromise ??= (async () => {
    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      return !!gpu && !!(await gpu.requestAdapter());
    } catch {
      return false;
    }
  })();
  return gpuPromise;
}

/*
  The runtime is loaded as a plain script from public/ort/ (copied there by
  scripts/copy-ort-wasm.mjs), not imported through webpack: webpack rewrites
  the runtime's own `new URL(…, import.meta.url)` file loading and breaks it
  ("url.replace is not a function"). Same files, same version, own domain.
*/
function getOrt(): Promise<typeof Ort> {
  ortPromise ??= new Promise<typeof Ort>((resolve, reject) => {
    const w = window as unknown as { ort?: typeof Ort };
    const ready = async () => {
      const ort = w.ort;
      if (!ort) return reject(new Error("onnxruntime-web did not load"));
      ort.env.wasm.wasmPaths = "/ort/";
      // Threads need a cross-origin-isolated page; without it, one thread.
      ort.env.wasm.numThreads = typeof crossOriginIsolated !== "undefined" && crossOriginIsolated
        ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
      // Without WebGPU the model runs on the CPU for tens of seconds; in a
      // worker, so the page stays responsive (spinner, progress, scrolling).
      // Must be decided before the first session — it can't change later.
      ort.env.wasm.proxy = !(await webgpuWorks());
      resolve(ort);
    };
    if (w.ort) return ready();
    const script = document.createElement("script");
    script.src = "/ort/ort.webgpu.min.js";
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("Could not load /ort/ort.webgpu.min.js"));
    document.head.appendChild(script);
  });
  ortPromise.catch(() => { ortPromise = null; });
  return ortPromise;
}


type Manifest = { size: number; sha256: string; parts: string[] };

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Download the parts a manifest lists and join them, checking the result's SHA-256. */
async function fetchParts(url: string, label: string, onProgress?: Progress): Promise<Uint8Array<ArrayBuffer>> {
  const res = await fetch(url);
  if (!res.ok) throw new ModelUnavailableError(`${label} manifest not found (${res.status})`);
  const m = (await res.json()) as Manifest;
  const bytes = new Uint8Array(m.size);
  let got = 0;
  for (const part of m.parts) {
    const pr = await fetch(new URL(part, new URL(url, location.href)).toString());
    if (!pr.ok || !pr.body) throw new ModelUnavailableError(`${label} part ${part} not found (${pr.status})`);
    const reader = pr.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (got + value.length > bytes.length) throw new Error(`${label} is larger than its manifest says`);
      bytes.set(value, got);
      got += value.length;
      onProgress?.({
        stage: "download",
        label: `Downloading ${label} (first time only) — ${(got / 1e6).toFixed(0)} of ${(m.size / 1e6).toFixed(0)} MB`,
        fraction: got / m.size,
      });
    }
  }
  if (got !== m.size || (await sha256Hex(bytes)) !== m.sha256) {
    throw new Error(`${label} download was incomplete or corrupted — please try again`);
  }
  return bytes;
}

async function fetchModel(url: string, label: string, onProgress?: Progress): Promise<Uint8Array<ArrayBuffer>> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  } catch { /* Cache API unavailable (private mode) — just download */ }

  if (url.endsWith(".json")) {
    const joined = await fetchParts(url, label, onProgress);
    try { await cache?.put(url, new Response(joined.slice())); } catch { /* quota — fine, re-download next time */ }
    return joined;
  }

  const res = await fetch(url);
  if (!res.ok) throw new ModelUnavailableError(`${label} model not found (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  let bytes: Uint8Array<ArrayBuffer>;
  if (res.body && total) {
    const reader = res.body.getReader();
    bytes = new Uint8Array(total);
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (got + value.length > bytes.length) { // server lied about the length
        const bigger = new Uint8Array(Math.max(bytes.length * 2, got + value.length));
        bigger.set(bytes);
        bytes = bigger;
      }
      bytes.set(value, got);
      got += value.length;
      onProgress?.({
        stage: "download",
        label: `Downloading ${label} (first time only) — ${(got / 1e6).toFixed(0)} of ${(total / 1e6).toFixed(0)} MB`,
        fraction: got / total,
      });
    }
    bytes = bytes.subarray(0, got);
  } else {
    onProgress?.({ stage: "download", label: `Downloading ${label} (first time only)…` });
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  try { await cache?.put(url, new Response(bytes.slice())); } catch { /* quota — fine, re-download next time */ }
  return bytes;
}

const sessions = new Map<string, Promise<Ort.InferenceSession>>();

function getSession(url: string, label: string, onProgress?: Progress): Promise<Ort.InferenceSession> {
  let s = sessions.get(url);
  if (!s) {
    s = (async () => {
      const [ort, bytes] = await Promise.all([getOrt(), fetchModel(url, label, onProgress)]);
      onProgress?.({ stage: "load", label: `Starting ${label}…` });
      if (!ort.env.wasm.proxy) {
        try {
          return await ort.InferenceSession.create(bytes, { executionProviders: ["webgpu"] });
        } catch (e) {
          console.warn("[watermark] WebGPU session failed, using WebAssembly:", e);
        }
      }
      return ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
    })();
    s.catch(() => sessions.delete(url)); // let a later attempt retry
    sessions.set(url, s);
  }
  return s;
}

/** Is a model file reachable (cached, or answering on the network)? */
const availability = new Map<string, Promise<boolean>>();
export function modelAvailable(url: string): Promise<boolean> {
  let p = availability.get(url);
  if (!p) {
    p = (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        if (await cache.match(url)) return true;
      } catch { /* ignore */ }
      try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
      } catch {
        return false;
      }
    })();
    availability.set(url, p);
  }
  return p;
}

// ── Image helpers ─────────────────────────────────────────────────────────

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  return c.getContext("2d", { willReadFrequently: true })!;
}

export async function loadCanvas(src: string): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = canvas(img.naturalWidth, img.naturalHeight);
  ctx2d(c).drawImage(img, 0, 0);
  return c;
}

/** Binary mask (0/255 per pixel) from a black-and-white image the size of the photo. */
export async function maskFromImage(src: string, w: number, h: number): Promise<Uint8Array> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = canvas(w, h);
  const g = ctx2d(c);
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4] > 127 ? 255 : 0;
  return m;
}

// ── Binary morphology (square windows, O(n) via prefix sums) ──────────────

function dilate(m: Uint8Array, w: number, h: number, k: number): Uint8Array {
  const r = k >> 1;
  const tmp = new Uint8Array(m.length);
  const out = new Uint8Array(m.length);
  const pre = new Int32Array(Math.max(w, h) + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + (m[row + x] ? 1 : 0);
    for (let x = 0; x < w; x++) tmp[row + x] = pre[Math.min(w, x + r + 1)] - pre[Math.max(0, x - r)] > 0 ? 255 : 0;
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) pre[y + 1] = pre[y] + (tmp[y * w + x] ? 1 : 0);
    for (let y = 0; y < h; y++) out[y * w + x] = pre[Math.min(h, y + r + 1)] - pre[Math.max(0, y - r)] > 0 ? 255 : 0;
  }
  return out;
}

function erode(m: Uint8Array, w: number, h: number, k: number): Uint8Array {
  const inv = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) inv[i] = m[i] ? 0 : 255;
  const d = dilate(inv, w, h, k);
  for (let i = 0; i < d.length; i++) d[i] = d[i] ? 0 : 255;
  return d;
}

type Box = { x: number; y: number; w: number; h: number; area: number };

/** 8-connected components of a binary mask: their bounding boxes and the label image. */
function components(m: Uint8Array, w: number, h: number): { boxes: Box[]; labels: Int32Array } {
  const labels = new Int32Array(m.length);
  const boxes: Box[] = [];
  const stack = new Int32Array(m.length);
  for (let start = 0; start < m.length; start++) {
    if (!m[start] || labels[start]) continue;
    const id = boxes.length + 1;
    let top = 0, minX = w, minY = h, maxX = 0, maxY = 0, area = 0;
    stack[top++] = start;
    labels[start] = id;
    while (top) {
      const p = stack[--top];
      const x = p % w, y = (p / w) | 0;
      area++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const q = ny * w + nx;
          if (m[q] && !labels[q]) { labels[q] = id; stack[top++] = q; }
        }
      }
    }
    boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
  }
  return { boxes, labels };
}

/** Close gaps inside letters, then widen the mask to take anti-aliased edges too (remover.grow). */
export function growMask(m: Uint8Array, w: number, h: number): Uint8Array {
  const side = Math.min(w, h);
  const close = Math.max(3, Math.round(side * 0.012)) | 1;
  const closed = erode(dilate(m, w, h, close), w, h, close);
  return dilate(closed, w, h, Math.max(5, Math.round(side * 0.01)) | 1);
}

// ── Detection ─────────────────────────────────────────────────────────────

let trainSize: number | null = null;

export async function detect(
  src: HTMLCanvasElement,
  opts: { text: boolean; logo: boolean; threshold?: number },
  onProgress?: Progress,
): Promise<Uint8Array> {
  const ort = await getOrt();
  const session = await getSession(DETECTOR_URL, "watermark detector", onProgress);
  onProgress?.({ stage: "detect", label: "Finding the watermark…" });

  if (trainSize === null) {
    // export_onnx.py ships the training crop size as a second output.
    const probe = await session.run({ image: new ort.Tensor("float32", new Float32Array(3 * 32 * 32), [1, 3, 32, 32]) });
    trainSize = Number((probe.train_size?.data as Float32Array | undefined)?.[0]) || 512;
  }

  const W = src.width, H = src.height;
  let scale = trainSize / Math.min(W, H);
  if (Math.max(W, H) * scale > DETECT_LONG) scale = DETECT_LONG / Math.max(W, H);
  const dw = Math.max(32, Math.round((W * scale) / 32) * 32);
  const dh = Math.max(32, Math.round((H * scale) / 32) * 32);

  const small = canvas(dw, dh);
  const sg = ctx2d(small);
  sg.imageSmoothingQuality = "high";
  sg.drawImage(src, 0, 0, dw, dh);
  const px = sg.getImageData(0, 0, dw, dh).data;
  const n = dw * dh;
  const input = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) input[c * n + i] = (px[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  }
  const out = await session.run({ image: new ort.Tensor("float32", input, [1, 3, dh, dw]) });
  const prob = out.prob.data as Float32Array;

  // Combine the channels the visitor asked for, then upsample the
  // probabilities smoothly to full size before thresholding (cleaner edges).
  const pc = canvas(dw, dh);
  const pg = ctx2d(pc);
  const pimg = pg.createImageData(dw, dh);
  for (let i = 0; i < n; i++) {
    const p = Math.max(opts.text ? prob[i] : 0, opts.logo ? prob[n + i] : 0);
    const v = Math.round(p * 255);
    pimg.data[i * 4] = pimg.data[i * 4 + 1] = pimg.data[i * 4 + 2] = v;
    pimg.data[i * 4 + 3] = 255;
  }
  pg.putImageData(pimg, 0, 0);
  const full = canvas(W, H);
  const fg = ctx2d(full);
  fg.imageSmoothingQuality = "high";
  fg.drawImage(pc, 0, 0, W, H);
  const fp = fg.getImageData(0, 0, W, H).data;
  const cut = (opts.threshold ?? 0.5) * 255;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < mask.length; i++) mask[i] = fp[i * 4] > cut ? 255 : 0;

  // Drop specks: a real watermark is never a handful of stray pixels.
  const { boxes, labels } = components(mask, W, H);
  const minArea = Math.max(12, Math.round(W * H * 2e-5));
  for (let i = 0; i < mask.length; i++) if (labels[i] && boxes[labels[i] - 1].area < minArea) mask[i] = 0;
  return mask;
}

// ── Inpainting ────────────────────────────────────────────────────────────

type Rect = { x: number; y: number; w: number; h: number };

/** A square crop around a region with generous context, kept inside the image. */
function cropAround(box: Rect, W: number, H: number): Rect {
  const margin = Math.max(48, Math.round(Math.max(box.w, box.h) * 0.5));
  const side = Math.min(Math.max(box.w, box.h) + 2 * margin, Math.max(W, H));
  const w = Math.min(side, W), h = Math.min(side, H);
  return {
    x: Math.min(Math.max(0, Math.round(box.x + box.w / 2 - w / 2)), W - w),
    y: Math.min(Math.max(0, Math.round(box.y + box.h / 2 - h / 2)), H - h),
    w, h,
  };
}

/*
  Overlapping crops are filled in one LaMa pass instead of several: each pass
  is ~1 s on WebGPU but ~15 s on the WebAssembly fallback. Two crops merge only
  while the merged crop stays within 1.5x the larger one, so a mark in each
  corner still gets two sharp fills rather than one blurry whole-image fill.
*/
function mergeCrops(crops: Rect[], W: number, H: number): Rect[] {
  const list = [...crops];
  for (let merged = true; merged;) {
    merged = false;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        if (!overlap) continue;
        const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
        const union = { x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0 };
        // The union already includes both crops' context margins: square it, don't re-pad it.
        const side = Math.max(union.w, union.h);
        if (side > 1.5 * Math.max(a.w, a.h, b.w, b.h)) continue;
        const sq = Math.min(side, Math.max(W, H));
        const w = Math.min(sq, W), h = Math.min(sq, H);
        list[i] = {
          x: Math.min(Math.max(0, Math.round(union.x + union.w / 2 - w / 2)), W - w),
          y: Math.min(Math.max(0, Math.round(union.y + union.h / 2 - h / 2)), H - h),
          w, h,
        };
        list.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
  return list;
}

/** Fill every masked pixel of `src` with LaMa. Returns a new canvas; pixels outside the mask are untouched. */
export async function inpaint(src: HTMLCanvasElement, mask: Uint8Array, onProgress?: Progress): Promise<HTMLCanvasElement> {
  const ort = await getOrt();
  const session = await getSession(LAMA_URL, "AI inpainting model", onProgress);
  const W = src.width, H = src.height;

  const out = canvas(W, H);
  const og = ctx2d(out);
  og.drawImage(src, 0, 0);

  // Group nearby marks (letters of one word, a logo and its caption) so each
  // group is filled with shared context instead of letter by letter.
  const reach = Math.max(9, Math.round(Math.min(W, H) * 0.03)) | 1;
  const { boxes } = components(dilate(mask, W, H, reach), W, H);

  const maskCanvas = canvas(W, H);
  {
    const mg = ctx2d(maskCanvas);
    const mi = mg.createImageData(W, H);
    for (let i = 0; i < mask.length; i++) {
      mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = mask[i];
      mi.data[i * 4 + 3] = 255;
    }
    mg.putImageData(mi, 0, 0);
  }

  const crops = mergeCrops(boxes.map((b) => cropAround(b, W, H)), W, H);
  const N = LAMA_SIZE * LAMA_SIZE;
  for (let b = 0; b < crops.length; b++) {
    const { x: cx, y: cy, w: cw, h: ch } = crops[b];
    onProgress?.({ stage: "inpaint", label: crops.length > 1 ? `Removing watermark… (${b + 1} of ${crops.length})` : "Removing watermark…", fraction: b / crops.length });

    const ic = canvas(LAMA_SIZE, LAMA_SIZE);
    const ig = ctx2d(ic);
    ig.imageSmoothingQuality = "high";
    ig.drawImage(out, cx, cy, cw, ch, 0, 0, LAMA_SIZE, LAMA_SIZE);
    const mc = canvas(LAMA_SIZE, LAMA_SIZE);
    const mg = ctx2d(mc);
    mg.drawImage(maskCanvas, cx, cy, cw, ch, 0, 0, LAMA_SIZE, LAMA_SIZE);

    const ip = ig.getImageData(0, 0, LAMA_SIZE, LAMA_SIZE).data;
    const mp = mg.getImageData(0, 0, LAMA_SIZE, LAMA_SIZE).data;
    const image = new Float32Array(3 * N);
    let m: Uint8Array = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      for (let c = 0; c < 3; c++) image[c * N + i] = ip[i * 4 + c] / 255;
      m[i] = mp[i * 4] > 20 ? 255 : 0; // any trace of the (smoothed) mask counts
    }
    m = dilate(m, LAMA_SIZE, LAMA_SIZE, 3);
    const maskT = new Float32Array(N);
    for (let i = 0; i < N; i++) maskT[i] = m[i] ? 1 : 0;

    const res = await session.run({
      image: new ort.Tensor("float32", image, [1, 3, LAMA_SIZE, LAMA_SIZE]),
      mask: new ort.Tensor("float32", maskT, [1, 1, LAMA_SIZE, LAMA_SIZE]),
    });
    const o = res.output.data as Float32Array;
    const filled = ig.createImageData(LAMA_SIZE, LAMA_SIZE);
    for (let i = 0; i < N; i++) {
      for (let c = 0; c < 3; c++) filled.data[i * 4 + c] = Math.max(0, Math.min(255, Math.round(o[c * N + i] * 255)));
      filled.data[i * 4 + 3] = 255;
    }
    ig.putImageData(filled, 0, 0);

    // Scale the filled crop back and paste it through a feathered copy of the
    // full-resolution mask, so only watermark pixels change.
    const back = canvas(cw, ch);
    const bg = ctx2d(back);
    bg.imageSmoothingQuality = "high";
    bg.drawImage(ic, 0, 0, cw, ch);
    const fillPx = bg.getImageData(0, 0, cw, ch).data;
    const cur = og.getImageData(cx, cy, cw, ch);
    const feather = canvas(cw, ch);
    const fgc = ctx2d(feather);
    fgc.filter = "blur(1px)";
    fgc.drawImage(maskCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
    const soft = fgc.getImageData(0, 0, cw, ch).data;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        const a = mask[(cy + y) * W + (cx + x)] ? 1 : soft[i * 4] / 255;
        if (a <= 0) continue;
        for (let c = 0; c < 3; c++) cur.data[i * 4 + c] = Math.round(fillPx[i * 4 + c] * a + cur.data[i * 4 + c] * (1 - a));
      }
    }
    og.putImageData(cur, cx, cy);
  }
  return out;
}

// ── One-call helpers for the page ─────────────────────────────────────────

export type BrowserResult = { dataUrl: string; found: boolean };

export async function removeAuto(srcDataUrl: string, opts: { text: boolean; logo: boolean }, onProgress?: Progress): Promise<BrowserResult> {
  const src = await loadCanvas(srcDataUrl);
  const raw = await detect(src, opts, onProgress);
  if (!raw.some((v) => v)) return { dataUrl: srcDataUrl, found: false };
  const out = await inpaint(src, growMask(raw, src.width, src.height), onProgress);
  return { dataUrl: out.toDataURL("image/jpeg", 0.93), found: true };
}

export async function removeWithMask(srcDataUrl: string, maskDataUrl: string, onProgress?: Progress): Promise<BrowserResult> {
  const src = await loadCanvas(srcDataUrl);
  const mask = await maskFromImage(maskDataUrl, src.width, src.height);
  if (!mask.some((v) => v)) return { dataUrl: srcDataUrl, found: false };
  // Brushed strokes already cover the mark; a small widening catches edge glow.
  const out = await inpaint(src, dilate(mask, src.width, src.height, 5), onProgress);
  return { dataUrl: out.toDataURL("image/jpeg", 0.93), found: true };
}
