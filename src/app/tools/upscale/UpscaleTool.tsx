"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upscaleImage } from "@/lib/upscale-client";
import UnlimitedModal from "@/app/_components/UnlimitedModal";
import SignInModal from "@/app/_components/SignInModal";

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
const ANON_LIMIT = 5;
const ANON_KEY = "jpt_anon_transforms";
const MAX_OUTPUT_PX = 16000;

interface User { name?: string; email?: string; plan?: string }

type Scale = "2x" | "4x";

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

  const [src, setSrc] = useState<string | null>(null);
  const [srcDims, setSrcDims] = useState<{ w: number; h: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState<Scale>("2x");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const [showSignIn, setShowSignIn] = useState(false);
  const [signInReason, setSignInReason] = useState<"default" | "unlimited">("default");
  const [showUnlimited, setShowUnlimited] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isUnlimited = user?.plan === "unlimited";

  useEffect(() => {
    fetch("/api/auth/google/me").then((r) => r.json()).then((d: { authenticated?: boolean; name?: string; email?: string; plan?: string }) => {
      if (d.authenticated) setUser({ name: d.name, email: d.email, plan: d.plan || "free" });
    }).catch(() => {}).finally(() => setAuthChecked(true));
    try { setAnonUsed(parseInt(localStorage.getItem(ANON_KEY) || "0", 10) || 0); } catch {}
  }, []);

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

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(""); setResult(null); setResultDims(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      setSrc(url);
      setSrcDims(await dims(url));
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setSrc(null); setSrcDims(null); setResult(null); setResultDims(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const runUpscale = useCallback(async () => {
    if (!src || processing) return;
    setError("");

    // 4× is a Pro feature: not signed in → sign-in first; signed in but not
    // unlimited → the $5 pricing popup.
    if (scale === "4x" && !isUnlimited) {
      if (!user) { setSignInReason("default"); setShowSignIn(true); return; }
      setShowUnlimited(true);
      return;
    }
    // 2× is a free basic tool — counts toward a guest's 5 trials.
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
      recordAnon();
    } catch {
      setError("Upscaling failed. Please try a different image.");
    } finally {
      setProcessing(false);
    }
  }, [src, scale, processing, isUnlimited, user, anonBlocked, recordAnon, srcDims]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {!src ? (
        /* ── Upload ── */
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
        /* ── Workspace ── */
        <div>
          <div style={{ position: "relative", background: "#F5F6FB", border: "1px solid #E6E8F2", borderRadius: 18, padding: 16, display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 14 }}>
            <figure style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Original" style={{ width: "100%", maxHeight: 340, objectFit: "contain", borderRadius: 12, display: "block", background: "#fff" }} />
              <figcaption style={{ textAlign: "center", fontSize: 12.5, color: "#6B7280", marginTop: 8, fontWeight: 600 }}>Original{srcDims ? ` · ${srcDims.w}×${srcDims.h}` : ""}</figcaption>
            </figure>
            {result && (
              <figure style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result} alt="Upscaled" style={{ width: "100%", maxHeight: 340, objectFit: "contain", borderRadius: 12, display: "block", background: "#fff" }} />
                <figcaption style={{ textAlign: "center", fontSize: 12.5, color: "#059669", marginTop: 8, fontWeight: 700 }}>Upscaled{resultDims ? ` · ${resultDims.w}×${resultDims.h}` : ""}</figcaption>
              </figure>
            )}

            {processing && (
              <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, border: "3px solid #E0E7FF", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: "#4338CA" }}>Please wait — upscaling your image…</span>
              </div>
            )}
          </div>

          {error && <div style={{ marginTop: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13.5, color: "#991B1B", fontWeight: 600 }}>{error}</div>}

          {/* Scale selector */}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {(["2x", "4x"] as Scale[]).map((sc) => (
              <button key={sc} onClick={() => setScale(sc)} style={{
                position: "relative", flex: 1, padding: "14px 8px", borderRadius: 12,
                border: scale === sc ? "2px solid #6366F1" : "1.5px solid #E0E0EE",
                background: scale === sc ? "#EEF2FF" : "#fff", cursor: "pointer", fontWeight: 800, fontSize: 18,
                color: scale === sc ? "#6366F1" : "#94A3B8",
              }}>
                {sc === "4x" && !isUnlimited && (
                  <span style={{ position: "absolute", top: -8, right: -6, background: "linear-gradient(120deg,#7C3AED,#EC4899)", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: "0.06em", borderRadius: 999, padding: "2px 7px", boxShadow: "0 2px 6px rgba(124,58,237,0.4)" }}>PRO</span>
                )}
                {sc}
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, marginTop: 2, color: scale === sc ? "#6366F1" : "#AAB2C5" }}>
                  {sc === "2x" ? "Enhance · Free" : "Ultra · Pro"}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {!result ? (
              <button onClick={runUpscale} disabled={processing} className="jpt-hover" style={{ flex: 1, minWidth: 200, padding: "16px", background: processing ? "#9CA3AF" : GRAD, color: "#fff", border: "none", borderRadius: 14, fontSize: 16.5, fontWeight: 800, cursor: processing ? "not-allowed" : "pointer", boxShadow: "0 10px 26px rgba(99,102,241,0.35)" }}>
                {processing ? "Upscaling…" : scale === "4x" && !isUnlimited ? "🔒 Upscale 4× — Go Unlimited" : `🔍 Upscale ${scale}`}
              </button>
            ) : (
              <>
                <a href={result} download={`upscaled-${scale}.png`} className="jpt-hover" style={{ flex: 1, minWidth: 180, padding: "16px", background: GRAD, color: "#fff", borderRadius: 14, fontSize: 16, fontWeight: 800, textAlign: "center", textDecoration: "none", boxShadow: "0 10px 26px rgba(99,102,241,0.35)" }}>
                  ⬇ Download upscaled image
                </a>
                <button onClick={() => { setResult(null); setResultDims(null); }} style={{ padding: "16px 20px", background: "#fff", color: "#6366F1", border: "1.5px solid #C7D2FE", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                  Upscale again
                </button>
              </>
            )}
            <button onClick={reset} style={{ padding: "16px 18px", background: "none", color: "#94A3B8", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Start over
            </button>
          </div>

          {!user && authChecked && (
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#9AA1B4", margin: "14px 0 0" }}>
              {anonLeft > 0 ? `${anonLeft} free ${anonLeft === 1 ? "edit" : "edits"} left — ` : ""}
              <button onClick={() => { setSignInReason("default"); setShowSignIn(true); }} style={{ background: "none", border: "none", color: "#6366F1", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12.5 }}>Sign in free</button> to keep using the basic tools.
            </p>
          )}
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
