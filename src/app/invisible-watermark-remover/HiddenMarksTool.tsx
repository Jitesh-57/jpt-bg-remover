"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ACCEPT, CLASS_LABELS, DEFAULT_TEXT_OPTIONS, FORMAT_LABEL,
  type CharClass, type CleanReport, type Finding, type TextOptions,
  cleanAndVerify, scanText,
} from "@/lib/hidden-marks";

// Fully client-side: files are read into memory, cleaned by walking their
// container format, verified with a second pass, and offered back as a
// download. Nothing is uploaded.

const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const MAX_BYTES = 200 * 1024 * 1024;

type Item = {
  id: number;
  name: string;
  size: number;
  status: "working" | "done" | "error";
  report?: CleanReport;
  error?: string;
  url?: string;
};

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px" };
const btn: React.CSSProperties = { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const primary: React.CSSProperties = { background: GRAD, color: "#fff", border: "none", borderRadius: 11, padding: "11px 22px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", textDecoration: "none", display: "inline-block" };

function kb(n: number) {
  return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function cleanName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? `${name.slice(0, dot)}-clean${name.slice(dot)}` : `${name}-clean`;
}

const SENSITIVE = new Set(["gps", "ai-prompt", "c2pa", "ai-label", "hidden-message"]);
function findingColor(f: Finding) {
  return SENSITIVE.has(f.kind) ? "var(--danger)" : "var(--accent)";
}

export default function HiddenMarksTool() {
  const [tab, setTab] = useState<"files" | "text">("files");
  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div role="tablist" style={{ display: "flex", gap: 6, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: 5, maxWidth: 420, margin: "0 auto 18px" }}>
        {([["files", "Images, PDFs & files"], ["text", "Text"]] as const).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            style={{ flex: 1, border: "none", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontWeight: 800, cursor: "pointer", background: tab === k ? GRAD : "transparent", color: tab === k ? "#fff" : "var(--text-muted)" }}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Both stay mounted so switching tabs keeps the file list and pasted text. */}
      <div hidden={tab !== "files"}><FilesPanel /></div>
      <div hidden={tab !== "text"}><TextPanel /></div>
    </div>
  );
}

// ── Files ─────────────────────────────────────────────────────────────────

function FilesPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const queue = Array.from(files).map((file) => ({ file, item: { id: nextId.current++, name: file.name, size: file.size, status: "working" as const } }));
    setItems((list) => [...queue.map((q) => q.item), ...list]);
    for (const { file, item } of queue) {
      if (file.size > MAX_BYTES) { update(item.id, { status: "error", error: "Files over 200 MB aren’t supported in the browser." }); continue; }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const report = await cleanAndVerify(bytes, file.name);
        const changed = report.bytes !== bytes;
        const url = changed ? URL.createObjectURL(new Blob([report.bytes as BlobPart], { type: file.type || "application/octet-stream" })) : undefined;
        update(item.id, { status: "done", report, url });
      } catch (e) {
        update(item.id, { status: "error", error: "This file couldn’t be read. It may be damaged or not the type its name says." });
        console.error(e);
      }
    }
  }, []);

  const cleaned = items.filter((i) => i.url);
  const totalFound = items.reduce((n, i) => n + (i.report?.findings.length ?? 0), 0);

  const downloadAll = async () => {
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const used = new Set<string>();
      for (const it of cleaned) {
        let name = cleanName(it.name);
        for (let n = 2; used.has(name); n++) name = cleanName(it.name).replace(/(\.[^.]+)?$/, `-${n}$1`);
        used.add(name);
        zip.file(name, it.report!.bytes);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "cleaned-files.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    } finally {
      setZipping(false);
    }
  };

  const clear = () => {
    items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    setItems([]);
  };

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer",
          border: `2px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`, background: drag ? "var(--accent-soft)" : "var(--surface)",
          borderRadius: 20, padding: items.length ? "26px 20px" : "52px 24px", transition: "all .2s",
        }}
      >
        <input ref={inputRef} type="file" multiple accept={ACCEPT} style={{ display: "none" }} onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
        <div style={{ fontSize: items.length ? 28 : 40, marginBottom: 10 }}>🧼</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Drop files or click to choose</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.6 }}>
          JPG, PNG, WebP, GIF, SVG, PDF, Word, Excel, PowerPoint, MP3, WAV, FLAC and text files. Cleaned on your device — nothing is uploaded.
        </div>
      </label>

      {items.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "18px 0 12px" }}>
            <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
              {items.length} file{items.length === 1 ? "" : "s"} · {totalFound} hidden item{totalFound === 1 ? "" : "s"} removed
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {cleaned.length > 1 && (
                <button onClick={downloadAll} disabled={zipping} style={{ ...primary, padding: "9px 18px", fontSize: 14 }}>
                  {zipping ? "Zipping…" : `Download all (${cleaned.length}) as ZIP`}
                </button>
              )}
              <button onClick={clear} style={btn}>Clear</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((it) => <FileCard key={it.id} item={it} />)}
          </div>
        </>
      )}
    </div>
  );
}

function FileCard({ item }: { item: Item }) {
  const r = item.report;
  const [open, setOpen] = useState(true);
  let badge: { text: string; color: string };
  if (item.status === "working") badge = { text: "Cleaning…", color: "var(--text-muted)" };
  else if (item.status === "error") badge = { text: "Couldn’t read", color: "var(--danger)" };
  else if (r!.format === "unknown") badge = { text: "Not supported", color: "var(--warn)" };
  else if (!r!.findings.length) badge = { text: r!.notes.length ? "Left unchanged" : "Already clean", color: r!.notes.length ? "var(--warn)" : "var(--success)" };
  else if (r!.remaining.length) badge = { text: "Partly cleaned", color: "var(--warn)" };
  else badge = { text: "Cleaned · verified", color: "var(--success)" };

  return (
    <div style={card}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>
            {r ? `${FORMAT_LABEL[r.format]} · ` : ""}{kb(item.size)}{r && item.url ? ` → ${kb(r.bytes.length)}` : ""}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: badge.color, border: `1px solid ${badge.color}`, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{badge.text}</span>
        {item.url && (
          <a href={item.url} download={cleanName(item.name)} style={{ ...primary, padding: "9px 18px", fontSize: 14 }}>Download</a>
        )}
      </div>

      {item.error && <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--danger)" }}>{item.error}</p>}

      {r && r.findings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", padding: 0, color: "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {open ? "▾" : "▸"} Removed {r.findings.length} item{r.findings.length === 1 ? "" : "s"}
          </button>
          {open && (
            <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 6 }}>
              {r.findings.map((f, i) => (
                <li key={i} style={{ display: "flex", gap: 8, fontSize: 13.5, lineHeight: 1.5, color: "var(--text)" }}>
                  <span style={{ color: findingColor(f), fontWeight: 900, flexShrink: 0 }}>✕</span>
                  <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <strong style={{ fontWeight: 700 }}>{f.label}</strong>
                    {f.detail && <span style={{ color: "var(--text-muted)" }}> — {f.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {r && r.remaining.length > 0 && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--warn)" }}>
          A second check still found: {r.remaining.map((f) => f.label).join(", ")}.
        </p>
      )}
      {r?.notes.map((n) => <p key={n} style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>ℹ {n}</p>)}
    </div>
  );
}

// ── Text ──────────────────────────────────────────────────────────────────

const CLASS_COLOR: Record<CharClass, string> = {
  "zero-width": "var(--danger)", bidi: "var(--warn)", tag: "var(--danger)", variation: "var(--accent-2)", space: "var(--accent)", format: "var(--text-muted)",
};

function short(name: string) {
  return name.replace(/^ZERO WIDTH /, "ZW ").replace(/ SPACE$/, " SP").replace(/^VARIATION SELECTOR-/, "VS");
}

function TextPanel() {
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<TextOptions>(DEFAULT_TEXT_OPTIONS);
  const [copied, setCopied] = useState(false);
  const scan = useMemo(() => scanText(text, opts), [text, opts]);
  const total = scan.hits.length;

  // The original text with every hidden character drawn as a visible marker.
  const marked = useMemo(() => {
    const out: React.ReactNode[] = [];
    let last = 0;
    scan.hits.forEach((h, i) => {
      if (h.index > last) out.push(text.slice(last, h.index));
      out.push(
        <span key={i} title={`${h.name} — ${h.action}`} style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, lineHeight: "16px", padding: "0 4px", margin: "0 1px", borderRadius: 4, verticalAlign: "1px", color: "#fff", background: CLASS_COLOR[h.cls], opacity: h.action === "kept" ? 0.45 : 1 }}>
          {short(h.name)}
        </span>,
      );
      last = h.index + h.length;
    });
    out.push(text.slice(last));
    return out;
  }, [scan, text]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(scan.cleaned); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const downloadTxt = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([scan.cleaned], { type: "text/plain;charset=utf-8" }));
    a.download = "cleaned-text.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  const area: React.CSSProperties = { width: "100%", minHeight: 170, resize: "vertical", boxSizing: "border-box", background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit" };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card}>
        <label htmlFor="hm-in" style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8 }}>Paste text to check</label>
        <textarea id="hm-in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text from an AI chat, an email or a web page…" style={area} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
          {(Object.keys(CLASS_LABELS) as CharClass[]).map((c) => (
            <label key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
              <input type="checkbox" checked={opts[c]} onChange={(e) => setOpts({ ...opts, [c]: e.target.checked })} style={{ accentColor: "var(--accent)" }} />
              {CLASS_LABELS[c]}
              {scan.counts[c] > 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", background: CLASS_COLOR[c], borderRadius: 999, padding: "1px 7px" }}>{scan.counts[c]}</span>}
            </label>
          ))}
        </div>
      </div>

      {text && (
        <>
          <div style={{ ...card, borderColor: total ? "var(--accent-border)" : "var(--border)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: total ? "var(--text)" : "var(--success)", marginBottom: total ? 10 : 0 }}>
              {total ? `Found ${total} hidden character${total === 1 ? "" : "s"}` : "✓ No hidden characters found"}
            </div>
            {scan.hiddenMessages.map((m, i) => (
              <div key={i} style={{ background: "var(--danger-soft)", color: "var(--text)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, marginBottom: 10, overflowWrap: "anywhere" }}>
                <strong style={{ color: "var(--danger)" }}>Hidden message decoded:</strong> {m}
              </div>
            ))}
            {total > 0 && (
              <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 14, lineHeight: 1.75, color: "var(--text)", maxHeight: 260, overflowY: "auto", background: "var(--surface-2)", borderRadius: 10, padding: 12 }}>
                {marked}
              </div>
            )}
          </div>

          <div style={card}>
            <label htmlFor="hm-out" style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8 }}>Clean text</label>
            <textarea id="hm-out" readOnly value={scan.cleaned} style={area} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button onClick={copy} style={primary}>{copied ? "Copied ✓" : "Copy clean text"}</button>
              <button onClick={downloadTxt} style={btn}>Download .txt</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
