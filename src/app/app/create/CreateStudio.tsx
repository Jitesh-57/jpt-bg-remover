"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { takeCreatePrompt, takeCreatePhoto } from "../_components/handoff";
import { StudioPage, Dropdown, GenerateButton, PreviewPanel, SessionStrip, ErrorNote, runGeneration, toSendable, acceptImageFile, labelStyle, actionBtn, type StudioResult } from "../_components/studio";
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [needsPhoto, setNeedsPhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const refInput = useRef<HTMLInputElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);
  useEffect(() => {
    const h = takeCreatePrompt();
    if (h) { setPrompt(h.prompt.slice(0, MAX_PROMPT)); setNeedsPhoto(!!h.needsPhoto); setReference(h.reference || null); }
    void takeCreatePhoto().then((img) => { if (img) setPhoto(img); });
    textRef.current?.focus();
  }, []);

  const takePhoto = async (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    try { setPhoto(await acceptImageFile(f)); } catch (e) { setErr((e as Error).message); }
  };

  const takeReference = async (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    try { setReference(await acceptImageFile(f)); } catch (e) { setErr((e as Error).message); }
  };

  /** Fills the prompt and, when the idea came with a picture, uses that picture as the reference. */
  const applyPrompt = (p: string, ref?: string | null) => {
    setPrompt(p.slice(0, MAX_PROMPT));
    if (ref !== undefined) setReference(ref);
    setNeedsPhoto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    textRef.current?.focus();
  };

  const surprise = () => {
    const pool = inspirations.filter((i) => i.prompt);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    applyPrompt(pick.prompt!, pick.image);
  };

  const generate = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    if (needsPhoto && !photo) { setErr("This prompt is made for your own photo — add Your image first."); return; }
    if (credits < CREDIT_COST) { openPricing("Create Image"); return; }
    setBusy(true);
    setErr(null);
    let image: string | undefined;
    let ref: string | undefined;
    try {
      if (photo) { const s = await toSendable(photo); image = s.imageUrl || s.dataUrl; }
      if (reference) { const s = await toSendable(reference); ref = s.imageUrl || s.dataUrl; }
    } catch {
      setBusy(false);
      setErr("An image couldn't be prepared. Try adding it again.");
      return;
    }
    const out = await runGeneration("/api/create-image", { prompt: text, model, aspectRatio: ratio, image, reference: ref }, { returnTo: "/app/create", reason: "Create Image", onCredits: setCredits });
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
        <div
          className="jpt-fieldbox"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); void takePhoto(e.dataTransfer.files?.[0]); }}
          style={{ position: "relative", borderRadius: 14, border: `1px solid ${dragOver ? "var(--accent)" : "var(--border)"}`, background: dragOver ? "var(--accent-soft)" : "var(--surface)", padding: "10px 10px 0" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {reference
              ? <Thumb src={reference} tag="Reference" onRemove={() => setReference(null)} />
              : <EmptyThumb tag="Reference" hint="optional" onClick={() => refInput.current?.click()} />}
            <Icon name="arrowRight" size={15} style={{ color: "var(--text-faint)" }} />
            {photo
              ? <Thumb src={photo} tag="Your image" onRemove={() => setPhoto(null)} />
              : <EmptyThumb tag="Your image" accent onClick={() => photoInput.current?.click()} />}
          </div>
          <textarea
            ref={textRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); void takePhoto(f); } }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }}
            rows={6}
            placeholder={photo ? "Describe the scene to put your image in…" : "A cozy Kyoto café at golden hour, rain on the window, soft film grain, 35mm photo…"}
            style={{ width: "100%", resize: "vertical", minHeight: 130, padding: "10px 4px 28px", borderRadius: 14, background: "transparent", border: "none", color: "var(--text)", fontSize: 14.5, lineHeight: 1.55, fontFamily: "inherit", outline: "none" }}
          />
          <span style={{ position: "absolute", right: 12, bottom: 10, fontSize: 11, color: "var(--text-faint)" }}>{prompt.length}/{MAX_PROMPT}</span>
        </div>
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void takePhoto(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={refInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void takeReference(e.target.files?.[0]); e.target.value = ""; }} />
        {!photo ? (
          <button onClick={() => photoInput.current?.click()} className="jpt-lift" style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", borderRadius: 11, border: "1px solid var(--accent-border)", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
            <Icon name="upload" size={16} />
            <span style={{ flex: 1 }}>
              Upload your image
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--accent-strong)", opacity: 0.85, marginTop: 1 }}>
                {needsPhoto ? "This prompt is made for your own photo." : reference ? "Your model or product, recreated like the reference." : "Put yourself or your product in the picture."}
              </span>
            </span>
          </button>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
            {reference ? "Recreating the reference with your image as the subject." : "Your image will be the subject — a person keeps their face, a product keeps its look."}
          </div>
        )}
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
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 16px" }}>Tap any image to use it as the reference with its prompt, then add your own image to recreate it.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(170px, 100%), 1fr))", gap: 12 }}>
        {inspirations.map((it, i) => (
          <button key={it.uid} onClick={() => it.prompt && applyPrompt(it.prompt, it.image)} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${Math.min(i, 12) * 35}ms`, position: "relative", aspectRatio: "1 / 1", padding: 0, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
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

function Thumb({ src, tag, onRemove }: { src: string; tag: string; onRemove: () => void }) {
  return (
    <div className="jpt-a-pop" style={{ position: "relative", width: 76, height: 76, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-strong)", background: "var(--surface-2)", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={tag} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <span style={{ position: "absolute", left: 4, bottom: 4, fontSize: 9.5, fontWeight: 800, color: "#fff", background: "rgba(8,8,10,.75)", borderRadius: 6, padding: "2px 6px" }}>{tag}</span>
      <button onClick={onRemove} aria-label={`Remove ${tag}`} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(8,8,10,.75)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}

function EmptyThumb({ tag, hint, accent, onClick }: { tag: string; hint?: string; accent?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="jpt-lift" style={{ width: 76, height: 76, flexShrink: 0, borderRadius: 12, border: `1.5px dashed ${accent ? "var(--accent)" : "var(--border-strong)"}`, background: accent ? "var(--accent-soft)" : "transparent", color: accent ? "var(--accent)" : "var(--text-faint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, fontWeight: 800, lineHeight: 1.2, textAlign: "center", padding: 4 }}>
      <Icon name="upload" size={15} />
      {tag}
      {hint && <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.8 }}>{hint}</span>}
    </button>
  );
}
