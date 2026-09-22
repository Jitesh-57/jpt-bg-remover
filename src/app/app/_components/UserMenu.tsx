"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import type { DashboardUser } from "./DashboardUser";
import { createSupabaseClient } from "@/lib/supabase";

export async function signOut() {
  try { await createSupabaseClient().auth.signOut(); } catch {}
  try { await fetch("/api/auth/google/logout", { method: "POST" }); } catch {}
  window.location.href = "/";
}

export function Avatar({ user, size = 32 }: { user: DashboardUser; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "var(--accent-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.4, color: "var(--accent)", flexShrink: 0 }}>
      {user.picture
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.picture} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

const ITEMS: { label: string; href: string; icon: IconName }[] = [
  { label: "My Creations", href: "/app/library", icon: "folder" },
  { label: "Credits & billing", href: "/app/credits", icon: "zap" },
  { label: "Settings", href: "/app/settings", icon: "settings" },
  { label: "Pixel Shine website", href: "/", icon: "globe" },
];

export default function UserMenu({ user }: { user: DashboardUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none", background: "none", border: "none", fontFamily: "inherit", cursor: "pointer", textAlign: "left" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Account menu" aria-expanded={open} style={{ display: "flex", padding: 2, borderRadius: "50%", border: `2px solid ${open ? "var(--accent)" : "transparent"}`, background: "none", cursor: "pointer", transition: "border-color .15s ease" }}>
        <Avatar user={user} />
      </button>
      {open && (
        <div className="jpt-a-pop" role="menu" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 250, zIndex: 300, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 6, transformOrigin: "top right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 12px" }}>
            <Avatar user={user} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              {user.email && <div style={{ fontSize: 12, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>}
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "0 4px 6px" }} />
          {ITEMS.map((it) => (
            <Link key={it.href} href={it.href} role="menuitem" onClick={() => setOpen(false)} className="jpt-nav-item" style={row}>
              <Icon name={it.icon} size={16} /> {it.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "6px 4px" }} />
          <button role="menuitem" onClick={signOut} className="jpt-nav-item" style={row}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
