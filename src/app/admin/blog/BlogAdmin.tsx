"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { label, input, chip, chipOn, primary, danger, success } from "../creatives/AdminShell";
import { LIMITS, type BlogCoverImage, type BlogPatch, type BlogSection } from "@/lib/blog-edits";
import type { BlogPost } from "@/app/blog/_data/posts";

/**
 * /admin/blog — edit any blog post in place: title, summary, SEO text, the
 * button, the cover picture, and every section (heading, text, a picture).
 * A save goes live on the next page load; "Back to original" undoes it all.
 */

const TOKEN_KEY = "jpt-admin-token";
const CAP = 2000;

type Row = { slug: string; title: string; category: string; date: string; edited: boolean; hidden: boolean; updatedAt?: string };
type Form = {
  title: string; excerpt: string; metaTitle: string; metaDescription: string; toolLabel: string;
  cover: BlogCoverImage | null; sections: BlogSection[]; hidden: boolean;
};

/** Shrinks a picture to at most 2000px and re-encodes it as WebP, so uploads stay small. */
async function toWebp(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
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
    return { dataUrl, w: c.width, h: c.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function formFrom(original: BlogPost, patch: BlogPatch | null): Form {
  return {
    title: patch?.title ?? original.title,
    excerpt: patch?.excerpt ?? original.excerpt,
    metaTitle: patch?.metaTitle ?? original.metaTitle,
    metaDescription: patch?.metaDescription ?? original.metaDescription,
    toolLabel: patch?.toolLabel ?? original.toolLabel,
    cover: patch?.cover ?? null,
    sections: (patch?.sections ?? original.sections).map((s) => ({ heading: s.heading ?? "", body: s.body.trim(), image: s.image })),
    hidden: !!patch?.hidden,
  };
}

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const small: React.CSSProperties = { ...chip, padding: "5px 10px", fontSize: 12 };
const count = (n: number, max: number) => <span style={{ float: "right", fontWeight: 600, textTransform: "none", letterSpacing: 0, color: n > max * 0.9 ? "var(--danger)" : "var(--text-faint)" }}>{n}/{max}</span>;

export default function BlogAdmin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [original, setOriginal] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => { try { const t = localStorage.getItem(TOKEN_KEY); if (t) setToken(t); } catch {} }, []);
  const t = token.trim();
  const api = (path = "") => `/api/admin/blog-edits?token=${encodeURIComponent(t)}${path}`;

  const loadList = useCallback(async () => {
    if (!t) return;
    setErr("");
    const r = await fetch(`/api/admin/blog-edits?token=${encodeURIComponent(t)}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setErr(d.error ? `${d.error}${d.fix ? ` ${d.fix}` : ""}` : `HTTP ${r.status}`); setRows(null); return; }
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    setRows(d.posts as Row[]);
  }, [t]);
  useEffect(() => { void loadList(); }, [loadList]);

  const dirty = !!form && JSON.stringify(form) !== saved;

  const open = async (s: string) => {
    if (dirty && !confirm("You have unsaved changes. Leave them?")) return;
    setErr(""); setOk(""); setSlug(s); setForm(null);
    const r = await fetch(api(`&slug=${encodeURIComponent(s)}`), { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    const f = formFrom(d.original, d.patch);
    setOriginal(d.original); setForm(f); setSaved(JSON.stringify(f));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setSection = (i: number, patch: Partial<BlogSection>) =>
    setForm((f) => (f ? { ...f, sections: f.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : f));
  const move = (i: number, d: -1 | 1) => setForm((f) => {
    if (!f) return f;
    const j = i + d;
    if (j < 0 || j >= f.sections.length) return f;
    const s = [...f.sections];
    [s[i], s[j]] = [s[j], s[i]];
    return { ...f, sections: s };
  });

  const upload = async (file: File | undefined, key: string): Promise<{ url: string; w: number; h: number } | null> => {
    if (!file) return null;
    setBusy(key); setErr("");
    try {
      const img = await toWebp(file);
      const r = await fetch(`/api/admin/page-edits?token=${encodeURIComponent(t)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload", dataUrl: img.dataUrl }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || `Upload failed (HTTP ${r.status}).`);
      return { url: d.url, w: img.w, h: img.h };
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!form || !slug) return;
    setBusy("save"); setErr(""); setOk("");
    const r = await fetch(api(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", slug, post: form }) });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    setSaved(JSON.stringify(form));
    setOk(form.hidden ? "Saved. This post is now hidden from the blog." : "Saved and live. Open the post to see it.");
    void loadList();
  };

  const reset = async () => {
    if (!slug || !confirm("Undo every change to this post and go back to the original?")) return;
    setBusy("reset"); setErr(""); setOk("");
    const r = await fetch(api(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", slug }) });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok || d.error) { setErr(d.error || `HTTP ${r.status}`); return; }
    if (original) { const f = formFrom(original, null); setForm(f); setSaved(JSON.stringify(f)); }
    setOk("Back to the original.");
    void loadList();
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || []).filter((r) => (!onlyEdited || r.edited) && (!needle || `${r.title} ${r.slug} ${r.category}`.toLowerCase().includes(needle)));
  }, [rows, q, onlyEdited]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "30px 16px 90px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "10px 0 6px" }}>📝 Blog editor</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 20px", maxWidth: 700 }}>
          Pick a post, change any text or picture, and press <strong>Save</strong>. It goes live straight away, with no deploy.
          <strong> Back to original</strong> undoes every change to that post.
        </p>

        {!rows && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 520 }}>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token (ADMIN_IMAGE_TOKEN)" style={input} />
            <button style={chip} onClick={() => void loadList()}>Load</button>
          </div>
        )}
        {err && <div style={{ ...danger, marginTop: 0, marginBottom: 16 }}>{err}</div>}

        {rows && (
          <div className="jpt-blog-admin" style={{ display: "grid", gap: 18, alignItems: "start" }}>
            {/* Posts */}
            <aside style={{ ...card, padding: 12, position: "sticky", top: 16, maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", minWidth: 0 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${rows.length} posts…`} style={{ ...input, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <button style={{ ...small, ...(!onlyEdited ? chipOn : {}) }} onClick={() => setOnlyEdited(false)}>All</button>
                <button style={{ ...small, ...(onlyEdited ? chipOn : {}) }} onClick={() => setOnlyEdited(true)}>Edited ({rows.filter((r) => r.edited).length})</button>
              </div>
              <div className="jpt-scroll-thin" style={{ overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                {list.map((r) => (
                  <button key={r.slug} onClick={() => void open(r.slug)}
                    style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", border: "none", borderRadius: 10, padding: "9px 10px", background: r.slug === slug ? "var(--accent-soft)" : "transparent", color: "var(--text)" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span>{r.category}</span><span>·</span><span>{r.date}</span>
                      {r.edited && <span style={{ color: "var(--accent-strong)", fontWeight: 800 }}>· Edited</span>}
                      {r.hidden && <span style={{ color: "var(--danger)", fontWeight: 800 }}>· Hidden</span>}
                    </div>
                  </button>
                ))}
                {!list.length && <div style={{ fontSize: 13, color: "var(--text-faint)", padding: 10 }}>No posts match.</div>}
              </div>
            </aside>

            {/* Editor */}
            <section style={{ minWidth: 0 }}>
              {!slug && <div style={{ ...card, color: "var(--text-muted)", fontSize: 14 }}>← Pick a post to edit.</div>}
              {slug && !form && !err && <div style={{ ...card, color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>}
              {form && original && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Actions */}
                  <div style={{ ...card, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", position: "sticky", top: 16, zIndex: 5 }}>
                    <button style={{ ...primary, padding: "10px 20px", fontSize: 14, opacity: busy ? 0.6 : 1 }} disabled={!!busy || !dirty} onClick={() => void save()}>
                      {busy === "save" ? "Saving…" : dirty ? "Save & publish" : "Saved"}
                    </button>
                    <a href={`/blog/${slug}`} target="_blank" rel="noreferrer" style={{ ...chip, textDecoration: "none" }}>View post ↗</a>
                    <button style={chip} disabled={!!busy} onClick={() => void reset()}>Back to original</button>
                    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, marginLeft: "auto", cursor: "pointer" }}>
                      <input type="checkbox" checked={form.hidden} onChange={(e) => set("hidden", e.target.checked)} /> Hide this post
                    </label>
                    {ok && !dirty && <div style={{ ...success, marginTop: 0, width: "100%", padding: "8px 12px", fontSize: 13 }}>{ok}</div>}
                  </div>

                  {/* Basics */}
                  <div style={card}>
                    <label style={label}>Title {count(form.title.length, LIMITS.title)}</label>
                    <input value={form.title} maxLength={LIMITS.title} onChange={(e) => set("title", e.target.value)} style={{ ...input, fontSize: 16, fontWeight: 800, marginBottom: 14 }} />
                    <label style={label}>Summary (shown on the card and at the top of the post) {count(form.excerpt.length, LIMITS.excerpt)}</label>
                    <textarea value={form.excerpt} maxLength={LIMITS.excerpt} rows={3} onChange={(e) => set("excerpt", e.target.value)} style={{ ...input, resize: "vertical", lineHeight: 1.55, marginBottom: 14 }} />
                    <label style={label}>Button text at the end of the post</label>
                    <input value={form.toolLabel} maxLength={LIMITS.toolLabel} onChange={(e) => set("toolLabel", e.target.value)} style={input} />
                  </div>

                  {/* Cover */}
                  <div style={card}>
                    <label style={label}>Cover picture</label>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ width: 220, maxWidth: "100%", aspectRatio: form.cover ? `${form.cover.w} / ${form.cover.h}` : "16 / 10", borderRadius: 12, overflow: "hidden", background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {form.cover
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={form.cover.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 12, color: "var(--text-faint)", padding: 12, textAlign: "center" }}>Automatic: the matching app&apos;s before &amp; after</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ ...chip, display: "inline-block" }}>
                          {busy === "cover" ? "Uploading…" : form.cover ? "Replace picture" : "Upload a picture"}
                          <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy}
                            onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; const up = await upload(f, "cover"); if (up) set("cover", up); }} />
                        </label>
                        {form.cover && <button style={small} onClick={() => set("cover", null)}>Use automatic picture</button>}
                      </div>
                    </div>
                  </div>

                  {/* Sections */}
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
                    Sections — tip: wrap words in <code>**double stars**</code> to make them bold; a line that is only <code>**bold**</code> becomes a sub-heading.
                  </div>
                  {form.sections.map((s, i) => (
                    <div key={i} style={card}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text-faint)" }}>SECTION {i + 1}</span>
                        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                          <button style={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                          <button style={small} disabled={i === form.sections.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                          <button style={{ ...small, color: "var(--danger)" }} onClick={() => { if (confirm("Delete this section?")) set("sections", form.sections.filter((_, j) => j !== i)); }}>Delete</button>
                        </span>
                      </div>
                      <input value={s.heading || ""} maxLength={LIMITS.heading} placeholder="Heading (optional)" onChange={(e) => setSection(i, { heading: e.target.value })}
                        style={{ ...input, fontWeight: 800, marginBottom: 10 }} />
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                        {s.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.image} alt="" style={{ height: 70, borderRadius: 8, border: "1px solid var(--border)" }} />
                        )}
                        <label style={{ ...small, display: "inline-block" }}>
                          {busy === `s${i}` ? "Uploading…" : s.image ? "Replace picture" : "+ Add a picture"}
                          <input type="file" accept="image/*" style={{ display: "none" }} disabled={!!busy}
                            onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; const up = await upload(f, `s${i}`); if (up) setSection(i, { image: up.url }); }} />
                        </label>
                        {s.image && <button style={small} onClick={() => setSection(i, { image: undefined })}>Remove picture</button>}
                      </div>
                      <textarea value={s.body} maxLength={LIMITS.body} rows={Math.min(18, Math.max(5, Math.ceil(s.body.length / 90)))} onChange={(e) => setSection(i, { body: e.target.value })}
                        style={{ ...input, resize: "vertical", lineHeight: 1.6, fontSize: 14 }} />
                    </div>
                  ))}
                  <button style={{ ...chip, alignSelf: "flex-start" }} disabled={form.sections.length >= LIMITS.sections}
                    onClick={() => set("sections", [...form.sections, { heading: "", body: "" }])}>+ Add a section</button>

                  {/* SEO */}
                  <div style={card}>
                    <label style={label}>Google title {count(form.metaTitle.length, LIMITS.metaTitle)}</label>
                    <input value={form.metaTitle} maxLength={LIMITS.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} style={{ ...input, marginBottom: 14 }} />
                    <label style={label}>Google description {count(form.metaDescription.length, LIMITS.metaDescription)}</label>
                    <textarea value={form.metaDescription} maxLength={LIMITS.metaDescription} rows={3} onChange={(e) => set("metaDescription", e.target.value)} style={{ ...input, resize: "vertical", lineHeight: 1.55 }} />
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 6 }}>Best kept under about 60 characters for the title and 155 for the description.</div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
