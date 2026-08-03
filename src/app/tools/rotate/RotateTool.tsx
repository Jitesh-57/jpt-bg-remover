"use client";

import { useState } from "react";
import { rotateFlipImage } from "@/lib/tools-canvas";
import OnPageTool from "@/app/tools/_components/OnPageTool";

export default function RotateTool() {
  const [deg, setDeg] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const tag = `${deg}°${flipH ? " ⇋" : ""}${flipV ? " ⇅" : ""}`;
  const btn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "12px 6px", borderRadius: 11, fontSize: 13.5, fontWeight: 800, cursor: "pointer",
    border: active ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
    background: active ? "#EEF2FF" : "#fff", color: active ? "#6366F1" : "#94A3B8",
  });

  return (
    <OnPageTool
      modeLabel="Rotate & flip"
      actionLabel="Apply"
      downloadBase="rotated"
      resultTag={tag}
      disabled={deg === 0 && !flipH && !flipV}
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setDeg((d) => (d + 270) % 360)} style={btn(false)}>⟲ Left 90°</button>
            <button onClick={() => setDeg((d) => (d + 90) % 360)} style={btn(false)}>Right 90° ⟳</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFlipH((v) => !v)} style={btn(flipH)}>⇋ Flip H</button>
            <button onClick={() => setFlipV((v) => !v)} style={btn(flipV)}>⇅ Flip V</button>
          </div>
          <div style={{ fontSize: 13, color: "#374151", fontWeight: 700, textAlign: "center", padding: "6px 0" }}>
            Rotation: <span style={{ color: "#6366F1" }}>{deg}°</span>{flipH ? " · flip H" : ""}{flipV ? " · flip V" : ""}
          </div>
          <button onClick={() => { setDeg(0); setFlipH(false); setFlipV(false); }} style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", background: "none", border: "none", cursor: "pointer" }}>Reset</button>
        </div>
      }
      onTransform={(src) => rotateFlipImage(src, deg, flipH, flipV)}
    />
  );
}
