"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Draggable before/after comparison slider. Each side falls back to a designed
 * gradient placeholder (with the tool emoji) if its creative hasn't been
 * uploaded to Supabase yet — so the home page always looks finished.
 */
export default function BeforeAfter({
  before,
  after,
  alt,
  emoji,
  grad,
}: {
  before: string;
  after: string;
  alt: string;
  emoji: string;
  grad: string;
}) {
  const [pos, setPos] = useState(50);
  const [beforeOk, setBeforeOk] = useState(true);
  const [afterOk, setAfterOk] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromClientX(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  const placeholder: React.CSSProperties = {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8, background: grad,
    color: "#4338CA", fontWeight: 800,
  };

  const layer: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: 16,
        overflow: "hidden", cursor: "ew-resize", touchAction: "none", userSelect: "none",
        border: "1px solid #E6E8F2", boxShadow: "0 18px 50px rgba(99,102,241,0.16)",
      }}
    >
      {/* AFTER (full) */}
      {afterOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={after} alt={`${alt} — after`} style={layer} draggable={false} onError={() => setAfterOk(false)} />
      ) : (
        <div style={placeholder}>
          <span style={{ fontSize: 40 }}>{emoji}</span>
          <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>After</span>
        </div>
      )}

      {/* BEFORE (clipped to slider position) */}
      <div style={{ position: "absolute", inset: 0, width: `${pos}%`, overflow: "hidden", borderRight: "2px solid rgba(255,255,255,0.9)" }}>
        {beforeOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={before} alt={`${alt} — before`} style={{ ...layer, filter: "saturate(0.6) brightness(0.98)" }} draggable={false} onError={() => setBeforeOk(false)} />
        ) : (
          <div style={{ ...placeholder, filter: "grayscale(0.4)", opacity: 0.9 }}>
            <span style={{ fontSize: 40, filter: "blur(1px)" }}>{emoji}</span>
            <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>Before</span>
          </div>
        )}
      </div>

      {/* Labels */}
      <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(15,23,42,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: "0.08em" }}>BEFORE</span>
      <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(99,102,241,0.9)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: "0.08em" }}>AFTER</span>

      {/* Handle */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, transform: "translateX(-50%)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", boxShadow: "0 4px 14px rgba(15,23,42,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366F1", fontWeight: 900, fontSize: 14 }}>⇆</div>
      </div>
    </div>
  );
}
