"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// Fully client-side QR generator — nothing is uploaded or sent to a server.
// Renders to a PNG data URL for preview/download and can also export SVG.

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
type EC = "L" | "M" | "Q" | "H";

export default function QrGenerator() {
  const [text, setText] = useState("https://www.sjpt.io");
  const [fg, setFg] = useState("#111827");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [ec, setEc] = useState<EC>("M");
  const [pngUrl, setPngUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const value = text.trim();
    if (!value) {
      setPngUrl("");
      setError("");
      return;
    }
    debounce.current = setTimeout(() => {
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: ec,
        color: { dark: fg, light: bg },
      })
        .then((url) => {
          setPngUrl(url);
          setError("");
        })
        .catch(() => setError("Couldn't generate a QR code for that input — try shorter text."));
    }, 200);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [text, fg, bg, size, ec]);

  const downloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "qr-code.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadSvg = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      const svg = await QRCode.toString(value, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: ec,
        color: { dark: fg, light: bg },
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-code.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't export SVG for that input.");
    }
  };

  const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid #E5E7EB",
    fontSize: 14, color: "#111827", background: "#fff", outline: "none",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,320px)", gap: 28, alignItems: "start" }} className="qr-grid">
      {/* Controls */}
      <div style={{ background: "#fff", border: "1px solid #EAECF5", borderRadius: 18, padding: "22px 22px 24px" }}>
        <label style={label} htmlFor="qr-text">Text or URL</label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Paste a link, or type any text…"
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", marginBottom: 18 }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div>
            <label style={label} htmlFor="qr-fg">Foreground</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input id="qr-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)} style={{ width: 40, height: 38, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>{fg}</span>
            </div>
          </div>
          <div>
            <label style={label} htmlFor="qr-bg">Background</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input id="qr-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} style={{ width: 40, height: 38, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>{bg}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={label} htmlFor="qr-size">Size: {size}px</label>
            <input id="qr-size" type="range" min={128} max={1024} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366F1" }} />
          </div>
          <div>
            <label style={label} htmlFor="qr-ec">Error correction</label>
            <select id="qr-ec" value={ec} onChange={(e) => setEc(e.target.value as EC)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: "#DC2626", fontSize: 13, fontWeight: 600, marginTop: 16 }}>{error}</p>}
      </div>

      {/* Preview + download */}
      <div style={{ background: "#F8F9FC", border: "1px solid #EAECF5", borderRadius: 18, padding: 22, textAlign: "center", position: "sticky", top: 20 }}>
        <div style={{ background: bg, borderRadius: 14, padding: 16, display: "inline-block", minWidth: 180, minHeight: 180, boxShadow: "0 6px 20px rgba(15,23,42,0.08)" }}>
          {pngUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngUrl} alt="Your QR code" style={{ width: "100%", maxWidth: 240, height: "auto", display: "block" }} />
          ) : (
            <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
              Type something to generate
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <button
            onClick={downloadPng}
            disabled={!pngUrl}
            className="jpt-hover"
            style={{ background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "12px 18px", fontSize: 15, fontWeight: 800, cursor: pngUrl ? "pointer" : "not-allowed", opacity: pngUrl ? 1 : 0.5, boxShadow: "0 8px 22px rgba(99,102,241,0.28)" }}
          >
            Download PNG
          </button>
          <button
            onClick={downloadSvg}
            disabled={!pngUrl}
            style={{ background: "#fff", color: "#334155", border: "1px solid #E5E7EB", borderRadius: 11, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: pngUrl ? "pointer" : "not-allowed", opacity: pngUrl ? 1 : 0.5 }}
          >
            Download SVG
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 14, lineHeight: 1.5 }}>
          Generated in your browser — nothing is uploaded.
        </p>
      </div>

      <style>{`@media (max-width: 720px){ .qr-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
