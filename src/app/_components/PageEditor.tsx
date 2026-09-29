"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOBAL_SCOPE, normPath, normText, type PageEdits } from "@/lib/page-edits";
import { hasBackgroundImage, imageKeyOf, imageSrcOf, originalText } from "./site-edits-core";

/**
 * The visual page editor. Open any page with ?jpt_edit=1 (the admin's
 * "Page editor" tab does this), then click any text or image to change it.
 *
 * Each change is saved for "this page" or "every page" — the header and
 * footer are on every page, so a change there usually wants the second.
 * Clicks are captured while editing, so links and buttons don't fire; switch
 * to Browse to move between pages without leaving edit mode.
 */

type Sel =
  | { kind: "text"; node: Text; original: string; value: string }
  | { kind: "image"; el: Element; key: string; src: string; file?: { dataUrl: string; preview: string; bytes: number; w: number; h: number }; blog?: { slug: string; slot: string } };

const TOKEN_KEY = "jpt-admin-token";
const CAP = 2000;

async function toWebp(file: File): Promise<{ dataUrl: string; preview: string; bytes: number; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That file isn't an image this browser can read."));
      i.src = url;
    });
    const scale = Math.min(1, CAP / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("This browser wouldn't give us a canvas.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.88));
    if (!blob) throw new Error("The browser couldn't encode the image.");
    const dataUrl = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(blob); });
    return { dataUrl, preview: dataUrl, bytes: blob.size, w: c.width, h: c.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function textNodeAt(x: number, y: number): Text | null {
  const d = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null };
  const node = d.caretRangeFromPoint?.(x, y)?.startContainer ?? d.caretPositionFromPoint?.(x, y)?.offsetNode ?? null;
  return node && node.nodeType === Node.TEXT_NODE && normText(node.nodeValue || "") ? (node as Text) : null;
}

function isEditor(el: EventTarget | null): boolean {
  return el instanceof Element && !!el.closest("[data-jpt-editor]");
}

/** What a pointer is over: an image, or a run of text. */
function pick(e: MouseEvent): { el: Element; image: boolean; text?: Text } | null {
  const t = e.target as Element | null;
  if (!t || isEditor(t)) return null;
  for (let el: Element | null = t; el && el !== document.body; el = el.parentElement) {
    if (el instanceof HTMLImageElement || hasBackgroundImage(el)) return { el, image: true };
    if ((el as HTMLElement).dataset?.blogImage) return { el, image: true }; // a blog picture slot, even while empty
    if (el.children.length > 3) break;
  }
  const text = textNodeAt(e.clientX, e.clientY);
  if (text?.parentElement) return { el: text.parentElement, image: false, text };
  return null;
}

export default function PageEditor({ edits, path, onExit }: { edits: PageEdits; path: string; onExit: () => void }) {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [mode, setMode] = useState<"edit" | "browse">("edit");
  const [scope, setScope] = useState<"page" | "all">("page");
  const [sel, setSel] = useState<Sel | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const selRef = useRef<Sel | null>(null);
  selRef.current = sel;

  useEffect(() => { try { setToken(localStorage.getItem(TOKEN_KEY) || ""); } catch {} }, []);

  const page = normPath(path);
  const pageRules = edits.pages[page] || {};
  const globalRules = edits.pages[GLOBAL_SCOPE] || {};
  const count = Object.keys(pageRules.text || {}).length + Object.keys(pageRules.images || {}).length;
  const globalCount = Object.keys(globalRules.text || {}).length + Object.keys(globalRules.images || {}).length;

  // Hover outline and click capture.
  useEffect(() => {
    if (mode !== "edit" || !token) { setBox(null); return; }
    const move = (e: MouseEvent) => {
      if (selRef.current) return;
      const p = pick(e);
      setBox(p ? (p.text ? rangeRect(p.text) : p.el.getBoundingClientRect()) : null);
    };
    const block = (e: Event) => {
      if (isEditor(e.target)) return;
      // Alt/Option-click passes through, so menus and dropdowns can be opened
      // and their contents edited without leaving Edit mode.
      if ((e as MouseEvent).altKey) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const click = (e: MouseEvent) => {
      if (isEditor(e.target)) return;
      // Alt/Option-click passes through, so menus and dropdowns can be opened
      // and their contents edited without leaving Edit mode.
      if ((e as MouseEvent).altKey) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const p = pick(e);
      if (!p) return;
      setNote(null);
      if (p.image) {
        // A blog picture is saved into its post (see /admin/blog), not as a page rule.
        const tag = p.el.closest<HTMLElement>("[data-blog-image]");
        const blog = tag?.dataset.blogSlug && tag.dataset.blogImage ? { slug: tag.dataset.blogSlug, slot: tag.dataset.blogImage } : undefined;
        setSel({ kind: "image", el: p.el, key: imageKeyOf(p.el), src: imageSrcOf(p.el), blog });
        setBox(p.el.getBoundingClientRect());
      } else if (p.text) {
        const original = originalText(p.text);
        const current = normText(p.text.nodeValue || "");
        setSel({ kind: "text", node: p.text, original, value: current });
        setBox(rangeRect(p.text));
      }
    };
    window.addEventListener("mousemove", move, true);
    window.addEventListener("click", click, true);
    window.addEventListener("mousedown", block, true);
    window.addEventListener("pointerdown", block, true);
    window.addEventListener("submit", block, true);
    return () => {
      window.removeEventListener("mousemove", move, true);
      window.removeEventListener("click", click, true);
      window.removeEventListener("mousedown", block, true);
      window.removeEventListener("pointerdown", block, true);
      window.removeEventListener("submit", block, true);
    };
  }, [mode, token]);

  const call = useCallback(async (body: object) => {
    const r = await fetch(`/api/admin/page-edits?token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => ({}))) as { error?: string; edits?: PageEdits; url?: string };
    if (!r.ok || d.error) throw new Error(d.error || `Save failed (${r.status}).`);
    return d;
  }, [token]);

  const publish = (d: { edits?: PageEdits }) => {
    if (d.edits) window.dispatchEvent(new CustomEvent("jpt-page-edits", { detail: d.edits }));
  };

  const scopeKey = scope === "all" ? GLOBAL_SCOPE : page;

  /** Sets (or with url null, removes) a blog post's picture, then reloads so the page shows what visitors will. */
  const saveBlogImage = async (blog: { slug: string; slot: string }, img: { url: string; w: number; h: number } | null) => {
    const r = await fetch(`/api/admin/blog-edits?token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "image", slug: blog.slug, slot: blog.slot, url: img?.url ?? null, w: img?.w, h: img?.h }),
    });
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok || d.error) throw new Error(d.error || `Save failed (${r.status}).`);
    setTimeout(() => location.reload(), 700);
  };

  const save = async () => {
    if (!sel) return;
    setBusy(true);
    setNote(null);
    try {
      if (sel.kind === "text") {
        const value = sel.value.trim();
        if (!value) throw new Error("The text can't be empty.");
        publish(await call({ scope: scopeKey, kind: "text", key: sel.original, value }));
      } else {
        if (!sel.file) throw new Error("Choose a new image first.");
        if (!sel.key && !sel.blog) throw new Error("This image can't be replaced.");
        const up = await call({ action: "upload", dataUrl: sel.file.dataUrl });
        if (sel.blog) {
          await saveBlogImage(sel.blog, { url: up.url!, w: sel.file.w, h: sel.file.h });
          setNote({ ok: true, text: "Saved to this blog post and live now. Reloading…" });
          setSel(null);
          setBox(null);
          return;
        }
        publish(await call({ scope: scopeKey, kind: "image", key: sel.key, value: up.url }));
      }
      setNote({ ok: true, text: scope === "all" ? "Saved on every page. Live for visitors within a minute." : "Saved on this page. Live for visitors within a minute." });
      setSel(null);
      setBox(null);
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!sel) return;
    setBusy(true);
    try {
      if (sel.kind === "image" && sel.blog) {
        await saveBlogImage(sel.blog, null);
        setNote({ ok: true, text: sel.blog.slot === "cover" ? "Back to the automatic picture. Reloading…" : "Picture removed. Reloading…" });
        setSel(null);
        setBox(null);
        return;
      }
      const kind = sel.kind;
      const key = kind === "text" ? sel.original : sel.key;
      const inPage = kind === "text" ? pageRules.text?.[key] !== undefined : pageRules.images?.[key] !== undefined;
      const inAll = kind === "text" ? globalRules.text?.[key] !== undefined : globalRules.images?.[key] !== undefined;
      let last: { edits?: PageEdits } = {};
      if (inPage) last = await call({ scope: page, kind, key, value: null });
      if (inAll) last = await call({ scope: GLOBAL_SCOPE, kind, key, value: null });
      publish(last);
      setNote({ ok: true, text: "Back to the original." });
      setSel(null);
      setBox(null);
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resetPage = async () => {
    if (!confirm(`Undo all ${count} changes made on ${page}? Changes made for every page are kept.`)) return;
    setBusy(true);
    try { publish(await call({ action: "reset-page", scope: page })); setNote({ ok: true, text: "This page is back to its original copy and images." }); }
    catch (e) { setNote({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const edited = sel && (sel.kind === "text"
    ? pageRules.text?.[sel.original] !== undefined || globalRules.text?.[sel.original] !== undefined
    : pageRules.images?.[sel.key] !== undefined || globalRules.images?.[sel.key] !== undefined);

  // Portalled to <body> so no wrapper's stacking context can put the site header above it.
  return createPortal(
    // Its own top stacking level: globals.css gives every child of <body> z-index 1.
    <div data-jpt-editor="" style={{ position: "relative", zIndex: 2147483000, fontFamily: "var(--font, system-ui)", color: "#fff" }}>
      {box && mode === "edit" && (
        <div style={{ position: "fixed", left: box.left - 3, top: box.top - 3, width: box.width + 6, height: box.height + 6, border: "2px solid #FF6A1A", borderRadius: 6, background: "rgba(255,106,26,0.08)", pointerEvents: "none", zIndex: 2147483000, transition: "all .08s" }} />
      )}

      {/* Toolbar */}
      <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 2147483001, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: "calc(100vw - 20px)", background: "#15151A", border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "8px 10px", boxShadow: "0 12px 40px rgba(0,0,0,.45)", fontSize: 13 }}>
        <strong style={{ color: "#FF8A3D", whiteSpace: "nowrap" }}>✏️ Page editor</strong>
        <span style={{ color: "rgba(255,255,255,.6)", whiteSpace: "nowrap" }}>{page}</span>
        {token ? (
          <>
            <div style={{ display: "flex", background: "rgba(255,255,255,.08)", borderRadius: 9, padding: 2 }}>
              {(["edit", "browse"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setSel(null); setBox(null); }} style={{ ...seg, ...(mode === m ? segOn : {}) }}>
                  {m === "edit" ? "Edit" : "Browse"}
                </button>
              ))}
            </div>
            <span style={{ color: "rgba(255,255,255,.6)", whiteSpace: "nowrap" }}>
              {count} change{count === 1 ? "" : "s"} here{globalCount ? ` · ${globalCount} on every page` : ""}
            </span>
            {count > 0 && <button onClick={resetPage} disabled={busy} style={ghost}>Undo this page</button>}
          </>
        ) : (
          <>
            <input type="password" placeholder="Admin token" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} style={{ ...field, width: 170 }} />
            <button style={primary} onClick={() => { const t = tokenDraft.trim(); if (!t) return; try { localStorage.setItem(TOKEN_KEY, t); } catch {} setToken(t); }}>Start</button>
          </>
        )}
        <button onClick={() => { const u = new URL(location.href); u.searchParams.set("jpt_edit", "0"); history.replaceState(null, "", u.toString()); onExit(); }} style={ghost}>Exit</button>
      </div>

      {mode === "edit" && token && !sel && (
        <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 2147483001, background: "#15151A", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "9px 14px", fontSize: 13, color: "rgba(255,255,255,.8)", boxShadow: "0 12px 40px rgba(0,0,0,.45)", maxWidth: "calc(100vw - 20px)", textAlign: "center" }}>
          {note ? <span style={{ color: note.ok ? "#4ADE80" : "#F87171", fontWeight: 700 }}>{note.text}</span> : "Click any text or image to change it. Alt/Option-click opens menus and dropdowns. Use Browse to open other pages."}
        </div>
      )}

      {/* Panel */}
      {sel && (
        <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 2147483001, width: "min(420px, calc(100vw - 28px))", maxHeight: "calc(100vh - 90px)", overflowY: "auto", background: "#15151A", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, padding: 16, boxShadow: "0 20px 60px rgba(0,0,0,.55)", fontSize: 13.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 15 }}>{sel.kind === "text" ? "Change text" : "Change image"}</strong>
            <button onClick={() => { setSel(null); setBox(null); }} style={{ ...ghost, padding: "4px 9px" }}>✕</button>
          </div>

          {sel.kind === "text" ? (
            <>
              {edited && <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 8, lineHeight: 1.5 }}>Original: “{sel.original}”</div>}
              <textarea value={sel.value} onChange={(e) => setSel({ ...sel, value: e.target.value })} rows={Math.min(8, Math.max(2, Math.ceil(sel.value.length / 42)))} autoFocus
                style={{ ...field, width: "100%", resize: "vertical", lineHeight: 1.5, fontSize: 14 }} />
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: sel.file ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 10 }}>
                <figure style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sel.src} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#0B0B0E", borderRadius: 10 }} />
                  <figcaption style={cap}>Now</figcaption>
                </figure>
                {sel.file && (
                  <figure style={{ margin: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sel.file.preview} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain", background: "#0B0B0E", borderRadius: 10 }} />
                    <figcaption style={cap}>New · {(sel.file.bytes / 1024).toFixed(0)} KB</figcaption>
                  </figure>
                )}
              </div>
              <label style={{ ...ghost, display: "block", textAlign: "center", padding: "10px", cursor: "pointer" }}>
                {sel.file ? "Choose a different image" : "Choose new image"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { const file = await toWebp(f); setSel((s) => (s && s.kind === "image" ? { ...s, file } : s)); }
                  catch (err) { setNote({ ok: false, text: (err as Error).message }); }
                }} />
              </label>
            </>
          )}

          {sel.kind === "image" && sel.blog ? (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)", margin: "12px 0 4px", lineHeight: 1.5 }}>
              Saved into this blog post&apos;s {sel.blog.slot === "cover" ? "cover" : "section picture"}. You can also change it in /admin/blog.
            </div>
          ) : (
          <div style={{ display: "flex", gap: 6, margin: "12px 0 4px", fontSize: 12.5 }}>
            {(["page", "all"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} style={{ ...ghost, flex: 1, ...(scope === s ? { borderColor: "#FF6A1A", color: "#FF8A3D", background: "rgba(255,106,26,.12)" } : {}) }}>
                {s === "page" ? "This page only" : "Every page"}
              </button>
            ))}
          </div>
          )}

          {note && !note.ok && <div style={{ color: "#F87171", fontWeight: 600, margin: "8px 0", lineHeight: 1.5 }}>{note.text}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={save} disabled={busy} style={{ ...primary, flex: 1 }}>{busy ? "Saving…" : "Save & publish"}</button>
            {(edited || (sel.kind === "image" && sel.blog)) && (
              <button onClick={reset} disabled={busy} style={ghost}>
                {sel.kind === "image" && sel.blog ? (sel.blog.slot === "cover" ? "Use automatic" : "Remove picture") : "Reset to original"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function rangeRect(t: Text): DOMRect {
  const r = document.createRange();
  r.selectNodeContents(t);
  return r.getBoundingClientRect();
}

const seg: React.CSSProperties = { border: "none", background: "transparent", color: "rgba(255,255,255,.7)", fontWeight: 700, fontSize: 12.5, padding: "5px 11px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" };
const segOn: React.CSSProperties = { background: "#FF6A1A", color: "#fff" };
const ghost: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "6px 11px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" };
const primary: React.CSSProperties = { border: "none", background: "linear-gradient(135deg,#FF6A1A,#E11D48)", color: "#fff", fontWeight: 800, fontSize: 13.5, padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" };
const field: React.CSSProperties = { background: "#0B0B0E", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "8px 10px", fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" };
const cap: React.CSSProperties = { fontSize: 11.5, color: "rgba(255,255,255,.55)", textAlign: "center", marginTop: 4 };
