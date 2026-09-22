"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditPill from "./CreditPill";
import CommandPalette from "./CommandPalette";
import { DashboardUserProvider, type DashboardUser } from "./DashboardUser";
import { beginGoogleSignIn } from "@/lib/auth-return";

const NAV = [
  { label: "Home", href: "/app", icon: "🏠" },
  { label: "AI Tools", href: "/app/tools", icon: "✨" },
  { label: "Free Tools", href: "/app/tools/free", icon: "🧰" },
  { label: "My Creations", href: "/app/library", icon: "📁" },
  { label: "Credits", href: "/app/credits", icon: "⚡" },
];

const MOBILE_TABS = [
  { label: "Home", href: "/app", icon: "🏠" },
  { label: "Tools", href: "/app/tools", icon: "✨" },
  { label: "Library", href: "/app/library", icon: "📁" },
  { label: "Credits", href: "/app/credits", icon: "⚡" },
];

type AuthState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: DashboardUser };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("jpt_app_sidebar_collapsed") === "1"); } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("jpt_app_sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  useEffect(() => {
    let live = true;
    fetch("/api/auth/google/me")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; userId?: string; email?: string; name?: string; picture?: string; credits?: number; plan?: string }) => {
        if (!live) return;
        if (!d.authenticated) { setAuth({ status: "signed-out" }); return; }
        setAuth({
          status: "signed-in",
          user: {
            userId: d.userId!, email: d.email, name: d.name || "there", picture: d.picture,
            credits: d.credits ?? 0, plan: d.plan ?? "free", hasPurchased: (d.plan ?? "free") !== "free",
          },
        });
      })
      .catch(() => { if (live) setAuth({ status: "signed-out" }); });
    return () => { live = false; };
  }, []);

  // ⌘K / Ctrl+K opens the command palette from anywhere in the shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (auth.status === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="jpt-spin" style={{ fontSize: 28, color: "var(--text-faint)" }}>◍</div>
      </div>
    );
  }

  if (auth.status === "signed-out") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>Sign in to Pixel Shine</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 24px" }}>
            Your dashboard, credits and creations live here — sign in to see them.
          </p>
          <button
            onClick={() => beginGoogleSignIn(pathname || "/app")}
            style={{
              padding: "13px 28px", borderRadius: 12, border: "none", background: "var(--grad-strong)",
              color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)",
            }}
          >
            Sign in with Google
          </button>
          <div style={{ marginTop: 18 }}>
            <a href="/" style={{ fontSize: 13, color: "var(--text-faint)", textDecoration: "none" }}>← Back to Pixel Shine</a>
          </div>
        </div>
      </div>
    );
  }

  const { user } = auth;

  return (
    <DashboardUserProvider value={user}>
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex" }}>
        {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
        <aside
          className="jpt-app-sidebar"
          style={{
            width: collapsed ? 64 : 232, flexShrink: 0, borderRight: "1px solid var(--border)",
            background: "var(--bg-elevated)", display: "flex", flexDirection: "column",
            transition: "width .18s var(--ease)", position: "sticky", top: 0, height: "100vh",
          }}
        >
          <div style={{ padding: "16px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", minHeight: 56 }}>
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
            </button>
            {!collapsed && <Link href="/app" style={{ fontWeight: 900, fontSize: 15, color: "var(--text)", textDecoration: "none" }}>✦ Pixel <span style={{ color: "var(--accent)" }}>Shine</span></Link>}
          </div>

          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map((item) => {
              const active = item.href === "/app" ? pathname === "/app" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10,
                    color: active ? "var(--accent)" : "var(--text-muted)", background: active ? "var(--accent-soft)" : "transparent",
                    fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden",
                  }}
                >
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: 10, borderTop: "1px solid var(--border)" }}>
            <Link
              href="/app/settings"
              title={collapsed ? "Settings" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10,
                color: pathname?.startsWith("/app/settings") ? "var(--accent)" : "var(--text-muted)",
                background: pathname?.startsWith("/app/settings") ? "var(--accent-soft)" : "transparent",
                fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 17 }}>⚙️</span>
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </aside>

        {/* ── Main column ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header style={{ position: "sticky", top: 0, zIndex: 100, height: 56, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setPaletteOpen(true)}
              style={{
                flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)",
                color: "var(--text-faint)", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", textAlign: "left",
              }}
            >
              <span>🔍</span>
              <span style={{ flex: 1 }}>Search tools and creations…</span>
              <span style={{ fontSize: 11, fontWeight: 700, border: "1px solid var(--border-strong)", borderRadius: 5, padding: "1px 6px" }}>⌘K</span>
            </button>
            <div style={{ flex: 1 }} />
            <CreditPill initialCredits={user.credits} />
            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "var(--accent)", flexShrink: 0 }}>
              {user.picture
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.picture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : user.name.slice(0, 1).toUpperCase()}
            </div>
          </header>

          <main style={{ flex: 1, paddingBottom: 72 /* leaves room for the mobile tab bar */ }}>
            {children}
          </main>
        </div>

        {/* ── Mobile bottom tab bar ──────────────────────────────────────── */}
        <nav className="jpt-app-tabbar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "6px 4px" }}>
          {MOBILE_TABS.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0", textDecoration: "none", color: active ? "var(--accent)" : "var(--text-faint)" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </DashboardUserProvider>
  );
}
