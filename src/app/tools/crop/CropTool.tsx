"use client";

import { useState } from "react";
import { cropToAspectRatio } from "@/lib/tools-canvas";
import OnPageTool from "@/app/tools/_components/OnPageTool";

const RATIOS: { label: string; w: number; h: number }[] = [
  { label: "1:1", w: 1, h: 1 },
  { label: "4:5", w: 4, h: 5 },
  { label: "16:9", w: 16, h: 9 },
  { label: "9:16", w: 9, h: 16 },
  { label: "4:3", w: 4, h: 3 },
  { label: "3:2", w: 3, h: 2 },
];

export default function CropTool() {
  const [idx, setIdx] = useState(0);
  const r = RATIOS[idx];
  return (
    <OnPageTool
      modeLabel="Aspect ratio"
      actionLabel={`Crop to ${r.label}`}
      downloadBase="cropped"
      resultTag={r.label}
      controls={
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {RATIOS.map((rr, i) => (
              <button key={rr.label} onClick={() => setIdx(i)} style={{
                padding: "12px 6px", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer",
                border: idx === i ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                background: idx === i ? "#EEF2FF" : "#fff", color: idx === i ? "#6366F1" : "#94A3B8",
              }}>{rr.label}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: "12px 0 0" }}>Centre-crops your image to the chosen ratio — perfect for social posts and profiles.</p>
        </div>
      }
      onTransform={(src) => cropToAspectRatio(src, r.w, r.h)}
    />
  );
}
