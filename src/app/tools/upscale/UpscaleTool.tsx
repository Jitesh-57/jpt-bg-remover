"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upscaleImage } from "@/lib/upscale-client";
import UnlimitedModal from "@/app/_components/UnlimitedModal";
import SignInModal from "@/app/_components/SignInModal";

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
const ANON_LIMIT = 5;
const ANON_KEY = "jpt_anon_transforms";
const MAX_OUTPUT_PX = 16000;
const HISTORY_MAX = 8;

interface User { name?: string; email?: string; plan?: string }
type Scale = "2x" | "4x";
interface HistItem { dataUrl: string; w: number; h: number; scale: Scale }

async function dims(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = dataUrl;
  });
}

export default function UpscaleTool() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [anonUsed, setAnonUsed] = useState(0);
  const [isWide, setIsWide] = useState(true);

  const [src, setSrc] = useState<string | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);
  const [resultScale, setResultScale] = useState<Scale>("2x");
  const [activeIsHistory, setActiveIsHistory] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [history, setHistory] = useState<HistItem[]>([]);

  const [scale, setScale] = useState<Scale>("2x");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [dragBar, setDragBar] = useState(false);
  const [notice, setNotice] = useState("");

  const [showSignIn, setShowSignIn] = useState(false);
  const [signInReason, setSignInReason] = useState<"default" | "unlimited">("default");
  const [showUnlimited, setShowUnlimited] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const isUnlimited = user?.plan === "unlimited";

  useEffect(() => {
    fetch("/api/auth/google/me").then((r) => r.json()).then((d: { authenticated?: boolean; name?: string; email?: string; plan?: string }) => {
      if (d.authenticated) setUser({ name: d.name, email: d.email, plan: d.plan || "free" });
    }).catch(() => {}).finally(() => setAuthChecked(true));
    try { setAnonUsed(parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0); } catch {}
  }, []);

  useEffect(() => {
    const f = () => setIsWide(window.innerWidth >= 900);
    f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3800);
    return () => clearTimeout(t);
  }, [notice]);

  const anonLeft = Math.max(0, ANON_LIMIT - anonUsed);

  const anonBlocked = useCallback((): boolean => {
    if (!authChecked || user) return false;
    let used = 0;
    try { used = parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0; } catch {}
    if (used >= ANON_LIMIT) { setSignInReason("unlimited"); setShowSignIn(true); return true; }
    return false;
  }, [authChecked, user]);

  const recordAnon = useCallback(() => {
    if (user) return;
    try {
      const used = (parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0) + 1;
      localStorage.setItem(ANON_KEY, String(used));
      setAnonUsed(used);
    } catch {}
  }, [user]);

  const loadImage = useCallback(async (url: string) => {
    setSrc(url);
    setSrcDims(await dims(url));
    setResult(null); setResultDims(null); setActiveIsHistory(false); setShowOriginal(false); setError("");
  }, []);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [loadImage]);

  // Upload another image: if busy, notify; otherwise archive the last result
  // into History and open the new image in the main panel.
  const handleNewUpload = useCallback((file: File | undefined) => {
    if (processing) { setNotice("Your image is still upscaling — please wait, then upload another."); return; }
    if (!file || !file.type.startsWith("image/")) return;
    if (result && resultDims) {
      const entry: HistItem = { dataUrl: result, w: resultDims.w, h: resultDims.h, scale: resultScale };
      setHistory((h) => [entry, ...h].slice(0, HISTORY_MAX));
    }
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result as string);
    reader.readAsDataURL(file);
  }, [processing, result, resultDims, resultScale, loadImage]);

  const openHistory = (i: number) => {
    const item = history[i];
    const rest = history.filter((_, idx) => idx !== i);
    const next = result && resultDims ? [{ dataUrl: result, w: resultDims.w, h: resultDims.h, scale: resultScale }, ...rest].slice(0, HISTORY_MAX) : rest;
    setHistory(next);
    setResult(item.dataUrl); setResultDims({ w: item.w, h: item.h }); setResultScale(item.scale);
    setActiveIsHistory(true); setShowOriginal(false);
  };

  const reset = () => {
    setSrc(null); setSrcDims(null); setResult(null); setResultDims(null); setActiveIsHistory(false); setShowOriginal(false); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const runUpscale = useCallback(async () => {
    if (!src || processing) return;
    setError("");
    if (scale === "4x" && !isUnlimited) {
      if (!user) { setSignInReason("default"); setShowSignIn(true); return; }
      setShowUnlimited(true);
      return;
    }
    if (anonBlocked()) return;

    const factor = scale === "4x" ? 4 : 2;
    if (srcDims && Math.max(srcDims.w, srcDims.h) * factor > MAX_OUTPUT_PX) {
      setError(`Image is too large to upscale ${scale} (output would exceed ${MAX_OUTPUT_PX}px). Try 2× or a smaller image.`);
      return;
    }

    setProcessing(true);
    try {
      const out = await upscaleImage(src, scale);
      setResult(out);
      setResultDims(await dims(out));
      setResultScale(scale);
      setActiveIsHistory(false);
      setShowOriginal(false);
      recordAnon();
    } catch {
      setError("Upscaling failed. Please try a different image.");
    } finally {
      setProcessing(false);
    }
  }, [src, scale, processing, isUnlimited, user, anonBlocked, recordAnon, srcDims]);

  const displaySrc = result ? (showOriginal && !activeIsHistory ? src : result) : src;
  const showingResult = !!result && !(showOriginal && !activeIsHistory);
  const activeDims = showingResult ? resultDims : srcDims;

  const scaleSelector = (
    <div style={{ display: "flex", gap: 10 }}>
      {(["2x", "4x"] as Scale[]).map((sc) => (
        <button key={sc} onClick={() => setScale(sc)} style={{
          position: "relative", flex: 1, padding: "13px 8px", borderRadius: 12,
          border: scale === sc ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
          background: scale === sc ? "#EEF2FF" : "#fff", cursor: "pointer", fontWeight: 800, fontSize: 17,
          color: scale === sc ? "#6366F1" : "#94A3B8",
        }}>
          {sc === "4x" && !isUnlimited && (
            <span style={{ position: "absolute", top: -8, right: -6, background: "linear-gradient(120deg,#7C3AED,#EC4899)", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: "0.06em", borderRadius: 999, padding: "2px 7px", boxShadow: "0 2px 6px rgba(124,58,237,0.4)" }}>PRO</span>
          )}
          {sc}
          <span style={{ display: "block", fontSize: 10.5, fontWeight: 600, marginTop: 2, color: scale === sc ? "#6366F1" : "#AAB2C5" }}>
            {sc === "2x" ? "Enhance · Free" : "Ultra · Pro"}
          </span>
        </button>
      ))}
    </div>
  );

  const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #ECECF6", borderRadius: 18, boxShadow: "0 8px 26px rgba(30,41,90,.05)" };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "left" }}>
      {!src ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 14, padding: "56px 24px", cursor: "pointer", textAlign: "center",
            border: `2px dashed ${drag ? "#6366F1" : "#C7CDF5"}`, borderRadius: 20,
            background: drag ? "#EEF2FF" : "#FAFBFF", transition: "all .15s",
          }}
        >
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
          <span style={{ width: 60, height: 60, borderRadius: 16, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(99,102,241,0.3)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
          </span>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A" }}>Drop an image or click to upload</span>
          <span style={{ fontSize: 14, color: "#6B7280" }}>JPG, PNG, WEBP · upscaled right here, nothing to install</span>
        </label>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 268px 236px" : "1fr", gap: 16, alignItems: "stretch" }}>
            {/* LEFT — image */}
            <div style={{ ...cardStyle, position: "relative", padding: 16, display: "flex", flexDirection: "column", minHeight: 360 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FC", borderRadius: 12, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displaySrc || undefined} alt={showingResult ? "Upscaled" : "Original"} style={{ maxWidth: "100%", maxHeight: 440, objectFit: "contain", display: "block" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: showingResult ? "#059669" : "#64748B" }}>
                  {showingResult ? `Upscaled ${resultScale}` : "Original"}{activeDims ? ` · ${activeDims.w}×${activeDims.h}` : ""}
                </span>
                {result && !activeIsHistory && (
                  <button onClick={() => setShowOriginal((v) => !v)} style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", border: "none", borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}>
                    {showOriginal ? "Show upscaled" : "Show original"}
                  </button>
                )}
              </div>
              {processing && (
                <div style={{ position: "absolute", inset: 16, borderRadius: 12, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{ width: 40, height: 40, border: "3px solid #E0E7FF", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#4338CA" }}>Please wait — upscaling…</span>
                </div>
              )}
            </div>

            {/* MIDDLE — mode + action */}
            <div style={{ ...cardStyle, padding: 18, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Mode</div>
              {scaleSelector}
              {error && <div style={{ marginTop: 12, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, color: "#991B1B", fontWeight: 600 }}>{error}</div>}
              <div style={{ flex: 1, minHeight: 20 }} />
              <button onClick={runUpscale} disabled={processing} className="jpt-hover" style={{ width: "100%", padding: "15px", background: processing ? "#9CA3AF" : GRAD, color: "#fff", border: "none", borderRadius: 13, fontSize: 15.5, fontWeight: 800, cursor: processing ? "not-allowed" : "pointer", boxShadow: "0 8px 22px rgba(99,102,241,0.32)" }}>
                {processing ? "Upscaling…" : scale === "4x" && !isUnlimited ? "🔒 Upscale 4×" : `Upscale ${scale}`}
              </button>
              {showingResult && (
                <a href={result!} download={`upscaled-${resultScale}.png`} className="jpt-hover" style={{ display: "block", width: "100%", marginTop: 10, padding: "13px", background: "#fff", color: "#6366F1", border: "1.5px solid #C7D2FE", borderRadius: 12, fontSize: 14.5, fontWeight: 800, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                  ⬇ Download
                </a>
              )}
              {!user && authChecked && (
                <p style={{ textAlign: "center", fontSize: 11.5, color: "#9AA1B4", margin: "12px 0 0" }}>
                  {anonLeft > 0 ? `${anonLeft} free ${anonLeft === 1 ? "edit" : "edits"} left` : "Free trials used"} · <button onClick={() => { setSignInReason("default"); setShowSignIn(true); }} style={{ background: "none", border: "none", color: "#6366F1", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 11.5 }}>Sign in free</button>
                </p>
              )}
            </div>

            {/* RIGHT — history */}
            <div style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>History <span style={{ color: "#94A3B8", fontWeight: 700 }}>{history.length}</span></span>
              </div>
              {history.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#AAB2C5", fontSize: 12.5, fontWeight: 600, padding: "20px 6px", lineHeight: 1.5 }}>
                  Your upscaled images appear here when you upload another.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {history.map((h, i) => (
                    <button key={i} onClick={() => openHistory(i)} title={`Upscaled ${h.scale} · ${h.w}×${h.h}`} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 10, border: "1px solid #E6E8F2", overflow: "hidden", cursor: "pointer", padding: 0, background: `#F3F4FB center/cover no-repeat url(${h.dataUrl})` }}>
                      <span style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(15,23,42,0.72)", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "1px 6px" }}>{h.scale}</span>
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

      {showSignIn && <SignInModal reason={signInReason} onClose={() => setShowSignIn(false)} />}
      {showUnlimited && (
        <UnlimitedModal
          onClose={() => setShowUnlimited(false)}
          loggedIn={!!user}
          reason="4× upscaling"
          prefillUser={user ? { name: user.name, email: user.email } : undefined}
          onSuccess={() => { setUser((u) => u ? { ...u, plan: "unlimited" } : { plan: "unlimited" }); setShowUnlimited(false); }}
        />
      )}
    </div>
  );
}
