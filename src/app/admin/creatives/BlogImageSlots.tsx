"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImage, prepare, type Pending } from "./CreativeUploader";
import { label, chip, chipOn, primary, danger, success, linkBtn } from "./AdminShell";
import { blogCover, mainsFrom } from "@/lib/blog-images";
import { IMAGE_WIDTHS, type BlogPatch } from "@/lib/blog-edits";
import type { BlogPost } from "@/app/blog/_data/posts";

/**
 * The picture sections of one blog post, for the Creatives tab: the main
 * picture (the cover) and one per section of the post, in page order.
 *
 * Same flow as an app page: choose a section, add an image, look at it, then
 * Apply. Images are published whole at their own shape, stored under a name
 * that says what they are (blog/<post>-main-….webp), and given a WIDTH.
 */

type Slot = { id: string; label: string; hint: string; file: string };
type Live = { url: string; w?: number; h?: number; width?: number; auto?: boolean };

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export default function BlogImageSlots({ slug, token }: { slug: string; token: string }) {
  const [original, setOriginal] = useState<BlogPost | null>(null);
  const [patch, setPatch] = useState<BlogPatch | null>(null);
  const [auto, setAuto] = useState<{ url: string; w?: number; h?: number } | null>(null);
  const [pending, setPending] = useState<Record<string, Pending>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = token.trim();
  const api = `/api/admin/blog-edits?token=${encodeURIComponent(t)}`;

  const refresh = useCallback(async () => {
    if (!t) return;
    setErr(null);
    try {
      const [post, doc] = await Promise.all([
        fetch(`${api}&slug=${encodeURIComponent(slug)}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/admin/overrides?token=${encodeURIComponent(t)}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { pages: {} })).catch(() => ({ pages: {} })),
      ]);
      if (post.error) throw new Error(post.error);
      setOriginal(post.original);
      setPatch(post.patch);
      // What the cover shows when no picture has been chosen: the matching app's before & after.
      const c = blogCover(post.original, mainsFrom(doc.pages || {}));
      setAuto(c.sources[0] ? { url: c.sources[0], w: c.w, h: c.h } : null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [api, slug, t]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!t) return <p style={{ fontSize: 13.5, color: "var(--text-faint)" }}>Paste the admin token at the top first.</p>;
  if (!original) return err ? <div style={danger}>{err}</div> : <p style={{ fontSize: 13.5, color: "var(--text-faint)" }}>Reading the post…</p>;

  const sections = patch?.sections ?? original.sections;
  const slots: Slot[] = [
    { id: "cover", label: "Main picture", hint: "Top of the post and on its blog card", file: `blog/${slug}-main-….webp` },
    ...sections.map((s, i) => ({
      id: `section:${i}`,
      label: `Section ${i + 1}`,
      hint: s.heading ? `Under “${s.heading.length > 60 ? `${s.heading.slice(0, 57)}…` : s.heading}”` : "At the start of this section",
      file: `blog/${slug}-section-${i + 1}-….webp`,
    })),
  ];
  const liveOf = (id: string): Live | null => {
    if (id === "cover") return patch?.cover ? { ...patch.cover } : auto ? { ...auto, auto: true } : null;
    const s = sections[Number(id.slice(8))];
    return s?.image ? { url: s.image, width: s.imageWidth } : null;
  };

  const pick = (id: string) => { if (fileRef.current) { fileRef.current.dataset.slot = id; fileRef.current.click(); } };
  const addFile = async (f: File, id: string) => {
    setErr(null); setDone(null); setBusy("Reading…");
    try { const ready = await prepare(await loadImage(f), f.name); setPending((s) => ({ ...s, [id]: ready })); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };

  const post = async (body: object) => {
    const r = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...body }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
    return d as { url?: string };
  };

  const apply = async () => {
    const ids = Object.keys(pending);
    if (!ids.length) return;
    setBusy("Publishing…"); setErr(null); setDone(null);
    try {
      const names: string[] = [];
      for (const id of ids) {
        const p = pending[id];
        const d = await post({ action: "upload", slot: id, dataUrl: p.dataUrl, w: p.w, h: p.h, apply: true });
        names.push((d.url || "").split("/").pop() || id);
      }
      setPending({});
      setDone(`Published ${names.length}: ${names.join(", ")}`);
      await refresh();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!confirm(id === "cover" ? "Go back to the automatic picture (the matching app's before & after)?" : "Remove this section's picture?")) return;
    setBusy("Removing…"); setErr(null); setDone(null);
    try { await post({ action: "image", slot: id, url: null }); await refresh(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };

  const resize = async (id: string, width: number) => {
    setErr(null);
    try { await post({ action: "width", slot: id, width }); await refresh(); }
    catch (e) { setErr((e as Error).message); }
  };

  const count = Object.keys(pending).length;
  const bytes = Object.values(pending).reduce((n, p) => n + p.bytes, 0);
  const filled = slots.filter((s) => { const l = liveOf(s.id); return l && !l.auto; }).length;

  return (
    <div>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
        Blog post <strong>{original.title}</strong>. {slots.length} picture sections: the main picture, then one for each section of the post.
        Pick a section, add an image, check it, then <strong>Apply</strong>. Images are published whole, at their own shape.
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; const id = fileRef.current?.dataset.slot; if (f && id) void addFile(f, id); e.target.value = ""; }} />

      <span style={{ ...label, marginBottom: 12 }}>Sections — {filled} of {slots.length} have a chosen picture</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
        {slots.map((slot) => {
          const has = liveOf(slot.id);
          const next = pending[slot.id];
          const shape = next ? `${next.w} / ${next.h}` : has?.w && has?.h ? `${has.w} / ${has.h}` : "4 / 3";
          return (
            <div key={slot.id} style={{ background: "var(--surface)", borderRadius: 14, padding: 13, border: `1px solid ${next ? "var(--accent-border)" : has && !has.auto ? "var(--border-strong)" : "var(--border)"}` }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 13.5 }}>{slot.label}</strong>
                {next && <span style={{ fontSize: 10.5, fontWeight: 900, color: "var(--accent-strong)", letterSpacing: "0.06em" }}>PENDING</span>}
                {!next && has?.auto && <span style={{ fontSize: 10.5, fontWeight: 900, color: "var(--text-faint)", letterSpacing: "0.06em" }}>AUTOMATIC</span>}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", margin: "3px 0 9px", lineHeight: 1.45 }}>{slot.hint}</div>

              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", aspectRatio: shape, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {next || has ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={next ? next.dataUrl : has!.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: !next && has?.auto ? 0.75 : 1 }} />
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-faint)" }}>empty</span>
                )}
              </div>

              <div style={{ fontSize: 11, color: "var(--text-faint)", margin: "8px 0 9px", lineHeight: 1.5, wordBreak: "break-all" }}>
                {next ? <>{next.w}×{next.h} · {kb(next.bytes)} · <code style={{ color: "var(--accent-strong)", fontWeight: 800 }}>{slot.file}</code></>
                  : has && !has.auto ? <>{has.w && has.h ? `${has.w}×${has.h} · ` : ""}live · <code>{has.url.split("/").pop()}</code></>
                  : has?.auto ? <>the matching app&apos;s creative, until you add one</>
                  : <>nothing published</>}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => pick(slot.id)} disabled={!!busy} style={{ ...chip, fontSize: 12, padding: "6px 12px" }}>
                  {(has && !has.auto) || next ? "Replace" : "Add image"}
                </button>
                {next && <button onClick={() => setPending((s) => { const n = { ...s }; delete n[slot.id]; return n; })} style={linkBtn}>undo</button>}
                {has && !has.auto && !next && (
                  <button onClick={() => void remove(slot.id)} disabled={!!busy} style={{ ...linkBtn, color: "var(--danger)" }}>
                    {slot.id === "cover" ? "use automatic" : "remove"}
                  </button>
                )}
              </div>

              {has && !has.auto && !next && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 10.5, color: "var(--text-faint)", fontWeight: 800, letterSpacing: "0.06em" }}>WIDTH</span>
                  {IMAGE_WIDTHS.map((w) => (
                    <button key={w} onClick={() => void resize(slot.id, w)} style={{ ...chip, fontSize: 11, padding: "3px 9px", ...((has.width || 100) === w ? chipOn : {}) }}>{w}%</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => void apply()} disabled={!!busy || !count} style={{ ...primary, marginTop: 22, opacity: busy || !count ? 0.55 : 1 }}>
        {busy || (count ? `Apply — publish ${count} image${count === 1 ? "" : "s"} (${kb(bytes)})` : "Nothing to publish")}
      </button>

      {err && <div style={danger}>{err}</div>}
      {done && (
        <div style={success}>
          {done}
          <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>
            <a href={`/blog/${slug}`} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 800 }}>Open the post ↗</a> — live now.
          </div>
        </div>
      )}
    </div>
  );
}
