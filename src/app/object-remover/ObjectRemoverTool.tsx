"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RemovalCompare from "@/app/_components/RemovalCompare";
import SignInModal from "@/app/_components/SignInModal";
import { CREDIT_COST } from "@/lib/plans";
import { publishCredits } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import { userMessage } from "@/lib/user-message";
import { trackEvent } from "@/lib/analytics";
import { savePendingContext, loadPendingContext, clearPendingContext } from "@/lib/pending-image";

/**
 * AI Object Remover: brush over a person, object or anything else in a photo,
 * press Remove, and AI fills the gap from what's around it.
 *
 * The removal runs on fal.ai (/api/object-remover) and costs CREDIT_COST, like
 * every AI tool. The brush paints a black-and-white mask; Erase takes paint
 * back off. Several passes are fine: each one works on the last result.
 *
 * Signed out, the photo is kept through sign-in (pending-image), so nobody
 * uploads twice; with no credits, the packs open.
 */

const TOOL = "object-remover";
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const MAX_SIDE = 3072;
const TINT = "rgba(255,70,90,0.55)";

type Phase = "idle" | "edit" | "working" | "done";
type Pt = { x: number; y: number };

const panel: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const ghost: React.CSSProperties = { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 11, padding: "11px 16px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%" };
const primary: React.CSSProperties = { background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "13px 18px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: "0 8px 22px var(--accent-border)" };

const ICON = {
  brush: "M9.5 14.5 4 20M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z",
  erase: "M20 20H9l-5-5a2 2 0 0 1 0-2.8l8.2-8.2a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L13 19M7 10l7 7",
};

function Glyph({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Read a file into a JPEG data URL no larger than MAX_SIDE on its long edge. */
function prepare(file: File): Promise<string> {
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
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("That file couldn't be opened as an image."));
    img.src = URL.createObjectURL(file);
  });
}

export default function ObjectRemoverTool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [source, setSource] = useState<string | null>(null);   // what was uploaded
  const [history, setHistory] = useState<string[]>([]);       // each removal's result, newest last
  const [message, setMessage] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);
  /** Uploaded copies of data-URL photos, so a second attempt doesn't upload again. */
  const uploaded = useRef(new Map<string, string>());

  const current = history[history.length - 1] ?? source;

  // A photo that went through sign-in comes back here.
  useEffect(() => {
    void loadPendingContext().then((ctx) => {
      if (ctx?.tool !== TOOL || !ctx.image) return;
      void clearPendingContext();
      setSource(ctx.image);
      setHistory([]);
      setPhase("edit");
    });
  }, []);

  // Every sign-in path (this tool's, the navbar's) keeps the photo.
  useEffect(() => {
    const w = window as unknown as { __jptPersistContext?: () => Promise<void> };
    if (!current) return;
    w.__jptPersistContext = () => savePendingContext({ image: current, tool: TOOL });
    return () => { delete w.__jptPersistContext; };
  }, [current]);

  const remove = useCallback(async (image: string, mask: string) => {
    const id = ++runId.current;
    setPhase("working");
    setMessage(null);
    trackEvent("object_remover_run", {});
    try {
      // A URL keeps the request small; the photo itself is the fallback if the upload fails.
      let payload: { imageUrl?: string; dataUrl?: string } = { imageUrl: image };
      if (image.startsWith("data:")) {
        let url = uploaded.current.get(image);
        if (!url) {
          try {
            const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
            url = await uploadDataUrlToSupabase(image);
            uploaded.current.set(image, url);
          } catch { /* send the photo itself */ }
        }
        payload = url ? { imageUrl: url } : { dataUrl: image };
      }
      const res = await fetch("/api/object-remover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, mask }),
      });
      const data = await res.json().catch(() => ({})) as { resultUrl?: string; dataUrl?: string; credits?: number; error?: string; upgradeRequired?: boolean };
      if (id !== runId.current) return;
      if (res.status === 401) { setPhase("edit"); setSignIn(true); return; }
      if (res.status === 402 || data.upgradeRequired) {
        setPhase("edit");
        setMessage({ kind: "warn", text: `Each removal uses ${CREDIT_COST} credits. Get credits to continue.` });
        openPricing("object removal");
        return;
      }
      const out = data.resultUrl || data.dataUrl;
      if (!res.ok || !out) {
        setMessage({ kind: "error", text: userMessage(data.error, "That didn't work. Please try again.") });
        setPhase("edit");
        return;
      }
      if (typeof data.credits === "number") publishCredits(data.credits);
      setHistory((h) => [...h, out]);
      setMessage({ kind: "ok", text: "Removed" });
      setPhase("done");
    } catch {
      if (id !== runId.current) return;
      setMessage({ kind: "error", text: "Could not reach the server. Check your connection and try again." });
      setPhase("edit");
    }
  }, []);

  const onFile = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage({ kind: "error", text: "Please choose a JPG, PNG or WebP image." }); return; }
    try {
      const dataUrl = await prepare(file);
      runId.current++;
      setSource(dataUrl);
      setHistory([]);
      setMessage(null);
      setPhase("edit");
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  }, []);

  const download = async () => {
    const last = history[history.length - 1];
    if (!last) return;
    // The result is a stored image on another domain, where a plain link opens it instead of saving it.
    try {
      const blob = await (await fetch(last)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `object-removed.${blob.type.includes("png") ? "png" : "jpg"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      window.open(last, "_blank", "noopener");
    }
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
  const signInModal = signIn && (
    <SignInModal nextPath={typeof window !== "undefined" ? window.location.pathname : undefined} onClose={() => setSignIn(false)} />
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
          <span style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 12 }}>{CREDIT_COST} credits per removal · full resolution · no watermark</span>
        </label>
        {message && <p style={{ textAlign: "center", color: "var(--danger)", fontSize: 14, marginTop: 12 }}>{message.text}</p>}
      </div>
    );
  }

  // ── Brush ────────────────────────────────────────────────────────────────
  if (phase === "edit") {
    return (
      <>
        <BrushEditor
          image={current}
          notice={message && message.kind !== "ok" ? message : null}
          canCancel={history.length > 0}
          onCancel={() => { setMessage(null); setPhase("done"); }}
          onNewImage={() => fileRef.current?.click()}
          onApply={(mask) => remove(current, mask)}
          fileInput={fileInput}
        />
        {signInModal}
      </>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  const working = phase === "working";
  const last = history[history.length - 1] ?? null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "flex-start", maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, flex: "1 1 520px", minWidth: 0, position: "relative" }}>
        <RemovalCompare before={working ? current : source} after={working ? null : last} working={working} progress={null} afterAlt="Object removed" workingLabel="AI is removing it…" />
      </div>
      <div style={{ ...panel, flex: "1 1 280px", maxWidth: 420, display: "grid", gap: 14 }}>
        <button onClick={() => void download()} disabled={!last || working} style={{ ...primary, opacity: !last || working ? 0.55 : 1, cursor: !last || working ? "default" : "pointer" }}>
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
            ✎ Brush &amp; remove more
          </button>
        </div>
        <button onClick={undo} disabled={working || !history.length} style={{ ...ghost, opacity: working || !history.length ? 0.5 : 1 }}>Undo last removal</button>
        <button onClick={() => fileRef.current?.click()} disabled={working} style={{ ...ghost, border: "1px solid var(--accent-border)" }}>Upload Next Image</button>
        {fileInput}
      </div>
    </div>
  );
}

// ── Brushing the mask ─────────────────────────────────────────────────────

function BrushEditor({ image, notice, canCancel, onCancel, onNewImage, onApply, fileInput }: {
  image: string;
  notice: { kind: "ok" | "warn" | "error"; text: string } | null;
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
  const lastPt = useRef<Pt | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<"brush" | "erase">("brush");
  const [brush, setBrush] = useState(40); // diameter, per 1000 px of image width
  const [painted, setPainted] = useState(false);
  const [cursor, setCursor] = useState<Pt | null>(null); // brush outline, on-screen px
  const [preview, setPreview] = useState(false); // show the outline mid-canvas while resizing
  const [displayW, setDisplayW] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const redraw = useCallback(() => {
    const view = viewRef.current, mask = maskRef.current, img = imgRef.current;
    if (!view || !mask || !img) return;
    const ctx = view.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, 0, 0, view.width, view.height);
    // Tint what's brushed so the visitor can see what will be removed.
    const tint = document.createElement("canvas");
    tint.width = view.width; tint.height = view.height;
    const t = tint.getContext("2d")!;
    t.drawImage(mask, 0, 0, view.width, view.height);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = TINT;
    t.fillRect(0, 0, tint.width, tint.height);
    ctx.drawImage(tint, 0, 0);
  }, []);

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const m = document.createElement("canvas");
      m.width = img.naturalWidth; m.height = img.naturalHeight;
      maskRef.current = m;
      history.current = [];
      setPainted(false);
      const view = viewRef.current!;
      view.width = m.width; view.height = m.height;
      redraw();
      setDisplayW(view.getBoundingClientRect().width);
      setLoaded(true);
    };
    img.src = image;
  }, [image, redraw]);

  // Keep the outline's scale right when the canvas is resized (rotation, window resize).
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
    const r = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const radius = () => ((maskRef.current?.width || 1000) / 1000) * brush / 2;
  const ringSize = Math.max(4, (displayW * brush) / 1000); // on-screen diameter of the brush

  const stroke = (to: Pt) => {
    const m = maskRef.current!.getContext("2d")!;
    // Erase takes paint back off the mask.
    m.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";
    m.strokeStyle = m.fillStyle = "#fff";
    m.lineCap = m.lineJoin = "round";
    m.lineWidth = radius() * 2;
    const from = lastPt.current ?? to;
    m.beginPath(); m.moveTo(from.x, from.y); m.lineTo(to.x, to.y); m.stroke();
    m.beginPath(); m.arc(to.x, to.y, radius(), 0, Math.PI * 2); m.fill();
    m.globalCompositeOperation = "source-over";
    lastPt.current = to;
    redraw();
  };

  /** Is anything still brushed? Erase can take the last of it away. */
  const anyPaint = () => {
    const m = maskRef.current; if (!m) return false;
    const d = m.getContext("2d")!.getImageData(0, 0, m.width, m.height).data;
    for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 0) return true;
    return false;
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const m = maskRef.current; if (!m) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    history.current.push(m.getContext("2d")!.getImageData(0, 0, m.width, m.height));
    if (history.current.length > 20) history.current.shift();
    lastPt.current = null;
    track(e);
    stroke(point(e));
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    track(e);
    if (lastPt.current) stroke(point(e));
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!lastPt.current) return;
    lastPt.current = null;
    if (e.pointerType !== "mouse") setCursor(null); // a finger has left the screen
    setPainted(anyPaint());
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
    setPainted(anyPaint());
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

  const view = viewRef.current;
  const ring = cursor ?? (preview && view ? { x: view.clientWidth / 2, y: view.clientHeight / 2 } : null);
  const small: React.CSSProperties = { ...ghost, width: "auto", padding: "8px 14px" };
  const modeBtn = (id: "brush" | "erase", label: string) => {
    const on = mode === id;
    return (
      <button key={id} role="radio" aria-checked={on} onClick={() => setMode(id)}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 74, padding: "9px 12px",
          border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800,
          background: on ? GRAD : "transparent", color: on ? "#fff" : "var(--text-muted)",
        }}>
        <Glyph d={ICON[id]} />{label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "left" }}>
      <div style={{ ...panel, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginBottom: 14 }}>
        <div role="radiogroup" aria-label="Brush or erase" style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {modeBtn("brush", "Brush")}
          {modeBtn("erase", "Erase")}
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--text)", flex: "1 1 220px" }}>
          Brush Size
          <input type="range" min={8} max={200} value={brush} onChange={(e) => resize(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--accent)" }} aria-label="Brush size" />
        </label>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button onClick={undo} disabled={!history.current.length} style={{ ...small, opacity: history.current.length ? 1 : 0.5 }}>Undo</button>
          <button onClick={clear} disabled={!painted} style={{ ...small, opacity: painted ? 1 : 0.5 }}>Clear</button>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 12px", textAlign: "center" }}>
        {mode === "brush" ? "Brush over what you want to remove — a little past its edges works best." : "Erase takes the brush off anything you don't want removed."}
      </p>
      {notice && (
        <p style={{ color: notice.kind === "error" ? "var(--danger)" : "var(--warn)", fontSize: 14, margin: "0 0 12px", textAlign: "center" }}>{notice.text}</p>
      )}
      <div style={{ ...panel, padding: 10, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0 }}>
          <canvas
            ref={viewRef}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onPointerLeave={(e) => { if (e.pointerType === "mouse" && !lastPt.current) setCursor(null); }}
            style={{ maxWidth: "100%", maxHeight: "72vh", width: "auto", height: "auto", borderRadius: 8, cursor: "none", touchAction: "none", display: "block", opacity: loaded ? 1 : 0.4 }}
          />
          {ring && (
            // The brush outline: a white ring with a dark edge so it shows on any photo; dashed when erasing.
            <span aria-hidden style={{
              position: "absolute", left: ring.x, top: ring.y, width: ringSize, height: ringSize,
              transform: "translate(-50%, -50%)", borderRadius: "50%", pointerEvents: "none",
              border: `2px ${mode === "erase" ? "dashed" : "solid"} #fff`, boxShadow: "0 0 0 1px rgba(0,0,0,.7), inset 0 0 0 1px rgba(0,0,0,.7)",
              background: mode === "erase" ? "rgba(255,255,255,0.12)" : "rgba(255,70,90,0.18)",
            }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={apply} disabled={!painted} style={{ ...primary, width: "auto", padding: "13px 30px", opacity: painted ? 1 : 0.55, cursor: painted ? "pointer" : "default" }}>
          ✨ Remove · {CREDIT_COST} credits
        </button>
        {canCancel && <button onClick={onCancel} style={{ ...ghost, width: "auto", padding: "13px 22px" }}>Back to result</button>}
        <button onClick={onNewImage} style={{ ...ghost, width: "auto", padding: "13px 22px" }}>New image</button>
        {fileInput}
      </div>
    </div>
  );
}
