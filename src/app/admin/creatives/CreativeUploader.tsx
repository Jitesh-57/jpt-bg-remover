"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fileNameFor, imageUrlFor, type PageTarget } from "@/lib/page-target";
import type { PageOverride, ShowcaseImage } from "@/lib/overrides";
import { label, input, chip, chipOn, primary, danger, success, linkBtn } from "./AdminShell";

/**
 * The images on one page: what is there now, and what is about to be.
 *
 * Built around the sections rather than around the files. A list of dropped
 * images each carrying a dropdown answered "where does this go?" but never
 * "what is on the page right now?" — so replacing one image meant remembering
 * which slot it was in. Now every section is a card showing its current image,
 * and putting a new one in is a choice made on that card.
 *
 * Cropping and compression run here, in the browser, on the machine that has
 * the file. A creative comes out of an image tool at 3–8 MB and the page draws
 * it about 1000px wide, so what crosses the wire is the 40–120 KB that was
 * actually needed.
 *
 * Nothing is published until it has been looked at: a pending image sits in its
 * card until Apply, because the failure mode of a one-click importer is a wrong
 * image on a live page and the only cheap way to catch that is to show it
 * first. Removing is immediate, because it is one thing, it is reversible by
 * uploading again, and it is asked for by name.
 */

export type App = {
  slug: string; name: string; emoji: string;
  title: string; metaDescription: string; keywords: string;
  h1: string; tagline: string; intro: string; badge: string;
};

type Section = {
  id: string;
  label: string;
  hint: string;
  /** Legacy slots are shown when they hold a file, but nothing new goes in. */
  legacy?: boolean;
};

/**
 * The sections of a page, in the order they appear on it.
 *
 * A creative app page leads with one image. It used to be two 4:5 panes with
 * BEFORE and AFTER drawn over them, which cut a finished creative — already a
 * before and after, with its own labels — into two windows that destroyed it.
 * Those two are still listed when a page has them, so they can be seen and
 * cleared, but nothing new is put in them.
 */
function sectionsFor(target: PageTarget): Section[] {
  const gallery = Array.from({ length: 6 }, (_, i) => ({
    id: `showcase-${i + 1}`,
    label: target.slug ? `More examples · ${i + 1}` : `Gallery · ${i + 1}`,
    hint: "Published whole",
  }));
  if (!target.slug) return gallery;
  return [
    { id: "main", label: "Main creative", hint: "One image, top of the page, published whole" },
    ...gallery,
    { id: "before", label: "Old pane · Before", hint: "Replaced by the main creative", legacy: true },
    { id: "after", label: "Old pane · After", hint: "Replaced by the main creative", legacy: true },
  ];
}

/** An image waiting to be published into a section. */
type Pending = { dataUrl: string; bytes: number; w: number; h: number; from: string };

/** What a section holds: what is live, and what is about to replace it. */
type Live = { url: string; w: number; h: number; width?: number };

const CAP = 1400;
const QUALITY = 0.82;
const WIDTHS = [100, 75, 50];

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    // The object URL is not revoked: it is what the preview is drawn from
    // until the file is published, and releasing it leaves a broken thumbnail.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be read."));
    img.src = url;
  });
}

/**
 * The whole image, capped and re-encoded — never cropped.
 *
 * Every section publishes whole now. A finished creative is often 1500px wide
 * or more and the page draws it at about 1000, so capping and re-encoding is
 * worth doing; reframing is not ours to do.
 */
async function prepare(img: HTMLImageElement, from: string): Promise<Pending> {
  const w = Math.round(Math.min(img.width, CAP));
  const h = Math.round((w / img.width) * img.height);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser would not give us a canvas.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", QUALITY));
  if (!blob) throw new Error("The browser could not encode a WebP.");
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("The encoded image could not be read back."));
    fr.readAsDataURL(blob);
  });
  return { dataUrl, bytes: blob.size, w, h, from };
}

/** Does a file exist at this URL? The only way to ask storage from here. */
function probe(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function CreativeUploader({ target, token }: { target: PageTarget; token: string }) {
  const sections = useMemo(() => sectionsFor(target), [target]);

  const [live, setLive] = useState<Record<string, Live>>({});
  const [pending, setPending] = useState<Record<string, Pending>>({});
  const [pool, setPool] = useState<{ id: string; img: HTMLImageElement; from: string }[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const [heading, setHeading] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  /*
    What is on the page right now, asked the way the page itself asks.

    The main creative and the gallery are drawn from the overrides document, so
    the document is what decides whether they are there — a file left behind by
    a half-failed delete is not on the page, and showing it here as live would
    be a lie the page disagrees with.

    The old cropped pair predates that document and is only a file, so those
    two are found the only way a browser can find them: try to load it and see.
  */
  const refresh = useCallback(async () => {
    setLoading(true);
    const found: Record<string, Live> = {};
    let entry: PageOverride | undefined;
    if (token.trim()) {
      try {
        const res = await fetch(`/api/admin/overrides?token=${encodeURIComponent(token.trim())}`);
        if (res.ok) {
          const doc = (await res.json()) as { pages?: Record<string, PageOverride> };
          entry = doc.pages?.[target.key];
        }
      } catch { /* the probe below still finds the files */ }
    }
    setHeading((entry?.galleryTitle || "").trim());

    // Cache-busted, so a replace or a removal shows here immediately rather
    // than whenever the five-minute window happens to turn over.
    const stamp = Date.now();
    const record = (x: ShowcaseImage) => {
      found[x.slot] = { url: `${imageUrlFor(target.key, x.slot)}?t=${stamp}`, w: x.w, h: x.h, width: x.width };
    };
    if (entry?.main) record(entry.main);
    for (const x of entry?.showcase || []) record(x);

    await Promise.all(sectionsFor(target).filter((sec) => sec.legacy).map(async (sec) => {
      const url = `${imageUrlFor(target.key, sec.id)}?t=${stamp}`;
      const size = await probe(url);
      if (size) found[sec.id] = { url, w: size.w, h: size.h };
    }));
    setLive(found);
    setLoading(false);
  }, [target, token]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addFiles(files: File[], slot?: string) {
    setErr(null); setDone(null); setBusy("Reading…");
    try {
      for (const f of files) {
        const img = await loadImage(f);
        if (slot) {
          const ready = await prepare(img, f.name);
          setPending((s) => ({ ...s, [slot]: ready }));
          setPicking(null);
          break; // one file per section
        }
        setPool((s) => [...s, { id: crypto.randomUUID(), img, from: f.name }]);
      }
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function assign(slot: string, item: { img: HTMLImageElement; from: string }) {
    setBusy("Preparing…"); setDone(null);
    try {
      const ready = await prepare(item.img, item.from);
      setPending((s) => ({ ...s, [slot]: ready }));
      setPicking(null);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function fromLink() {
    if (!link.trim()) return;
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    setErr(null); setNote(null); setDone(null); setBusy("Reading the link…");
    try {
      const res = await fetch(`/api/admin/find-images?token=${encodeURIComponent(token.trim())}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      const data = (await res.json()) as { images?: string[]; source?: string; error?: string; why?: string; fix?: string };
      if (!res.ok) throw new Error([data.error, data.why, data.fix].filter(Boolean).join(" "));
      const urls = data.images || [];
      setBusy(`Fetching ${urls.length} image${urls.length === 1 ? "" : "s"}…`);
      const loaded: { id: string; img: HTMLImageElement; from: string }[] = [];
      for (const u of urls.slice(0, 12)) {
        try { loaded.push({ id: crypto.randomUUID(), img: await loadImage(u), from: u }); }
        catch { /* a signed URL that expired, or a host refusing a cross-origin read */ }
      }
      setNote(`Found ${urls.length} via ${data.source}; ${loaded.length} loaded. Put each one into a section below.`);
      if (!loaded.length) throw new Error("None of those images could be loaded — share-page URLs are signed and expire quickly. Right-click the image in ChatGPT, copy its address, and paste that; or download and drop the files in.");
      setPool((s) => [...s, ...loaded]);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function apply() {
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    const slots = Object.keys(pending);
    if (!slots.length) { setErr("Nothing to publish — put an image into a section first."); return; }
    setBusy("Publishing…"); setErr(null);
    try {
      const names: string[] = [];
      for (const slot of slots) {
        const p = pending[slot];
        const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: target.key, slot, dataUrl: p.dataUrl, w: p.w, h: p.h,
            galleryTitle: heading.trim() || undefined,
          }),
        });
        const d = (await res.json()) as { error?: string; detail?: string; fix?: string };
        if (!res.ok) throw new Error([d.error, d.detail, d.fix].filter(Boolean).join(" ") || `Upload failed (${res.status}).`);
        names.push(fileNameFor(target.key, slot));
      }
      setDone(names);
      setPending({});
      setPool([]);
      await refresh();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  }

  async function remove(slot: string) {
    const sec = sections.find((s) => s.id === slot);
    if (!confirm(`Remove the image in “${sec?.label}”? The page falls back to its built-in artwork.`)) return;
    setBusy("Removing…"); setErr(null); setDone(null);
    try {
      const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: target.key, slot }),
      });
      const d = (await res.json()) as { error?: string; detail?: string };
      if (!res.ok) throw new Error([d.error, d.detail].filter(Boolean).join(" ") || `Remove failed (${res.status}).`);
    } catch (e) { setErr((e as Error).message); }
    finally {
      setBusy(null);
      // Re-read either way. A delete that half-succeeded — the record gone, the
      // file still there — leaves the page and this panel disagreeing unless
      // the panel goes and looks again.
      await refresh();
    }
  }

  async function resize(slot: string, width: number) {
    setErr(null); setDone(null);
    const before = live[slot];
    setLive((s) => ({ ...s, [slot]: { ...s[slot], width } }));
    try {
      const res = await fetch(`/api/admin/creative-upload?token=${encodeURIComponent(token.trim())}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: target.key, slot, width }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(d.error || `Could not change the width (${res.status}).`);
    } catch (e) {
      setErr((e as Error).message);
      setLive((s) => ({ ...s, [slot]: before }));
    }
  }

  const pendingCount = Object.keys(pending).length;
  const pendingBytes = Object.values(pending).reduce((n, p) => n + p.bytes, 0);
  const shown = sections.filter((s) => !s.legacy || live[s.id] || pending[s.id]);

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
        {target.slug
          ? <>Sections of <strong>{target.path}</strong>. The main creative is one whole image — no before/after halves.</>
          : <>Sections of <strong>{target.path}</strong>. Whole images, in a row above the footer.</>}
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
        Everything found lands in the tray below, then goes into whichever section you choose. A direct image URL, or
        dropping files, always works; a share page is drawn by JavaScript and its image URLs expire.
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden multiple
        onChange={(e) => {
          const f = Array.from(e.target.files || []);
          const slot = fileRef.current?.dataset.slot || undefined;
          if (f.length) void addFiles(f, slot);
          e.target.value = "";
        }} />

      {pool.length > 0 && (
        <div style={{ marginBottom: 22, padding: 14, border: "1px dashed var(--border-strong)", borderRadius: 14 }}>
          <span style={{ ...label, marginBottom: 10 }}>Tray — {pool.length} image{pool.length === 1 ? "" : "s"} not placed yet</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {pool.map((it) => (
              <div key={it.id} style={{ width: 96 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.img.src} alt="" style={{ width: "100%", borderRadius: 8, display: "block", background: "var(--surface-2)" }} />
                <button onClick={() => setPool((s) => s.filter((x) => x.id !== it.id))} style={{ ...linkBtn, fontSize: 11, marginTop: 4 }}>discard</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <span style={{ ...label, marginBottom: 12 }}>
        {/* Counted over what is on screen: the old panes are only listed when
            they hold something, so counting all of them reads as wrong. */}
        Sections {loading ? "— checking what is on the page…" : `— ${Object.keys(live).length} of ${shown.length} filled`}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
        {shown.map((sec) => {
          const has = live[sec.id];
          const next = pending[sec.id];
          return (
            <div
              key={sec.id}
              style={{
                background: "var(--surface)", borderRadius: 14, padding: 13,
                border: `1px solid ${next ? "var(--accent-border)" : has ? "var(--border-strong)" : "var(--border)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 13.5 }}>{sec.label}</strong>
                {next && <span style={{ fontSize: 10.5, fontWeight: 900, color: "var(--accent-strong)", letterSpacing: "0.06em" }}>PENDING</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", margin: "3px 0 9px" }}>{sec.hint}</div>

              <div style={{
                position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--surface-2)",
                aspectRatio: next ? `${next.w} / ${next.h}` : has ? `${has.w} / ${has.h}` : "4 / 3",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {next || has ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={next ? next.dataUrl : has.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{loading ? "…" : "empty"}</span>
                )}
              </div>

              <div style={{ fontSize: 11, color: "var(--text-faint)", margin: "8px 0 9px", lineHeight: 1.5 }}>
                {next ? <>{next.w}×{next.h} · {kb(next.bytes)} · <code style={{ color: "var(--accent-strong)", fontWeight: 800 }}>{fileNameFor(target.key, sec.id)}</code></>
                  : has ? <>{has.w}×{has.h} · live</>
                  : <>nothing published</>}
              </div>

              {/* Replacing is a choice made here, on the section, not on the image. */}
              {!sec.legacy && (
                picking === sec.id ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {pool.map((it) => (
                      <button key={it.id} onClick={() => void assign(sec.id, it)} title={it.from}
                        style={{ padding: 0, border: "1px solid var(--accent-border)", borderRadius: 6, background: "none", cursor: "pointer", lineHeight: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.img.src} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 5, display: "block" }} />
                      </button>
                    ))}
                    <button onClick={() => { if (fileRef.current) { fileRef.current.dataset.slot = sec.id; fileRef.current.click(); } }} style={{ ...chip, fontSize: 11.5, padding: "5px 10px" }}>
                      choose a file…
                    </button>
                    <button onClick={() => setPicking(null)} style={linkBtn}>cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={() => { setPicking(sec.id); if (!pool.length && fileRef.current) { fileRef.current.dataset.slot = sec.id; fileRef.current.click(); } }}
                      style={{ ...chip, fontSize: 12, padding: "6px 12px" }}>
                      {has || next ? "Replace" : "Add image"}
                    </button>
                    {next && <button onClick={() => setPending((s) => { const n = { ...s }; delete n[sec.id]; return n; })} style={linkBtn}>undo</button>}
                    {has && <button onClick={() => void remove(sec.id)} disabled={!!busy} style={{ ...linkBtn, color: "var(--danger)" }}>remove</button>}
                  </div>
                )
              )}
              {sec.legacy && has && (
                <button onClick={() => void remove(sec.id)} disabled={!!busy} style={{ ...linkBtn, color: "var(--danger)" }}>remove</button>
              )}

              {/* Width is a property of what is live, so it is set on what is live. */}
              {has && !sec.legacy && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 10.5, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "0.06em" }}>WIDTH</span>
                  {WIDTHS.map((w) => (
                    <button key={w} onClick={() => void resize(sec.id, w)}
                      style={{ ...chip, fontSize: 11, padding: "3px 9px", ...((has.width || 100) === w ? chipOn : {}) }}>
                      {w}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!target.slug && (
        <div style={{ marginTop: 22, maxWidth: 420 }}>
          <label style={label}>Heading above the images</label>
          <input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Examples" style={input} />
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "7px 0 0" }}>
            Left blank, the row is headed “Examples”. Saved with the images.
          </p>
        </div>
      )}

      <button
        onClick={() => void apply()}
        disabled={!!busy || !pendingCount}
        style={{ ...primary, marginTop: 22, opacity: busy || !pendingCount ? 0.55 : 1 }}
      >
        {busy || (pendingCount
          ? `Apply — publish ${pendingCount} image${pendingCount === 1 ? "" : "s"} (${kb(pendingBytes)})`
          : "Nothing to publish")}
      </button>

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
