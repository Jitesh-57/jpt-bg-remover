"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Drop a before/after creative onto an app and it is live in a few seconds.
 *
 * The work happens here rather than on the server because the file is here.
 * A creative comes out of an image tool at 3–8 MB and the pane it lands in is
 * 410 CSS px wide; uploading the original would be slow, would cost storage,
 * and would still need cropping. A canvas does the whole job locally, and what
 * crosses the wire is the 40–120 KB that was actually needed.
 *
 * The token is kept in localStorage so this is a one-time step. It is the
 * admin token, so this page is noindex and the value never goes anywhere but
 * the API call it authorises.
 */

type App = { slug: string; name: string; emoji: string };
type Half = "before" | "after";
type Pane = { half: Half; dataUrl: string; bytes: number; w: number; h: number };

const TARGET_W = 900;
const ASPECT = 4 / 5;
const QUALITY = 0.82;
const SPLIT_RATIO = 1.4;

function kb(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file could not be read as an image.")); };
    img.src = url;
  });
}

/**
 * Crop to 4:5 and cap the width.
 *
 * The size is worked out from the source: the largest 4:5 window that fits,
 * then capped. Asking for 900×1125 flatly would upscale anything smaller,
 * which makes it blurrier *and* the file bigger — both halves of the job
 * backwards.
 */
function toPane(img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, gravity: "centre" | "top" | "bottom"): Promise<{ dataUrl: string; bytes: number; w: number; h: number }> {
  const srcRatio = sw / sh;
  let cw = sw, ch = sh;
  if (srcRatio > ASPECT) cw = sh * ASPECT; else ch = sw / ASPECT;
  const cx = sx + (sw - cw) / 2;
  const cy = gravity === "top" ? sy : gravity === "bottom" ? sy + (sh - ch) : sy + (sh - ch) / 2;

  const outW = Math.round(Math.min(cw, TARGET_W));
  const outH = Math.round(outW / ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser would not give us a canvas to work on.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("The browser could not encode a WebP."));
        const r = new FileReader();
        r.onload = () => resolve({ dataUrl: r.result as string, bytes: blob.size, w: outW, h: outH });
        r.onerror = () => reject(new Error("The encoded image could not be read back."));
        r.readAsDataURL(blob);
      },
      "image/webp",
      QUALITY
    );
  });
}

export default function CreativeUploader({ apps }: { apps: App[] }) {
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState("");
  const [panes, setPanes] = useState<Pane[]>([]);
  const [source, setSource] = useState<{ name: string; bytes: number; w: number; h: number; split: boolean } | null>(null);
  const [gravity, setGravity] = useState<"centre" | "top" | "bottom">("centre");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFile = useRef<File | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("jpt-admin-token");
      if (t) setToken(t);
    } catch { /* blocked storage — typing it each time still works */ }
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps.slice(0, 12);
    return apps.filter((a) => a.slug.includes(q) || a.name.toLowerCase().includes(q)).slice(0, 12);
  }, [apps, query]);

  const selected = apps.find((a) => a.slug === slug) || null;

  async function process(file: File, g = gravity) {
    setErr(null);
    setDone(null);
    lastFile.current = file;
    try {
      const img = await loadImage(file);
      const wide = img.width / img.height >= SPLIT_RATIO;
      const out: Pane[] = [];
      if (wide) {
        // A side-by-side creative: the two halves land in the two panes the
        // app page already draws, so the labels stay honest.
        const half = Math.floor(img.width / 2);
        const left = await toPane(img, 0, 0, half, img.height, g);
        const right = await toPane(img, img.width - half, 0, half, img.height, g);
        out.push({ half: "before", ...left }, { half: "after", ...right });
      } else {
        const one = await toPane(img, 0, 0, img.width, img.height, g);
        out.push({ half: "after", ...one });
      }
      setPanes(out);
      setSource({ name: file.name, bytes: file.size, w: img.width, h: img.height, split: wide });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function reGravity(g: "centre" | "top" | "bottom") {
    setGravity(g);
    if (lastFile.current) void process(lastFile.current, g);
  }

  async function upload() {
    if (!slug || !panes.length) return;
    if (!token.trim()) { setErr("Paste the admin token first."); return; }
    setBusy(true);
    setErr(null);
    try {
      for (const p of panes) {
        const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, half: p.half, dataUrl: p.dataUrl }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; fix?: string };
        if (!res.ok) throw new Error([data.error, data.fix].filter(Boolean).join(" ") || `Upload failed (${res.status}).`);
      }
      try { localStorage.setItem("jpt-admin-token", token.trim()); } catch { /* fine */ }
      setDone(`/creative/${slug}`);
      setPanes([]);
      setSource(null);
      lastFile.current = null;
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const total = panes.reduce((n, p) => n + p.bytes, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Creatives</h1>
        <p style={{ margin: "0 0 26px", color: "var(--text-muted)", fontSize: 14.5, lineHeight: 1.6 }}>
          Pick an app, drop a before/after image. It is cropped and compressed here in the browser, then
          stored — live on the page within a few minutes, no deploy.
        </p>

        <label style={label}>Admin token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_IMAGE_TOKEN"
          style={{ ...input, maxWidth: 420, marginBottom: 22 }}
        />

        <label style={label}>App</label>
        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <span style={{ fontSize: 20 }}>{selected.emoji}</span>
            <strong style={{ fontSize: 15 }}>{selected.name}</strong>
            <code style={{ fontSize: 12, color: "var(--text-faint)" }}>{selected.slug}</code>
            <button onClick={() => { setSlug(""); setPanes([]); setSource(null); }} style={linkBtn}>change</button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${apps.length} apps — name or slug`}
              style={{ ...input, maxWidth: 420 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 22px" }}>
              {matches.map((a) => (
                <button key={a.slug} onClick={() => setSlug(a.slug)} style={chip}>
                  {a.emoji} {a.name}
                </button>
              ))}
              {!matches.length && <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Nothing matches “{query}”.</span>}
            </div>
          </>
        )}

        {slug && (
          <>
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void process(f); }} />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void process(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border-strong)"}`,
                background: dragging ? "var(--accent-soft)" : "var(--surface-2)",
                borderRadius: 16, padding: "34px 20px", textAlign: "center", cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Drop the creative here</div>
              <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 6 }}>
                A wide before/after is split down the middle · anything else becomes the After pane
              </div>
            </div>
          </>
        )}

        {source && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              <strong style={{ color: "var(--text)" }}>{source.name}</strong> — {source.w}×{source.h}, {kb(source.bytes)}
              {source.split ? " · split into two panes" : " · used as the After pane"}
              {" → "}
              <strong style={{ color: "var(--success)" }}>{kb(total)}</strong> total
              {" "}({Math.round((1 - total / source.bytes) * 100)}% smaller)
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ ...label, margin: 0 }}>Crop</span>
              {(["centre", "top", "bottom"] as const).map((g) => (
                <button key={g} onClick={() => reGravity(g)} style={{ ...chip, ...(gravity === g ? chipOn : {}) }}>{g}</button>
              ))}
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                — use “bottom” to keep a caption burned into the bottom of the frame
              </span>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {panes.map((p) => (
                <figure key={p.half} style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={p.half} style={{ width: 180, aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)", display: "block" }} />
                  <figcaption style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 800 }}>
                    {p.half} · {p.w}×{p.h} · {kb(p.bytes)}
                  </figcaption>
                </figure>
              ))}
            </div>

            <button onClick={() => void upload()} disabled={busy} style={{ ...primary, marginTop: 20, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Uploading…" : `Publish ${panes.length === 2 ? "both panes" : "the After pane"}`}
            </button>
          </div>
        )}

        {err && <div style={danger}>{err}</div>}
        {done && (
          <div style={success}>
            Published. <a href={done} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 800 }}>Open {done} →</a>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>
              The page caches for five minutes, so give it a moment or hard-refresh.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)", marginBottom: 7 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, fontFamily: "inherit", fontSize: 14, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)" };
const chip: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "7px 12px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)" };
const chipOn: React.CSSProperties = { background: "var(--accent-soft)", borderColor: "var(--accent-border)", color: "var(--accent-strong)" };
const linkBtn: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", background: "none", border: "none", padding: 0, fontSize: 12.5, fontWeight: 700, color: "var(--accent-strong)", textDecoration: "underline" };
const primary: React.CSSProperties = { cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 12, padding: "13px 22px", fontSize: 15, fontWeight: 800, background: "var(--grad-strong)", color: "#fff", boxShadow: "var(--glow)" };
const danger: React.CSSProperties = { marginTop: 18, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.55 };
const success: React.CSSProperties = { marginTop: 18, background: "var(--success-soft)", color: "var(--success)", borderRadius: 10, padding: "12px 15px", fontSize: 14, fontWeight: 700, lineHeight: 1.5 };
