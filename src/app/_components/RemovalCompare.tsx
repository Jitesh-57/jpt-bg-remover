"use client";

import { useState } from "react";

/**
 * The result of an in-browser removal (watermark remover, object remover):
 * the original with the result over it, a slider to wipe between them, and a
 * spinner with progress while the AI is working.
 */
export default function RemovalCompare({ before, after, working, progress, afterAlt, workingLabel }: {
  before: string;
  after: string | null;
  working: boolean;
  progress: { label: string; fraction?: number } | null;
  afterAlt: string;
  workingLabel: string;
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
        <img src={after} alt={afterAlt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", clipPath: `inset(0 0 0 ${pos}%)` }} />
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
          <div style={{ fontSize: 14.5, fontWeight: 700, textAlign: "center", padding: "0 16px" }}>{progress?.label ?? workingLabel}</div>
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
