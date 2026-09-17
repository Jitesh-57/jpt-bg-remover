"use client";

import { useEffect, useState } from "react";
import { FIELDS, type FieldKey } from "@/lib/overrides";
import { label, input, primary, danger, success, linkBtn } from "./AdminShell";
import type { App } from "./CreativeUploader";

/**
 * Edit a page's search copy, and keep the edit through the next deploy.
 *
 * Every field shows the built-in text as its placeholder, so an empty box is
 * readable as "this page still says what the code says" rather than "this page
 * has no title". Clearing a box is how you go back to the built-in copy — the
 * saved document simply drops that key.
 *
 * The preview is the point of the screen. Copy written against a character
 * count in someone's head is how a description ends up truncated in the one
 * place it is read, so the SERP snippet is drawn at Google's widths with the
 * counts beside it.
 */

const LIMITS: Partial<Record<FieldKey, number>> = { title: 60, metaDescription: 155 };

export default function SeoEditor({ app, token }: { app: App; token: string }) {
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const key = `creative/${app.slug}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setSaved(false);
    (async () => {
      if (!token.trim()) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/admin/overrides?token=${encodeURIComponent(token.trim())}`);
        const data = (await res.json()) as { pages?: Record<string, Record<string, string>>; error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || `Could not load (${res.status}).`);
        setValues((data.pages?.[key] as Partial<Record<FieldKey, string>>) || {});
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [key, token]);

  const shown = (k: FieldKey) => values[k] ?? "";
  const effective = (k: FieldKey) => (values[k]?.trim() || (app as unknown as Record<string, string>)[k] || "");

  async function save() {
    if (!token.trim()) { setErr("Paste the admin token at the top first."); return; }
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/admin/overrides?token=${encodeURIComponent(token.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, values }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status}).`);
      setSaved(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const changed = Object.entries(values).filter(([, v]) => (v ?? "").trim()).length;

  if (loading) return <p style={{ fontSize: 13.5, color: "var(--text-faint)" }}>Loading current copy…</p>;

  return (
    <div>
      {/* SERP preview */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
        <div style={{ ...label, marginBottom: 10 }}>How Google is likely to show it</div>
        <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>www.sjpt.io › creative › {app.slug}</div>
        <div style={{ fontSize: 18, color: "#8ab4f8", margin: "3px 0 3px", lineHeight: 1.3 }}>
          {truncate(effective("title"), 60)}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
          {truncate(effective("metaDescription"), 155)}
        </div>
      </div>

      {FIELDS.map((f) => {
        const k = f.key as FieldKey;
        const v = shown(k);
        const limit = LIMITS[k];
        const len = effective(k).length;
        const over = limit ? len > limit : false;
        return (
          <div key={k} style={{ marginBottom: 18 }}>
            <label style={label} htmlFor={`f-${k}`}>
              {f.label}
              {limit && (
                <span style={{ marginLeft: 8, color: over ? "var(--danger)" : "var(--text-faint)", fontWeight: 700 }}>
                  {len}/{limit}{over ? " — will be cut off" : ""}
                </span>
              )}
              {v.trim() && <span style={{ marginLeft: 8, color: "var(--accent-strong)" }}>edited</span>}
            </label>
            <textarea
              id={`f-${k}`}
              rows={f.lines}
              value={v}
              onChange={(e) => { setValues((s) => ({ ...s, [k]: e.target.value })); setSaved(false); }}
              placeholder={(app as unknown as Record<string, string>)[k] || ""}
              style={{ ...input, resize: "vertical", lineHeight: 1.5 }}
            />
            {f.hint && <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 4 }}>{f.hint}</div>}
            {v.trim() && (
              <button onClick={() => { setValues((s) => ({ ...s, [k]: "" })); setSaved(false); }} style={{ ...linkBtn, marginTop: 5 }}>
                reset to the built-in copy
              </button>
            )}
          </div>
        );
      })}

      <button onClick={() => void save()} disabled={busy} style={{ ...primary, opacity: busy ? 0.6 : 1 }}>
        {busy ? "Saving…" : changed ? `Save ${changed} field${changed === 1 ? "" : "s"}` : "Save (clears all overrides for this page)"}
      </button>

      {err && <div style={danger}>{err}</div>}
      {saved && (
        <div style={success}>
          Saved. <a href={`/creative/${app.slug}`} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 800 }}>Open the page ↗</a>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>
            It caches for five minutes. This is stored outside the repo, so deploys leave it alone.
          </div>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
