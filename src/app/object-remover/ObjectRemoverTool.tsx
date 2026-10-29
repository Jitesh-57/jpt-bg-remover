"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RemovalCompare from "@/app/_components/RemovalCompare";
import GeneratingFx from "@/app/_components/GeneratingFx";
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
 * Laid out like the AI apps: the tools in a panel on the left, the photo on
 * the right (on a phone, the photo first). While the AI works, the photo
 * shows the same generating animation as every other tool.
 *
 * Signed out, the photo is kept through sign-in (pending-image), so nobody
 * uploads twice; with no credits, the packs open.
 */

const TOOL = "object-remover";
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const MAX_SIDE = 3072;
const TINT = "rgba(255,70,90,0.55)";
const STEPS = ["Reading your photo…", "Finding what you brushed…", "Removing it…", "Rebuilding what was behind it…", "Adding the finishing touches…"];

type Phase = "idle" | "edit" | "working" | "done";
type Pt = { x: number; y: number };
type Notice = { kind: "ok" | "warn" | "error"; text: string };

const side: React.CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 18, minWidth: 0 };
const stage: React.CSSProperties = { position: "relative", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 14, minHeight: 460, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 };
const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 };
const ghost: React.CSSProperties = { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 11, padding: "10px 14px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 };

function primary(on: boolean): React.CSSProperties {
  return {
    width: "100%", padding: 14, borderRadius: 13, border: "none", fontFamily: "inherit", fontWeight: 800, fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: on ? "var(--grad-strong)" : "var(--surface-3)", color: on ? "#fff" : "var(--text-faint)",
    cursor: on ? "pointer" : "not-allowed", boxShadow: on ? "var(--glow)" : "none", transition: "background .2s ease",
  };
}

const ICON = {
  brush: "M9.5 14.5 4 20M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z",
  erase: "M20 20H9l-5-5a2 2 0 0 1 0-2.8l8.2-8.2a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L13 19M7 10l7 7",
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  clear: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  tip: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
};

function Glyph({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Spark() {
  return <span aria-hidden style={{ fontSize: 15 }}>✨</span>;
}

function NoticeLine({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  const color = notice.kind === "ok" ? "var(--success)" : notice.kind === "warn" ? "var(--warn)" : "var(--danger)";
  return <p role="status" style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color, lineHeight: 1.45 }}>{notice.kind === "ok" ? "✓ " : ""}{notice.text}</p>;
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
  const [message, setMessage] = useState<Notice | null>(null);
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
  const footnote = <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>{CREDIT_COST} credits per removal · full resolution · no watermark</p>;

  // ── Upload ───────────────────────────────────────────────────────────────
  if (phase === "idle" || !source || !current) {
    return (
      <div className="jpt-or">
        <aside className="jpt-or-side" style={side}>
          <p style={label}>How it works</p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
            {[
              ["Upload a photo", "JPG, PNG or WebP."],
              ["Brush over what to remove", "A person, an object, text — anything."],
              ["Press Remove", "AI fills the gap from what's around it."],
            ].map(([t, d], i) => (
              <li key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13.5 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{t}</span>
                  <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
            <button onClick={() => fileRef.current?.click()} className="jpt-sheen" style={primary(true)}><Glyph d={ICON.upload} size={18} /> Upload Image</button>
            {footnote}
          </div>
        </aside>
        <label
          className="jpt-or-stage"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
          style={{ ...stage, padding: "40px 20px", cursor: "pointer", flexDirection: "column", textAlign: "center", border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`, background: drag ? "var(--accent-soft)" : "var(--bg-elevated)", transition: "background .2s, border-color .2s" }}
        >
          {fileInput}
          <span style={{ width: 64, height: 64, borderRadius: 18, background: "var(--grad-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "var(--glow)" }}><Glyph d={ICON.upload} size={28} /></span>
          <span style={{ fontSize: 20, fontWeight: 900, marginTop: 16, color: "var(--text)" }}>Drop your photo here</span>
          <span style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>or <span style={{ color: "var(--accent)", fontWeight: 800 }}>choose a photo</span> · JPG, PNG or WebP</span>
          {message && <span style={{ marginTop: 14 }}><NoticeLine notice={message} /></span>}
        </label>
      </div>
    );
  }

  // ── Brush (and the removal running over it) ────────────────────────────
  if (phase === "edit" || phase === "working") {
    return (
      <>
        <BrushEditor
          image={current}
          working={phase === "working"}
          notice={message && message.kind !== "ok" ? message : null}
          canCancel={history.length > 0}
          onCancel={() => { setMessage(null); setPhase("done"); }}
          onNewImage={() => fileRef.current?.click()}
          onApply={(mask) => remove(current, mask)}
          footnote={footnote}
          fileInput={fileInput}
        />
        {signInModal}
      </>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────
  const last = history[history.length - 1] ?? null;
  return (
    <div className="jpt-or">
      <aside className="jpt-or-side" style={side}>
        <NoticeLine notice={message} />
        <button onClick={() => void download()} disabled={!last} className="jpt-sheen" style={primary(!!last)}>
          <Glyph d={ICON.download} size={18} /> Download Image
        </button>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
          <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>Something else to remove, or a trace left?</span>
          <button onClick={() => { setMessage(null); setPhase("edit"); }} style={{ ...ghost, border: "1px solid var(--accent-border)", color: "var(--accent-strong)" }}>
            <Glyph d={ICON.brush} size={17} /> Brush &amp; remove more
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={undo} disabled={!history.length} style={{ ...ghost, opacity: history.length ? 1 : 0.5 }}><Glyph d={ICON.undo} size={16} /> Undo</button>
          <button onClick={() => fileRef.current?.click()} style={ghost}><Glyph d={ICON.upload} size={16} /> New photo</button>
        </div>
        <div style={{ marginTop: "auto" }}>{footnote}</div>
        {fileInput}
      </aside>
      <div className="jpt-or-stage" style={stage}>
        <div style={{ width: "100%", maxWidth: 900 }}>
          <RemovalCompare before={source} after={last} working={false} progress={null} afterAlt="Object removed" workingLabel="" />
        </div>
      </div>
    </div>
  );
}

// ── Brushing the mask ─────────────────────────────────────────────────────

function BrushEditor({ image, working, notice, canCancel, onCancel, onNewImage, onApply, footnote, fileInput }: {
  image: string;
  /** The removal is running: everything waits, and the photo shows the animation. */
  working: boolean;
  notice: Notice | null;
  canCancel: boolean;
  onCancel: () => void;
  onNewImage: () => void;
  onApply: (maskDataUrl: string) => void;
  footnote: React.ReactNode;
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
  const [steps, setSteps] = useState(0); // undo steps, so Undo enables and disables on time
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
      setSteps(0);
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
  useEffect(() => { if (working) setCursor(null); }, [working]);

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
    const m = maskRef.current; if (!m || working) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    history.current.push(m.getContext("2d")!.getImageData(0, 0, m.width, m.height));
    if (history.current.length > 20) history.current.shift();
    setSteps(history.current.length);
    lastPt.current = null;
    track(e);
    stroke(point(e));
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (working) return;
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
    setSteps(history.current.length);
    setPainted(anyPaint());
    redraw();
  };
  const clear = () => {
    const m = maskRef.current; if (!m) return;
    m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    history.current = []; setSteps(0); setPainted(false); redraw();
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
  const ring = working ? null : cursor ?? (preview && view ? { x: view.clientWidth / 2, y: view.clientHeight / 2 } : null);
  const canRemove = painted && !working;
  const modeBtn = (id: "brush" | "erase", text: string) => {
    const on = mode === id;
    return (
      <button key={id} role="radio" aria-checked={on} onClick={() => setMode(id)} disabled={working}
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "11px 8px",
          border: "none", borderRadius: 11, cursor: working ? "default" : "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800,
          background: on ? GRAD : "transparent", color: on ? "#fff" : "var(--text-muted)", boxShadow: on ? "0 6px 16px var(--accent-border)" : "none",
          transition: "background .15s, color .15s",
        }}>
        <Glyph d={ICON[id]} />{text}
      </button>
    );
  };

  return (
    <div className="jpt-or">
      <aside className="jpt-or-side" style={{ ...side, opacity: working ? 0.75 : 1, transition: "opacity .2s" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p style={label}>Tool</p>
          <div role="radiogroup" aria-label="Brush or erase" style={{ display: "flex", gap: 4, padding: 4, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
            {modeBtn("brush", "Brush")}
            {modeBtn("erase", "Erase")}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={label}>Brush size</p>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{brush}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-faint)", flex: "0 0 auto" }} />
            <input type="range" min={8} max={200} value={brush} disabled={working} onChange={(e) => resize(Number(e.target.value))}
              style={{ flex: 1, minWidth: 0, accentColor: "var(--accent)" }} aria-label="Brush size" />
            <span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--text-faint)", flex: "0 0 auto" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={undo} disabled={working || !steps} style={{ ...ghost, opacity: working || !steps ? 0.5 : 1 }}><Glyph d={ICON.undo} size={16} /> Undo</button>
          <button onClick={clear} disabled={working || !painted} style={{ ...ghost, opacity: working || !painted ? 0.5 : 1 }}><Glyph d={ICON.clear} size={16} /> Clear</button>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 12px", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
          <span style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }}><Glyph d={ICON.tip} size={17} /></span>
          <span>{mode === "brush"
            ? "Brush over what you want to remove — a little past its edges, and its shadow too."
            : "Erase takes the brush off anything you want to keep."}</span>
        </div>

        <NoticeLine notice={working ? null : notice} />

        <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
          <button onClick={apply} disabled={!canRemove} className={canRemove ? "jpt-sheen" : undefined} style={primary(canRemove)}>
            {working
              ? <><span className="jpt-spin" style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff" }} /> Removing…</>
              : <><Spark /> Remove · {CREDIT_COST} credits</>}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: canCancel ? "1fr 1fr" : "1fr", gap: 8 }}>
            {canCancel && <button onClick={onCancel} disabled={working} style={ghost}>Back to result</button>}
            <button onClick={onNewImage} disabled={working} style={ghost}><Glyph d={ICON.upload} size={16} /> New photo</button>
          </div>
          {footnote}
        </div>
        {fileInput}
      </aside>

      <div className="jpt-or-stage" style={stage}>
        <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0, borderRadius: 12, overflow: "hidden" }}>
          <canvas
            ref={viewRef}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onPointerLeave={(e) => { if (e.pointerType === "mouse" && !lastPt.current) setCursor(null); }}
            aria-label="Your photo: brush over what to remove"
            style={{ maxWidth: "100%", maxHeight: "min(74vh, 780px)", width: "auto", height: "auto", cursor: working ? "progress" : "none", touchAction: "none", display: "block", opacity: loaded ? 1 : 0.4 }}
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
          {working && <GeneratingFx ghost={image} steps={STEPS} estimate="usually under a minute" />}
        </div>
      </div>
    </div>
  );
}
