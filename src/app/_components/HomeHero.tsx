"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * editing ones. It is drawn by the page rather than the browser, whose own
 * list ignores the dark theme on Windows and came out white.
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
        <ModelMenu models={models} value={current} onChange={setModel} />
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

const chevron = (open: boolean) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    style={{ flexShrink: 0, color: "var(--text-faint)", transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * The model picker: a pill that opens a list of the models, and nothing else.
 * Opens on the current model, upward when there's no room below; arrows,
 * Enter and Escape work as in a native select. The list is drawn on the page's
 * top layer and pinned to the pill, since the hero section clips what spills
 * out of it and the gallery below would cover it.
 */
function ModelMenu({ models, value, onChange }: { models: readonly { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const current = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !list.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);

  // Below the pill, or above it when that has more room; follows it while the page scrolls.
  const place = useCallback(() => {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(270, vw - 32);
    const left = Math.max(16, Math.min(r.left, vw - width - 16));
    const below = vh - r.bottom - 16;
    const above = r.top - 16;
    const up = below < 300 && above > below;
    const maxHeight = Math.max(160, Math.min(320, (up ? above : below) - 6));
    setPos(up ? { left, width, maxHeight, bottom: vh - r.top + 6 } : { left, width, maxHeight, top: r.bottom + 6 });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [open, place]);

  // Keep the highlighted model in view inside the list (not by scrolling the page).
  useEffect(() => {
    const l = list.current;
    const el = l?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!l || !el) return;
    if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop - 6;
    else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight + 6;
  }, [open, active, pos]);

  const show = () => {
    setActive(Math.max(0, models.findIndex((m) => m.id === current.id)));
    setOpen(true);
  };
  const pick = (id: string) => { onChange(id); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") { if (e.key === "Escape") e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(models.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(models.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(models[active].id); }
  };

  return (
    <div ref={root} style={{ position: "relative", minWidth: 0, maxWidth: "100%" }}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="hero-models"
        aria-activedescendant={open ? `hero-model-${active}` : undefined}
        aria-label={`Model: ${current.label}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7, maxWidth: "100%", padding: "8px 12px 8px 13px", borderRadius: 999,
          background: open ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${open ? "var(--accent-border)" : "var(--border-strong)"}`,
          color: "var(--text)", fontFamily: "inherit", cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)" }}>Model</span>
        <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.label}</span>
        {chevron(open)}
      </button>
      {open && pos && createPortal(
        <div
          ref={list}
          id="hero-models"
          role="listbox"
          aria-label="Model"
          style={{
            position: "fixed", zIndex: 1001, ...pos, overflowY: "auto", overscrollBehavior: "contain", textAlign: "left",
            padding: 6, borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-lg)",
          }}
        >
          {models.map((m, i) => {
            const on = m.id === current.id;
            return (
              <div
                key={m.id}
                id={`hero-model-${i}`}
                data-i={i}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(m.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 9,
                  fontSize: 13.5, fontWeight: on ? 800 : 600, cursor: "pointer",
                  color: on ? "var(--accent)" : "var(--text)", background: i === active ? "var(--surface-2)" : "transparent",
                }}
              >
                <span>{m.label}</span>
                {on && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
