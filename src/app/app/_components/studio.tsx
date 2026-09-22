"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";
import { openInEditor } from "./handoff";
import { CREDIT_COST } from "@/lib/plans";
import { publishCredits } from "@/lib/credits";
import { openPricing } from "@/lib/pricing-modal";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { parseJsonResponse, prepareDataUrl } from "@/lib/upload-prep";
import { userMessage } from "@/lib/user-message";

export const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px", display: "block",
};

/** Page frame shared by Create, Recreate and the Editor: title, then a control panel and a preview of equal height. */
export function StudioPage({ title, sub, controls, preview, below }: { title: string; sub: string; controls: React.ReactNode; preview: React.ReactNode; below?: React.ReactNode }) {
  return (
    <div style={{ padding: "22px 24px 60px" }}>
      <div style={{ maxWidth: 1600 }}>
        <div className="jpt-a-up" style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: "clamp(1.5rem,2.6vw,1.9rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>{title}</h1>
          <p style={{ margin: "5px 0 0", fontSize: 14, color: "var(--text-muted)" }}>{sub}</p>
        </div>
        <div className="jpt-create-grid">
          <div className="jpt-a-up" style={{ ["--d" as string]: "60ms", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {controls}
          </div>
          <div className="jpt-a-up" style={{ ["--d" as string]: "120ms", minWidth: 0, display: "flex", flexDirection: "column" }}>
            {preview}
          </div>
        </div>
        {below}
      </div>
    </div>
  );
}

/** A styled native select — accessible, keyboard-friendly, and it opens the OS picker on mobile. */
export function Dropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  const current = options.find((o) => o.value === value);
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      <span style={{ position: "relative", display: "block" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "11px 36px 11px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", outline: "none" }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevronDown" size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }} />
      </span>
      {current?.hint && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.4 }}>{current.hint}</span>}
    </label>
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("That file could not be read."));
    r.readAsDataURL(file);
  });
}

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Validates and reads a picked file. Throws a readable message. */
export async function acceptImageFile(f: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (f.size > 15 * 1024 * 1024) throw new Error("That image is over 15 MB — try a smaller one.");
  return readFileAsDataUrl(f);
}

/** Downscales, then uploads to storage so the request carries a URL instead of megabytes of base64. */
export async function toSendable(src: string): Promise<{ imageUrl?: string; dataUrl?: string }> {
  if (src.startsWith("http")) return { imageUrl: src };
  const small = await prepareDataUrl(src);
  try {
    const { uploadDataUrlToSupabase } = await import("@/lib/supabase-upload");
    return { imageUrl: await uploadDataUrlToSupabase(small) };
  } catch {
    return { dataUrl: small };
  }
}

/** A drop-or-click upload tile that shows the picked image with a remove button. */
export function ImageDrop({ label, hint, value, onChange, height = 150, icon = "upload" }: { label: string; hint: string; value: string | null; onChange: (v: string | null) => void; height?: number; icon?: IconName }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const take = async (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    try { onChange(await acceptImageFile(f)); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div style={{ minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ref.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void take(e.dataTransfer.files?.[0]); }}
        className="jpt-lift"
        style={{ position: "relative", height, borderRadius: 14, border: `1.5px dashed ${over ? "var(--accent)" : value ? "transparent" : "var(--border-strong)"}`, background: over ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--text-faint)", textAlign: "center", padding: 10 }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "var(--surface-2)" }} />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              aria-label={`Remove ${label}`}
              style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(8,8,10,.72)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon name="close" size={14} />
            </button>
          </>
        ) : (
          <>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name={icon} size={20} /></span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Click or drop an image</span>
            <span style={{ fontSize: 11.5 }}>{hint}</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={ACCEPT} hidden onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600, marginTop: 6 }}>{err}</div>}
    </div>
  );
}

export function GenerateButton({ onClick, disabled, busy, label = "Generate" }: { onClick: () => void; disabled: boolean; busy: boolean; label?: string }) {
  const on = !disabled && !busy;
  return (
    <button
      onClick={onClick}
      disabled={!on}
      className={on ? "jpt-sheen" : undefined}
      style={{ width: "100%", padding: "14px", borderRadius: 13, border: "none", background: on ? "var(--grad-strong)" : "var(--surface-3)", color: on ? "#fff" : "var(--text-faint)", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: on ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: on ? "var(--glow)" : "none", transition: "background .2s ease" }}
    >
      {busy
        ? <><span className="jpt-spin" style={{ display: "inline-flex" }}><Icon name="sparkle" size={17} /></span> Generating…</>
        : <><Icon name="sparkle" size={17} /> {label} <span style={{ opacity: 0.8, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 2 }}>· <Icon name="zap" size={13} />{CREDIT_COST}</span></>}
    </button>
  );
}

export interface StudioResult { id: string; src: string; prompt: string }

/** The right-hand panel: empty state, animated progress, or the result with its actions. Fills its column's height. */
export function PreviewPanel({ busy, result, stages, emptyTitle, emptySub, frameRatio = "1 / 1", extraActions, onRegenerate }: {
  busy: boolean;
  result: StudioResult | null;
  stages: string[];
  emptyTitle: string;
  emptySub: string;
  frameRatio?: string;
  extraActions?: React.ReactNode;
  onRegenerate?: () => void;
}) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 6000);
    return () => clearInterval(t);
  }, [busy, stages.length]);

  return (
    <div style={{ flex: 1, position: "relative", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: 18, minHeight: 460, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {!busy && !result && (
        <div style={{ textAlign: "center", position: "relative", padding: 20 }}>
          <div className="jpt-a-glow" aria-hidden style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)", top: "50%", left: "50%", marginTop: -180, marginLeft: -180 }} />
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}><Icon name="image" size={28} /></div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{emptyTitle}</div>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "6px 0 0" }}>{emptySub}</p>
          </div>
        </div>
      )}

      {busy && (
        <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
          <div className="jpt-skel" style={{ aspectRatio: frameRatio, maxHeight: "60vh", margin: "0 auto", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="jpt-spin" style={{ display: "inline-flex", color: "var(--accent)" }}><Icon name="sparkle" size={30} /></span>
          </div>
          <div key={stage} className="jpt-a-pop" style={{ marginTop: 14, fontSize: 13.5, fontWeight: 700, color: "var(--text-muted)" }}>{stages[stage]}</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>This usually takes 20–60 seconds. Keep this tab open.</div>
        </div>
      )}

      {!busy && result && (
        <div key={result.id} className="jpt-a-up" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.src} alt={result.prompt || "Result"} style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 14, boxShadow: "var(--shadow-lg)", display: "block" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            <a href={result.src} download={`pixelshine-${result.id}.png`} style={actionBtn(true)}><Icon name="download" size={15} /> Download</a>
            <button onClick={() => openInEditor(result.src)} style={actionBtn(false)}><Icon name="editor" size={15} /> Edit this image</button>
            {onRegenerate && <button onClick={onRegenerate} style={actionBtn(false)}><Icon name="sparkle" size={15} /> Regenerate</button>}
            {extraActions}
          </div>
        </div>
      )}
    </div>
  );
}

export function actionBtn(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10,
    border: primary ? "none" : "1px solid var(--border)", background: primary ? "var(--grad-strong)" : "var(--surface)",
    color: primary ? "#fff" : "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: "pointer", textDecoration: "none",
  };
}

/** Thumbnails of this session's results under the preview. */
export function SessionStrip({ results, current, onPick }: { results: StudioResult[]; current: StudioResult | null; onPick: (r: StudioResult) => void }) {
  if (!results.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8 }}>This session · saved to My Creations</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {results.map((r) => (
          <button key={r.id} onClick={() => onPick(r)} className="jpt-a-pop" style={{ flex: "0 0 auto", width: 76, height: 76, padding: 0, borderRadius: 12, overflow: "hidden", border: `2px solid ${current?.id === r.id ? "var(--accent)" : "var(--border)"}`, background: "var(--surface-2)", cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * POSTs a generation and handles the shared outcomes: credits update, sign-in on
 * 401, the packs on 402/403. Returns the image, or an error message to show.
 */
export async function runGeneration(url: string, body: object, opts: { returnTo: string; reason: string; onCredits?: (n: number) => void }): Promise<{ image?: string; error?: string; handled?: boolean }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    type Body = { dataUrl?: string; error?: string; credits?: number; upgradeRequired?: boolean };
    let data: Body = {};
    try { data = await parseJsonResponse<Body>(res); } catch (e) { data = { error: (e as Error).message }; }

    if (typeof data.credits === "number") { opts.onCredits?.(data.credits); publishCredits(data.credits); }
    if (res.status === 401) { await beginGoogleSignIn(opts.returnTo); return { handled: true }; }
    if (res.status === 402 || res.status === 403 || data.upgradeRequired) { openPricing(opts.reason); return { handled: true }; }
    if (!res.ok || !data.dataUrl) return { error: userMessage(data.error, "That didn't work. Please try again.") };
    return { image: data.dataUrl };
  } catch {
    return { error: "Could not reach the server. Check your connection and try again." };
  }
}

export function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="jpt-a-pop" style={{ padding: "10px 12px", borderRadius: 10, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{text}</div>;
}
