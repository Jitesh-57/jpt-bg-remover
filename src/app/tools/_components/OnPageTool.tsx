"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignInModal from "@/app/_components/SignInModal";

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
const ANON_LIMIT = 5;
const ANON_KEY = "jpt_anon_transforms";
const HISTORY_MAX = 8;

interface HistItem { dataUrl: string; w: number; h: number; tag: string }

async function dims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = dataUrl;
  });
}

function extOf(dataUrl: string) {
  return dataUrl.includes("image/png") ? "png" : dataUrl.includes("image/webp") ? "webp" : "jpg";
}

interface Props {
  /** Short verb for the primary button, e.g. "Compress image". */
  actionLabel: string;
  /** Tool-specific option UI shown in the "Mode" panel. */
  controls: React.ReactNode;
  /** Transform the source image using the current options. */
  onTransform: (src: string) => Promise<string>;
  /** Short label for the current settings (shown on the result + history), e.g. "PNG" or "70%". */
  resultTag?: string;
  /** Download filename base (extension is derived from the output). */
  downloadBase?: string;
  /** Disable the action (e.g. no format chosen). */
  disabled?: boolean;
  /** Label for the Mode panel header. */
  modeLabel?: string;
}

/**
 * Shared "do it on the page" tool shell: upload → transform → download, with a
 * 3-column layout (image · options+action · history), an upload-another bar
 * that moves the last result into history, a busy notice, and the guest
 * 5-trial → sign-in gate. Free basic tools only (no Pro gate).
 */
export default function OnPageTool({ actionLabel, controls, onTransform, resultTag, downloadBase = "jpt", disabled, modeLabel = "Options" }: Props) {
  const [user, setUser] = useState<{ name?: string; email?: string; plan?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [anonUsed, setAnonUsed] = useState(0);
  const [isWide, setIsWide] = useState(true);

  const [src, setSrc] = useState<string | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);
  const [resultTagState, setResultTagState] = useState("");
  const [activeIsHistory, setActiveIsHistory] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [history, setHistory] = useState<HistItem[]>([]);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [dragBar, setDragBar] = useState(false);
  const [notice, setNotice] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/google/me").then((r) => r.json()).then((d: { authenticated?: boolean; name?: string; email?: string; plan?: string }) => {
      if (d.authenticated) setUser({ name: d.name, email: d.email, plan: d.plan || "free" });
    }).catch(() => {}).finally(() => setAuthChecked(true));
    try { setAnonUsed(parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0); } catch {}
  }, []);
  useEffect(() => { const f = () => setIsWide(window.innerWidth >= 900); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(""), 3800); return () => clearTimeout(t); }, [notice]);

  const anonLeft = Math.max(0, ANON_LIMIT - anonUsed);
  const anonBlocked = useCallback((): boolean => {
    if (!authChecked || user) return false;
    let used = 0;
    try { used = parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0; } catch {}
    if (used >= ANON_LIMIT) { setShowSignIn(true); return true; }
    return false;
  }, [authChecked, user]);
  const recordAnon = useCallback(() => {
    if (user) return;
    try { const used = (parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0) + 1; localStorage.setItem(ANON_KEY, String(used)); setAnonUsed(used); } catch {}
  }, [user]);

  const loadImage = useCallback(async (url: string) => {
    setSrc(url); setSrcDims(await dims(url));
    setResult(null); setResultDims(null); setActiveIsHistory(false); setShowOriginal(false); setError("");
  }, []);
  const handleFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload = () => loadImage(r.result as string); r.readAsDataURL(file);
  }, [loadImage]);

  const handleNewUpload = useCallback((file: File | undefined) => {
    if (processing) { setNotice(`Your image is still processing — please wait, then upload another.`); return; }
    if (!file || !file.type.startsWith("image/")) return;
    if (result && resultDims) setHistory((h) => [{ dataUrl: result, w: resultDims.w, h: resultDims.h, tag: resultTagState }, ...h].slice(0, HISTORY_MAX));
    const r = new FileReader(); r.onload = () => loadImage(r.result as string); r.readAsDataURL(file);
  }, [processing, result, resultDims, resultTagState, loadImage]);

  const openHistory = (i: number) => {
    const item = history[i];
    const rest = history.filter((_, idx) => idx !== i);
    const next = result && resultDims ? [{ dataUrl: result, w: resultDims.w, h: resultDims.h, tag: resultTagState }, ...rest].slice(0, HISTORY_MAX) : rest;
    setHistory(next);
    setResult(item.dataUrl); setResultDims({ w: item.w, h: item.h }); setResultTagState(item.tag);
    setActiveIsHistory(true); setShowOriginal(false);
  };

  const reset = () => { setSrc(null); setSrcDims(null); setResult(null); setResultDims(null); setActiveIsHistory(false); setShowOriginal(false); setError(""); if (inputRef.current) inputRef.current.value = ""; };

  const run = async () => {
    if (!src || processing || disabled) return;
    if (anonBlocked()) return;
    setProcessing(true); setError("");
    try {
      const out = await onTransform(src);
      setResult(out); setResultDims(await dims(out)); setResultTagState(resultTag || "");
      setActiveIsHistory(false); setShowOriginal(false); recordAnon();
    } catch { setError("Something went wrong. Please try another image."); }
    finally { setProcessing(false); }
  };

  const displaySrc = result ? (showOriginal && !activeIsHistory ? src : result) : src;
  const showingResult = !!result && !(showOriginal && !activeIsHistory);
  const activeDims = showingResult ? resultDims : srcDims;
  const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #ECECF6", borderRadius: 18, boxShadow: "0 8px 26px rgba(30,41,90,.05)" };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "left" }}>
      {!src ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "56px 24px", cursor: "pointer", textAlign: "center", border: `2px dashed ${drag ? "#6366F1" : "#C7CDF5"}`, borderRadius: 20, background: drag ? "#EEF2FF" : "#FAFBFF", transition: "all .15s" }}
        >
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
          <span style={{ width: 60, height: 60, borderRadius: 16, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(99,102,241,0.3)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
          </span>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A" }}>Drop an image or click to upload</span>
          <span style={{ fontSize: 14, color: "#6B7280" }}>JPG, PNG, WEBP · done right here, nothing to install</span>
        </label>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 268px 236px" : "1fr", gap: 16, alignItems: "stretch" }}>
            {/* LEFT — image */}
            <div style={{ ...cardStyle, position: "relative", padding: 16, display: "flex", flexDirection: "column", minHeight: 360 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FC", borderRadius: 12, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displaySrc || undefined} alt={showingResult ? "Result" : "Original"} style={{ maxWidth: "100%", maxHeight: 440, objectFit: "contain", display: "block" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: showingResult ? "#059669" : "#64748B" }}>
                  {showingResult ? `Result${resultTagState ? ` · ${resultTagState}` : ""}` : "Original"}{activeDims ? ` · ${activeDims.w}×${activeDims.h}` : ""}
                </span>
                {result && !activeIsHistory && (
                  <button onClick={() => setShowOriginal((v) => !v)} style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "none", borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}>
                    {showOriginal ? "Show result" : "Show original"}
                  </button>
                )}
              </div>
              {processing && (
                <div style={{ position: "absolute", inset: 16, borderRadius: 12, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{ width: 40, height: 40, border: "3px solid #E0E7FF", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#4338CA" }}>Please wait — processing…</span>
                </div>
              )}
            </div>

            {/* MIDDLE — options + action */}
            <div style={{ ...cardStyle, padding: 18, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>{modeLabel}</div>
              {controls}
              {error && <div style={{ marginTop: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, color: "#991B1B", fontWeight: 600 }}>{error}</div>}
              <div style={{ flex: 1, minHeight: 20 }} />
              <button onClick={run} disabled={processing || disabled} className="jpt-hover" style={{ width: "100%", padding: "15px", background: processing || disabled ? "#9CA3AF" : GRAD, color: "#fff", border: "none", borderRadius: 13, fontSize: 15.5, fontWeight: 800, cursor: processing || disabled ? "not-allowed" : "pointer", boxShadow: "0 8px 22px rgba(99,102,241,0.32)" }}>
                {processing ? "Processing…" : actionLabel}
              </button>
              {showingResult && (
                <a href={result!} download={`${downloadBase}.${extOf(result!)}`} className="jpt-hover" style={{ display: "block", width: "100%", marginTop: 10, padding: "13px", background: "#fff", color: "#6366F1", border: "1.5px solid #C7D2FE", borderRadius: 12, fontSize: 14.5, fontWeight: 800, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                  ⬇ Download
                </a>
              )}
              {!user && authChecked && (
                <p style={{ textAlign: "center", fontSize: 11.5, color: "#9AA1B4", margin: "12px 0 0" }}>
                  {anonLeft > 0 ? `${anonLeft} free ${anonLeft === 1 ? "edit" : "edits"} left` : "Free trials used"} · <button onClick={() => setShowSignIn(true)} style={{ background: "none", border: "none", color: "#6366F1", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 11.5 }}>Sign in free</button>
                </p>
              )}
            </div>

            {/* RIGHT — history */}
            <div style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>History <span style={{ color: "#94A3B8", fontWeight: 700 }}>{history.length}</span></span>
              {history.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#AAB2C5", fontSize: 12.5, fontWeight: 600, padding: "20px 6px", lineHeight: 1.5 }}>
                  Your results appear here when you upload another image.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {history.map((h, i) => (
                    <button key={i} onClick={() => openHistory(i)} title={`${h.tag} · ${h.w}×${h.h}`} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 10, border: "1px solid #E6E8F2", overflow: "hidden", cursor: "pointer", padding: 0, background: `#F3F4FB center/cover no-repeat url(${h.dataUrl})` }}>
                      {h.tag && <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(15,23,42,0.72)", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "1px 6px" }}>{h.tag}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM — upload another */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragBar(true); }}
            onDragLeave={() => setDragBar(false)}
            onDrop={(e) => { e.preventDefault(); setDragBar(false); handleNewUpload(e.dataTransfer.files?.[0]); }}
            style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", border: `1.5px dashed ${dragBar ? "#6366F1" : "#D8DCEE"}`, borderRadius: 14, padding: "16px 20px", background: dragBar ? "#EEF2FF" : "#FBFBFE" }}
          >
            <input ref={bottomInputRef} type="file" accept="image/*" onChange={(e) => { handleNewUpload(e.target.files?.[0]); if (bottomInputRef.current) bottomInputRef.current.value = ""; }} style={{ display: "none" }} />
            <button onClick={() => bottomInputRef.current?.click()} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "12px 22px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
              Upload image
            </button>
            <span style={{ fontSize: 13.5, color: "#9AA1B4", fontWeight: 600 }}>or just drop here</span>
            <button onClick={reset} style={{ marginLeft: "auto", background: "none", border: "none", color: "#94A3B8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clear</button>
          </div>
        </>
      )}

      {notice && (
        <div style={{ position: "fixed", top: 74, left: "50%", transform: "translateX(-50%)", zIndex: 10000, background: "#0F172A", color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, boxShadow: "0 12px 34px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 10, maxWidth: "92vw" }}>
          <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          {notice}
        </div>
      )}
      {showSignIn && <SignInModal reason="unlimited" onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
