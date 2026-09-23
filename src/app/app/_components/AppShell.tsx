"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditPill from "./CreditPill";
import CommandPalette from "./CommandPalette";
import UserMenu from "./UserMenu";
import Icon, { type IconName } from "./Icon";
import { DashboardUserProvider, type DashboardUser } from "./DashboardUser";
import { beginGoogleSignIn } from "@/lib/auth-return";
import { openPricing } from "@/lib/pricing-modal";
import BrandLogo from "@/app/_components/BrandLogo";

interface NavItem { label: string; href: string; icon: IconName; badge?: string }

const GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ label: "Home", href: "/app", icon: "home" }] },
  {
    label: "Create",
    items: [
      { label: "Create Image", href: "/app/create", icon: "sparkle" },
      { label: "Recreate", href: "/app/recreate", icon: "copy", badge: "New" },
      { label: "Image Editor", href: "/app/editor", icon: "editor" },
    ],
  },
  {
    label: "Explore",
    items: [
      { label: "AI Apps", href: "/app/apps", icon: "apps" },
      { label: "Community", href: "/app/community", icon: "community" },
    ],
  },
];

const BOTTOM: NavItem[] = [
  { label: "My Creations", href: "/app/library", icon: "folder" },
  { label: "Settings", href: "/app/settings", icon: "settings" },
  { label: "Back to website", href: "/", icon: "globe" },
];

const MOBILE_TABS: NavItem[] = [
  { label: "Home", href: "/app", icon: "home" },
  { label: "Create", href: "/app/create", icon: "sparkle" },
  { label: "Recreate", href: "/app/recreate", icon: "copy" },
  { label: "Edit", href: "/app/editor", icon: "editor" },
  { label: "Apps", href: "/app/apps", icon: "apps" },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname || !href.startsWith("/app")) return false;
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

type AuthState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: DashboardUser };

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" title="Go to Pixel Shine homepage" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", minWidth: 0 }}>
      <BrandLogo height={32} variant={collapsed ? "mark" : "wordmark"} />
    </Link>
  );
}

function NavLink({ item, pathname, collapsed }: { item: NavItem; pathname: string | null; collapsed: boolean }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className="jpt-nav-item"
      data-active={active}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "10px 0" : "9px 12px",
        justifyContent: collapsed ? "center" : "flex-start", borderRadius: 10,
        color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap",
      }}
    >
      <Icon name={item.icon} size={18} />
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && item.badge && (
        <span style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", background: "var(--grad-strong)", borderRadius: 999, padding: "2px 7px", letterSpacing: "0.03em" }}>{item.badge}</span>
      )}
    </Link>
  );
}

function ShellSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <div className="jpt-app-sidebar" style={{ width: 232, borderRight: "1px solid var(--border)", background: "var(--bg-elevated)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="jpt-skel" style={{ height: 30, width: 140, borderRadius: 9, marginBottom: 18 }} />
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="jpt-skel" style={{ height: 34, borderRadius: 10 }} />)}
      </div>
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="jpt-skel" style={{ height: 40, maxWidth: 420, borderRadius: 12 }} />
        <div className="jpt-skel" style={{ height: 220, borderRadius: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="jpt-skel" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      </div>
    </div>
  );
}

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

  // A free trial granted at signup is announced once, then forgotten.
  const [trialToast, setTrialToast] = useState(0);
  useEffect(() => {
    if (auth.status !== "signed-in") return;
    const m = document.cookie.match(/(?:^|; )jpt_trial=(\d+)/);
    if (!m) return;
    document.cookie = "jpt_trial=; path=/; max-age=0";
    setTrialToast(Number(m[1]));
    const t = setTimeout(() => setTrialToast(0), 9000);
    return () => clearTimeout(t);
  }, [auth.status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (auth.status === "checking") return <ShellSkeleton />;

  if (auth.status === "signed-out") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        <div className="jpt-a-glow" aria-hidden style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 65%)", top: "50%", left: "50%", marginTop: -310, marginLeft: -310 }} />
        <div className="jpt-a-up" style={{ position: "relative", textAlign: "center", maxWidth: 400, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 22, padding: "36px 30px", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Brand /></div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Sign in to your studio</h1>
          <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 24px" }}>
            Create images, run 200+ AI apps and keep every result in one place.
          </p>
          <button
            onClick={() => beginGoogleSignIn(pathname || "/app")}
            style={{ width: "100%", padding: "13px 28px", borderRadius: 12, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)" }}
          >
            Continue with Google
          </button>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 18, fontSize: 13, color: "var(--text-faint)", textDecoration: "none" }}>
            <Icon name="globe" size={14} /> Back to Pixel Shine
          </Link>
        </div>
      </div>
    );
  }

  const { user } = auth;
  const width = collapsed ? 72 : 232;

  return (
    <DashboardUserProvider value={user}>
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex" }}>
        <aside
          className="jpt-app-sidebar"
          style={{
            width, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg-elevated)",
            display: "flex", flexDirection: "column", transition: "width .22s var(--ease)",
            position: "sticky", top: 0, height: "100vh", overflow: "hidden",
          }}
        >
          <div style={{ padding: collapsed ? "16px 0" : "16px 14px 16px 18px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 8, minHeight: 64 }}>
            {!collapsed && <Brand />}
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="jpt-nav-item"
              style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "transparent", color: "var(--text-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="panel" size={18} />
            </button>
          </div>

          <nav style={{ flex: 1, padding: collapsed ? "4px 12px" : "4px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            {GROUPS.map((g, gi) => (
              <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: gi === 0 ? 0 : 14 }}>
                {g.label && (collapsed
                  ? <div style={{ height: 1, background: "var(--border)", margin: "0 8px 8px" }} />
                  : <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px 6px" }}>{g.label}</div>)}
                {g.items.map((item) => <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />)}
              </div>
            ))}
          </nav>

          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
            {BOTTOM.map((item) => <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />)}
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header style={{ position: "sticky", top: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--border)" }}>
            <div className="jpt-app-brand-sm" style={{ display: "none" }}><Brand collapsed /></div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="jpt-lift"
              style={{
                flex: 1, minWidth: 0, maxWidth: 440, display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text-faint)", fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", textAlign: "left",
              }}
            >
              <Icon name="search" size={16} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search apps, tools and pages…</span>
              <span className="jpt-app-hide-sm" style={{ fontSize: 11, fontWeight: 700, border: "1px solid var(--border-strong)", borderRadius: 6, padding: "1px 6px" }}>Ctrl K</span>
            </button>
            <div className="jpt-app-hide-sm" style={{ flex: 1 }} />
            <button
              onClick={() => openPricing("Get more credits")}
              className="jpt-sheen jpt-app-hide-sm"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 15px", borderRadius: 999, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 13, fontFamily: "inherit", cursor: "pointer", boxShadow: "var(--glow)" }}
            >
              <Icon name="gem" size={15} /> Get credits
            </button>
            <CreditPill initialCredits={user.credits} />
            <UserMenu user={user} />
          </header>

          <main style={{ flex: 1, paddingBottom: 76 }}>{children}</main>
        </div>

        <nav className="jpt-app-tabbar" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--border)", padding: "6px 4px calc(6px + env(safe-area-inset-bottom))" }}>
          {MOBILE_TABS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", textDecoration: "none", color: active ? "var(--accent)" : "var(--text-faint)", transition: "color .15s ease" }}>
                <Icon name={item.icon} size={20} />
                <span style={{ fontSize: 10.5, fontWeight: 700 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {trialToast > 0 && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 24, zIndex: 1200, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div role="status" className="jpt-a-pop" onClick={() => setTrialToast(0)}
            style={{ pointerEvents: "auto", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 14.5, padding: "13px 20px", borderRadius: 14, boxShadow: "var(--glow)", cursor: "pointer", textAlign: "center" }}>
            🎁 Welcome! You got {trialToast} free credits. Try your first AI creation.
          </div>
        </div>
      )}

    </DashboardUserProvider>
  );
}
