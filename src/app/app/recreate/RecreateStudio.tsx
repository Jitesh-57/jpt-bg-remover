"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../_components/Icon";
import { useDashboardUser } from "../_components/DashboardUser";
import { StudioPage, GenerateButton, PreviewPanel, SessionStrip, ErrorNote, runGeneration, toSendable, acceptImageFile, labelStyle, type StudioResult } from "../_components/studio";
import { CREDIT_COST } from "@/lib/plans";
import { onCreditsChanged } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import { parseJsonResponse } from "@/lib/upload-prep";

const STAGES = ["Studying the reference…", "Matching pose and lighting…", "Placing you in the scene…", "Finishing the details…"];
const MAX_NOTE = 1500;

type Slot = "reference" | "person";

function Thumb({ src, tag, onRemove }: { src: string; tag: string; onRemove: () => void }) {
  return (
    <div className="jpt-a-pop" style={{ position: "relative", width: 76, height: 76, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-strong)", background: "var(--surface-2)", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={tag} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <span style={{ position: "absolute", left: 4, bottom: 4, fontSize: 9.5, fontWeight: 800, color: "#fff", background: "rgba(8,8,10,.75)", borderRadius: 6, padding: "2px 6px", letterSpacing: "0.03em" }}>{tag}</span>
      <button onClick={onRemove} aria-label={`Remove ${tag}`} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(8,8,10,.75)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}

function EmptyThumb({ tag, onClick }: { tag: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="jpt-lift" style={{ width: 76, height: 76, borderRadius: 12, border: "1.5px dashed var(--border-strong)", background: "transparent", color: "var(--text-faint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>
      <Icon name="upload" size={16} /> {tag}
    </button>
  );
}

export default function RecreateStudio() {
  const user = useDashboardUser();
  const [credits, setCredits] = useState(user.credits);
  const [reference, setReference] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [loadingLink, setLoadingLink] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [current, setCurrent] = useState<StudioResult | null>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const personInput = useRef<HTMLInputElement>(null);

  useEffect(() => onCreditsChanged(setCredits), []);

  const setSlot = (slot: Slot, v: string | null) => (slot === "reference" ? setReference(v) : setPerson(v));

  const takeFile = async (slot: Slot, f: File | undefined) => {
    setErr(null);
    if (!f) return;
    try { setSlot(slot, await acceptImageFile(f)); } catch (e) { setErr((e as Error).message); }
  };

  /** A dropped or pasted image fills whichever slot is still empty — reference first. */
  const takeAny = (f: File | undefined) => {
    if (!f) return;
    void takeFile(!reference ? "reference" : "person", f);
  };

  const loadLink = async () => {
    const url = link.trim();
    if (!url || loadingLink) return;
    setLoadingLink(true);
    setErr(null);
    try {
      const res = await fetch("/api/resolve-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await parseJsonResponse<{ imageUrl?: string; dataUrl?: string; error?: string }>(res);
      const img = data.imageUrl || data.dataUrl;
      if (!res.ok || !img) { setErr(data.error || "Couldn't load an image from that link."); return; }
      setReference(img);
      setLink("");
    } catch (e) {
      setErr((e as Error).message || "Couldn't load that link.");
    } finally {
      setLoadingLink(false);
    }
  };

  const generate = async () => {
    if (!reference || !person || busy) return;
    if (credits < CREDIT_COST) { openPricing("Recreate"); return; }
    setBusy(true);
    setErr(null);
    try {
      const [r, p] = await Promise.all([toSendable(reference), toSendable(person)]);
      const out = await runGeneration(
        "/api/recreate",
        { reference: r.imageUrl || r.dataUrl, person: p.imageUrl || p.dataUrl, prompt: note.trim() },
        { returnTo: "/app/recreate", reason: "Recreate", onCredits: setCredits }
      );
      if (out.error) { setErr(out.error); return; }
      if (!out.image) return;
      const res: StudioResult = { id: `${Date.now()}`, src: out.image, prompt: note.trim() || "Recreate" };
      setResults((prev) => [res, ...prev].slice(0, 12));
      setCurrent(res);
    } catch (e) {
      setErr((e as Error).message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const smallBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 12px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" };

  const controls = (
    <>
      <div>
        <span style={labelStyle}>Reference link</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void loadLink(); } }}
            placeholder="Paste a Pinterest, Instagram or image link"
            aria-label="Reference image link"
            className="jpt-field"
            style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13.5, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={loadLink} disabled={!link.trim() || loadingLink} style={{ ...smallBtn, background: link.trim() ? "var(--accent-soft)" : "var(--surface)", color: link.trim() ? "var(--accent)" : "var(--text-faint)", borderColor: link.trim() ? "var(--accent-border)" : "var(--border)" }}>
            {loadingLink ? <span className="jpt-spin" style={{ display: "inline-flex" }}><Icon name="sparkle" size={14} /></span> : <Icon name="arrowRight" size={14} />}
            {loadingLink ? "Loading" : "Load"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={() => refInput.current?.click()} className="jpt-lift" style={smallBtn}><Icon name="image" size={15} /> Upload reference</button>
        <button onClick={() => personInput.current?.click()} className="jpt-lift" style={{ ...smallBtn, borderColor: "var(--accent-border)", color: "var(--accent)" }}><Icon name="upload" size={15} /> Your photo</button>
      </div>
      <input ref={refInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void takeFile("reference", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={personInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void takeFile("person", e.target.files?.[0]); e.target.value = ""; }} />

      <div>
        <span style={labelStyle}>Prompt <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>(optional)</span></span>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); takeAny(e.dataTransfer.files?.[0]); }}
          style={{ borderRadius: 14, border: `1px solid ${dragOver ? "var(--accent)" : "var(--border)"}`, background: dragOver ? "var(--accent-soft)" : "var(--surface)", padding: 10, transition: "border-color .15s ease, background-color .15s ease" }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            {reference ? <Thumb src={reference} tag="Reference" onRemove={() => setReference(null)} /> : <EmptyThumb tag="Reference" onClick={() => refInput.current?.click()} />}
            <Icon name="arrowRight" size={16} style={{ color: "var(--text-faint)" }} />
            {person ? <Thumb src={person} tag="You" onRemove={() => setPerson(null)} /> : <EmptyThumb tag="You" onClick={() => personInput.current?.click()} />}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); takeAny(f); } }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void generate(); } }}
            rows={4}
            placeholder="Anything to change? e.g. make it evening, keep my glasses, change the dress to red…"
            style={{ width: "100%", resize: "vertical", minHeight: 90, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14, lineHeight: 1.55, fontFamily: "inherit", padding: "4px 2px" }}
          />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>Tip: you can also drop or paste images into this box.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
        <span style={{ ...labelStyle, margin: 0 }}>Model</span>
        <span style={{ fontWeight: 800 }}>ChatGPT</span>
        <span style={{ color: "var(--text-faint)", fontSize: 12 }}>· best at matching a reference</span>
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <ErrorNote text={err} />
        <GenerateButton onClick={generate} disabled={!reference || !person} busy={busy} label="Recreate" />
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {!reference ? "Add a reference image to start." : !person ? "Now add your photo." : `${credits} credits left`}
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
        frameRatio="4 / 5"
        emptyTitle="Recreate any photo with you in it"
        emptySub="Add a reference (upload or paste a Pinterest link) and your photo, then press Recreate."
        onRegenerate={reference && person ? generate : undefined}
      />
      <SessionStrip results={results} current={current} onPick={setCurrent} />
    </>
  );

  return <StudioPage title="Recreate" sub="Copy the look, pose and setting of any photo — with your face." controls={controls} preview={preview} />;
}
