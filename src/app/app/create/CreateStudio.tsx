"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { takeCreatePrompt, openInEditor } from "../_components/handoff";
import { ASPECT_RATIOS, MODELS, type AspectRatio } from "@/lib/app-presets";
import { CREDIT_COST } from "@/lib/plans";
import { publishCredits, onCreditsChanged } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { parseJsonResponse } from "@/lib/upload-prep";
import { userMessage } from "@/lib/user-message";
import type { FeedItem } from "@/lib/dashboard-feed.server";

const MAX_PROMPT = 4000;
const STAGES = ["Reading your prompt…", "Composing the scene…", "Painting light and detail…", "Adding the finishing touches…"];

interface Result { id: string; src: string; prompt: string; ratio: AspectRatio }

function ratioBox(r: string, max = 18): { w: number; h: number } {
  const [a, b] = r.split(":").map(Number);
  return a >= b ? { w: max, h: Math.round((max * b) / a) } : { w: Math.round((max * a) / b), h: max };
}

export default function CreateStudio({ inspirations }: { inspirations: FeedItem[] }) {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [current, setCurrent] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);
  useEffect(() => {
    const p = takeCreatePrompt();
    if (p) setPrompt(p.slice(0, MAX_PROMPT));
    textRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy]);

  const applyPrompt = (p: string) => {
    setPrompt(p.slice(0, MAX_PROMPT));
    window.scrollTo({ top: 0, behavior: "smooth" });
    textRef.current?.focus();
  };

  const surprise = () => {
    const pool = inspirations.filter((i) => i.prompt);
    if (pool.length) applyPrompt(pool[Math.floor(Math.random() * pool.length)].prompt!);
  };

  const generate = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    if (credits < CREDIT_COST) { openPricing("Create Image"); return; }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/create-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, model, aspectRatio: ratio }),
      });
      type Body = { dataUrl?: string; resultUrl?: string | null; error?: string; credits?: number; upgradeRequired?: boolean };
      let data: Body = {};
      try { data = await parseJsonResponse<Body>(res); } catch (e) { data = { error: (e as Error).message }; }

      if (typeof data.credits === "number") { setCredits(data.credits); publishCredits(data.credits); }
      if (res.status === 401) { await beginGoogleSignIn("/app/create"); return; }
      if (res.status === 402 || res.status === 403 || data.upgradeRequired) { openPricing("Create Image"); return; }
      if (!res.ok || !data.dataUrl) { setErr(userMessage(data.error, "That didn't work. Please try again.")); return; }

      const r: Result = { id: `${Date.now()}`, src: data.dataUrl, prompt: text, ratio };
      setResults((prev) => [r, ...prev].slice(0, 12));
      setCurrent(r);
    } catch {
      setErr("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); }
  };

  const copyPrompt = async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(current.prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const shown = current ?? null;
  const frameRatio = (busy ? ratio : shown?.ratio ?? ratio).replace(":", " / ");
  const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 9px" };
  const canGo = !!prompt.trim() && !busy;

  return (
    <div style={{ padding: "26px 24px 60px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div className="jpt-a-up" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,2.8vw,2rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Create Image</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Describe anything and get a photorealistic image in seconds.</p>
        </div>

        <div className="jpt-create-grid">
          <div className="jpt-a-up" style={{ ["--d" as string]: "60ms", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, position: "sticky", top: 84 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
              <p style={{ ...label, margin: 0 }}>Prompt</p>
              <button onClick={surprise} disabled={!inspirations.length} className="jpt-nav-item" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, border: "none", background: "transparent", color: "var(--accent)", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
                <Icon name="wand" size={14} /> Surprise me
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                ref={textRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
                onKeyDown={onKeyDown}
                rows={7}
                placeholder="A cozy Kyoto café at golden hour, rain on the window, soft film grain, 35mm photo…"
                style={{ width: "100%", resize: "vertical", minHeight: 150, padding: "13px 14px 28px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14.5, lineHeight: 1.55, fontFamily: "inherit", outline: "none", transition: "border-color .15s ease, box-shadow .15s ease" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <span style={{ position: "absolute", right: 12, bottom: 10, fontSize: 11, color: "var(--text-faint)" }}>{prompt.length}/{MAX_PROMPT}</span>
            </div>

            <p style={{ ...label, marginTop: 18 }}>Aspect ratio</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {ASPECT_RATIOS.map((r) => {
                const on = r === ratio;
                const b = ratioBox(r);
                return (
                  <button key={r} onClick={() => setRatio(r)} className="jpt-lift" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 6px", borderRadius: 10, border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: on ? "var(--accent)" : "var(--text-muted)", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
                    <span style={{ width: b.w, height: b.h, border: "1.6px solid currentColor", borderRadius: 3 }} />
                    {r}
                  </button>
                );
              })}
            </div>

            <p style={{ ...label, marginTop: 18 }}>Model</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MODELS.map((m) => {
                const on = m.id === model;
                return (
                  <button key={m.id} onClick={() => setModel(m.id)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 11, border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", fontFamily: "inherit", cursor: "pointer", transition: "background-color .15s ease, border-color .15s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 800, color: on ? "var(--accent)" : "var(--text)" }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${on ? "var(--accent)" : "var(--border-strong)"}`, boxShadow: on ? "inset 0 0 0 3px var(--bg-elevated)" : "none", background: on ? "var(--accent)" : "transparent" }} />
                      {m.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, paddingLeft: 22 }}>{m.hint}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={generate}
              disabled={!canGo}
              className={canGo ? "jpt-sheen" : undefined}
              style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 13, border: "none", background: canGo ? "var(--grad-strong)" : "var(--surface-3)", color: canGo ? "#fff" : "var(--text-faint)", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: canGo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canGo ? "var(--glow)" : "none", transition: "background .2s ease" }}
            >
              {busy ? <><span className="jpt-spin" style={{ display: "inline-flex" }}><Icon name="sparkle" size={17} /></span> Generating…</> : <><Icon name="sparkle" size={17} /> Generate <span style={{ opacity: 0.8, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 2 }}>· <Icon name="zap" size={13} />{CREDIT_COST}</span></>}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--text-faint)" }}>
              <span>{credits} credits left</span>
              <span className="jpt-app-hide-sm">Ctrl + Enter to generate</span>
            </div>
            {err && <div className="jpt-a-pop" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{err}</div>}
          </div>

          <div className="jpt-a-up" style={{ ["--d" as string]: "120ms", minWidth: 0 }}>
            <div style={{ position: "relative", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, minHeight: 460, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {!busy && !shown && (
                <div style={{ textAlign: "center", position: "relative", padding: 20 }}>
                  <div className="jpt-a-glow" aria-hidden style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)", top: "50%", left: "50%", marginTop: -170, marginLeft: -170 }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="image" size={28} /></div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>Your image will appear here</div>
                    <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "6px 0 0" }}>Write a prompt, or pick one of the ideas below.</p>
                  </div>
                </div>
              )}

              {busy && (
                <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
                  <div className="jpt-skel" style={{ aspectRatio: frameRatio, maxHeight: 560, margin: "0 auto", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="jpt-spin" style={{ display: "inline-flex", color: "var(--accent)" }}><Icon name="sparkle" size={30} /></span>
                  </div>
                  <div key={stage} className="jpt-a-pop" style={{ marginTop: 14, fontSize: 13.5, fontWeight: 700, color: "var(--text-muted)" }}>{STAGES[stage]}</div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>This usually takes 10–40 seconds.</div>
                </div>
              )}

              {!busy && shown && (
                <div key={shown.id} className="jpt-a-up" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shown.src} alt={shown.prompt} style={{ maxWidth: "100%", maxHeight: 620, borderRadius: 14, boxShadow: "var(--shadow-lg)", display: "block" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    <a href={shown.src} download={`pixelshine-${shown.id}.png`} style={actionBtn(true)}><Icon name="download" size={15} /> Download</a>
                    <button onClick={() => openInEditor(shown.src, "")} style={actionBtn(false)}><Icon name="editor" size={15} /> Edit in Image Editor</button>
                    <button onClick={copyPrompt} style={actionBtn(false)}><Icon name="copy" size={15} /> {copied ? "Copied" : "Copy prompt"}</button>
                    <button onClick={generate} disabled={!canGo} style={actionBtn(false)}><Icon name="sparkle" size={15} /> Regenerate</button>
                  </div>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>This session</span>
                  <Link href="/app/library" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>All creations →</Link>
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {results.map((r) => (
                    <button key={r.id} onClick={() => setCurrent(r)} className="jpt-a-pop" style={{ flex: "0 0 auto", width: 86, height: 86, padding: 0, borderRadius: 12, overflow: "hidden", border: `2px solid ${current?.id === r.id ? "var(--accent)" : "var(--border)"}`, background: "var(--surface-2)", cursor: "pointer" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {inspirations.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Need an idea?</h2>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 16px" }}>Tap any image to use its prompt. Prompts from the community, credited to their creators.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(170px, 100%), 1fr))", gap: 12 }}>
              {inspirations.map((it, i) => (
                <button key={it.uid} onClick={() => it.prompt && applyPrompt(it.prompt)} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${Math.min(i, 12) * 35}ms`, position: "relative", aspectRatio: "1 / 1", padding: 0, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="jpt-zoom-media" src={it.image} alt={it.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(8,8,10,.88) 100%)" }} />
                  <span style={{ position: "absolute", left: 10, right: 10, bottom: 9 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                    <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>by {it.author}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function actionBtn(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10,
    border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--grad-strong)" : "var(--surface)",
    color: primary ? "#fff" : "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: "pointer", textDecoration: "none",
  };
}
