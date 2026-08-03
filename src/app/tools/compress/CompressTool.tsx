"use client";

import { useState } from "react";
import { compressToJpeg } from "@/lib/tools-canvas";
import OnPageTool from "@/app/tools/_components/OnPageTool";

export default function CompressTool() {
  const [quality, setQuality] = useState(70);
  return (
    <OnPageTool
      modeLabel="Quality"
      actionLabel="Compress image"
      downloadBase="compressed"
      resultTag={`${quality}%`}
      controls={
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>JPEG quality</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#6366F1" }}>{quality}%</span>
          </div>
          <input type="range" min={20} max={95} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#6366F1" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9AA1B4", marginTop: 4 }}>
            <span>Smaller file</span><span>Higher quality</span>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: "12px 0 0" }}>Lower quality = smaller file. Around 60–80% is usually invisible for photos.</p>
        </div>
      }
      onTransform={(src) => compressToJpeg(src, quality / 100)}
    />
  );
}
