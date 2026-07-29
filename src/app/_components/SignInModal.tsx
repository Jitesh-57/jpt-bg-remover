"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  // "unlimited" = shown after a guest uses their free trials; "default" = generic.
  reason?: "default" | "unlimited";
  // Called right before an auth redirect/reload so the page can persist context.
  onBeforeAuth?: () => void;
  // Where to return after Google OAuth. Defaults to the current path.
  nextPath?: string;
}

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";
const INPUT: React.CSSProperties = { border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "12px 13px", fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

/**
 * Clean, compact sign-in nudge. Google (redirect) + optional email login/signup.
 * Shared by the editor and batch editor so the sign-in step looks consistent.
 */
export default function SignInModal({ onClose, reason = "default", onBeforeAuth, nextPath }: Props) {
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const google = () => {
    onBeforeAuth?.();
    const next = nextPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  const emailAuth = async () => {
    if (!email.trim() || !password.trim()) { setError("Email and password required"); return; }
    setLoading(true); setError("");
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? { email: email.trim(), password, name: name.trim() }
        : { email: email.trim(), password };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { error?: string; needsConfirmation?: boolean };
      if (!res.ok) {
        setError(res.status === 503 ? "Email sign-in isn't enabled — please use Google." : (data.error || "Authentication failed"));
        return;
      }
      if (data.needsConfirmation) { setError("✅ Check your email for a confirmation link, then sign in."); return; }
      onBeforeAuth?.();
      window.location.reload();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const title = reason === "unlimited" ? "Sign in to keep going" : "Sign in to continue";
  const sub = reason === "unlimited"
    ? "You've used your 5 free edits. Create a free account to keep using every basic tool — no limits, no card."
    : "Create a free account to continue. It takes a second and keeps your work saved.";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, boxShadow: "0 24px 70px rgba(0,0,0,0.35)", padding: "30px 28px 24px" }}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "none", background: "#F1F5F9", color: "#64748B", cursor: "pointer", fontSize: 17, lineHeight: 1 }}>×</button>

        <div style={{ width: 46, height: 46, borderRadius: 13, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 20px rgba(99,102,241,0.3)" }}>
          <span style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>✦</span>
        </div>

        <h2 style={{ fontSize: 21, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 8px" }}>{title}</h2>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.55, margin: "0 0 20px" }}>{sub}</p>

        <ul style={{ listStyle: "none", margin: "0 0 22px", padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
          {["Free basic image tools", "Your edits saved to your account", "No credit card required"].map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#374151", fontWeight: 600 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#ECFDF5", color: "#10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        <button onClick={google} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, width: "100%", padding: "14px", borderRadius: 12, border: "none", background: GRAD, color: "#fff", fontSize: 15.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 22px rgba(99,102,241,0.35)" }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
          </span>
          Continue with Google
        </button>

        {!showEmail ? (
          <button onClick={() => setShowEmail(true)} style={{ display: "block", width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
            Continue with email
          </button>
        ) : (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 13 }}>
              <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: mode === "signup" ? 800 : 500, color: mode === "signup" ? "#6366F1" : "#94A3B8", borderBottom: mode === "signup" ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 12px" }}>Create account</button>
              <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: mode === "login" ? 800 : 500, color: mode === "login" ? "#6366F1" : "#94A3B8", borderBottom: mode === "login" ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 12px" }}>Sign in</button>
            </div>
            {mode === "signup" && <input type="text" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />}
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && emailAuth()} style={INPUT} />
            <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && emailAuth()} style={INPUT} />
            {error && <div style={{ background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#C0392B" }}>{error}</div>}
            <button onClick={emailAuth} disabled={loading} style={{ padding: "12px", borderRadius: 10, border: "none", background: loading ? "#9CA3AF" : GRAD, color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account — free" : "Sign in"}
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
