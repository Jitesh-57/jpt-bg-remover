"use client";

import { useEffect, useState } from "react";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { takeEditorHandoff } from "../_components/handoff";
import { StudioPage, Dropdown, ImageDrop, GenerateButton, PreviewPanel, SessionStrip, ErrorNote, runGeneration, toSendable, labelStyle, actionBtn, type StudioResult } from "../_components/studio";
import { ASPECT_RATIOS, MODELS } from "@/lib/app-presets";
import { CREDIT_COST } from "@/lib/plans";
import { onCreditsChanged } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";

const MAX_PROMPT = 2000;
const STAGES = ["Looking at your photo…", "Applying your edit…", "Blending light and detail…", "Finishing up…"];
const QUICK = [
  "Remove the background and make it pure white",
  "Remove the people in the background",
  "Make it golden hour lighting",
  "Turn this into a studio headshot",
  "Restore and sharpen this old photo",
  "Change the outfit to a black suit",
];

type Ratio = "original" | (typeof ASPECT_RATIOS)[number];

export default function EditorStudio() {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [ratio, setRatio] = useState<Ratio>("original");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [current, setCurrent] = useState<StudioResult | null>(null);

  useEffect(() => onCreditsChanged(setCredits), []);
  useEffect(() => {
    void takeEditorHandoff().then((h) => {
      if (h?.image) setImage(h.image);
      if (h?.prompt) setPrompt(h.prompt.slice(0, MAX_PROMPT));
    });
  }, []);

  const generate = async () => {
    const text = prompt.trim();
    if (!image || !text || busy) return;
    if (credits < CREDIT_COST) { openPricing("AI Image Editor"); return; }
    setBusy(true);
    setErr(null);
    try {
      const src = await toSendable(image);
      const out = await runGeneration(
        "/api/edit-image",
        { image: src.imageUrl || src.dataUrl, prompt: text, model, aspectRatio: ratio === "original" ? undefined : ratio },
        { returnTo: "/app/editor", reason: "AI Image Editor", onCredits: setCredits }
      );
      if (out.error) { setErr(out.error); return; }
      if (!out.image) return;
      const r: StudioResult = { id: `${Date.now()}`, src: out.image, prompt: text };
      setResults((prev) => [r, ...prev].slice(0, 12));
      setCurrent(r);
    } catch (e) {
      setErr((e as Error).message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const keepEditing = () => {
    if (!current) return;
    setImage(current.src);
    setPrompt("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const controls = (
    <>
      <ImageDrop label="Photo" hint="JPG, PNG or WebP · up to 15 MB" value={image} onChange={setImage} height={190} />

      <div>
        <span style={labelStyle}>What should change?</span>
        <div style={{ position: "relative" }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }}
            rows={4}
            placeholder="e.g. Remove the person on the left and make the sky sunset orange"
            className="jpt-field"
            style={{ width: "100%", resize: "vertical", minHeight: 110, padding: "12px 14px 26px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, lineHeight: 1.55, fontFamily: "inherit", outline: "none" }}
          />
          <span style={{ position: "absolute", right: 12, bottom: 10, fontSize: 11, color: "var(--text-faint)" }}>{prompt.length}/{MAX_PROMPT}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {QUICK.map((q) => (
            <button key={q} onClick={() => setPrompt(q)} className="jpt-lift" style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Dropdown label="Model" value={model} onChange={setModel} options={MODELS.map((m) => ({ value: m.id as string, label: m.label, hint: m.hint }))} />
        <Dropdown<Ratio> label="Size" value={ratio} onChange={setRatio} options={[{ value: "original", label: "Keep original" }, ...ASPECT_RATIOS.map((r) => ({ value: r as Ratio, label: r }))]} />
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <ErrorNote text={err} />
        <GenerateButton onClick={generate} disabled={!image || !prompt.trim()} busy={busy} />
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {!image ? "Upload a photo to start." : !prompt.trim() ? "Describe the edit, or pick a suggestion." : `${credits} credits left`}
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
        frameRatio={ratio === "original" ? "4 / 5" : ratio.replace(":", " / ")}
        emptyTitle="Your edited image will appear here"
        emptySub="Upload a photo, describe the change, and press Generate."
        onRegenerate={image && prompt.trim() ? generate : undefined}
        extraActions={current && <button onClick={keepEditing} style={actionBtn(false)}><Icon name="wand" size={15} /> Keep editing this</button>}
      />
      <SessionStrip results={results} current={current} onPick={setCurrent} />
    </>
  );

  return <StudioPage title="AI Image Editor" sub="Upload a photo and describe the change — the AI does the rest." controls={controls} preview={preview} />;
}
