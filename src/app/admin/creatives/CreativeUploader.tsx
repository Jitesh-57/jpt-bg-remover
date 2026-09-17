"use client";

import { useRef, useState } from "react";
import { label, input, chip, chipOn, primary, danger, success } from "./AdminShell";

/**
 * Get a before/after onto an app page: drop files, or paste a link.
 *
 * The cropping and compression run here, in the browser, on the machine that
 * has the file. A creative comes out of an image tool at 3–8 MB and the pane
 * it lands in is 410 CSS px wide, so uploading the original would be slow,
 * cost storage, and still need cropping. What crosses the wire is the 40–120 KB
 * that was actually needed.
 *
 * Nothing is published until it has been looked at. Everything found is laid
 * out with the slot it will take and the name it will get, and Apply is a
 * separate press — because the failure mode of a one-click importer is a
 * wrong image on a live page, and the only cheap way to catch that is to show
 * it first.
 */

export type App = {
  slug: string; name: string; emoji: string;
  title: string; metaDescription: string; keywords: string;
  h1: string; tagline: string; intro: string; badge: string;
};

type Slot = "before" | "after" | `extra-${number}`;
type Pane = { id: string; slot: Slot; dataUrl: string; bytes: number; w: number; h: number; from: string };

const TARGET_W = 900;
const ASPECT = 4 / 5;
const QUALITY = 0.82;
const SPLIT_RATIO = 1.4;

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (typeof src !== "string") URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = url;
  });
}

/**
 * Crop to 4:5 and cap the width.
 *
 * The size comes from the source: the largest 4:5 window that fits, then
 * capped. Asking for 900×1125 flatly upscales anything smaller, which makes it
 * blurrier *and* the file bigger — both halves of the job backwards.
 */
async function toPane(img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, gravity: string) {
  let cw = sw, ch = sh;
  if (sw / sh > ASPECT) cw = sh * ASPECT; else ch = sw / ASPECT;
  const cx = sx + (sw - cw) / 2;
  const cy = gravity === "top" ? sy : gravity === "bottom" ? sy + (sh - ch) : sy + (sh - ch) / 2;
  const outW = Math.round(Math.min(cw, TARGET_W));
  const outH = Math.round(outW / ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser would not give us a canvas.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", QUALITY));
  if (!blob) throw new Error("The browser could not encode a WebP.");
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("The encoded image could not be read back."));
    fr.readAsDataURL(blob);
  });
  return { dataUrl, bytes: blob.size, w: outW, h: outH };
}

export default function CreativeUploader({ slug, token }: { apps: App[]; slug: string; token: string }) {
  const [panes, setPanes] = useState<Pane[]>([]);
  const [gravity, setGravity] = useState("centre");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const nextSlot = (taken: Slot[]): Slot => {
    if (!taken.includes("before")) return "before";
    if (!taken.includes("after")) return "after";
    for (let i = 1; i < 10; i++) if (!taken.includes(`extra-${i}` as Slot)) return `extra-${i}` as Slot;
    return "extra-9";
  };

  async function ingest(img: HTMLImageElement, from: string, g = gravity) {
    const wide = img.width / img.height >= SPLIT_RATIO;
    const made: Pane[] = [];
    const taken: Slot[] = [];
    if (wide) {
      // A side-by-side creative goes into the two panes the page already draws.
      const half = Math.floor(img.width / 2);
      const l = await toPane(img, 0, 0, half, img.height, g);
      const r = await toPane(img, img.width - half, 0, half, img.height, g);
      made.push({ id: crypto.randomUUID(), slot: "before", from, ...l });
      made.push({ id: crypto.randomUUID(), slot: "after", from, ...r });
      taken.push("before", "after");
    } else {
      const one = await toPane(img, 0, 0, img.width, img.height, g);
      made.push({ id: crypto.randomUUID(), slot: nextSlot(taken), from, ...one });
    }
    return made;
  }

  async function onFiles(files: File[]) {
    setErr(null); setDone(false);
    setBusy("Preparing…");
    try {
      let acc: Pane[] = [];
      for (const f of files) {
        const img = await loadImage(f);
        const made = await ingest(img, f.name);
        acc = [...acc, ...made];
      }
      setPanes(reslot(acc));
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  /** Re-assign slots so the list reads before, after, extra-1, extra-2… */
  function reslot(list: Pane[]): Pane[] {
    const order: Slot[] = ["before", "after", ...Array.from({ length: 8 }, (_, i) => `extra-${i + 1}` as Slot)];
    return list.map((p, i) => ({ ...p, slot: order[Math.min(i, order.length - 1)] }));
  }

  async function fromLink() {
    if (!link.trim()) return;
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    setErr(null); setNote(null); setDone(false);
    setBusy("Reading the link…");
    try {
      const res = await fetch(`/api/admin/find-images?token=${encodeURIComponent(token.trim())}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      const data = (await res.json()) as { images?: string[]; source?: string; error?: string; why?: string; fix?: string };
      if (!res.ok) throw new Error([data.error, data.why, data.fix].filter(Boolean).join(" "));
      const urls = data.images || [];
      setNote(`Found ${urls.length} image${urls.length === 1 ? "" : "s"} via ${data.source}.`);

      setBusy("Fetching images…");
      let acc: Pane[] = [];
      for (const u of urls.slice(0, 8)) {
        try {
          const img = await loadImage(u);
          acc = [...acc, ...(await ingest(img, u))];
        } catch {
          /*
            A signed link that expired between finding it and fetching it, or
            a host that refuses a cross-origin read. Skipping one is better
            than losing the rest, and the count above already says how many
            were found versus how many arrived.
          */
        }
      }
      if (!acc.length) throw new Error("Found links, but none of the images could actually be loaded — signed URLs from a share page expire quickly. Download them and drop the files in instead.");
      setPanes(reslot(acc));
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function apply() {
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    setBusy("Publishing…"); setErr(null);
    try {
      for (const p of panes) {
        const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, slot: p.slot, dataUrl: p.dataUrl }),
        });
        const d = (await res.json()) as { error?: string; fix?: string };
        if (!res.ok) throw new Error([d.error, d.fix].filter(Boolean).join(" ") || `Upload failed (${res.status}).`);
      }
      setDone(true); setPanes([]);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  const total = panes.reduce((n, p) => n + p.bytes, 0);

  return (
    <div>
      <label style={label}>Paste a link</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void fromLink(); }}
          placeholder="https://chatgpt.com/share/… or a direct image URL"
          style={{ ...input, flex: "1 1 340px" }}
        />
        <button onClick={() => void fromLink()} disabled={!!busy} style={{ ...chip, padding: "10px 18px" }}>Fetch</button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "0 0 20px", lineHeight: 1.55 }}>
        A share page is drawn by JavaScript and its image URLs are signed links that expire, so this works sometimes and
        fails clearly when it does not. A direct image URL, or dropping the files below, always works.
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden multiple
        onChange={(e) => { const f = Array.from(e.target.files || []); if (f.length) void onFiles(f); }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = Array.from(e.dataTransfer.files || []); if (f.length) void onFiles(f); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border-strong)"}`,
          background: dragging ? "var(--accent-soft)" : "var(--surface-2)",
          borderRadius: 16, padding: "32px 20px", textAlign: "center", cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 8 }}>🖼️</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{busy || "Drop the creatives here"}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 6 }}>
          A wide before/after is split down the middle · several files are fine
        </div>
      </div>

      {panes.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <span style={{ ...label, margin: 0 }}>Crop</span>
            {["centre", "top", "bottom"].map((g) => (
              <button key={g} onClick={() => setGravity(g)} style={{ ...chip, ...(gravity === g ? chipOn : {}) }}>{g}</button>
            ))}
            <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
              — “bottom” keeps a caption burned into the bottom of the frame. Re-drop to re-crop.
            </span>
          </div>

          <div style={{ ...label, marginBottom: 10 }}>
            This is what will be published — {panes.length} file{panes.length === 1 ? "" : "s"}, {kb(total)} total
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {panes.map((p, i) => (
              <figure key={p.id} style={{ margin: 0, width: 180 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={p.slot} style={{ width: 180, aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)", display: "block" }} />
                <figcaption style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6, lineHeight: 1.5 }}>
                  <code style={{ color: "var(--accent-strong)", fontWeight: 800 }}>{slug}-{p.slot}.webp</code>
                  <br />{p.w}×{p.h} · {kb(p.bytes)}
                  <br /><span style={{ opacity: 0.7 }}>from {p.from.length > 28 ? p.from.slice(0, 26) + "…" : p.from}</span>
                </figcaption>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={() => setPanes((s) => reslot(s.filter((x) => x.id !== p.id)))}
                    style={{ ...chip, padding: "4px 10px", fontSize: 11.5 }}
                  >remove</button>
                  {i > 0 && (
                    <button
                      onClick={() => setPanes((s) => { const n = [...s]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return reslot(n); })}
                      style={{ ...chip, padding: "4px 10px", fontSize: 11.5 }}
                    >← move</button>
                  )}
                </div>
              </figure>
            ))}
          </div>

          <button onClick={() => void apply()} disabled={!!busy} style={{ ...primary, marginTop: 20, opacity: busy ? 0.6 : 1 }}>
            {busy === "Publishing…" ? "Publishing…" : `Apply — publish ${panes.length} file${panes.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {note && !err && <div style={{ ...success, background: "var(--surface-2)", color: "var(--text-muted)", fontWeight: 600 }}>{note}</div>}
      {err && <div style={danger}>{err}</div>}
      {done && (
        <div style={success}>
          Published. <a href={`/creative/${slug}`} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 800 }}>Open the page ↗</a>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>
            Cached for five minutes. Stored outside the repo, so deploys leave it alone.
          </div>
        </div>
      )}
    </div>
  );
}
