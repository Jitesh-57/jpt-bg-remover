"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { takeCreatePrompt } from "../_components/handoff";
import { StudioPage, Dropdown, GenerateButton, PreviewPanel, SessionStrip, ErrorNote, runGeneration, labelStyle, actionBtn, type StudioResult } from "../_components/studio";
import { ASPECT_RATIOS, MODELS, type AspectRatio } from "@/lib/app-presets";
import { CREDIT_COST } from "@/lib/plans";
import { onCreditsChanged } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import type { FeedItem } from "@/lib/dashboard-feed.server";

const MAX_PROMPT = 4000;
const STAGES = ["Reading your prompt…", "Composing the scene…", "Painting light and detail…", "Adding the finishing touches…"];

const RATIO_LABEL: Record<AspectRatio, string> = {
  "1:1": "1:1 · Square", "4:5": "4:5 · Portrait", "3:4": "3:4 · Portrait", "16:9": "16:9 · Landscape", "9:16": "9:16 · Story", "3:2": "3:2 · Photo",
};

export default function CreateStudio({ inspirations }: { inspirations: FeedItem[] }) {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [current, setCurrent] = useState<StudioResult | null>(null);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);
  useEffect(() => {
    const p = takeCreatePrompt();
    if (p) setPrompt(p.slice(0, MAX_PROMPT));
    textRef.current?.focus();
  }, []);

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
    const out = await runGeneration("/api/create-image", { prompt: text, model, aspectRatio: ratio }, { returnTo: "/app/create", reason: "Create Image", onCredits: setCredits });
    setBusy(false);
    if (out.error) { setErr(out.error); return; }
    if (!out.image) return;
    const r: StudioResult = { id: `${Date.now()}`, src: out.image, prompt: text };
    setResults((prev) => [r, ...prev].slice(0, 12));
    setCurrent(r);
  };

  const copyPrompt = async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(current.prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const controls = (
    <>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ ...labelStyle, margin: 0 }}>Prompt</span>
          <button onClick={surprise} disabled={!inspirations.length} className="jpt-nav-item" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, border: "none", background: "transparent", color: "var(--accent)", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
            <Icon name="wand" size={14} /> Surprise me
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <textarea
            ref={textRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }}
            rows={8}
            placeholder="A cozy Kyoto café at golden hour, rain on the window, soft film grain, 35mm photo…"
            className="jpt-field"
            style={{ width: "100%", resize: "vertical", minHeight: 170, padding: "13px 14px 28px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14.5, lineHeight: 1.55, fontFamily: "inherit", outline: "none" }}
          />
          <span style={{ position: "absolute", right: 12, bottom: 10, fontSize: 11, color: "var(--text-faint)" }}>{prompt.length}/{MAX_PROMPT}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Dropdown label="Aspect ratio" value={ratio} onChange={setRatio} options={ASPECT_RATIOS.map((r) => ({ value: r, label: RATIO_LABEL[r] }))} />
        <Dropdown label="Model" value={model} onChange={setModel} options={MODELS.map((m) => ({ value: m.id as string, label: m.label, hint: m.hint }))} />
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <ErrorNote text={err} />
        <GenerateButton onClick={generate} disabled={!prompt.trim()} busy={busy} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-faint)" }}>
          <span>{credits} credits left</span>
          <span className="jpt-app-hide-sm">Ctrl + Enter to generate</span>
        </div>
      </div>
    </>
  );

  const preview = (
    <>
      <PreviewPanel
        busy={busy}
        result={current}
        stages={STAGES}
        frameRatio={ratio.replace(":", " / ")}
        emptyTitle="Your image will appear here"
        emptySub="Write a prompt, or pick one of the ideas below."
        onRegenerate={prompt.trim() ? generate : undefined}
        extraActions={current && <button onClick={copyPrompt} style={actionBtn(false)}><Icon name="copy" size={15} /> {copied ? "Copied" : "Copy prompt"}</button>}
      />
      <SessionStrip results={results} current={current} onPick={setCurrent} />
    </>
  );

  const below = inspirations.length > 0 && (
    <section style={{ marginTop: 36 }}>
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
  );

  return <StudioPage title="Create Image" sub="Describe anything and get a photorealistic image in seconds." controls={controls} preview={preview} below={below} />;
}
