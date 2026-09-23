"use client";

import { useEffect, useState } from "react";
import { sendToCreate } from "@/lib/prompts/handoff";
import { trackEvent } from "@/lib/analytics";
import { userMessage } from "@/lib/user-message";

/**
 * GenerateButton — "Generate this", everywhere.
 *
 * Opens Create Image with the prompt loaded and the prompt's example image as
 * the reference. A prompt written for the reader's own photo is flagged, and
 * Create asks for that photo before it runs.
 *
 * Video prompts get no button at all — there is no video generation on this
 * site. That is the caller's decision; this component is never rendered for them.
 */
export default function GenerateButton({
  uid,
  prompt,
  needsPhoto,
  reference,
  full = false,
  label,
}: {
  uid: string;
  /** The filled-in prompt: whatever the placeholders currently say. */
  prompt: string;
  needsPhoto: boolean;
  /** The prompt's example image, used as the reference in Create Image. */
  reference?: string | null;
  full?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setErr(null);
    trackEvent("prompt_generate_click", { uid, needsPhoto });
    try {
      await sendToCreate({ prompt, reference, needsPhoto, source: "prompt-library" });
    } catch (e) {
      setErr(userMessage(e, "Could not open Create Image. Please try again."));
      setBusy(false);
    }
  };

  /*
    Arriving from a card's Generate button: cards link here with ?generate=1
    (a card cannot carry a prompt that runs to 22,000 characters), so the
    flow continues from the detail page.
  */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("generate") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname);
    void go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        onClick={() => void go()}
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
      {err && <div style={{ marginTop: 8, color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{err}</div>}
    </>
  );
}
