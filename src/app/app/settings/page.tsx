"use client";

import { useState } from "react";
import { useDashboardUser } from "../_components/DashboardUser";
import { createSupabaseClient } from "@/lib/supabase";
import { CREDIT_COST } from "@/lib/plans";

export default function SettingsPage() {
  const user = useDashboardUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await createSupabaseClient().auth.signOut(); } catch {}
    try { await fetch("/api/auth/google/logout", { method: "POST" }); } catch {}
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.4rem,2.6vw,1.8rem)", fontWeight: 900, margin: "0 0 24px", color: "var(--text)" }}>Settings</h1>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 26px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "var(--accent)", flexShrink: 0 }}>
            {user.picture
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.picture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : user.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            {user.email && <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 26px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>⚡ {user.credits} credits</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{Math.floor(user.credits / CREDIT_COST)} generations left · never expire</div>
          </div>
          <a href="/app/credits" style={{ padding: "9px 16px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--text)", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>Manage credits</a>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "20px 26px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Sign out</div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            You&apos;ll need to sign back in to access your dashboard, credits and creations.
          </p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ padding: "10px 20px", borderRadius: 10, background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)", fontWeight: 800, fontSize: 13.5, fontFamily: "inherit", cursor: signingOut ? "wait" : "pointer" }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
