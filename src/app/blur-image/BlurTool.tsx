"use client";

import { useCallback, useRef, useState } from "react";

// Fully client-side blur / pixelate tool. The image is drawn to a canvas in the
// browser and never uploaded. Drag a box over the area you want to hide, and it's
// blurred or pixelated at full resolution. Undo/reset supported; download is PNG.

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
type Mode = "blur" | "pixelate";
type Rect = { x: number; y: number; w: number; h: number };

const MAX_DISPLAY_W = 760;

export default function BlurTool() {
  const fileRef = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null); // natural-resolution working canvas
  const historyRef = useRef<ImageData[]>([]);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const dragRectRef = useRef<Rect | null>(null);

  const [hasImage, setHasImage] = useState(false);
  const [mode, setMode] = useState<Mode>("blur");
  const [intensity, setIntensity] = useState(18);
  const [scale, setScale] = useState(1); // natural / display
  const [canUndo, setCanUndo] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Draw the working canvas onto the (scaled) display canvas, optionally with a
  // live selection rectangle on top.
  const renderDisplay = useCallback((sel?: Rect | null) => {
    const disp = displayRef.current;
    const work = workRef.current;
    if (!disp || !work) return;
    const ctx = disp.getContext("2d")!;
    ctx.clearRect(0, 0, disp.width, disp.height);
    ctx.drawImage(work, 0, 0, work.width, work.height, 0, 0, disp.width, disp.height);
    if (sel && sel.w > 1 && sel.h > 1) {
      ctx.save();
      ctx.strokeStyle = "#6366F1";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
      ctx.fillStyle = "rgba(99,102,241,0.15)";
      ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
      ctx.restore();
    }
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const img = new Image();
    img.onload = () => {
      const work = document.createElement("canvas");
      work.width = img.naturalWidth;
      work.height = img.naturalHeight;
      work.getContext("2d")!.drawImage(img, 0, 0);
      workRef.current = work;

      const dispW = Math.min(MAX_DISPLAY_W, img.naturalWidth);
      const dispH = Math.round((img.naturalHeight * dispW) / img.naturalWidth);
      const disp = displayRef.current!;
      disp.width = dispW;
      disp.height = dispH;
      setScale(img.naturalWidth / dispW);

      historyRef.current = [];
      setCanUndo(false);
      setHasImage(true);
      // render after state/canvas sizing settles
      requestAnimationFrame(() => renderDisplay());
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }, [renderDisplay]);

  const pushHistory = () => {
    const work = workRef.current!;
    const ctx = work.getContext("2d")!;
    historyRef.current.push(ctx.getImageData(0, 0, work.width, work.height));
    if (historyRef.current.length > 20) historyRef.current.shift();
    setCanUndo(true);
  };

  // Apply the effect to a rectangle expressed in DISPLAY coordinates.
  const applyEffect = (dispRect: Rect) => {
    const work = workRef.current;
    if (!work) return;
    const rx = Math.max(0, Math.round(dispRect.x * scale));
    const ry = Math.max(0, Math.round(dispRect.y * scale));
    const rw = Math.min(work.width - rx, Math.round(dispRect.w * scale));
    const rh = Math.min(work.height - ry, Math.round(dispRect.h * scale));
    if (rw < 3 || rh < 3) return;

    pushHistory();
    const ctx = work.getContext("2d")!;

    if (mode === "blur") {
      // Blur the whole image with full surrounding context (avoids edge bleed),
      // then copy just the selected rectangle back over the original.
      const blurPx = Math.max(2, Math.round(intensity * (Math.max(work.width, work.height) / 900)));
      const blurred = document.createElement("canvas");
      blurred.width = work.width;
      blurred.height = work.height;
      const bctx = blurred.getContext("2d")!;
      bctx.filter = `blur(${blurPx}px)`;
      bctx.drawImage(work, 0, 0);
      bctx.filter = "none";
      ctx.drawImage(blurred, rx, ry, rw, rh, rx, ry, rw, rh);
    } else {
      // Pixelate: downscale the region then draw it back with smoothing off.
      const block = Math.max(4, Math.round(intensity * (Math.max(work.width, work.height) / 900)));
      const tw = Math.max(1, Math.round(rw / block));
      const th = Math.max(1, Math.round(rh / block));
      const tmp = document.createElement("canvas");
      tmp.width = tw;
      tmp.height = th;
      const tctx = tmp.getContext("2d")!;
      tctx.drawImage(work, rx, ry, rw, rh, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tw, th, rx, ry, rw, rh);
      ctx.imageSmoothingEnabled = true;
    }
    renderDisplay();
  };

  // Pointer (mouse + touch) selection.
  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = displayRef.current!.getBoundingClientRect();
    const sx = displayRef.current!.width / rect.width;
    const sy = displayRef.current!.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = pointerPos(e);
    dragRectRef.current = null;
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!startRef.current) return;
    const p = pointerPos(e);
    const s = startRef.current;
    const r = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) };
    dragRectRef.current = r;
    renderDisplay(r);
  };
  const onUp = () => {
    const r = dragRectRef.current;
    startRef.current = null;
    dragRectRef.current = null;
    if (r && r.w > 4 && r.h > 4) applyEffect(r);
    else renderDisplay();
  };

  const undo = () => {
    const hist = historyRef.current;
    if (!hist.length) return;
    const prev = hist.pop()!;
    workRef.current!.getContext("2d")!.putImageData(prev, 0, 0);
    setCanUndo(hist.length > 0);
    renderDisplay();
  };

  const reset = () => {
    if (!historyRef.current.length) return;
    const first = historyRef.current[0];
    workRef.current!.getContext("2d")!.putImageData(first, 0, 0);
    historyRef.current = [];
    setCanUndo(false);
    renderDisplay();
  };

  const download = () => {
    const work = workRef.current;
    if (!work) return;
    const a = document.createElement("a");
    a.href = work.toDataURL("image/png");
    a.download = "blurred-image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const btn: React.CSSProperties = {
    padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
    border: "1px solid #E5E7EB", background: "#fff", color: "#334155",
  };
  const seg = (active: boolean): React.CSSProperties => ({
    ...btn, flex: 1, textAlign: "center",
    background: active ? GRAD : "#fff", color: active ? "#fff" : "#334155",
    border: active ? "none" : "1px solid #E5E7EB",
  });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {!hasImage ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#6366F1" : "#CBD5E1"}`, borderRadius: 18,
            background: dragOver ? "#EEF2FF" : "#F8F9FC", padding: "56px 24px", textAlign: "center", cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🫥</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Drop an image or click to upload</div>
          <div style={{ fontSize: 13.5, color: "#6B7280" }}>Your image stays in your browser — nothing is uploaded.</div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>
      ) : (
        <div>
          {/* Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 18, background: "#fff", border: "1px solid #EAECF5", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", gap: 8, minWidth: 200, flex: "1 1 200px" }}>
              <button onClick={() => setMode("blur")} style={seg(mode === "blur")}>Blur</button>
              <button onClick={() => setMode("pixelate")} style={seg(mode === "pixelate")}>Pixelate</button>
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 180 }}>
              <label htmlFor="intensity" style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                {mode === "blur" ? "Blur strength" : "Block size"}: {intensity}
              </label>
              <input id="intensity" type="range" min={6} max={48} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366F1" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={undo} disabled={!canUndo} style={{ ...btn, opacity: canUndo ? 1 : 0.5, cursor: canUndo ? "pointer" : "not-allowed" }}>Undo</button>
              <button onClick={reset} disabled={!canUndo} style={{ ...btn, opacity: canUndo ? 1 : 0.5, cursor: canUndo ? "pointer" : "not-allowed" }}>Reset</button>
            </div>
          </div>

          <p style={{ fontSize: 13.5, color: "#6B7280", margin: "0 0 12px", textAlign: "center" }}>
            Drag a box over the area you want to hide. Repeat for as many areas as you like.
          </p>

          <div style={{ textAlign: "center", background: "#F1F5F9", borderRadius: 14, padding: 14 }}>
            <canvas
              ref={displayRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              style={{ maxWidth: "100%", height: "auto", borderRadius: 8, cursor: "crosshair", touchAction: "none", boxShadow: "0 6px 20px rgba(15,23,42,0.10)" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 20 }}>
            <button onClick={download} className="jpt-hover" style={{ background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "13px 28px", fontSize: 15.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 22px rgba(99,102,241,0.28)" }}>
              Download Image
            </button>
            <button onClick={() => { setHasImage(false); workRef.current = null; historyRef.current = []; setCanUndo(false); }} style={{ ...btn, padding: "13px 22px" }}>
              Upload another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
