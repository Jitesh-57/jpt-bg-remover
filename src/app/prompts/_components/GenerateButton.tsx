"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendToEditor } from "@/lib/prompts/handoff";
import { prepareDataUrl } from "@/lib/upload-prep";
import { trackEvent } from "@/lib/analytics";
import { userMessage } from "@/lib/user-message";

/**
 * GenerateButton — "Generate this", everywhere.
 *
 * Two paths, decided by whether the prompt actually needs a photo from the
 * reader (`needsPhoto`, computed when the dataset is built):
 *
 *   needs a photo  →  ask for it here, then open the editor with the photo and
 *                     the prompt loaded and start the generation.
 *   generates one  →  straight to the editor with the prompt. Putting an
 *                     upload box in front of someone with nothing to upload is
 *                     a dead end, not a step.
 *
 * Video prompts get no button at all — there is no video generation on this
 * site, and a button that leads somewhere unrelated is worse than no button.
 * That is the caller's decision; this component is never rendered for them.
 */

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";
const MAX_MB = 10;

export default function GenerateButton({
  uid,
  prompt,
  needsPhoto,
  full = false,
  label,
}: {
  uid: string;
  /** The filled-in prompt: whatever the placeholders currently say. */
  prompt: string;
  needsPhoto: boolean;
  full?: boolean;
  label?: string;
}) {
  /*
    Arriving from a card's Generate button.

    A card cannot carry the prompt itself — some of these run to 22,000
    characters, and a grid of 254 of them would be a megabyte of payload for
    text nobody can see — so the card links here with ?generate=1 and the flow
    picks up where it left off. It also means the reader sees the prompt and
    its placeholders before spending a credit, which is the right order.
  */
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("generate") === "1";
    if (!wanted) return;
    // Clean the URL so a refresh, a share or a back-navigation does not
    // reopen it.
    window.history.replaceState(null, "", window.location.pathname);
    if (needsPhoto) setOpen(true);
    // A text-to-image prompt has nothing to ask for; it just goes.
    else void sendToEditor({ prompt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const go = async (image?: string) => {
    setBusy(true);
    trackEvent("prompt_generate_click", { uid, withPhoto: !!image });
    try {
      await sendToEditor({ prompt, image });
    } catch (e) {
      setErr(userMessage(e, "Could not open the editor. Please try again."));
      setBusy(false);
    }
  };

  const onFile = useCallback(async (file: File) => {
    setErr(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setErr("Please use a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`That image is ${(file.size / 1048576).toFixed(1)}MB — the limit is ${MAX_MB}MB.`);
      return;
    }
    setBusy(true);
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("That file could not be read."));
        r.readAsDataURL(file);
      });
      // Downscaled before it is stored: a 12MP phone photo as base64 is past
      // the request body limit at the other end, and this is the last place
      // that can shrink it cheaply.
      await go(await prepareDataUrl(raw));
    } catch (e) {
      setErr(userMessage(e, "That photo could not be read. Please try another."));
      setBusy(false);
    }
  }, [prompt, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const button = (
    <button
      onClick={() => (needsPhoto ? (setErr(null), setOpen(true)) : void go())}
      disabled={busy}
      style={{
        cursor: busy ? "wait" : "pointer", fontFamily: "inherit", borderRadius: 11,
        width: full ? "100%" : undefined,
        padding: full ? "13px 18px" : "9px 14px",
        fontSize: full ? 15 : 13.5, fontWeight: 700,
        background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)",
      }}
    >
      {busy ? "Opening…" : label || "Generate this →"}
    </button>
  );

  if (!open) return button;

  return (
    <>
      {button}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add your photo"
        onClick={() => !busy && setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.72)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(460px, 100%)", background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "24px 24px 22px",
          }}
        >
          <h2 style={{ fontSize: 19, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Add your photo
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 18px" }}>
            This prompt works on a photo of your own. Pick one and it opens in the editor with the prompt
            already loaded.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void onFile(f);
            }}
            onClick={() => !busy && fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border-strong)"}`,
              background: dragging ? "var(--accent-soft)" : "var(--surface-2)",
              borderRadius: 16, padding: "30px 20px", textAlign: "center",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
              {busy ? "Preparing…" : "Choose a photo"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 6 }}>
              or drag it here · JPG, PNG, WEBP up to {MAX_MB}MB
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 14, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 10, padding: "10px 13px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <button
              onClick={() => void go()}
              disabled={busy}
              style={{ cursor: "pointer", fontFamily: "inherit", background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textDecoration: "underline" }}
            >
              Skip — just open the editor
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={busy}
              style={{ cursor: "pointer", fontFamily: "inherit", background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "var(--text-faint)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
