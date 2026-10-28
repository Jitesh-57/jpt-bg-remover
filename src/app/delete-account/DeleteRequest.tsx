"use client";

import { useEffect, useState } from "react";
import { userMessage } from "@/lib/user-message";

/**
 * The "request deletion" button, for whoever is signed in on this browser.
 * Signed out, it renders nothing and the page's other two ways stand alone.
 * Two taps, the second one to confirm: the page can't use confirm().
 */
export default function DeleteRequest() {
  const [email, setEmail] = useState<string | null>(null);
  const [step, setStep] = useState<"ask" | "confirm" | "sending" | "done">("ask");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then((r) => r.json())
      .then((d) => { if (d?.authenticated) setEmail(d.email || "your account"); })
      .catch(() => { /* signed out or offline: the other ways still show */ });
  }, []);

  if (!email) return null;

  const send = async () => {
    setStep("sending");
    setErr(null);
    try {
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "web" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(userMessage(data.error, "That didn't go through. Please try again.")); setStep("confirm"); return; }
      setStep("done");
    } catch {
      setErr("Could not reach the server. Check your connection and try again.");
      setStep("confirm");
    }
  };

  const box: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: 12, padding: 20, marginBottom: 24, borderRadius: 16,
    border: "1px solid var(--border)", background: "var(--surface-2, var(--surface))",
  };
  const button: React.CSSProperties = {
    font: "inherit", fontWeight: 700, fontSize: 15, padding: "12px 18px", borderRadius: 12, border: 0,
    cursor: "pointer", color: "#fff", background: "#D92D3A", alignSelf: "flex-start",
  };

  if (step === "done") {
    return (
      <div style={box} role="status">
        <b style={{ color: "var(--text)" }}>Request received.</b>
        <span>The account {email} and its photos will be deleted within 30 days.</span>
      </div>
    );
  }
  return (
    <div style={box}>
      <span>You&apos;re signed in as <b style={{ color: "var(--text)" }}>{email}</b>.</span>
      {step === "ask" ? (
        <button style={button} onClick={() => setStep("confirm")}>Delete this account</button>
      ) : (
        <>
          <span>This permanently deletes the account, its photos and any unused credits. It can&apos;t be undone.</span>
          <button style={button} disabled={step === "sending"} onClick={() => void send()}>
            {step === "sending" ? "Sending…" : "Yes, delete my account"}
          </button>
        </>
      )}
      {err && <span style={{ color: "#D92D3A" }}>{err}</span>}
    </div>
  );
}
