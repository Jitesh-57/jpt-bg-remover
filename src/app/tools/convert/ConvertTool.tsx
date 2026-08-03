"use client";

import { useState } from "react";
import { convertImageFormat } from "@/lib/tools-canvas";
import OnPageTool from "@/app/tools/_components/OnPageTool";

type Fmt = "png" | "jpeg" | "webp";
const FORMATS: { key: Fmt; label: string }[] = [
  { key: "jpeg", label: "JPG" },
  { key: "png", label: "PNG" },
  { key: "webp", label: "WEBP" },
];

export default function ConvertTool() {
  const [format, setFormat] = useState<Fmt>("png");
  return (
    <OnPageTool
      modeLabel="Convert to"
      actionLabel={`Convert to ${FORMATS.find((f) => f.key === format)!.label}`}
      downloadBase="converted"
      resultTag={FORMATS.find((f) => f.key === format)!.label}
      controls={
        <div style={{ display: "flex", gap: 8 }}>
          {FORMATS.map((f) => (
            <button key={f.key} onClick={() => setFormat(f.key)} style={{
              flex: 1, padding: "13px 8px", borderRadius: 12, fontSize: 14.5, fontWeight: 800, cursor: "pointer",
              border: format === f.key ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
              background: format === f.key ? "#EEF2FF" : "#fff", color: format === f.key ? "#6366F1" : "#94A3B8",
            }}>{f.label}</button>
          ))}
        </div>
      }
      onTransform={(src) => convertImageFormat(src, format)}
    />
  );
}
