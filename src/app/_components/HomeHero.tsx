"use client";

import { useRef, useState } from "react";
import { sendToCreate } from "@/lib/prompts/handoff";
import { IMAGE_EDIT_MODELS, TEXT_TO_IMAGE_MODELS, ASPECT_RATIOS } from "@/lib/app-presets";
import { trackEvent } from "@/lib/analytics";

/**
 * The homepage's product demo: the same upload + "describe an edit" bar the
 * editor uses, so the first thing a visitor touches is the real product. It
 * stashes the image and prompt and hands off to the editor.
 *
 * The model is one dropdown offering what the studio will run for this
 * input, as it does: text-to-image models until a photo is added, then the
 * editing ones.
 */
export default function HomeHero() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(TEXT_TO_IMAGE_MODELS[0].id);
  const [ratio, setRatio] = useState<string>("1:1");
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const read = (f: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error("read failed"));
      r.readAsDataURL(f);
    });

  const models = file ? IMAGE_EDIT_MODELS : TEXT_TO_IMAGE_MODELS;
  const current = models.some((m) => m.id === model) ? model : models[0].id;

  const onFile = async (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile({ url: await read(f), name: f.name });
  };

  const go = async () => {
    trackEvent("home_hero_start", { hasImage: !!file, hasPrompt: !!prompt.trim(), model: current, ratio });
    await sendToCreate({ prompt: prompt.trim(), image: file?.url, source: "home-hero", model: current, ratio });
  };

  const chip = (on: boolean): React.CSSProperties => ({
    padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap",
    background: on ? "var(--accent-soft)" : "var(--surface-2)",
    color: on ? "var(--accent)" : "var(--text-muted)",
    border: `1px solid ${on ? "var(--accent-border)" : "var(--border)"}`,
  });

  return (
    <div
      className="jpt-glass"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}
      style={{
        borderRadius: 22, padding: 14, border: `1.5px solid ${drag ? "var(--accent)" : "var(--border-strong)"}`,
        background: "var(--surface)", boxShadow: "var(--shadow-lg)", maxWidth: 820, margin: "0 auto",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />

      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        {/* Upload tile */}
        <button
          onClick={() => inputRef.current?.click()}
          aria-label={file ? "Change image" : "Upload an image"}
          style={{
            flexShrink: 0, width: 92, borderRadius: 14, border: "1.5px dashed var(--border-strong)",
            background: "var(--surface-2)", cursor: "pointer", padding: 0, overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            color: "var(--text-muted)", fontFamily: "inherit",
          }}
        >
          {file ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <>
              <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>Upload</span>
            </>
          )}
        </button>

        {/* Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void go(); } }}
          rows={3}
          placeholder="Describe an edit — “make it a 1980s studio portrait”, “remove the background”, “put me on a beach at golden hour”…"
          style={{
            flex: 1, minWidth: 0, resize: "none", border: "none", outline: "none", background: "transparent",
            color: "var(--text)", fontSize: 16, lineHeight: 1.55, fontFamily: "inherit", padding: "8px 6px",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <label style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%", padding: "0 0 0 13px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border-strong)", cursor: "pointer" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", whiteSpace: "nowrap" }}>Model</span>
          <select
            value={current}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Model"
            style={{ appearance: "none", WebkitAppearance: "none", minWidth: 0, maxWidth: "100%", padding: "8px 32px 8px 0", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textOverflow: "ellipsis" }}
          >
            <optgroup label={file ? "Edit your photo" : "Create from text"}>
              {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </optgroup>
            {!file && <option disabled value="">Upload a photo for {IMAGE_EDIT_MODELS.length} editing models</option>}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>
        {ASPECT_RATIOS.slice(0, 4).map((r) => (
          <button key={r} onClick={() => setRatio(r)} style={chip(ratio === r)}>{r}</button>
        ))}
        <button
          onClick={go}
          style={{
            marginLeft: "auto", padding: "11px 20px", borderRadius: 999, border: "none",
            background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14.5,
            fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)",
          }}
        >
          Generate Now →
        </button>
      </div>
    </div>
  );
}
