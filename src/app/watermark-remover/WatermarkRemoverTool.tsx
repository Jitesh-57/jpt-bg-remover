"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Progress } from "@/lib/watermark-browser";

// Visible-watermark remover running our own models. Each request tries, in order:
//   1. the visitor's browser (lib/watermark-browser: detector + LaMa in ONNX),
//   2. our GPU server (/api/watermark-remove → gpu-image-server),
// and when neither can detect automatically, opens the manual brush.
// Upload runs automatic detection straight away; "Try Manual Edit" lets the
// visitor paint over anything it missed.

const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const MAX_SIDE = 2048; // keeps the upload under Vercel's 4.5 MB body limit

type Phase = "idle" | "working" | "done" | "manual";

const panel: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const ghost: React.CSSProperties = { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 11, padding: "11px 16px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%" };
const primary: React.CSSProperties = { background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "13px 18px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: "0 8px 22px var(--accent-border)" };

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
      resolve({ dataUrl: c.toDataURL("image/jpeg", 0.93), w, h });
    };
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = URL.createObjectURL(file);
  });
}

export default function WatermarkRemoverTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [source, setSource] = useState<string | null>(null);   // what was uploaded
  const [result, setResult] = useState<string | null>(null);   // latest cleaned image
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [removeText, setRemoveText] = useState(true);
  const [removeLogo, setRemoveLogo] = useState(true);
  const [message, setMessage] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<{ label: string; fraction?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);

  const call = useCallback(async (image: string, opts: { mask?: string; text: boolean; logo: boolean }) => {
    const id = ++runId.current;
    setPhase("working");
    setMessage(null);
    setProgress(null);
    const done = (dataUrl: string, found: boolean) => {
      setResult(dataUrl);
      setPhase("done");
      setMessage(found
        ? { kind: "ok", text: "Watermark removed successfully" }
        : { kind: "warn", text: opts.mask ? "Nothing was painted. Paint over the watermark and try again." : "No watermark detected. Use Manual Edit to paint over it." });
    };

    // 1. In the browser, when the model files are published.
    try {
      const wb = await import("@/lib/watermark-browser");
      const onProgress: Progress = (p) => { if (id === runId.current) setProgress({ label: p.label, fraction: p.fraction }); };
      const lama = await wb.modelAvailable(wb.LAMA_URL);
      if (lama && opts.mask) {
        const r = await wb.removeWithMask(image, opts.mask, onProgress);
        if (id === runId.current) done(r.dataUrl, r.found);
        return;
      }
      if (lama && !opts.mask && (await wb.modelAvailable(wb.DETECTOR_URL))) {
        const r = await wb.removeAuto(image, { text: opts.text, logo: opts.logo }, onProgress);
        if (id === runId.current) done(r.dataUrl, r.found);
        return;
      }
    } catch (e) {
      console.warn("[watermark] in-browser removal failed, trying the server:", e);
    }
    if (id !== runId.current) return;
    setProgress({ label: "Removing watermark…" });

    // 2. Our GPU server.
    try {
      const res = await fetch("/api/watermark-remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mask: opts.mask, removeText: opts.text, removeLogo: opts.logo }),
      });
      const data = (await res.json().catch(() => ({}))) as { dataUrl?: string; found?: boolean; error?: string; needsManual?: boolean };
      if (id !== runId.current) return; // a newer request superseded this one
      if (!res.ok || !data.dataUrl) {
        // 3. Nothing can find the watermark automatically: let the visitor paint it.
        if (data.needsManual && !opts.mask) {
          setMessage({ kind: "warn", text: "Paint over the watermark, then click Remove Painted Area." });
          setPhase("manual");
          return;
        }
        setMessage({ kind: "error", text: data.error || "Something went wrong. Please try again." });
        setPhase("done");
        return;
      }
      done(data.dataUrl, !!data.found);
    } catch {
      if (id !== runId.current) return;
      setMessage({ kind: "error", text: "Couldn't reach the server. Check your connection and try again." });
      setPhase("done");
    }
  }, []);

  const onFile = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage({ kind: "error", text: "Please choose a JPG, PNG or WebP image." }); return; }
    try {
      const { dataUrl, w, h } = await prepare(file);
      setSource(dataUrl);
      setResult(null);
      setSize({ w, h });
      call(dataUrl, { text: removeText, logo: removeLogo });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  }, [call, removeText, removeLogo]);

  const toggle = (which: "text" | "logo", on: boolean) => {
    const text = which === "text" ? on : removeText;
    const logo = which === "logo" ? on : removeLogo;
    setRemoveText(text);
    setRemoveLogo(logo);
    if (source && (text || logo)) call(source, { text, logo });
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = "watermark-removed.jpg";
    a.click();
  };

  // The new upload replaces this one in onFile, so nothing is cleared until a file is actually picked.
  const reset = () => fileRef.current?.click();

  // ── Upload ───────────────────────────────────────────────────────────────
  if (phase === "idle" || !source) {
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
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <span style={{ background: GRAD, color: "#fff", borderRadius: 12, padding: "14px 30px", fontSize: 16, fontWeight: 800, marginBottom: 14, boxShadow: "0 8px 22px var(--accent-border)" }}>Upload Image</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>or drop a JPG, PNG or WebP here</span>
          <span style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 12 }}>Only upload images you own or have permission to edit.</span>
        </label>
        {message && <p style={{ textAlign: "center", color: "var(--danger)", fontSize: 14, marginTop: 12 }}>{message.text}</p>}
      </div>
    );
  }

  // ── Manual brush ─────────────────────────────────────────────────────────
  if (phase === "manual") {
    return (
      <ManualEditor
        image={result || source}
        size={size}
        notice={message && message.kind !== "ok" ? message.text : null}
        onCancel={() => { setMessage(null); setPhase("done"); }}
        onApply={(mask) => call(result || source, { mask, text: true, logo: true })}
      />
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  const working = phase === "working";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start", maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, flex: "1 1 520px", minWidth: 0, position: "relative" }}>
        <Compare before={source} after={result} working={working} progress={progress} />
      </div>
      <div style={{ ...panel, flex: "1 1 280px", maxWidth: 420, display: "grid", gap: 14 }}>
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 4 }}>Result still has a watermark?</div>
          <button onClick={() => setPhase("manual")} disabled={working} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 15, fontWeight: 800, textDecoration: "underline", cursor: working ? "default" : "pointer", padding: 0 }}>
            ✎ Try Manual Edit
          </button>
        </div>

        <button onClick={download} disabled={!result || working} style={{ ...primary, opacity: !result || working ? 0.55 : 1, cursor: !result || working ? "default" : "pointer" }}>
          {working ? "Removing watermark…" : "Download Image"}
        </button>
        {message && (
          <div style={{ textAlign: "center", fontSize: 13.5, fontWeight: 600, color: message.kind === "ok" ? "var(--success)" : message.kind === "warn" ? "var(--warn)" : "var(--danger)" }}>
            {message.kind === "ok" ? "✓ " : ""}{message.text}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 22 }}>
          {([["text", "Remove Text", removeText], ["logo", "Remove Logo", removeLogo]] as const).map(([k, label, on]) => (
            <label key={k} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, color: "var(--text)", cursor: working ? "default" : "pointer" }}>
              <input type="checkbox" checked={on} disabled={working || (on && !(k === "text" ? removeLogo : removeText))} onChange={(e) => toggle(k, e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
              {label}
            </label>
          ))}
        </div>

        <button onClick={reset} style={{ ...ghost, border: "1px solid var(--accent-border)" }}>Upload Next Image</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

// ── Before / after slider ─────────────────────────────────────────────────

function Compare({ before, after, working, progress }: {
  before: string;
  after: string | null;
  working: boolean;
  progress: { label: string; fraction?: number } | null;
}) {
  const [pos, setPos] = useState(50);
  const pill = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: 10, [side]: 10, zIndex: 3, fontSize: 11, fontWeight: 800, color: "#fff",
    background: "rgba(0,0,0,.6)", borderRadius: 6, padding: "3px 8px", letterSpacing: ".04em",
  });
  return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", userSelect: "none" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt="Original image" style={{ display: "block", width: "100%", height: "auto" }} />
      {after && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={after} alt="Watermark removed" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", clipPath: `inset(0 0 0 ${pos}%)` }} />
      )}
      {after && (
        <>
          <span style={pill("left")}>Before</span>
          <span style={pill("right")}>After</span>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#fff", boxShadow: "0 0 6px rgba(0,0,0,.5)", pointerEvents: "none" }}>
            <span style={{ position: "absolute", top: "50%", left: -17, width: 36, height: 36, marginTop: -18, borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "2px solid #fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>‹ ›</span>
          </div>
          <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", margin: 0 }} />
        </>
      )}
      {working && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 12, zIndex: 4 }}>
          <div className="wm-spin" style={{ width: 38, height: 38, borderRadius: "50%", border: "4px solid rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
          <div style={{ fontSize: 14.5, fontWeight: 700, textAlign: "center", padding: "0 16px" }}>{progress?.label ?? "Removing watermark…"}</div>
          {progress?.fraction !== undefined && (
            <div style={{ width: "min(260px, 70%)", height: 6, borderRadius: 3, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
              <div style={{ width: `${Math.round(progress.fraction * 100)}%`, height: "100%", background: "#fff", transition: "width .2s" }} />
            </div>
          )}
          <style>{`@keyframes wmspin{to{transform:rotate(360deg)}}.wm-spin{animation:wmspin .9s linear infinite}`}</style>
        </div>
      )}
    </div>
  );
}

// ── Manual brush editor ───────────────────────────────────────────────────

function ManualEditor({ image, size, notice, onCancel, onApply }: {
  image: string;
  size: { w: number; h: number };
  notice: string | null;
  onCancel: () => void;
  onApply: (maskDataUrl: string) => void;
}) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const history = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [brush, setBrush] = useState(28); // in image pixels at 1000px wide
  const [painted, setPainted] = useState(false);

  const redraw = useCallback(() => {
    const view = viewRef.current, mask = maskRef.current, img = imgRef.current;
    if (!view || !mask || !img) return;
    const ctx = view.getContext("2d")!;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, 0, 0, view.width, view.height);
    // Tint the painted area so the visitor can see what will be removed.
    const tint = document.createElement("canvas");
    tint.width = view.width; tint.height = view.height;
    const t = tint.getContext("2d")!;
    t.drawImage(mask, 0, 0, view.width, view.height);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = "rgba(255,70,90,0.55)";
    t.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, 0, 0);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const m = document.createElement("canvas");
      m.width = size.w || img.naturalWidth; m.height = size.h || img.naturalHeight;
      maskRef.current = m;
      const view = viewRef.current!;
      view.width = m.width; view.height = m.height;
      redraw();
    };
    img.src = image;
  }, [image, size, redraw]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };
  const radius = () => ((maskRef.current?.width || 1000) / 1000) * brush / 2;

  const stroke = (to: { x: number; y: number }) => {
    const m = maskRef.current!.getContext("2d")!;
    m.strokeStyle = m.fillStyle = "#fff";
    m.lineCap = m.lineJoin = "round";
    m.lineWidth = radius() * 2;
    const from = last.current ?? to;
    m.beginPath(); m.moveTo(from.x, from.y); m.lineTo(to.x, to.y); m.stroke();
    m.beginPath(); m.arc(to.x, to.y, radius(), 0, Math.PI * 2); m.fill();
    last.current = to;
    redraw();
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const m = maskRef.current; if (!m) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    history.current.push(m.getContext("2d")!.getImageData(0, 0, m.width, m.height));
    if (history.current.length > 20) history.current.shift();
    last.current = null;
    stroke(point(e));
    setPainted(true);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { if (last.current) stroke(point(e)); };
  const up = () => { last.current = null; };

  const undo = () => {
    const m = maskRef.current, prev = history.current.pop();
    if (!m || !prev) return;
    m.getContext("2d")!.putImageData(prev, 0, 0);
    setPainted(history.current.length > 0);
    redraw();
  };
  const clear = () => {
    const m = maskRef.current; if (!m) return;
    m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    history.current = []; setPainted(false); redraw();
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

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <strong style={{ fontSize: 15, color: "var(--text)" }}>Paint over the watermark</strong>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--text-muted)", flex: "1 1 200px" }}>
          Brush
          <input type="range" min={8} max={120} value={brush} onChange={(e) => setBrush(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--accent)" }} />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={undo} disabled={!painted} style={{ ...ghost, width: "auto", padding: "8px 14px", opacity: painted ? 1 : 0.5 }}>Undo</button>
          <button onClick={clear} disabled={!painted} style={{ ...ghost, width: "auto", padding: "8px 14px", opacity: painted ? 1 : 0.5 }}>Clear</button>
        </div>
      </div>
      {notice && <p style={{ color: "var(--warn)", fontSize: 14, margin: "0 0 12px", textAlign: "center" }}>{notice}</p>}
      <div style={{ ...panel, padding: 10, textAlign: "center" }}>
        <canvas
          ref={viewRef}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          style={{ maxWidth: "100%", height: "auto", borderRadius: 8, cursor: "crosshair", touchAction: "none", display: "inline-block" }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={apply} disabled={!painted} style={{ ...primary, width: "auto", padding: "13px 28px", opacity: painted ? 1 : 0.55, cursor: painted ? "pointer" : "default" }}>Remove Painted Area</button>
        <button onClick={onCancel} style={{ ...ghost, width: "auto", padding: "13px 22px" }}>Cancel</button>
      </div>
    </div>
  );
}
