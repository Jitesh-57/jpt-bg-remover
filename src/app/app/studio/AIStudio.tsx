"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { acceptImageFile, toSendable } from "../_components/studio";
import { takeEditorHandoff } from "../_components/handoff";
import { CREDIT_COST } from "@/lib/plans";
import { onCreditsChanged, publishCredits } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { parseJsonResponse } from "@/lib/upload-prep";
import { userMessage } from "@/lib/user-message";
import { trackEvent } from "@/lib/analytics";

/**
 * Pixel Shine AI Studio — describe the outcome, check what we understood,
 * generate, then keep refining the same image in plain words.
 *
 * Every generation becomes a version built on the one before it, so "make it
 * darker" after "put it in a luxury hotel" means the hotel. Any version can be
 * picked up again, compared with the original, or downloaded.
 */

interface Version { id: string; src: string; url?: string; label: string; prompt: string }
interface Understood { label: string; value: string }
interface Intent {
  locked?: boolean;
  source?: "ai" | "rules";
  why?: string;
  understood: Understood[];
  prompt: string;
  question?: string;
  options?: string[];
  suggestions: string[];
  detected?: string[];
  recommended?: { label: string; prompt: string }[];
}

const STAGES = ["Preparing your image…", "Understanding the composition…", "Applying your changes…", "Generating the result…", "Finalizing details…"];
const STARTERS = [
  "Make this product photo look premium",
  "Turn this selfie into a professional headshot",
  "Remove the background and add a luxury studio",
  "Change the outfit to a black formal suit",
  "Make it golden hour lighting",
  "Restore and sharpen this old photo",
];
const CONTINUE = [
  { label: "Remove background", prompt: "Remove the background completely and place the subject on a pure white background. Keep the subject exactly as it is, with clean edges." },
  { label: "Upscale & sharpen", prompt: "Increase sharpness and fine detail as if upscaled to high resolution, reduce noise and artefacts. Change nothing else." },
  { label: "Social post 4:5", prompt: "Recompose this image as a clean, eye-catching 4:5 social media post with balanced negative space. Keep the subject unchanged." },
  { label: "Cinematic look", prompt: "Give the image a cinematic colour grade with gentle contrast and filmic tones. Keep people and products unchanged." },
];

function toolName(slug: string | null): string | null {
  if (!slug) return null;
  return slug.split("-").map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ");
}

async function download(src: string, name: string) {
  trackEvent("download_clicked", { tool: "ai-studio" });
  try {
    const blob = await (await fetch(src)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    window.open(src, "_blank");
  }
}

/* ── Before / after slider ─────────────────────────────────────────────── */
function Compare({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", userSelect: "none", touchAction: "pan-y" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Result" style={img} draggable={false} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Original" style={img} draggable={false} />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#fff", transform: "translateX(-1px)", boxShadow: "0 0 10px rgba(0,0,0,.4)", pointerEvents: "none" }}>
        <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "#fff", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, boxShadow: "0 2px 10px rgba(0,0,0,.35)" }}>‹ ›</span>
      </div>
      <span style={{ ...tag, left: 10 }}>Original</span>
      <span style={{ ...tag, right: 10 }}>Result</span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare original and result"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", margin: 0 }} />
    </div>
  );
}

/* ── Scanning effect over the photo while it's being read ───────────────── */
const SCAN_TEXT = {
  analyze: ["Scanning your photo…", "Finding the subject…", "Reading light and colour…", "Spotting what could be better…", "Preparing ideas for you…"],
  reading: ["Understanding your request…", "Mapping it onto your photo…", "Planning the edit…"],
};
const DOTS = [[22, 30], [68, 24], [40, 58], [76, 66], [30, 80]];

function ScanOverlay({ mode }: { mode: "analyze" | "reading" }) {
  const lines = SCAN_TEXT[mode];
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 1400);
    return () => clearInterval(t);
  }, [lines]);
  return (
    <div className="jpt-scan" aria-live="polite" role="status">
      <div className="jpt-scan-grid" />
      <div className="jpt-scan-beam" />
      {DOTS.map(([x, y], k) => (
        <span key={k} className="jpt-scan-dot" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${k * 0.35}s` }} />
      ))}
      {(["tl", "tr", "bl", "br"] as const).map((c) => <span key={c} className={`jpt-scan-corner ${c}`} />)}
      <div className="jpt-scan-pill">
        <span className="jpt-spin" style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", flexShrink: 0 }} />
        <span key={i} className="jpt-a-pop">{lines[i]}</span>
      </div>
    </div>
  );
}

export default function AIStudio() {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [tool, setTool] = useState<string | null>(null);

  const [original, setOriginal] = useState<{ src: string; url?: string; name: string; w: number; h: number } | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [current, setCurrent] = useState(-1); // -1 = original
  const [view, setView] = useState<"image" | "compare">("image");

  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"idle" | "reading" | "review" | "generating">("idle");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [analysis, setAnalysis] = useState<Intent | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [model, setModel] = useState<"gpt-image" | "nano-banana" | "seedream-v45">("gpt-image");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { try { setIsAdmin(!!localStorage.getItem("jpt-admin-token")); } catch {} }, []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // What an account without credits has left of its free smart reading: one photo analysis, one try.
  const [allow, setAllow] = useState<{ analyze: boolean; tries: number } | null>(null);
  const [unlock, setUnlock] = useState(false);
  useEffect(() => {
    void fetch("/api/ai/intent").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d && !d.paid) setAllow({ analyze: !!d.analyze, tries: Number(d.tries) || 0 });
    }).catch(() => {});
  }, []);
  const paid = credits > 0;
  const gate = useRef({ paid, allow });
  gate.current = { paid, allow };
  const askForCredits = () => { setUnlock(true); setPhase("idle"); openPricing("AI Studio smart reading"); };
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);
  useEffect(() => { setTool(toolName(new URLSearchParams(location.search).get("tool"))); }, []);

  const shown = current >= 0 ? versions[current] : null;
  const shownSrc = shown?.src ?? original?.src ?? null;
  const history = useMemo(() => versions.slice(0, current + 1).map((v) => v.label), [versions, current]);

  // Stages advance on a timer: honest "still working" feedback, never a fake percentage.
  useEffect(() => {
    if (phase !== "generating") return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 5000);
    return () => clearInterval(t);
  }, [phase]);

  /* Upload ------------------------------------------------------------- */
  const load = useCallback(async (src: string, name: string) => {
    const dims = await new Promise<{ w: number; h: number }>((res) => {
      const i = new Image();
      i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = () => res({ w: 0, h: 0 });
      i.src = src;
    });
    setOriginal({ src, name, ...dims });
    setVersions([]);
    setCurrent(-1);
    setView("image");
    setIntent(null);
    setPhase("idle");
    setErr(null);
    setSuggestions([]);
    trackEvent("image_uploaded", { tool: "ai-studio" });

    // Upload once (so every later call sends a URL, not megabytes), then read the photo.
    setAnalysis(null);
    const g = gate.current;
    if (!g.paid && g.allow && !g.allow.analyze) { setUnlock(true); return; } // free analysis already used: no scan
    setAnalyzing(true);
    try {
      const sent = await toSendable(src);
      const url = sent.imageUrl;
      if (url) setOriginal((o) => (o && o.src === src ? { ...o, url } : o));
      const r = await fetch("/api/ai/intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "analyze", tool, image: url || sent.dataUrl }),
      });
      if (r.ok) {
        const d = (await r.json()) as Intent;
        if (d.locked) setUnlock(true); else setAnalysis(d);
        if (!g.paid) setAllow((a) => (a ? { ...a, analyze: false } : a));
      }
    } catch { /* analysis is a nicety */ }
    finally { setAnalyzing(false); }
  }, [tool]);

  useEffect(() => {
    void takeEditorHandoff().then((h) => {
      if (h?.image) void load(h.image, "photo");
      if (h?.prompt) setText(h.prompt);
    });
  }, [load]);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    try { await load(await acceptImageFile(f), f.name); } catch (e) { setErr((e as Error).message); }
  };

  /* Understand --------------------------------------------------------- */
  const sourceFor = async (from = current): Promise<string> => {
    const v = from >= 0 ? versions[from] : null;
    if (v?.url) return v.url;
    if (!v && original?.url) return original.url;
    const sent = await toSendable(v?.src ?? original!.src);
    return sent.imageUrl || sent.dataUrl || "";
  };

  const understand = async (request: string) => {
    const r = request.trim();
    if (!r || !original || phase === "reading" || phase === "generating") return;
    if (!paid && allow && allow.tries <= 0) { askForCredits(); return; }
    setPhase("reading");
    setErr(null);
    trackEvent("ai_command_started", { tool: "ai-studio" });
    try {
      const image = await sourceFor();
      const res = await fetch("/api/ai/intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: r, tool, history, image }),
      });
      if (res.status === 401) { await beginGoogleSignIn("/app/studio"); return; }
      const d = (await res.json()) as Intent & { error?: string };
      if (!res.ok || d.error) throw new Error(d.error || "We couldn't read that request. Please try again.");
      if (!paid) setAllow((a) => (a ? { ...a, tries: Math.max(0, a.tries - 1) } : a));
      if (d.locked) { askForCredits(); return; }
      setIntent({ ...d, understood: d.understood?.length ? d.understood : [{ label: "Change", value: r }] });
      setPhase("review");
      trackEvent("intent_detected", { tool: "ai-studio", clarify: !!d.question });
    } catch (e) {
      setErr((e as Error).message);
      setPhase("idle");
    }
  };

  const direct = async (label: string, prompt: string) => {
    trackEvent("suggestion_clicked", { tool: "ai-studio", label });
    if (!paid && allow && allow.tries <= 0) { askForCredits(); return; }
    setText(label);
    setErr(null);
    // A short read on the photo, so picking an option feels considered rather than instant.
    setPhase("reading");
    if (!paid) {
      try {
        const r = await fetch("/api/ai/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "pick" }) });
        const d = (await r.json()) as { locked?: boolean };
        setAllow((a) => (a ? { ...a, tries: Math.max(0, a.tries - 1) } : a));
        if (d.locked) { askForCredits(); return; }
      } catch { /* let them try; the next read is checked on the server */ }
    }
    setTimeout(() => {
      setIntent({ understood: [{ label: "Action", value: label }, { label: "Keep", value: "Everything else as it is" }], prompt, suggestions: [] });
      setPhase("review");
    }, 1300);
  };

  /* Generate ----------------------------------------------------------- */
  const generate = async (prompt = intent?.prompt, label = text.trim() || "Edit", from = current) => {
    if (!prompt || !original) return;
    if (credits < CREDIT_COST) { openPricing("AI Studio"); return; }
    setPhase("generating");
    setErr(null);
    trackEvent("generation_started", { tool: "ai-studio" });
    try {
      const image = await sourceFor(from);
      const res = await fetch("/api/edit-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt, model }),
      });
      type Body = { dataUrl?: string; resultUrl?: string; error?: string; credits?: number; upgradeRequired?: boolean };
      let d: Body = {};
      try { d = await parseJsonResponse<Body>(res); } catch (e) { d = { error: (e as Error).message }; }
      if (typeof d.credits === "number") { setCredits(d.credits); publishCredits(d.credits); }
      if (res.status === 401) { await beginGoogleSignIn("/app/studio"); setPhase("review"); return; }
      if (res.status === 402 || res.status === 403 || d.upgradeRequired) { openPricing("AI Studio"); setPhase("review"); return; }
      if (!res.ok || !d.dataUrl) throw new Error(userMessage(d.error, "We couldn't generate this image this time."));

      const v: Version = { id: `${Date.now()}`, src: d.resultUrl || d.dataUrl, url: d.resultUrl, label: label.length > 48 ? `${label.slice(0, 45)}…` : label, prompt };
      // A new edit from an older version starts a new branch from there.
      setVersions((prev) => [...prev.slice(0, from + 1), v]);
      setCurrent(from + 1);
      setView("image");
      setSuggestions(intent?.suggestions?.length ? intent.suggestions : analysis?.suggestions ?? []);
      setIntent(null);
      setText("");
      setPhase("idle");
      trackEvent("generation_completed", { tool: "ai-studio" });
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      setErr((e as Error).message || "We couldn't generate this image this time.");
      setPhase("review");
      trackEvent("generation_failed", { tool: "ai-studio" });
    }
  };

  const variation = () => {
    if (!shown) return;
    trackEvent("variation_created", { tool: "ai-studio" });
    // Same request, from the image this version was made from; lands as the next version.
    void generate(`${shown.prompt} Create a fresh variation with different fine details.`, `${shown.label} (variation)`, current - 1);
  };

  const busy = phase === "reading" || phase === "generating";

  /* ── UI ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: "22px 24px 60px" }}>
      <div style={{ maxWidth: 1500 }}>
        <div className="jpt-a-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,2.6vw,1.9rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
              AI Studio <span style={{ fontSize: 11, fontWeight: 900, verticalAlign: "middle", color: "#fff", background: "var(--grad-strong)", borderRadius: 6, padding: "3px 7px", marginLeft: 6 }}>NEW</span>
            </h1>
            <p style={{ margin: "5px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Tell Pixel Shine what you want. It handles the rest, and you can keep refining.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
            {tool && <span style={chip}>{tool}</span>}
            <span style={chip}><Icon name="zap" size={13} /> {credits} credits</span>
          </div>
        </div>

        <div className="jpt-studio-grid">
          {/* Workspace */}
          <section className="jpt-a-up" style={{ ["--d" as string]: "60ms", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); void pick(e.dataTransfer.files?.[0]); }}
              style={{ position: "relative", borderRadius: 20, border: `1px ${original ? "solid" : "dashed"} ${dragOver ? "var(--accent)" : "var(--border-strong)"}`, background: "var(--bg-elevated)", minHeight: 420, height: "min(68vh, 680px)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", containerType: "size" }}
            >
              {!original ? (
                <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", textAlign: "center", padding: 30, fontFamily: "inherit" }}>
                  <span style={{ width: 64, height: 64, borderRadius: 18, background: "var(--grad-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "var(--glow)" }}><Icon name="upload" size={28} /></span>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 16 }}>Drop your image here</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>or <span style={{ color: "var(--accent)", fontWeight: 800 }}>choose an image</span> · JPG, PNG or WebP</div>
                </button>
              ) : view === "compare" && shown ? (
                <Compare before={original.src} after={shown.src} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <div style={dims
                  ? { position: "relative", width: `min(100cqw, calc(100cqh * ${dims.w / dims.h}))`, aspectRatio: `${dims.w} / ${dims.h}` }
                  : { position: "absolute", inset: 0 }}>
                  <img src={shownSrc!} alt={shown ? shown.label : "Your photo"}
                    onLoad={(e) => { const t = e.currentTarget; if (t.naturalWidth) setDims({ w: t.naturalWidth, h: t.naturalHeight }); }}
                    style={{ ...img, objectFit: "contain", filter: phase === "generating" ? "brightness(.55) blur(1px)" : undefined, transition: "filter .3s" }} />
                  {(analyzing || phase === "reading") && <ScanOverlay mode={analyzing && phase !== "reading" ? "analyze" : "reading"} />}
                </div>
              )}

              {phase === "generating" && (
                <div role="status" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff", textAlign: "center", padding: 20 }}>
                  <span className="jpt-spin" style={{ width: 38, height: 38, borderRadius: "50%", border: "3px solid rgba(255,255,255,.25)", borderTopColor: "#fff" }} />
                  <div key={stage} className="jpt-a-up" style={{ fontSize: 16, fontWeight: 800 }}>{STAGES[stage]}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.75 }}>Usually 10 to 40 seconds</div>
                </div>
              )}

              {original && (
                <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", pointerEvents: "none" }}>
                  <div style={{ display: "flex", background: "rgba(10,10,14,.7)", backdropFilter: "blur(8px)", borderRadius: 11, padding: 3, pointerEvents: "auto" }}>
                    <button onClick={() => { setView("image"); }} style={{ ...seg, ...(view === "image" ? segOn : {}) }}>{shown ? "Result" : "Original"}</button>
                    <button onClick={() => shown && setView("compare")} disabled={!shown} style={{ ...seg, ...(view === "compare" ? segOn : {}), opacity: shown ? 1 : 0.45 }}>Compare</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, pointerEvents: "auto" }}>
                    {shown && <button onClick={() => void download(shown.src, `pixelshine-${shown.id}.png`)} style={{ ...seg, ...segOn }}><Icon name="download" size={14} /> Download</button>}
                    <button onClick={() => fileRef.current?.click()} style={{ ...seg, background: "rgba(10,10,14,.7)", backdropFilter: "blur(8px)" }}>Replace</button>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>

            {/* Version history */}
            {original && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-faint)", flexShrink: 0 }}>History</span>
                {[{ id: "o", src: original.src, label: "Original" }, ...versions].map((v, i) => {
                  const idx = i - 1;
                  const on = idx === current;
                  return (
                    <button key={v.id} onClick={() => { setCurrent(idx); setView("image"); }} title={v.label} disabled={busy}
                      style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: 4, paddingRight: 10, borderRadius: 11, border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.src} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }} />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{idx < 0 ? "Original" : `V${idx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Assistant panel */}
          <aside className="jpt-a-up" style={{ ["--d" as string]: "120ms", minWidth: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* After upload: what we see */}
            {original && !shown && (analyzing || analysis?.detected?.length || analysis?.recommended?.length) ? (
              <div className="jpt-a-up">
                {(analyzing || !!analysis?.detected?.length) && <div style={eyebrow}>We detected</div>}
                {analyzing ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[70, 90, 60].map((w, i) => <span key={i} className="jpt-skel" style={{ width: w, height: 26, borderRadius: 999 }} />)}</div>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{analysis?.detected?.map((d, k) => <span key={d} className="jpt-a-pop" style={{ ...chip, ["--d" as string]: `${k * 90}ms` }}>{d}</span>)}</div>
                )}
                {!!analysis?.recommended?.length && (
                  <>
                    <div style={{ ...eyebrow, marginTop: 14 }}>Recommended</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {analysis.recommended.map((r, k) => (
                        <button key={r.label} onClick={() => void direct(r.label, r.prompt)} disabled={busy} className="jpt-lift jpt-a-up" style={{ ...card, ["--d" as string]: `${250 + k * 90}ms` }}>
                          <Icon name="wand" size={15} /> {r.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* The ask */}
            <div>
              <div style={eyebrow}>{shown ? "What would you like to change?" : "What do you want to create?"}</div>
              <div style={{ position: "relative" }}>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => { setText(e.target.value.slice(0, 2000)); if (phase === "review") setPhase("idle"); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void understand(text); } }}
                  rows={3}
                  disabled={!original || busy}
                  placeholder={!original ? "Upload an image first" : shown ? "e.g. Make the background darker and add a soft shadow" : analysis?.suggestions?.[0] ? `e.g. ${analysis.suggestions[0]}` : "Describe what you'd like to create"}
                  className="jpt-field"
                  style={{ width: "100%", resize: "none", padding: "13px 54px 13px 14px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)", fontSize: 14.5, lineHeight: 1.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
                <button onClick={() => void understand(text)} disabled={!original || !text.trim() || busy} aria-label="Continue"
                  style={{ position: "absolute", right: 9, bottom: 11, width: 36, height: 36, borderRadius: 11, border: "none", background: text.trim() && original ? "var(--grad-strong)" : "var(--surface-2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {phase === "reading" ? <span className="jpt-spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff" }} /> : <Icon name="arrowUp" size={17} />}
                </button>
              </div>

              {/* Starters, ideas for this photo, or next steps after a result */}
              {phase !== "review" && original && (analyzing || (shown ? suggestions.length : analysis?.suggestions?.length)) ? (
                <div style={{ ...eyebrow, marginTop: 14, marginBottom: 0 }}>{shown ? "Try next" : "Ideas for this photo"}</div>
              ) : null}
              {phase !== "review" && analyzing && !shown && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{[180, 140, 200, 160].map((w, i) => <span key={i} className="jpt-skel" style={{ width: w, height: 30, borderRadius: 999 }} />)}</div>
              )}
              {phase !== "review" && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {(shown && suggestions.length ? suggestions : original ? (analysis?.suggestions?.length ? analysis.suggestions : analyzing ? [] : STARTERS.slice(0, 4)) : STARTERS).map((s, k) => (
                    <button key={s} disabled={!original || busy} onClick={() => { trackEvent("suggestion_clicked", { tool: "ai-studio", label: s }); setText(s); void understand(s); }} className="jpt-lift jpt-a-up"
                      style={{ ["--d" as string]: `${500 + k * 70}ms`, padding: "6px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: original ? "pointer" : "default", opacity: original ? 1 : 0.6 }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Free accounts get smart reading on one photo; after that, ask them to buy credits. */}
            {unlock && !paid && (
              <div className="jpt-a-pop" style={{ border: "1px solid var(--accent-border)", background: "linear-gradient(180deg, var(--accent-soft), transparent)", borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>✨ Unlock smart AI reading</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 6 }}>
                  You&apos;ve used your free AI reading. Buy credits to unlock unlimited reading: every photo scanned, every suggestion tried, free for as long as you have credits.
                </div>
                <button onClick={() => openPricing("AI Studio smart reading")} style={{ marginTop: 12, width: "100%", padding: "11px 14px", borderRadius: 12, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "var(--glow)", fontFamily: "inherit" }}>
                  Get credits
                </button>
              </div>
            )}

            {/* Admins only: why smart reading fell back to keywords */}
            {isAdmin && !unlock && (intent?.source === "rules" || analysis?.source === "rules") && (
              <div style={{ fontSize: 12, color: "var(--text-faint)", border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.5 }}>
                Admin note: smart reading is off, using basic keyword mode. Reason: {intent?.why || analysis?.why || "unknown"}
              </div>
            )}

            {/* We understood */}
            {phase === "review" && intent && (
              <div className="jpt-a-pop" style={{ border: "1px solid var(--accent-border)", background: "linear-gradient(180deg, var(--accent-soft), transparent)", borderRadius: 16, padding: 16 }}>
                {intent.question ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{intent.question}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(intent.options ?? []).map((o) => (
                        <button key={o} onClick={() => { const r = `Improve the ${o.toLowerCase()}`; setText(r); void understand(r); }} className="jpt-lift" style={{ ...chip, cursor: "pointer", fontFamily: "inherit", color: "var(--text)" }}>{o}</button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={eyebrow}>We understood</div>
                    <div style={{ display: "grid", gap: 7 }}>
                      {intent.understood.map((u, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                          <span style={{ color: "var(--text-muted)" }}>{u.label}</span>
                          <span style={{ fontWeight: 800, textAlign: "right" }}>{u.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
                      Model
                      <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 2 }}>
                        {([["gpt-image", "ChatGPT"], ["nano-banana", "Nano Banana"], ["seedream-v45", "Seedream 4.5"]] as const).map(([id, label]) => (
                          <button key={id} onClick={() => setModel(id)} style={{ border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: model === id ? "var(--grad-strong)" : "transparent", color: model === id ? "#fff" : "var(--text-muted)" }}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={() => void generate(intent.prompt)} disabled={busy} style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 900, fontSize: 14.5, cursor: "pointer", boxShadow: "var(--glow)", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Icon name="sparkle" size={16} /> Generate · {CREDIT_COST} credits
                      </button>
                      <button onClick={() => { setPhase("idle"); inputRef.current?.focus(); }} style={ghost}>Edit request</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {err && (
              <div className="jpt-a-pop" style={{ padding: 14, borderRadius: 14, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13.5, fontWeight: 600 }}>
                {err}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {intent?.prompt && <button onClick={() => void generate(intent.prompt)} style={ghost}>Try again</button>}
                  <button onClick={() => { setErr(null); setPhase("idle"); inputRef.current?.focus(); }} style={ghost}>Change request</button>
                  <button onClick={() => fileRef.current?.click()} style={ghost}>Upload another image</button>
                </div>
              </div>
            )}

            {/* After a result */}
            {shown && phase !== "generating" && (
              <div className="jpt-a-up">
                <div style={eyebrow}>Continue with</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {CONTINUE.map((c) => (
                    <button key={c.label} onClick={() => { trackEvent("continue_editing_clicked", { tool: "ai-studio", label: c.label }); direct(c.label, c.prompt); }} disabled={busy} className="jpt-lift" style={card}>{c.label}</button>
                  ))}
                  <button onClick={variation} disabled={busy} className="jpt-lift" style={card}><Icon name="copy" size={14} /> Create variation</button>
                  <button onClick={() => void download(shown.src, `pixelshine-${shown.id}.png`)} className="jpt-lift" style={{ ...card, borderColor: "var(--accent-border)", color: "var(--accent)" }}><Icon name="download" size={14} /> Download</button>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10 }}>Each edit builds on the version you&apos;re looking at. Pick any version in History to go back.</div>
              </div>
            )}

            <div style={{ marginTop: "auto", fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
              Reading your request is free for paid users. You only spend {CREDIT_COST} credits when you press Generate. Every result is saved to My Creations.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const img: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block" };
const tag: React.CSSProperties = { position: "absolute", bottom: 10, fontSize: 11, fontWeight: 800, color: "#fff", background: "rgba(10,10,14,.7)", borderRadius: 999, padding: "4px 10px", pointerEvents: "none" };
const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-faint)", marginBottom: 9 };
const seg: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", color: "rgba(255,255,255,.8)", fontWeight: 800, fontSize: 12.5, padding: "6px 11px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" };
const segOn: React.CSSProperties = { background: "var(--grad-strong)", color: "#fff" };
const ghost: React.CSSProperties = { padding: "10px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
const card: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, padding: "11px 12px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" };
