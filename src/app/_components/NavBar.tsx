"use client";

import { useEffect, useState } from "react";

interface User {
  email: string;
  name: string;
  picture?: string;
  credits: number;
}

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/me")
      .then(r => r.json())
      .then((d: { authenticated: boolean; email?: string; name?: string; picture?: string; credits?: number }) => {
        if (d.authenticated && d.email) {
          setUser({ email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? 10 });
        }
      })
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/google/logout", { method: "POST" });
    setUser(null);
    setShowMenu(false);
    window.location.href = "/";
  };

  return (
    <nav className="jpt-nav">
      <div className="jpt-nav-inner">
        <a href="/" className="jpt-brand">
          <span className="jpt-brand-icon">✦</span>
          <span className="jpt-brand-text">JPT AI</span>
        </a>
        <div className="jpt-nav-divider" />
        <span className="jpt-section-label">AI Tools</span>
        <div className="jpt-nav-links">
          <a href="/editor" className="jpt-nav-link">
            <span>🖼️</span> AI Image Editor
          </a>
          <a href="/headshot" className="jpt-nav-link">
            <span>🎯</span> AI Headshot
          </a>
        </div>
        <div style={{ flex: 1 }} />

        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {user.picture ? (
                <img src={user.picture} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#6366F1", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {user.name[0]}
                </div>
              )}
              <span>{user.name.split(" ")[0]}</span>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.3)", padding: "2px 6px", borderRadius: 4 }}>⚡ {user.credits}</span>
            </button>

            {showMenu && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                minWidth: 200,
                zIndex: 1000,
              }}>
                <div style={{ padding: 12, borderBottom: "1px solid #E5E7EB" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{user.email}</div>
                </div>
                <div style={{ padding: "8px 0" }}>
                  <a href="/history" style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#333", textDecoration: "none", borderBottom: "1px solid #E5E7EB" }} onClick={() => setShowMenu(false)}>
                    📊 View History
                  </a>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      fontSize: 13,
                      color: "#EF4444",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/api/auth/google?next=/editor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "#6366F1",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>🔐</span> Sign In
          </a>
        )}
      </div>
    </nav>
  );
}
