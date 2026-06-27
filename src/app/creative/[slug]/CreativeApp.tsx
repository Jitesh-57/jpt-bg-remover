"use client";

import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { trackEvent, trackToolUse } from "@/lib/analytics";

const PricingModal = lazy(() => import("@/app/_components/PricingModal"));
const PENDING_KEY = "jpt_creative_pending";

interface Props {
  slug: string;
  prompt: string;
  cta: string;
  badge: string;
  gradient: [string, string];
}

type Status = "idle" | "uploading" | "generating" | "done" | "error";

const MAX_DIM = 1024;

/** Compress a data URL to <=1024px JPEG for fast upload. */
function compress(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function CreativeApp({ slug, prompt, cta, badge, gradient }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [needs, setNeeds] = useState<null | "signin" | "upgrade" | "credits">(null);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingNotice, setPricingNotice] = useState<string | undefined>(undefined);
  const [trialDone, setTrialDone] = useState(false);

  const TRIAL_NOTICE = "You've already used your free trial. Buy credits for more generations and unlock all AI tools.";

  const openPricing = (note?: string) => { setPricingNotice(note); setShowPricing(true); };

  // Restore the photo a user uploaded before being sent to sign-in.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        const { slug: s, img } = JSON.parse(raw);
        if (s === slug && img) setOriginal(img);
        sessionStorage.removeItem(PENDING_KEY);
      }
    } catch { /* ignore */ }
  }, [slug]);

  const pick = () => fileRef.current?.click();

  const onFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null);
    setNeeds(null);
    setMessage("");
    setStatus("idle");
    const dataUrl = await readFile(file);
    setOriginal(await compress(dataUrl));
  };

  const generate = async () => {
    if (!original || status === "uploading" || status === "generating") return;
    setNeeds(null);
    setMessage("");
    trackToolUse(`creative:${slug}`);

    // Try to upload to Supabase to dodge the 4.5MB API body limit; fall back to dataUrl.
    let body: Record<string, unknown> = { dataUrl: original, prompt };
    setStatus("uploading");
    try {
      const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
      const imageUrl = await uploadDataUrlToSupabase(original);
      body = { imageUrl, prompt };
    } catch {
      /* fall back to base64 dataUrl */
    }

    setStatus("generating");
    try {
      const res = await fetch("/api/creative-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { dataUrl?: string; error?: string; upgradeRequired?: boolean; trial?: boolean; trialUsed?: boolean };

      // Not signed in → save the photo and send them to sign-in, then back here.
      if (res.status === 401) { goSignIn(); return; }
      // Free trial already used, or paid feature → open the payment popup.
      if (res.status === 403) { openPricing(data.trialUsed ? TRIAL_NOTICE : undefined); setStatus("idle"); return; }
      if (res.status === 402) { data.upgradeRequired ? openPricing(TRIAL_NOTICE) : setNeeds("credits"); setStatus("idle"); return; }
      if (!res.ok || !data.dataUrl) { setMessage(data.error || "Generation failed. Please try again."); setStatus("error"); return; }

      setResult(data.dataUrl);
      setStatus("done");
      if (data.trial) setTrialDone(true);
      trackEvent("creative_generate_success", { tool: slug, trial: !!data.trial });
    } catch {
      setMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  const goSignIn = () => {
    try {
      if (original) sessionStorage.setItem(PENDING_KEY, JSON.stringify({ slug, img: original }));
    } catch { /* ignore */ }
    trackEvent("creative_signin_prompt", { tool: slug });
    const next = window.location.pathname;
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  const busy = status === "uploading" || status === "generating";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {/* Upload + result panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* INPUT */}
        <div
          onClick={!original ? pick : undefined}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          style={{
            position: "relative", aspectRatio: "1 / 1", borderRadius: 18, overflow: "hidden",
            border: original ? "1px solid #E5E7EB" : "2px dashed #C7D2FE",
            background: original ? "#000" : "#F5F5FF", cursor: original ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
          }}
        >
          {original ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={original} alt="Your upload" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>📂</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#4338CA" }}>Upload your photo</div>
              <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>Click or drag &amp; drop · JPG, PNG, WEBP</div>
            </div>
          )}
          {original && (
            <button onClick={pick}
              style={{ position: "absolute", top: 10, right: 10, padding: "6px 12px", background: "rgba(255,255,255,0.92)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#4338CA" }}>
              Change
            </button>
          )}
        </div>

        {/* OUTPUT */}
        <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 18, overflow: "hidden", border: "1px solid #E5E7EB", background: result ? "#000" : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {result ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="AI result" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <span style={{ position: "absolute", bottom: 12, right: 12, padding: "6px 14px", background: "rgba(99,102,241,0.92)", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 8 }}>{badge}</span>
            </>
          ) : busy ? (
            <div style={{ color: "#fff" }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", margin: "0 auto 14px", animation: "jptspin 0.8s linear infinite" }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{status === "uploading" ? "Uploading…" : "Generating with AI…"}</div>
              <style>{`@keyframes jptspin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.92)", padding: 24 }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Your result appears here</div>
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        {!original ? (
          <button onClick={pick}
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 16, padding: "15px 38px", borderRadius: 14, border: "none", cursor: "pointer", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}>
            📂 Upload Photo to Start
          </button>
        ) : (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={generate} disabled={busy}
              style={{ background: busy ? "#A5B4FC" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 16, padding: "15px 38px", borderRadius: 14, border: "none", cursor: busy ? "default" : "pointer", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}>
              {busy ? "Working…" : result ? "↻ Generate Again" : `${cta} →`}
            </button>
            {result && (
              <a href={result} download={`jpt-${slug}.png`}
                style={{ background: "#0F172A", color: "#fff", fontWeight: 800, fontSize: 16, padding: "15px 30px", borderRadius: 14, textDecoration: "none" }}>
                ⬇ Download
              </a>
            )}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 12.5, color: "#9CA3AF" }}>
          ⚡ Each generation uses 2 credits · your first try is free
        </div>
      </div>

      {/* Free-trial note after a successful trial generation */}
      {trialDone && status === "done" && (
        <Notice color="#4338CA" bg="#EEF2FF">
          🎁 That was your <strong>free trial</strong>. <button onClick={() => openPricing(TRIAL_NOTICE)} style={btnLinkStyle}>Buy credits to unlock all AI tools →</button>
        </Notice>
      )}
      {needs === "credits" && (
        <Notice color="#B45309" bg="#FFFBEB">
          You&apos;re out of credits. <button onClick={() => openPricing("Buy more credits to keep generating and unlock all AI tools.")} style={btnLinkStyle}>Get more credits →</button>
        </Notice>
      )}
      {status === "error" && message && (
        <Notice color="#B91C1C" bg="#FEF2F2">{message}</Notice>
      )}

      {showPricing && (
        <Suspense fallback={null}>
          <PricingModal onClose={() => setShowPricing(false)} notice={pricingNotice} />
        </Suspense>
      )}
    </div>
  );
}

const btnLinkStyle: React.CSSProperties = { background: "none", border: "none", padding: 0, font: "inherit", fontWeight: 800, textDecoration: "underline", color: "inherit", cursor: "pointer" };

function Notice({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div style={{ maxWidth: 560, margin: "18px auto 0", background: bg, color, borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
      {children}
    </div>
  );
}
