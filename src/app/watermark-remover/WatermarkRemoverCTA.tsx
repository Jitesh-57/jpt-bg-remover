"use client";

import { useCallback, useRef, useState } from "react";

// Where the "Remove Watermark" action sends the visitor. This page captures
// watermark-remover search traffic and hands it off to the recommended tool.
const REMOVER_URL = "https://www.gostudio.ai/watermark-remover?utm_source=jitesh-patil&utm_medium=sjpt";
const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

/**
 * Upload widget for the watermark-remover landing page. The visitor drops or
 * picks an image (shown as a local preview), then clicks "Remove Watermark",
 * which forwards them to the recommended AI watermark remover.
 */
export default function WatermarkRemoverCTA() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const goRemove = useCallback(() => {
    window.location.href = REMOVER_URL;
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {!preview ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "40px 24px", cursor: "pointer", textAlign: "center",
            border: `2px dashed ${drag ? "#6366F1" : "#C7CDF5"}`, borderRadius: 18,
            background: drag ? "#EEF2FF" : "#FafBff", transition: "all .15s",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          <span style={{ width: 54, height: 54, borderRadius: 14, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(99,102,241,0.3)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>Drop an image or click to upload</span>
          <span style={{ fontSize: 13.5, color: "#6B7280" }}>JPG, PNG, WEBP — nothing to install, free to try</span>
        </label>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #E6E8F2", borderRadius: 18, padding: 16, boxShadow: "0 18px 50px rgba(99,102,241,0.12)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your uploaded image" style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 12, display: "block", background: "#F5F6FB" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{fileName}</span>
            <button
              onClick={() => { setPreview(null); setFileName(""); if (inputRef.current) inputRef.current.value = ""; }}
              style={{ fontSize: 13, fontWeight: 700, color: "#6366F1", background: "none", border: "none", cursor: "pointer" }}
            >
              Choose another
            </button>
          </div>
        </div>
      )}

      <button
        onClick={goRemove}
        className="jpt-hover"
        style={{
          marginTop: 18, width: "100%", background: GRAD, color: "#fff", border: "none",
          borderRadius: 14, padding: "16px 28px", fontSize: 17, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 10px 28px rgba(99,102,241,0.35)",
        }}
      >
        Remove Watermark →
      </button>
      <p style={{ fontSize: 12, color: "#9AA1B4", textAlign: "center", margin: "10px 0 0" }}>
        Opens gostudio.ai — our recommended AI watermark remover.
      </p>
    </div>
  );
}
