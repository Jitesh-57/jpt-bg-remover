"use client";

import { useMemo, useRef, useState } from "react";
import { fileNameFor, type PageTarget } from "@/lib/page-target";
import { label, input, chip, chipOn, primary, danger, success } from "./AdminShell";

/**
 * Get images onto a page: drop files, or paste a link.
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

type Section = { id: string; label: string; crop: boolean };
type Slot = string;

/**
 * Where an image can go on this page, and what happens to it there.
 *
 * Which sections exist depends on the page, because the sections are real
 * places in real templates. A creative app page draws two panes side by side,
 * so those two are cropped to the 4:5 they render at. Every other page has the
 * gallery and nothing else — offering it a "before" pane would store a file
 * that page has no place to show.
 *
 * Gallery images are published whole: they are finished creatives with their
 * own before/after labels, and cropping one cuts the thing that makes it
 * readable.
 */
function sectionsFor(target: PageTarget): Section[] {
  const gallery = Array.from({ length: 6 }, (_, i) => ({
    id: `showcase-${i + 1}`,
    label: target.slug ? `More examples · ${i + 1}` : `Gallery · ${i + 1}`,
    crop: false,
  }));
  if (!target.slug) return gallery;
  return [
    { id: "before", label: "Main · Before", crop: true },
    { id: "after", label: "Main · After", crop: true },
    ...gallery,
  ];
}

/** One image in the pool: the original, plus whatever section it is bound for. */
type Item = {
  id: string;
  slot: Slot;
  from: string;
  img: HTMLImageElement;
  /** What will actually be uploaded, recomputed whenever the section changes. */
  out: { dataUrl: string; bytes: number; w: number; h: number } | null;
  busy?: boolean;
};

const TARGET_W = 900;
const ASPECT = 4 / 5;
const QUALITY = 0.82;

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

/*
  The object URL is deliberately not revoked.

  It used to be released as soon as the image had decoded, which was fine when
  every dropped file was cropped and previewed from its own data URL straight
  away. Now files arrive unassigned and are previewed from `img.src` until a
  section is chosen — so revoking it left a row of broken thumbnails at exactly
  the moment someone is trying to tell one image from another. What it costs is
  a handful of blobs held for the life of an admin tab.
*/
function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
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

/**
 * The whole image, capped and re-encoded — no crop.
 *
 * A finished creative is often 1500px wide or more; the page shows it at about
 * 1000. Capping and re-encoding is worth doing, reframing is not.
 */
async function toWhole(img: HTMLImageElement) {
  const outW = Math.round(Math.min(img.width, 1400));
  const outH = Math.round((outW / img.width) * img.height);
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser would not give us a canvas.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, outW, outH);
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

export default function CreativeUploader({ target, token }: { target: PageTarget; token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [gravity, setGravity] = useState("centre");
  const [link, setLink] = useState("");
  const [heading, setHeading] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sections = useMemo(() => sectionsFor(target), [target]);
  const crops = (slot: Slot) => sections.find((x) => x.id === slot)?.crop ?? false;

  /** Recompute one item's output for whatever section it is now bound for. */
  async function render(it: Item, g = gravity): Promise<Item> {
    if (!it.slot) return { ...it, out: null };
    try {
      const out = crops(it.slot)
        ? await toPane(it.img, 0, 0, it.img.width, it.img.height, g)
        : await toWhole(it.img);
      return { ...it, out };
    } catch {
      return { ...it, out: null };
    }
  }

  async function addImages(loaded: { img: HTMLImageElement; from: string }[]) {
    /*
      Nothing is assigned automatically.

      Guessing which of six images is the "after" is a guess that looks right
      until it is wrong on a live page, and the cost of being wrong is higher
      than the cost of two clicks. Everything arrives unassigned and waits.
    */
    const fresh: Item[] = loaded.map(({ img, from }) => ({
      id: crypto.randomUUID(), slot: "", from, img, out: null,
    }));
    setItems((s) => [...s, ...fresh]);
  }

  /*
    The item is passed in, not looked up.

    Finding it by id meant reading `items` — from the closure, which goes
    stale when several selects change in quick succession, or from inside a
    state updater, which is a side effect in a function React may call twice.
    The select that fires this already has the item in scope, and that one is
    always the current one.
  */
  async function setSlot(it: Item, slot: Slot) {
    setItems((s) => s.map((x) => (x.id === it.id ? { ...x, slot, busy: true } : x)));
    const next = await render({ ...it, slot });
    setItems((s) => s.map((x) => (x.id === it.id ? { ...next, busy: false } : x)));
    setDone(null);
  }

  async function reGravity(g: string) {
    setGravity(g);
    setBusy("Re-cropping…");
    const next = await Promise.all(items.map((it) => (crops(it.slot) ? render(it, g) : Promise.resolve(it))));
    setItems(next);
    setBusy(null);
  }

  async function onFiles(files: File[]) {
    setErr(null); setDone(null); setBusy("Reading…");
    try {
      const loaded = [];
      for (const f of files) loaded.push({ img: await loadImage(f), from: f.name });
      await addImages(loaded);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function fromLink() {
    if (!link.trim()) return;
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    setErr(null); setNote(null); setDone(null);
    setBusy("Reading the link…");
    try {
      const res = await fetch(`/api/admin/find-images?token=${encodeURIComponent(token.trim())}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      const data = (await res.json()) as { images?: string[]; source?: string; error?: string; why?: string; fix?: string };
      if (!res.ok) throw new Error([data.error, data.why, data.fix].filter(Boolean).join(" "));
      const urls = data.images || [];

      setBusy(`Fetching ${urls.length} image${urls.length === 1 ? "" : "s"}…`);
      const loaded: { img: HTMLImageElement; from: string }[] = [];
      for (const u of urls.slice(0, 12)) {
        try { loaded.push({ img: await loadImage(u), from: u }); }
        catch {
          /*
            A signed URL that expired between being found and being fetched, or
            a host refusing a cross-origin read. One failure should not lose the
            rest — the count below says how many were found against how many
            arrived, which is the number that matters.
          */
        }
      }
      setNote(`Found ${urls.length} via ${data.source}; ${loaded.length} loaded. Assign each one to a section below.`);
      if (!loaded.length) throw new Error("None of those images could be loaded — share-page URLs are signed and expire quickly. Right-click the image in ChatGPT, copy its address, and paste that; or download and drop the files in.");
      await addImages(loaded);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function apply() {
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    const ready = items.filter((i) => i.slot && i.out);
    const waiting = items.filter((i) => i.slot && !i.out).length;
    if (waiting) { setErr(`${waiting} image${waiting === 1 ? " is" : "s are"} still being prepared — give it a moment.`); return; }
    if (!ready.length) { setErr("Assign at least one image to a section first."); return; }
    setBusy("Publishing…"); setErr(null);
    try {
      const names: string[] = [];
      for (const it of ready) {
        const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: target.key, slot: it.slot,
            dataUrl: it.out!.dataUrl, w: it.out!.w, h: it.out!.h,
            galleryTitle: heading.trim() || undefined,
          }),
        });
        const d = (await res.json()) as { error?: string; detail?: string; fix?: string };
        if (!res.ok) throw new Error([d.error, d.detail, d.fix].filter(Boolean).join(" ") || `Upload failed (${res.status}).`);
        names.push(fileNameFor(target.key, it.slot));
      }
      setDone(names);
      setItems((s) => s.filter((i) => !(i.slot && i.out)));
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  const taken = new Set(items.filter((i) => i.slot).map((i) => i.slot));
  const ready = items.filter((i) => i.slot && i.out);
  const total = ready.reduce((n, i) => n + (i.out?.bytes ?? 0), 0);
  /*
    An image still encoding is not publishable, and Apply must wait for it.

    Pressing Apply a moment after assigning the last section published two of
    three and reported success — the third was mid-encode, so it was simply
    not in the list. Silently shipping fewer images than are on screen is the
    worst kind of wrong, because nothing about the result says so.
  */
  const preparing = items.some((i) => i.busy);
  const assigned = items.filter((i) => i.slot).length;

  return (
    <div>
      {/*
        Said out loud, because the same panel now serves two different page
        shapes and the sections on offer are the only other clue.
      */}
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
        {target.slug
          ? <>Images go to <strong>{target.path}</strong>: the two panes at the top, plus a “More examples” row below them.</>
          : <>Images go to <strong>{target.path}</strong>, in a row above the footer. Whole images, no cropping.</>}
      </p>

      <label style={label}>Paste a link</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void fromLink(); }}
          placeholder="https://chatgpt.com/share/… or a direct image URL"
          style={{ ...input, flex: "1 1 340px" }}
        />
        <button onClick={() => void fromLink()} disabled={!!busy} style={{ ...chip, padding: "10px 18px" }}>Fetch all images</button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "0 0 20px", lineHeight: 1.55 }}>
        Everything found is listed below, unassigned. A share page is drawn by JavaScript and its image URLs are signed
        links that expire, so this works sometimes and says so clearly when it does not — a direct image URL, or dropping
        files, always works.
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
          borderRadius: 16, padding: "30px 20px", textAlign: "center", cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 8 }}>🖼️</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{busy || "Drop images here"}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 6 }}>Several at once is fine</div>
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {/*
            Nothing on a non-app page is cropped, so there is no crop to aim.
            A control that does nothing is worse than no control.
          */}
          {sections.some((x) => x.crop) && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ ...label, margin: 0 }}>Crop for the main pair</span>
              {["centre", "top", "bottom"].map((g) => (
                <button key={g} onClick={() => void reGravity(g)} style={{ ...chip, ...(gravity === g ? chipOn : {}) }}>{g}</button>
              ))}
              <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
                — only Main · Before/After are cropped to 4:5. Everything else is published whole.
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(210px, 100%), 1fr))", gap: 16 }}>
            {items.map((it) => (
              <div key={it.id} style={{ background: "var(--surface)", border: `1px solid ${it.slot ? "var(--accent-border)" : "var(--border)"}`, borderRadius: 14, padding: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.out?.dataUrl || it.img.src}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: crops(it.slot) ? "4 / 5" : `${it.img.width} / ${it.img.height}`,
                    objectFit: crops(it.slot) ? "cover" : "contain",
                    borderRadius: 10, background: "var(--surface-2)", display: "block",
                  }}
                />
                <select
                  value={it.slot}
                  onChange={(e) => void setSlot(it, e.target.value as Slot)}
                  style={{ ...input, marginTop: 10, padding: "8px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <option value="">— choose a section —</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id} disabled={taken.has(sec.id) && it.slot !== sec.id}>
                      {sec.label}{sec.crop ? " (cropped 4:5)" : " (whole image)"}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 7, lineHeight: 1.5 }}>
                  {it.busy ? "preparing…" : it.out ? (
                    <>
                      <code style={{ color: "var(--accent-strong)", fontWeight: 800 }}>{fileNameFor(target.key, it.slot)}</code>
                      <br />{it.out.w}×{it.out.h} · {kb(it.out.bytes)}
                    </>
                  ) : (
                    <>{it.img.width}×{it.img.height} · not assigned</>
                  )}
                  <br /><span style={{ opacity: 0.7 }}>from {it.from.length > 26 ? it.from.slice(0, 24) + "…" : it.from}</span>
                </div>
                <button onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))} style={{ ...chip, padding: "4px 10px", fontSize: 11.5, marginTop: 8 }}>remove</button>
              </div>
            ))}
          </div>

          {/*
            The app template already heads its row "More examples". Every other
            page gets whatever this says, because "Examples" over a pricing page
            reads like a mistake.
          */}
          {!target.slug && (
            <div style={{ marginTop: 22, maxWidth: 420 }}>
              <label style={label}>Heading above the images</label>
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Examples"
                style={input}
              />
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "7px 0 0" }}>
                Left blank, the row is headed “Examples”. Saved with the images.
              </p>
            </div>
          )}

          <button
            onClick={() => void apply()}
            disabled={!!busy || preparing || !ready.length || ready.length !== assigned}
            style={{ ...primary, marginTop: 22, opacity: busy || preparing || !ready.length ? 0.55 : 1 }}
          >
            {busy === "Publishing…" ? "Publishing…"
              : preparing || ready.length !== assigned ? `Preparing ${assigned - ready.length} more…`
              : ready.length ? `Apply — publish ${ready.length} image${ready.length === 1 ? "" : "s"} (${kb(total)})`
              : "Assign a section to publish"}
          </button>
        </div>
      )}

      {note && !err && <div style={{ ...success, background: "var(--surface-2)", color: "var(--text-muted)", fontWeight: 600 }}>{note}</div>}
      {err && <div style={danger}>{err}</div>}
      {done && (
        <div style={success}>
          Published {done.length}: <code style={{ fontWeight: 700 }}>{done.join(", ")}</code>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>
            <a href={target.path} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 800 }}>Open {target.path} ↗</a>
            {" "}— cached for five minutes. Stored outside the repo, so deploys leave it alone.
          </div>
        </div>
      )}
    </div>
  );
}
