"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Progress } from "@/lib/watermark-browser";
import RemovalCompare from "@/app/_components/RemovalCompare";

/**
 * AI Object Remover: select a person, object or anything else in a photo,
 * press Remove, and AI fills the gap from what's around it.
 *
 * The removal is the watermark remover's engine (lib/watermark-browser): LaMa
 * running in the visitor's browser, so it's free, needs no account and the
 * photo never leaves the device. What's new here is how the selection is made:
 *
 *   brush  paint over it
 *   lasso  draw a loop around it; letting go closes the loop and fills it
 *   box    drag a rectangle over it
 *
 * `methods` decides which of the three the editor offers; with more than one
 * it shows them as a toolbar. Every selection is drawn into one black-and-white
 * mask, so they can be mixed: a box over a person, then the brush over their
 * shadow.
 */

export type SelectMethod = "brush" | "lasso" | "box";

export const SELECT_METHODS: { id: SelectMethod; label: string; hint: string; icon: string }[] = [
  { id: "brush", label: "Brush", hint: "Paint over what you want to remove.", icon: "M9.5 14.5 4 20M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z" },
  { id: "lasso", label: "Lasso", hint: "Draw a loop around it. Let go to close the loop.", icon: "M12 4c4.4 0 8 2.2 8 5s-3.6 5-8 5-8-2.2-8-5 3.6-5 8-5zM7 13.5c-.6 1.2-1 2.6-1 3.5a2 2 0 0 0 2 2c1.3 0 2-1.2 2-2.5" },
  { id: "box", label: "Box", hint: "Drag a box over it.", icon: "M4 4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 8v0M12 4h0M20 12h0M12 20h0" },
];

const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const MAX_SIDE = 4096; // LaMa works on crops, so big photos keep their detail
const TINT = "rgba(255,70,90,0.55)";

type Phase = "idle" | "edit" | "working" | "done";
type Status = { label: string; fraction?: number } | null;
type Pt = { x: number; y: number };

const panel: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const ghost: React.CSSProperties = { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 11, padding: "11px 16px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%" };
const primary: React.CSSProperties = { background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "13px 18px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: "0 8px 22px var(--accent-border)" };

function Glyph({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Read a file into a JPEG data URL no larger than MAX_SIDE on its long edge. */
function prepare(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; // transparent PNGs flatten onto white, not black
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve({ dataUrl: c.toDataURL("image/jpeg", 0.95), w, h });
    };
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = URL.createObjectURL(file);
  });
}

export default function ObjectRemoverTool({ methods = ["brush", "lasso", "box"] }: { methods?: SelectMethod[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [source, setSource] = useState<string | null>(null);   // what was uploaded
  const [history, setHistory] = useState<string[]>([]);       // each removal's result, newest last
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [message, setMessage] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<Status>(null);      // shown while removing
  const [modelStatus, setModelStatus] = useState<Status>(null); // background model download
  const fileRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);

  const current = history[history.length - 1] ?? source;

  // Start fetching the model while the visitor selects, so "Remove" is quick.
  const warmUp = useCallback(async () => {
    try {
      const wb = await import("@/lib/watermark-browser");
      await wb.preload((p) => setModelStatus(p.stage === "download" || p.stage === "load" ? { label: p.label, fraction: p.fraction } : null));
      setModelStatus(null);
    } catch {
      setModelStatus(null); // the real attempt on "Remove" reports any error
    }
  }, []);

  const remove = useCallback(async (image: string, mask: string) => {
    const id = ++runId.current;
    setPhase("working");
    setMessage(null);
    setProgress({ label: "Removing…" });
    try {
      const wb = await import("@/lib/watermark-browser");
      const onProgress: Progress = (p) => { if (id === runId.current) setProgress({ label: p.label, fraction: p.fraction }); };
      const r = await wb.removeWithMask(image, mask, onProgress);
      if (id !== runId.current) return;
      if (!r.found) {
        setMessage({ kind: "warn", text: "Nothing is selected. Select what you want to remove and try again." });
        setPhase("edit");
        return;
      }
      setHistory((h) => [...h, r.dataUrl]);
      setMessage({ kind: "ok", text: "Removed" });
      setPhase("done");
    } catch (e) {
      if (id !== runId.current) return;
      console.error("[object-remover]", e);
      setMessage({
        kind: "error",
        text: !navigator.onLine
          ? "You're offline — the AI model needs to download once. Reconnect and try again."
          : "Something went wrong while removing it. Please try again.",
      });
      setPhase("edit");
    }
  }, []);

  const onFile = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage({ kind: "error", text: "Please choose a JPG, PNG or WebP image." }); return; }
    try {
      const { dataUrl, w, h } = await prepare(file);
      runId.current++;
      setSource(dataUrl);
      setHistory([]);
      setSize({ w, h });
      setMessage(null);
      setPhase("edit");
      warmUp();
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  }, [warmUp]);

  const download = () => {
    const last = history[history.length - 1];
    if (!last) return;
    const a = document.createElement("a");
    a.href = last;
    a.download = "object-removed.jpg";
    a.click();
  };

  const undo = () => {
    setHistory((h) => h.slice(0, -1));
    setMessage(null);
    if (history.length <= 1) setPhase("edit");
  };

  const fileInput = (
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
      onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
  );

  // ── Upload ───────────────────────────────────────────────────────────────
  if (phase === "idle" || !source || !current) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
            cursor: "pointer", borderRadius: 20, padding: "46px 24px",
            border: `2px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`,
            background: drag ? "var(--accent-soft)" : "var(--surface)", transition: "all .2s",
          }}
        >
          {fileInput}
          <span style={{ background: GRAD, color: "#fff", borderRadius: 12, padding: "14px 30px", fontSize: 16, fontWeight: 800, marginBottom: 14, boxShadow: "0 8px 22px var(--accent-border)" }}>Upload Image</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>or drop a JPG, PNG or WebP here</span>
          <span style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 12 }}>100% free · runs in your browser · your photo is never uploaded</span>
        </label>
        {message && <p style={{ textAlign: "center", color: "var(--danger)", fontSize: 14, marginTop: 12 }}>{message.text}</p>}
      </div>
    );
  }

  // ── Select ───────────────────────────────────────────────────────────────
  if (phase === "edit") {
    return (
      <MaskEditor
        methods={methods}
        image={current}
        size={size}
        notice={message && message.kind !== "ok" ? message : null}
        modelStatus={modelStatus}
        canCancel={history.length > 0}
        onCancel={() => { setMessage(null); setPhase("done"); }}
        onNewImage={() => fileRef.current?.click()}
        onApply={(mask) => remove(current, mask)}
        fileInput={fileInput}
      />
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  const working = phase === "working";
  const last = history[history.length - 1] ?? null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start", maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, flex: "1 1 520px", minWidth: 0, position: "relative" }}>
        <RemovalCompare before={source} after={working ? null : last} working={working} progress={progress} afterAlt="Object removed" workingLabel="Removing…" />
      </div>
      <div style={{ ...panel, flex: "1 1 280px", maxWidth: 420, display: "grid", gap: 14 }}>
        <button onClick={download} disabled={!last || working} style={{ ...primary, opacity: !last || working ? 0.55 : 1, cursor: !last || working ? "default" : "pointer" }}>
          {working ? "Removing…" : "Download Image"}
        </button>
        {message && !working && (
          <div style={{ textAlign: "center", fontSize: 13.5, fontWeight: 600, color: message.kind === "ok" ? "var(--success)" : message.kind === "warn" ? "var(--warn)" : "var(--danger)" }}>
            {message.kind === "ok" ? "✓ " : ""}{message.text}
          </div>
        )}
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 4 }}>Something else to remove, or a trace left?</div>
          <button onClick={() => { setMessage(null); setPhase("edit"); }} disabled={working} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 15, fontWeight: 800, textDecoration: "underline", cursor: working ? "default" : "pointer", padding: 0 }}>
            ✎ Select &amp; remove more
          </button>
        </div>
        <button onClick={undo} disabled={working || !history.length} style={{ ...ghost, opacity: working || !history.length ? 0.5 : 1 }}>Undo last removal</button>
        <button onClick={() => fileRef.current?.click()} disabled={working} style={{ ...ghost, border: "1px solid var(--accent-border)" }}>Upload Next Image</button>
        {fileInput}
      </div>
    </div>
  );
}

// ── Selecting ─────────────────────────────────────────────────────────────

function MaskEditor({ methods, image, size, notice, modelStatus, canCancel, onCancel, onNewImage, onApply, fileInput }: {
  methods: SelectMethod[];
  image: string;
  size: { w: number; h: number };
  notice: { kind: "ok" | "warn" | "error"; text: string } | null;
  modelStatus: Status;
  canCancel: boolean;
  onCancel: () => void;
  onNewImage: () => void;
  onApply: (maskDataUrl: string) => void;
  fileInput: React.ReactNode;
}) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const history = useRef<ImageData[]>([]);
  // What the pointer is drawing right now, before it lands in the mask.
  const lastPt = useRef<Pt | null>(null);   // brush: the previous point of the stroke
  const loop = useRef<Pt[] | null>(null);   // lasso: the loop so far
  const box = useRef<{ a: Pt; b: Pt } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [method, setMethod] = useState<SelectMethod>(methods[0] ?? "brush");
  const [brush, setBrush] = useState(40); // diameter, per 1000 px of image width
  const [selected, setSelected] = useState(false);
  const [cursor, setCursor] = useState<Pt | null>(null); // brush outline, on-screen px
  const [preview, setPreview] = useState(false); // show the brush outline mid-canvas while resizing
  const [displayW, setDisplayW] = useState(0);

  useEffect(() => { if (!methods.includes(method)) setMethod(methods[0] ?? "brush"); }, [methods, method]);

  /** A margin around lasso and box selections, so an object's soft edge and halo go too. */
  const margin = () => Math.max(4, (maskRef.current?.width || 1000) * 0.008);

  const redraw = useCallback(() => {
    const view = viewRef.current, mask = maskRef.current, img = imgRef.current;
    if (!view || !mask || !img) return;
    const ctx = view.getContext("2d")!;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.setLineDash([]);
    ctx.drawImage(img, 0, 0, view.width, view.height);
    // Tint what's selected so the visitor can see what will be removed.
    const tint = document.createElement("canvas");
    tint.width = view.width; tint.height = view.height;
    const t = tint.getContext("2d")!;
    t.drawImage(mask, 0, 0, view.width, view.height);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = TINT;
    t.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, 0, 0);

    // The selection being drawn: a dashed white line over a dark one, so it shows on any photo.
    const lw = Math.max(2, view.width / 450);
    const outline = (path: () => void) => {
      ctx.fillStyle = "rgba(255,70,90,0.22)";
      path(); ctx.fill();
      ctx.lineWidth = lw * 2; ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.setLineDash([]);
      path(); ctx.stroke();
      ctx.lineWidth = lw; ctx.strokeStyle = "#fff"; ctx.setLineDash([lw * 4, lw * 3]);
      path(); ctx.stroke();
      ctx.setLineDash([]);
    };
    const pts = loop.current;
    if (pts && pts.length > 1) {
      outline(() => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y); ctx.closePath(); });
    }
    const b = box.current;
    if (b) {
      const x = Math.min(b.a.x, b.b.x), y = Math.min(b.a.y, b.b.y);
      outline(() => { ctx.beginPath(); ctx.rect(x, y, Math.abs(b.b.x - b.a.x), Math.abs(b.b.y - b.a.y)); });
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const m = document.createElement("canvas");
      m.width = size.w || img.naturalWidth; m.height = size.h || img.naturalHeight;
      maskRef.current = m;
      history.current = [];
      setSelected(false);
      const view = viewRef.current!;
      view.width = m.width; view.height = m.height;
      redraw();
      setDisplayW(view.getBoundingClientRect().width);
    };
    img.src = image;
  }, [image, size, redraw]);

  // Keep the brush outline's scale right when the canvas is resized (rotation, window resize).
  useEffect(() => {
    const view = viewRef.current;
    if (!view || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setDisplayW(view.getBoundingClientRect().width));
    ro.observe(view);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => { if (previewTimer.current) clearTimeout(previewTimer.current); }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };
  const track = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (method !== "brush") return;
    const r = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const radius = () => ((maskRef.current?.width || 1000) / 1000) * brush / 2;
  const ringSize = Math.max(4, (displayW * brush) / 1000); // on-screen diameter of the brush

  const maskCtx = () => {
    const m = maskRef.current!.getContext("2d")!;
    m.strokeStyle = m.fillStyle = "#fff";
    m.lineCap = m.lineJoin = "round";
    return m;
  };

  const paint = (to: Pt) => {
    const m = maskCtx();
    m.lineWidth = radius() * 2;
    const from = lastPt.current ?? to;
    m.beginPath(); m.moveTo(from.x, from.y); m.lineTo(to.x, to.y); m.stroke();
    m.beginPath(); m.arc(to.x, to.y, radius(), 0, Math.PI * 2); m.fill();
    lastPt.current = to;
    redraw();
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const m = maskRef.current; if (!m) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    history.current.push(m.getContext("2d")!.getImageData(0, 0, m.width, m.height));
    if (history.current.length > 20) history.current.shift();
    const p = point(e);
    track(e);
    if (method === "brush") { lastPt.current = null; paint(p); setSelected(true); }
    else if (method === "lasso") { loop.current = [p]; }
    else { box.current = { a: p, b: p }; }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    track(e);
    const p = point(e);
    if (method === "brush") { if (lastPt.current) paint(p); return; }
    if (method === "lasso" && loop.current) {
      const prev = loop.current[loop.current.length - 1];
      if (Math.hypot(p.x - prev.x, p.y - prev.y) > (maskRef.current?.width || 1000) / 400) { loop.current.push(p); redraw(); }
      return;
    }
    if (method === "box" && box.current) { box.current.b = p; redraw(); }
  };

  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== "mouse") setCursor(null); // a finger has left the screen
    const min = (maskRef.current?.width || 1000) / 100;
    let drew = false;
    if (method === "brush") { lastPt.current = null; return; }
    if (method === "lasso" && loop.current) {
      const pts = loop.current;
      loop.current = null;
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      if (pts.length >= 3 && Math.max(...xs) - Math.min(...xs) > min && Math.max(...ys) - Math.min(...ys) > min) {
        const m = maskCtx();
        m.lineWidth = margin() * 2;
        m.beginPath(); m.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) m.lineTo(p.x, p.y); m.closePath();
        m.fill(); m.stroke();
        drew = true;
      }
    }
    if (method === "box" && box.current) {
      const { a, b } = box.current;
      box.current = null;
      if (Math.abs(b.x - a.x) > min && Math.abs(b.y - a.y) > min) {
        const pad = margin();
        maskCtx().fillRect(Math.min(a.x, b.x) - pad, Math.min(a.y, b.y) - pad, Math.abs(b.x - a.x) + pad * 2, Math.abs(b.y - a.y) + pad * 2);
        drew = true;
      }
    }
    // A tap or a tiny scribble adds nothing: forget the undo step it saved.
    if (drew) setSelected(true); else history.current.pop();
    redraw();
  };

  const resize = (v: number) => {
    setBrush(v);
    setPreview(true);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreview(false), 900);
  };

  const undo = () => {
    const m = maskRef.current, prev = history.current.pop();
    if (!m || !prev) return;
    m.getContext("2d")!.putImageData(prev, 0, 0);
    setSelected(history.current.length > 0);
    redraw();
  };
  const clear = () => {
    const m = maskRef.current; if (!m) return;
    m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    history.current = []; setSelected(false); redraw();
  };
  const apply = () => {
    const m = maskRef.current; if (!m) return;
    const out = document.createElement("canvas");
    out.width = m.width; out.height = m.height;
    const o = out.getContext("2d")!;
    o.fillStyle = "#000"; o.fillRect(0, 0, out.width, out.height);
    o.drawImage(m, 0, 0);
    onApply(out.toDataURL("image/png"));
  };

  const view = viewRef.current;
  const ring = method === "brush" ? cursor ?? (preview && view ? { x: view.clientWidth / 2, y: view.clientHeight / 2 } : null) : null;
  const info = SELECT_METHODS.find((m) => m.id === method)!;
  const small: React.CSSProperties = { ...ghost, width: "auto", padding: "8px 14px" };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {methods.length > 1 && (
          <div role="radiogroup" aria-label="How to select" style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {SELECT_METHODS.filter((m) => methods.includes(m.id)).map((m) => {
              const on = m.id === method;
              return (
                <button key={m.id} role="radio" aria-checked={on} onClick={() => setMethod(m.id)} title={m.hint}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7, border: "none", borderRadius: 9, padding: "8px 13px", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14, fontWeight: 800,
                    background: on ? GRAD : "transparent", color: on ? "#fff" : "var(--text-muted)",
                  }}>
                  <Glyph d={m.icon} />{m.label}
                </button>
              );
            })}
          </div>
        )}
        <strong style={{ fontSize: 15, color: "var(--text)", flex: methods.length > 1 ? "1 1 220px" : undefined }}>{info.hint}</strong>
        {method === "brush" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--text-muted)", flex: "1 1 200px" }}>
            Brush size
            <input type="range" min={8} max={200} value={brush} onChange={(e) => resize(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--accent)" }} aria-label="Brush size" />
          </label>
        )}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button onClick={undo} disabled={!selected} style={{ ...small, opacity: selected ? 1 : 0.5 }}>Undo</button>
          <button onClick={clear} disabled={!selected} style={{ ...small, opacity: selected ? 1 : 0.5 }}>Clear</button>
        </div>
      </div>
      {notice && (
        <p style={{ color: notice.kind === "error" ? "var(--danger)" : "var(--warn)", fontSize: 14, margin: "0 0 12px", textAlign: "center" }}>{notice.text}</p>
      )}
      <div style={{ ...panel, padding: 10, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0 }}>
          <canvas
            ref={viewRef}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onPointerLeave={(e) => { if (e.pointerType === "mouse" && !lastPt.current) setCursor(null); }}
            style={{ maxWidth: "100%", maxHeight: "72vh", width: "auto", height: "auto", borderRadius: 8, cursor: method === "brush" ? "none" : "crosshair", touchAction: "none", display: "block" }}
          />
          {ring && (
            // The brush outline: a white ring with a dark edge so it shows on any photo.
            <span aria-hidden style={{
              position: "absolute", left: ring.x, top: ring.y, width: ringSize, height: ringSize,
              transform: "translate(-50%, -50%)", borderRadius: "50%", pointerEvents: "none",
              border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,.7), inset 0 0 0 1px rgba(0,0,0,.7)",
              background: "rgba(255,70,90,0.18)",
            }} />
          )}
        </div>
      </div>
      {modelStatus && (
        <div style={{ margin: "10px auto 0", maxWidth: 420, textAlign: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
          {modelStatus.label}
          {modelStatus.fraction !== undefined && (
            <div style={{ height: 4, borderRadius: 2, background: "var(--surface-3)", marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(modelStatus.fraction * 100)}%`, height: "100%", background: "var(--accent)" }} />
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={apply} disabled={!selected} style={{ ...primary, width: "auto", padding: "13px 30px", opacity: selected ? 1 : 0.55, cursor: selected ? "pointer" : "default" }}>
          ✨ Remove
        </button>
        {canCancel && <button onClick={onCancel} style={{ ...ghost, width: "auto", padding: "13px 22px" }}>Back to result</button>}
        <button onClick={onNewImage} style={{ ...ghost, width: "auto", padding: "13px 22px" }}>New image</button>
        {fileInput}
      </div>
    </div>
  );
}
