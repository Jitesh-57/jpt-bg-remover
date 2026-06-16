"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const PricingModal = lazy(() => import("./PricingModal"));

interface User {
  email: string;
  name: string;
  picture?: string;
  credits: number;
}

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const [tab, setTab] = useState<"google" | "email">("google");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetch("/api/auth/google/me")
          .then(r => r.json())
          .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string; credits?: number }) => {
            if (d.authenticated && d.email) {
              setUser({ email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? 10 });
            }
          }).catch(() => null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetch("/api/auth/google/me")
          .then(r => r.json())
          .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string; credits?: number }) => {
            if (d.authenticated && d.email) {
              setUser({ email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? 10 });
            }
          }).catch(() => null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/editor";

  const openModal = () => {
    setShowModal(true); setTab("google"); setMode("login");
    setEmail(""); setPassword(""); setName(""); setAuthError("");
  };
  const closeModal = () => { setShowModal(false); setAuthError(""); };

  const handleGoogleSignIn = () => {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(currentPath)}`;
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setAuthError("Email and password required"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? { email: email.trim(), password, name: name.trim() }
        : { email: email.trim(), password };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { ok?: boolean; email?: string; name?: string; credits?: number; error?: string; needsConfirmation?: boolean };
      if (!res.ok) { setAuthError(data.error || "Authentication failed"); return; }
      if (data.needsConfirmation) { setAuthError("✅ Check your email and click the confirmation link, then sign in."); return; }
      window.location.reload();
    } catch { setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
    } catch {}
    await fetch("/api/auth/google/logout", { method: "POST" });
    setUser(null); setShowMenu(false);
    window.location.href = "/";
  };

  return (
    <>
      <nav className="jpt-nav">
        <div className="jpt-nav-inner">
          <a href="/" className="jpt-brand">
            <span className="jpt-brand-icon">✦</span>
            <span className="jpt-brand-text">JPT AI</span>
          </a>
          <div className="jpt-nav-divider" />
          <span className="jpt-section-label">AI Tools</span>
          <div className="jpt-nav-links">
            <a href="/upscale" className="jpt-nav-link"><span>🔍</span> AI Upscale</a>
            <a href="/remove-bg" className="jpt-nav-link"><span>🪄</span> Remove BG</a>
            <a href="/ai-headshot" className="jpt-nav-link"><span>🎯</span> AI Headshot</a>
            <a href="/ai-editor" className="jpt-nav-link"><span>✍️</span> AI Editor</a>
            <a href="/editor" className="jpt-nav-link"><span>🖼️</span> Image Editor</a>
            <a href="/batch-editor" className="jpt-nav-link"><span>⚡</span> Batch Editor</a>
            <a href="/headshot" className="jpt-nav-link"><span>🎯</span> Headshot Tool</a>
            <a href="/generations" className="jpt-nav-link"><span>✦</span> My Generations</a>
            <button onClick={() => setShowPricing(true)} className="jpt-nav-link" style={{ background: "none", border: "none", cursor: "pointer" }}><span>💳</span> Pricing</button>
          </div>
          <div style={{ flex: 1 }} />

          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                {user.picture
                  ? <img src={user.picture} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#6366F1", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name[0]}</div>}
                <span>{user.name.split(" ")[0]}</span>
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.3)", padding: "2px 6px", borderRadius: 4 }}>⚡ {user.credits}</span>
              </button>
              {showMenu && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 200, zIndex: 1000 }}>
                  <div style={{ padding: 12, borderBottom: "1px solid #E5E7EB" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{user.email}</div>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    <a href="/generations" style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#333", textDecoration: "none", borderBottom: "1px solid #E5E7EB" }} onClick={() => setShowMenu(false)}>
                      ✦ My Generations
                    </a>
                    <button onClick={() => { setShowPricing(true); setShowMenu(false); }} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", textAlign: "left", fontSize: 13, color: "#6366F1", cursor: "pointer", fontWeight: 600, borderBottom: "1px solid #E5E7EB" }}>
                      💳 Buy Credits
                    </button>
                    <button onClick={handleLogout} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", textAlign: "left", fontSize: 13, color: "#EF4444", cursor: "pointer", fontWeight: 500 }}>
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={openModal} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🔐 Sign In
            </button>
          )}
        </div>
      </nav>

      {showPricing && (
        <Suspense fallback={null}>
          <PricingModal
            onClose={() => setShowPricing(false)}
            onPurchaseSuccess={(_, newCredits) => {
              setUser(u => u ? { ...u, credits: newCredits } : u);
              setShowPricing(false);
            }}
          />
        </Suspense>
      )}

      {showModal && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>✨</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#111", marginBottom: 6 }}>Sign in to JPT AI</div>
              <p style={{ fontSize: 14, color: "#666", margin: 0 }}>Get <strong>10 free AI credits</strong> to start editing</p>
            </div>
            <div style={{ display: "flex", background: "#F0F0F8", borderRadius: 10, padding: 3, marginBottom: 22 }}>
              {(["google", "email"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setAuthError(""); }}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: tab === t ? "#fff" : "none", fontWeight: 700, fontSize: 13, cursor: "pointer", color: tab === t ? "#6366F1" : "#888", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                  {t === "google" ? "🔵 Google" : "📧 Email"}
                </button>
              ))}
            </div>
            {tab === "google" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={handleGoogleSignIn}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "13px 20px", background: "#fff", border: "1.5px solid #E0E0EE", borderRadius: 10, cursor: "pointer", color: "#222", fontWeight: 700, fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", width: "100%" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <div style={{ fontSize: 12, color: "#999", textAlign: "center" }}>Quick · No password needed · Works with any Google account</div>
              </div>
            )}
            {tab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", borderBottom: "1px solid #F0F0F0", paddingBottom: 12, marginBottom: 4 }}>
                  {(["login", "signup"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setAuthError(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontWeight: mode === m ? 800 : 400, color: mode === m ? "#6366F1" : "#888", borderBottom: mode === m ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 16px", fontSize: 14 }}>
                      {m === "login" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>
                {mode === "signup" && (
                  <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)}
                    style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                )}
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                {authError && (
                  <div style={{ background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#C00" }}>{authError}</div>
                )}
                <button onClick={handleEmailAuth} disabled={authLoading}
                  style={{ padding: "12px", background: authLoading ? "#A5B4FC" : "#6366F1", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: authLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {authLoading
                    ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />{mode === "signup" ? "Creating…" : "Signing in…"}</>
                    : mode === "signup" ? "✦ Create Account" : "→ Sign In"}
                </button>
                <p style={{ fontSize: 12, color: "#999", textAlign: "center", margin: 0 }}>
                  {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                  <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setAuthError(""); }}
                    style={{ background: "none", border: "none", color: "#6366F1", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 12 }}>
                    {mode === "signup" ? "Sign in" : "Create one"}
                  </button>
                </p>
              </div>
            )}
            <button onClick={closeModal} style={{ display: "block", width: "100%", marginTop: 18, padding: "8px", background: "none", border: "none", color: "#AAA", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
