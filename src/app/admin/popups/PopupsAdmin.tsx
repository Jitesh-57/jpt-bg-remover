"use client";

import { useCallback, useEffect, useState } from "react";
import { label, input, chip, chipOn, linkBtn, primary, danger, success } from "../creatives/AdminShell";
import {
  BUILTIN_POPUPS, EMPTY_POPUPS, MAX_CUSTOM_POPUPS, POPUP_DESIGNS, newCustomPopup, popupText,
  type CustomPopup, type PopupDef, type PopupField, type PopupsDoc,
} from "@/lib/popups";
import PopupView from "@/app/_components/PopupView";
import SignupNudge from "@/app/_components/SignupNudge";
import { customContent } from "@/app/_components/CustomPopupHost";

/**
 * /admin/popups — every pop-up on the site, in one place.
 *
 *   On the site   the pop-ups the code shows (lib/popups.ts BUILTIN_POPUPS):
 *                 switch each on or off, where that's safe, and rewrite any of
 *                 its words. A pop-up added to the code later appears here by
 *                 itself, once it is registered there.
 *   Your popups   pop-ups made here: a design, the words, the picture, a button
 *                 and its link, who sees it, on which pages, when and how often.
 *
 * Nothing changes on the site until Save; then visitors see it within a
 * minute. Preview shows a pop-up over this page exactly as visitors would.
 */

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 };
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 };
const SAMPLE_OFFER = { credits: 2, generations: 1, country: "US" };

/** Converts a picked image to WebP (at most 1600px across) for the upload endpoint. */
async function toWebp(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      style={{
        ...chip, padding: "6px 12px", minWidth: 74, cursor: disabled ? "default" : "pointer",
        ...(on ? { background: "var(--success-soft)", color: "var(--success)", borderColor: "var(--success-soft)" } : { color: "var(--text-muted)" }),
      }}
    >
      {on ? "● On" : "○ Off"}
    </button>
  );
}

/** One editable field: a text box, a list, a number, a choice, or a picture with an upload button. */
function Field({ f, value, onChange, upload }: {
  f: Pick<PopupField, "label" | "kind" | "default" | "help" | "options">;
  value: string;
  onChange: (v: string) => void;
  upload: (file: File) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const changed = value !== "" && value !== f.default;
  const area = f.kind === "long" || f.kind === "list";
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <span style={{ ...label, marginBottom: 5 }}>{f.label}</span>
        {changed && f.default !== "" && <button style={{ ...linkBtn, fontSize: 11.5 }} onClick={() => onChange("")}>Reset</button>}
      </div>
      {f.kind === "select" ? (
        <select value={value || f.default} onChange={(e) => onChange(e.target.value)} style={input}>
          {f.options?.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      ) : area ? (
        <textarea value={value} placeholder={f.default} onChange={(e) => onChange(e.target.value)} rows={f.kind === "list" ? 4 : 3} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
      ) : (
        <input value={value} placeholder={f.default} type={f.kind === "number" ? "number" : "text"} min={0} onChange={(e) => onChange(e.target.value)} style={input} />
      )}
      {f.kind === "image" && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          {(value || f.default) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value || f.default} alt="" style={{ width: 96, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
          )}
          <label style={{ ...chip, fontSize: 12.5 }}>
            {busy ? "Uploading…" : "Upload a picture"}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              const url = await upload(file);
              setBusy(false);
              if (url) onChange(url);
            }} />
          </label>
        </div>
      )}
      {f.help && <div style={{ ...hint, fontSize: 12, marginTop: 5 }}>{f.help}</div>}
    </div>
  );
}

const CUSTOM_FIELDS: { key: keyof CustomPopup; f: Pick<PopupField, "label" | "kind" | "default" | "help" | "options">; group: string }[] = [
  { key: "name", group: "Popup", f: { label: "Name (only you see it)", kind: "text", default: "" } },
  { key: "design", group: "Popup", f: { label: "Design", kind: "select", default: "split", options: POPUP_DESIGNS } },
  { key: "badge", group: "Words", f: { label: "Badge", kind: "text", default: "", help: "The small label above the headline. Emoji work. Leave empty for none." } },
  { key: "title", group: "Words", f: { label: "Headline", kind: "text", default: "" } },
  { key: "text", group: "Words", f: { label: "Text", kind: "long", default: "" } },
  { key: "bullets", group: "Words", f: { label: "Tick list (one per line)", kind: "list", default: "", help: "Shown in the Big split and Photo card designs." } },
  { key: "button", group: "Buttons", f: { label: "Main button", kind: "text", default: "" } },
  { key: "action", group: "Buttons", f: { label: "Main button does", kind: "select", default: "link", options: [["link", "Opens the link below"], ["signup", "Signs up with Google"]] } },
  { key: "link", group: "Buttons", f: { label: "Main button link", kind: "url", default: "", help: "A page on the site (/pricing, /creative/ghibli-style) or a full https:// address." } },
  { key: "secondary", group: "Buttons", f: { label: "Second link text (optional)", kind: "text", default: "" } },
  { key: "secondaryLink", group: "Buttons", f: { label: "Second link", kind: "url", default: "" } },
  { key: "dismiss", group: "Buttons", f: { label: "Close link", kind: "text", default: "", help: "e.g. \"Maybe later\". The × always closes it." } },
  { key: "image", group: "Picture", f: { label: "Picture", kind: "image", default: "" } },
  { key: "caption", group: "Picture", f: { label: "Picture caption", kind: "text", default: "" } },
  { key: "audience", group: "Who and when", f: { label: "Who sees it", kind: "select", default: "everyone", options: [["everyone", "Everyone"], ["signed-out", "Signed-out visitors"], ["signed-in", "Signed-in users"]] } },
  { key: "pages", group: "Who and when", f: { label: "Pages (one per line)", kind: "long", default: "", help: "/pricing is that page; /blog* is every page under /blog. Empty: every page. Never on the app, admin or payment pages." } },
  { key: "delay", group: "Who and when", f: { label: "Show after (seconds)", kind: "number", default: "8" } },
  { key: "repeatDays", group: "Who and when", f: { label: "After it's closed, show again after (days)", kind: "number", default: "3", help: "0: on their next visit." } },
];

const groupsOf = <T extends { group?: string }>(items: T[]) =>
  items.reduce<[string, T[]][]>((acc, it) => {
    const g = it.group || "Text";
    const hit = acc.find(([n]) => n === g);
    if (hit) hit[1].push(it); else acc.push([g, [it]]);
    return acc;
  }, []);

export default function PopupsAdmin() {
  const [tokenDraft, setTokenDraft] = useState("");
  const [token, setToken] = useState("");
  const [doc, setDoc] = useState<PopupsDoc | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; trial: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    try { const t = localStorage.getItem("jpt-admin-token"); if (t) { setToken(t); setTokenDraft(t); } } catch { /* blocked */ }
  }, []);

  const load = useCallback(async () => {
    if (!token.trim()) return;
    setMsg(null);
    const r = await fetch(`/api/admin/popups?token=${encodeURIComponent(token.trim())}`, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ ok: false, text: d.error || `Couldn't load (${r.status}).` }); setDoc(null); return; }
    setDoc({ ...EMPTY_POPUPS, ...d, builtin: d.builtin || {}, custom: d.custom || [] });
    setDirty(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const applyToken = () => {
    try { localStorage.setItem("jpt-admin-token", tokenDraft.trim()); } catch { /* fine */ }
    if (tokenDraft.trim() === token.trim()) void load(); else setToken(tokenDraft.trim());
  };

  const change = (fn: (d: PopupsDoc) => PopupsDoc) => { setDoc((d) => (d ? fn(d) : d)); setDirty(true); setMsg(null); };

  const setBuiltin = (id: string, patch: { enabled?: boolean; key?: string; value?: string }) =>
    change((d) => {
      const cur = d.builtin[id] || {};
      const text = { ...(cur.text || {}) };
      if (patch.key !== undefined) { if (patch.value) text[patch.key] = patch.value; else delete text[patch.key]; }
      return { ...d, builtin: { ...d.builtin, [id]: { ...cur, ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}), text } } };
    });

  const setCustom = (id: string, patch: Partial<CustomPopup>) =>
    change((d) => ({ ...d, custom: d.custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const upload = async (file: File): Promise<string | null> => {
    try {
      const dataUrl = await toWebp(file);
      const r = await fetch(`/api/admin/page-edits?token=${encodeURIComponent(token.trim())}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "upload", dataUrl }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) { setMsg({ ok: false, text: d.error || "The upload didn't work." }); return null; }
      return d.url as string;
    } catch {
      setMsg({ ok: false, text: "That picture couldn't be read. Try a JPG, PNG or WebP." });
      return null;
    }
  };

  const save = async () => {
    if (!doc) return;
    setBusy(true);
    const r = await fetch(`/api/admin/popups?token=${encodeURIComponent(token.trim())}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doc }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: d.error || `Couldn't save (${r.status}).` }); return; }
    setDoc(d);
    setDirty(false);
    setMsg({ ok: true, text: "Saved. Visitors see the changes within a minute." });
  };

  /* ── Preview ── */
  let previewEl: React.ReactNode = null;
  if (preview && doc) {
    const off = () => setPreview(null);
    const custom = doc.custom.find((c) => c.id === preview.id);
    previewEl = custom
      ? <PopupView design={custom.design} content={customContent(custom, () => {}, () => {})} onClose={off} />
      : <SignupNudge p={popupText("signup", doc)} offer={preview.trial ? SAMPLE_OFFER : null} onClose={off} onGoogle={() => {}} onEmail={() => {}} />;
  }

  const builtinCard = (def: PopupDef) => {
    const s = doc?.builtin[def.id];
    const on = !def.canTurnOff || s?.enabled !== false;
    const open = openId === def.id;
    const edited = Object.keys(s?.text || {}).length;
    return (
      <div key={def.id} style={card}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{def.name}</div>
            <div style={{ ...hint, marginTop: 3 }}>{def.where}</div>
            {edited > 0 && <div style={{ ...hint, marginTop: 4, color: "var(--accent-strong)", fontWeight: 700 }}>{edited} change{edited === 1 ? "" : "s"} from the default</div>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {def.previewable && (
              <>
                <button style={chip} onClick={() => setPreview({ id: def.id, trial: true })}>Preview</button>
                <button style={chip} onClick={() => setPreview({ id: def.id, trial: false })}>Preview without trial</button>
              </>
            )}
            {def.fields.length > 0 && <button style={{ ...chip, ...(open ? chipOn : {}) }} onClick={() => setOpenId(open ? null : def.id)}>{open ? "Close" : "Edit text"}</button>}
            {def.canTurnOff
              ? <Switch on={on} onChange={(v) => setBuiltin(def.id, { enabled: v })} />
              : <span style={{ ...chip, cursor: "default", fontSize: 12, color: "var(--text-muted)" }}>Always on</span>}
          </div>
        </div>
        {open && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
            {def.tokens && (
              <div style={{ ...hint, background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px" }}>
                You can use: {Object.entries(def.tokens).map(([k, v], i) => <span key={k}>{i ? " · " : ""}<code>{`{${k}}`}</code> {v}</span>)}
              </div>
            )}
            {groupsOf(def.fields).map(([g, fields]) => (
              <div key={g}>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 10 }}>{g}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {fields.map((f) => (
                    <Field key={f.key} f={f} value={s?.text?.[f.key] ?? ""} upload={upload} onChange={(v) => setBuiltin(def.id, { key: f.key, value: v })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const customCard = (c: CustomPopup) => {
    const open = openId === c.id;
    const testPage = c.pages.split(/\n|,/).map((x) => x.trim().replace(/\*$/, "")).find((x) => x.startsWith("/")) || "/";
    return (
      <div key={c.id} style={card}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: "1 1 320px" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name || "Popup"}</div>
            <div style={{ ...hint, marginTop: 3 }}>
              {POPUP_DESIGNS.find(([d]) => d === c.design)?.[1]} · {c.audience === "everyone" ? "everyone" : c.audience === "signed-out" ? "signed-out visitors" : "signed-in users"} · {c.pages.trim() ? "chosen pages" : "every page"} · after {c.delay}s
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={chip} onClick={() => setPreview({ id: c.id, trial: false })}>Preview</button>
            <a href={`${testPage}?popup=${c.id}`} target="_blank" rel="noreferrer" style={{ ...chip, textDecoration: "none" }} title="Shows it on the site even while it's off. Save first.">Test on site ↗</a>
            <button style={{ ...chip, ...(open ? chipOn : {}) }} onClick={() => setOpenId(open ? null : c.id)}>{open ? "Close" : "Edit"}</button>
            <Switch on={c.enabled} onChange={(v) => setCustom(c.id, { enabled: v })} />
          </div>
        </div>
        {open && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
            {groupsOf(CUSTOM_FIELDS).map(([g, fields]) => (
              <div key={g}>
                <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 10 }}>{g}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {fields.map(({ key, f }) => (
                    <Field key={key} f={f} value={String(c[key] ?? "")} upload={upload}
                      onChange={(v) => setCustom(c.id, { [key]: key === "delay" || key === "repeatDays" ? Number(v) || 0 : v } as Partial<CustomPopup>)} />
                  ))}
                  {g === "Picture" && (
                    <label style={{ ...hint, display: "flex", gap: 8, alignItems: "center", alignSelf: "end" }}>
                      <input type="checkbox" checked={c.beforeAfter} onChange={(e) => setCustom(c.id, { beforeAfter: e.target.checked })} />
                      It&apos;s a before|after side by side (wipe between the halves)
                    </label>
                  )}
                </div>
              </div>
            ))}
            <div>
              {confirmDelete === c.id ? (
                <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={hint}>Delete &ldquo;{c.name}&rdquo;?</span>
                  <button style={{ ...chip, color: "var(--danger)" }} onClick={() => { change((d) => ({ ...d, custom: d.custom.filter((x) => x.id !== c.id) })); setConfirmDelete(null); }}>Yes, delete</button>
                  <button style={chip} onClick={() => setConfirmDelete(null)}>Keep it</button>
                </span>
              ) : (
                <button style={{ ...linkBtn, color: "var(--danger)" }} onClick={() => setConfirmDelete(c.id)}>Delete this popup</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "22px 16px 120px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <a href="/admin/creatives" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Admin</a>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", margin: "6px 0 4px" }}>💬 Popups</h1>
          <p style={{ ...hint, fontSize: 13.5, maxWidth: 680, margin: 0 }}>
            Switch any pop-up on or off, change every word in it, and make new ones. Nothing changes on the site until you press <strong>Save</strong>; then visitors see it within a minute.
          </p>
        </div>

        {!doc && (
          <div>
            <label style={label}>Admin token</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") applyToken(); }} placeholder="ADMIN_IMAGE_TOKEN" style={input} />
              <button style={chip} onClick={applyToken}>Load</button>
            </div>
          </div>
        )}

        {msg && <div style={msg.ok ? success : danger}>{msg.text}</div>}

        {doc && (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 900, margin: "10px 0 0" }}>On the site</h2>
            {BUILTIN_POPUPS.map(builtinCard)}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>Your popups</h2>
              <button
                style={chip}
                disabled={doc.custom.length >= MAX_CUSTOM_POPUPS}
                onClick={() => { const n = newCustomPopup(); change((d) => ({ ...d, custom: [...d.custom, n] })); setOpenId(n.id); }}
              >
                + Add a popup
              </button>
            </div>
            {doc.custom.length === 0 && <div style={{ ...card, ...hint }}>None yet. A new popup starts switched off, so you can preview and test it before visitors see it.</div>}
            {doc.custom.map(customCard)}
          </>
        )}
      </div>

      {dirty && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, padding: "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))", background: "var(--surface)", borderTop: "1px solid var(--border-strong)" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <span style={{ ...hint, marginRight: "auto" }}>You have unsaved changes.</span>
            <button style={chip} disabled={busy} onClick={() => void load()}>Discard</button>
            <button style={{ ...primary, padding: "11px 22px" }} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      {previewEl}
    </div>
  );
}
