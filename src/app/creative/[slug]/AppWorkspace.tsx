"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CreativeApp } from "@/lib/creative-apps";
import {
  TABS, presetsFor, buildPrompt, ASPECT_RATIOS, MODELS,
  type PresetTab, type Preset, type AspectRatio,
} from "@/lib/app-presets";
import { CREDIT_COST } from "@/lib/plans";
import { SHOW_PRESET_TABS, SHOW_STYLE_PICKER } from "@/lib/workspace-config";
import { trackEvent } from "@/lib/analytics";
import { persistAuthContext, savePendingContext } from "@/lib/pending-image";

const MAX_MB = 10;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

type Props = {
  app: CreativeApp;
  /** preset id -> thumbnail URL, resolved server-side from the bucket. */
  presetImages?: Record<string, string>;
  /** Sample images users can try without uploading. */
  samples?: string[];
};

export default function AppWorkspace({ app, presetImages = {}, samples = [] }: Props) {
  const [tab, setTab] = useState<PresetTab>("solo");
  const [preset, setPreset] = useState<Preset | null>(null);
  const [custom, setCustom] = useState("");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [ratio, setRatio] = useState<AspectRatio>("1:1");

  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const presets = useMemo(() => presetsFor(app, tab), [app, tab]);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; credits?: number }) => {
        if (d.authenticated) {
          setLoggedIn(true);
          if (typeof d.credits === "number") setCredits(d.credits);
        }
      })
      .catch(() => {});
  }, []);

  // Default to the first preset so Apply is never a no-op.
  useEffect(() => {
    if (tab !== "custom" && !preset && presets.length) setPreset(presets[0]);
  }, [tab, preset, presets]);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Could not read that file"));
      r.readAsDataURL(file);
    });

  const onFile = useCallback(async (file: File) => {
    setErr(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setErr("Please use a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`That image is ${(file.size / 1048576).toFixed(1)}MB — the limit is ${MAX_MB}MB.`);
      return;
    }
    const url = await readFile(file);
    setOriginal(url);
    setResult(null);
    // Keep it if they end up signing in from here.
    void savePendingContext({ image: url });
  }, []);

  const signIn = async () => {
    await persistAuthContext();
    const next = (window.location.pathname + window.location.search) || "/";
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  const apply = async () => {
    if (!original || busy) return;
    if (tab === "custom" && !custom.trim()) {
      setErr("Describe the look you want, or pick a style.");
      return;
    }
    setBusy(true);
    setErr(null);
    trackEvent("app_generate", { app: app.slug, tab, preset: preset?.id, model, ratio });

    try {
      const res = await fetch("/api/creative-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: original,
          prompt: buildPrompt(app, tab, preset, custom),
          slug: app.slug,
          model,
          aspectRatio: ratio,
        }),
      });
      const data = (await res.json()) as { dataUrl?: string; error?: string; credits?: number; upgradeRequired?: boolean };

      if (typeof data.credits === "number") setCredits(data.credits);

      if (res.status === 401) {
        await signIn();
        return;
      }
      if (!res.ok || !data.dataUrl) {
        setErr(data.error || "That didn't work. Please try again.");
        return;
      }
      setResult(data.dataUrl);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const ctlLabel: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 800, color: "var(--text-faint)",
    textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8, display: "block",
  };
  const select: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10, fontFamily: "inherit",
    background: "var(--surface-2)", color: "var(--text)",
    border: "1px solid var(--border)", fontSize: 14, fontWeight: 600, cursor: "pointer",
  };

  const canApply = !!original && !busy && (tab !== "custom" || !!custom.trim());

  return (
    <div className="jpt-workspace">
      {/* ── Control rail ─────────────────────────────────────────────────── */}
      <aside className="jpt-rail">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
        />

        {/* Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}
          style={{
            border: "1.5px dashed var(--border-strong)", borderRadius: 16,
            padding: "22px 18px", textAlign: "center", marginBottom: 16,
            background: "var(--surface-2)",
          }}
        >
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", padding: "13px", borderRadius: 999, border: "none",
              background: "var(--grad-strong)", color: "#fff", fontWeight: 800,
              fontSize: 15, fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)",
            }}
          >
            + Upload image
          </button>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 9 }}>
            JPG · PNG · WEBP, up to {MAX_MB}MB
          </div>
        </div>

        {/* Samples */}
        {samples.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>Try one of these:</span>
            {samples.slice(0, 3).map((src, i) => (
              <button
                key={i}
                onClick={() => { setOriginal(src); setResult(null); setErr(null); }}
                aria-label={`Use sample photo ${i + 1}`}
                style={{
                  width: 40, height: 40, borderRadius: 9, overflow: "hidden", padding: 0,
                  border: `1.5px solid ${original === src ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer", background: "var(--surface-2)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        {/* Tabs — hidden by SHOW_PRESET_TABS; see lib/workspace-config.ts */}
        {SHOW_PRESET_TABS && (
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", borderRadius: 999, padding: 4, marginBottom: 14 }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setPreset(null); }}
                title={t.hint}
                style={{
                  flex: 1, padding: "9px 6px", borderRadius: 999, border: "none",
                  background: on ? "var(--surface)" : "transparent",
                  color: on ? "var(--text)" : "var(--text-muted)",
                  fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer",
                  boxShadow: on ? "var(--shadow-sm)" : "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        )}

        {/* Presets, or the custom prompt box — hidden by SHOW_STYLE_PICKER */}
        {!SHOW_STYLE_PICKER ? null : tab === "custom" ? (
          <div style={{ marginBottom: 16 }}>
            <label style={ctlLabel} htmlFor="custom-prompt">Describe the look</label>
            <textarea
              id="custom-prompt"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={5}
              placeholder="e.g. 1980s studio portrait, warm tungsten light, feathered hair, beige backdrop"
              style={{ ...select, cursor: "text", resize: "vertical", lineHeight: 1.6, fontWeight: 500 }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={ctlLabel}>Style</label>
            <div className="jpt-preset-grid">
              {presets.map((p) => {
                const on = preset?.id === p.id;
                const thumb = presetImages[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p)}
                    aria-pressed={on}
                    title={p.modifier}
                    style={{
                      padding: 0, border: "none", background: "none", cursor: "pointer",
                      fontFamily: "inherit", textAlign: "center", minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: "3 / 4", borderRadius: 11, overflow: "hidden",
                        border: `2px solid ${on ? "var(--accent)" : "var(--border)"}`,
                        background: `linear-gradient(135deg, ${app.gradient[0]}, ${app.gradient[1]})`,
                        boxShadow: on ? "var(--glow)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={p.label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 20, opacity: 0.92 }}>{app.emoji}</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5, fontWeight: on ? 800 : 600, marginTop: 5,
                        color: on ? "var(--accent)" : "var(--text-muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {p.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Model + ratio */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 9, marginBottom: 14 }}>
          <div>
            <label style={ctlLabel} htmlFor="model">Model</label>
            <select id="model" value={model} onChange={(e) => setModel(e.target.value)} style={select}>
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={ctlLabel} htmlFor="ratio">Ratio</label>
            <select id="ratio" value={ratio} onChange={(e) => setRatio(e.target.value as AspectRatio)} style={select}>
              {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {err && (
          <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 10, padding: "10px 13px", fontSize: 13.5, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
            {err}
          </div>
        )}

        <button
          onClick={loggedIn ? apply : signIn}
          disabled={loggedIn && !canApply}
          style={{
            width: "100%", padding: "15px", borderRadius: 13, border: "none",
            background: loggedIn && !canApply ? "var(--surface-3)" : "var(--grad-strong)",
            color: loggedIn && !canApply ? "var(--text-faint)" : "#fff",
            fontWeight: 800, fontSize: 16, fontFamily: "inherit",
            cursor: loggedIn && !canApply ? "not-allowed" : "pointer",
            boxShadow: loggedIn && canApply ? "var(--glow)" : "none",
          }}
        >
          {!loggedIn ? "Sign in to generate" : busy ? "Generating…" : original ? "Apply" : "Upload a photo first"}
        </button>

        <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          {CREDIT_COST} credits per generation
          {credits !== null && <> · you have {credits}</>}
        </div>
      </aside>

      {/* ── Viewer ───────────────────────────────────────────────────────── */}
      <div style={{ minWidth: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", marginBottom: 10 }}>
            {app.emoji} {app.intro}
          </div>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,3rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 14px" }}>
            {app.h1}
          </h1>
          <p style={{ fontSize: "clamp(0.95rem,1.6vw,1.1rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 680, margin: "0 auto" }}>
            {app.tagline}
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 12, minHeight: 340,
          }}
        >
          {!original ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>{app.emoji}</div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                Upload a photo to start
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, maxWidth: 380, lineHeight: 1.65 }}>
                Pick a style on the left, then hit Apply. Your original stays untouched — you always see both.
              </p>
            </div>
          ) : (
            <div className="jpt-compare">
              <Pane label="Original" src={original} />
              <Pane
                label="Transformed"
                src={result}
                busy={busy}
                emptyText={busy ? "Generating…" : "Hit Apply to see the result"}
              />
            </div>
          )}
        </div>

        {result && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <a
              href={result}
              download={`${app.slug}.png`}
              style={{ padding: "12px 22px", borderRadius: 12, background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}
            >
              ⬇ Download
            </a>
            <button
              onClick={() => { setOriginal(result); setResult(null); }}
              style={{ padding: "12px 22px", borderRadius: 12, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: "pointer" }}
            >
              Use as input
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Pane({ label, src, busy, emptyText }: { label: string; src: string | null; busy?: boolean; emptyText?: string }) {
  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      <span
        style={{
          position: "absolute", top: 10, left: 10, zIndex: 2,
          background: "rgba(11,11,14,0.78)", color: "#fff", fontSize: 11.5, fontWeight: 800,
          borderRadius: 999, padding: "4px 11px", backdropFilter: "blur(6px)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          aspectRatio: "3 / 4", maxWidth: "100%", borderRadius: 14, overflow: "hidden",
          background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 13.5, color: "var(--text-faint)", fontWeight: 600, padding: 16, textAlign: "center" }}>
            {busy && <span className="jpt-spin" style={{ display: "inline-block", marginRight: 8 }}>◍</span>}
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}
