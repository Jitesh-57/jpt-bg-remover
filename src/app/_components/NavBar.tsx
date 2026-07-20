"use client";

import { useEffect, useState, lazy, Suspense, useRef } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { trackSignUp, setAnalyticsUser, trackSignInClicked, trackSignInFailed, trackPaymentPopupTriggered } from "@/lib/analytics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PAID_FEATURES_ENABLED } from "@/lib/features";

const PricingModal = lazy(() => import("./PricingModal"));

interface User { userId: string; email: string; name: string; picture?: string; credits: number; plan: string; trialToolsUsed: string[]; trialsRemaining: number; }

const FREE_TRIAL_LIMIT = 5;

const ALL_TOOLS = [
  {
    section: "AI Tools",
    items: [
      { icon: "🔍", label: "AI Upscale",     desc: "Enhance resolution up to 4×",           href: "/upscale", free: true },
      { icon: "🪄", label: "Remove BG (AI)",  desc: "AI-powered, higher quality",            href: "/remove-bg", free: false },
      { icon: "🎯", label: "AI Headshot",    desc: "Professional headshots from any photo", href: "/ai-headshot", free: false },
      { icon: "✍️", label: "AI Editor",     desc: "Edit images with text prompts",         href: "/ai-editor", free: false },
    ],
  },
  {
    section: "Tools",
    items: [
      { icon: "🖼️", label: "Image Editor",   desc: "Full-featured photo editor",           href: "/editor", free: true },
      { icon: "⚡",  label: "Batch Editor",   desc: "Process up to 100 images at once",     href: "/batch-editor", free: true },
      { icon: "✦",  label: "My Generations", desc: "View your saved edits",                href: "/generations", free: false },
    ],
  },
];

// The free, in-browser canvas tools (each has its own SEO landing page).
const FREE_IMAGE_TOOLS = [
  { icon: "🔍", label: "Image Upscaler",  desc: "Enhance resolution up to 4×",   href: "/upscale", free: true },
  { icon: "🗜️", label: "Compress Image",  desc: "Reduce file size to KB",        href: "/compress-image", free: true },
  { icon: "🔀", label: "Convert Format",  desc: "JPG · PNG · WEBP",              href: "/convert-image", free: true },
  { icon: "✂️", label: "Crop Image",      desc: "Social ratios + circle crop",   href: "/crop-image", free: true },
  { icon: "🔄", label: "Rotate & Flip",   desc: "Turn or mirror photos",         href: "/rotate-image", free: true },
  { icon: "🔖", label: "Add Watermark",   desc: "Text watermark on photos",      href: "/watermark-image", free: true },
  { icon: "😂", label: "Meme Generator",  desc: "Top & bottom meme text",        href: "/meme-generator", free: true },
  { icon: "📄", label: "Image to PDF",    desc: "JPG & PNG to PDF",              href: "/image-to-pdf", free: true },
  { icon: "🎬", label: "TikTok No-Watermark", desc: "Download TikTok, no watermark", href: "/tiktok-watermark-remover", free: true },
];

// In free-only mode show the free image tools + the editor. In paid mode keep
// the original AI Tools / Tools grouping.
const TOOLS = PAID_FEATURES_ENABLED
  ? ALL_TOOLS
  : [
      { section: "Free Image Tools", items: FREE_IMAGE_TOOLS },
      {
        section: "Editor",
        items: [
          { icon: "🖼️", label: "Image Editor", desc: "All tools in one editor",     href: "/editor", free: true },
          { icon: "⚡",  label: "Batch Editor", desc: "Up to 100 images at once",    href: "/batch-editor", free: true },
        ],
      },
    ];

export default function NavBar() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const pathname = usePathname();

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
      if (session?.user) fetchUser();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) fetchUser();
      else if (event === "SIGNED_OUT") { setUser(null); setAnalyticsUser(null); }
    });
    const onClickOutside = (e: MouseEvent) => {
      // On mobile the dropdown renders as a bottom sheet outside dropdownRef
      // (with its own backdrop-tap-to-close); this listener would otherwise
      // fire on mousedown for every tap inside it and unmount links before
      // their click/navigation completes.
      if (window.innerWidth < 768) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowToolsDropdown(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => { subscription.unsubscribe(); document.removeEventListener("mousedown", onClickOutside); };
  }, []);

  const fetchUser = () =>
    fetch("/api/auth/google/me").then(r => r.json())
      .then((d: { authenticated: boolean; userId?: string; email?: string; name?: string; picture?: string; credits?: number; plan?: string; trialToolsUsed?: string[]; trialsRemaining?: number }) => {
        if (d.authenticated && d.email) {
          const plan = d.plan ?? "free";
          setUser({ userId: d.userId!, email: d.email, name: d.name!, picture: d.picture, credits: d.credits ?? 0, plan, trialToolsUsed: d.trialToolsUsed ?? [], trialsRemaining: d.trialsRemaining ?? 0 });
          setAnalyticsUser({ id: d.userId!, plan });
        }
      }).catch(() => null);

  const openModal = () => { trackSignInClicked("modal_open"); setShowModal(true); setTab("google"); setMode("login"); setEmail(""); setPassword(""); setName(""); setAuthError(""); };
  const closeModal = () => { setShowModal(false); setAuthError(""); };
  // Let the current page (e.g. the editor) persist its in-memory context
  // (uploaded image + active tool) so it survives the sign-in round-trip.
  const persistPageContext = () => {
    try { (window as unknown as { __jptPersistContext?: () => void }).__jptPersistContext?.(); } catch {}
  };
  const handleGoogleSignIn = () => {
    trackSignUp("google");
    persistPageContext();
    const current = window.location.pathname + window.location.search;
    // On the homepage there's nothing to return to — send to the editor.
    const next = current === "/" || current === "" ? "/editor" : current;
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };
  const handleLogout = async () => {
    try { await createSupabaseClient().auth.signOut(); } catch {}
    await fetch("/api/auth/google/logout", { method: "POST" });
    setUser(null); setAnalyticsUser(null); setShowMenu(false);
    window.location.href = "/";
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setAuthError("Email and password required"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup" ? { email: email.trim(), password, name: name.trim() } : { email: email.trim(), password };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { ok?: boolean; error?: string; needsConfirmation?: boolean };
      if (!res.ok) { trackSignInFailed("email", data.error || "unknown"); setAuthError(data.error || "Authentication failed"); return; }
      if (data.needsConfirmation) { setAuthError("✅ Check your email and click the confirmation link, then sign in."); return; }
      trackSignUp(mode === "signup" ? "email_signup" : "email_login");
      persistPageContext();
      const current = window.location.pathname + window.location.search;
      window.location.href = current === "/" || current === "" ? "/editor" : current;
    } catch { trackSignInFailed("email", "network_error"); setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  if (pathname?.startsWith("/lp/")) return null;

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 999, background: "#0F172A", borderBottom: "1px solid rgba(255,255,255,0.08)", height: 56, display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", gap: 8 }}>

          {/* Brand */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#6366F1" }}>✦</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>JPT AI</span>
          </a>

          {/* AI Tools Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowToolsDropdown(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: showToolsDropdown ? "rgba(99,102,241,0.15)" : "transparent", border: "none", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              {PAID_FEATURES_ENABLED ? "AI Tools" : "Tools"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showToolsDropdown ? "rotate(180deg)" : "none", opacity: 0.7 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showToolsDropdown && !isMobile && (
              <div style={{ position: "absolute", top: "calc(100% + 12px)", left: 0, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid #F1F5F9", padding: "20px", minWidth: 580, zIndex: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {TOOLS.map((group, gi) => (
                  <div key={gi} style={{ padding: gi === 0 ? "0 20px 0 0" : "0 0 0 20px", borderRight: gi === 0 ? "1px solid #F1F5F9" : "none" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{group.section}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {group.items.map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowToolsDropdown(false)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, textDecoration: "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F5F5FF")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ width: 36, height: 36, background: "#EEF2FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{item.desc}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showToolsDropdown && isMobile && (
            <div onClick={() => setShowToolsDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)" }}>
              <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.25)", maxHeight: "78vh", overflowY: "auto", padding: "10px 16px calc(20px + env(safe-area-inset-bottom))" }}>
                <div style={{ width: 36, height: 4, background: "#E2E8F0", borderRadius: 2, margin: "4px auto 14px" }} />
                {TOOLS.map((group, gi) => (
                  <div key={gi} style={{ marginBottom: gi === TOOLS.length - 1 ? 0 : 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{group.section}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {group.items.map(item => (
                        <a key={item.href} href={item.href} onClick={() => setShowToolsDropdown(false)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", borderRadius: 10, textDecoration: "none" }}
                        >
                          <div style={{ width: 38, height: 38, background: "#EEF2FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{item.icon}</div>
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{item.desc}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blog */}
          <a href="/blog"
            style={{ padding: "7px 14px", color: "#E2E8F0", fontSize: 14, fontWeight: 600, textDecoration: "none", borderRadius: 8 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#E2E8F0")}>
            Blog
          </a>

          {/* Creative Apps — standalone navbar link (hidden in free-only mode) */}
          {PAID_FEATURES_ENABLED && (
            <a href="/creative"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", color: "#E2E8F0", fontSize: 14, fontWeight: 600, textDecoration: "none", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}>
              <span style={{ fontSize: 13 }}>✦</span>
              Creative Apps
            </a>
          )}

          <div style={{ flex: 1 }} />

          {/* Pricing — right side (hidden in free-only mode) */}
          {PAID_FEATURES_ENABLED && (
            <a href="/pricing"
              style={{ padding: "7px 14px", color: "#94A3B8", fontSize: 14, fontWeight: 600, textDecoration: "none", borderRadius: 8 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}>
              {t.navPricing}
            </a>
          )}

          {/* Auth */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowMenu(!showMenu)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 24, cursor: "pointer" }}>
                {user.picture
                  ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
                  : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366F1", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name[0]}</div>}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{user.name.split(" ")[0]}</span>
                {PAID_FEATURES_ENABLED && (
                  <span style={{ fontSize: 11, background: "#6366F1", color: "#fff", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                    {user.plan === "free" ? `🎁 ${user.trialsRemaining}` : `⚡ ${user.credits}`}
                  </span>
                )}
              </button>
              {showMenu && !isMobile && (
                <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 220, zIndex: 1000, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{user.email}</div>
                  </div>
                  {PAID_FEATURES_ENABLED && user.plan === "free" && user.trialsRemaining === 0 && (
                    <div style={{ margin: "10px 12px 4px", background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", border: "1px solid #C7D2FE", borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>🎁 Free trials used up</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>You&apos;ve used all {FREE_TRIAL_LIMIT} free trials, one per tool.</div>
                      <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, marginTop: 4 }}>Unlock all AI features with a paid plan</div>
                      <button onClick={() => { trackPaymentPopupTriggered("trial_exhausted"); setShowPricing(true); setShowMenu(false); }}
                        style={{ marginTop: 8, width: "100%", padding: "7px 12px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Buy Paid Plan
                      </button>
                    </div>
                  )}
                  {PAID_FEATURES_ENABLED && user.plan === "free" && user.trialsRemaining > 0 && (
                    <div style={{ margin: "10px 12px 4px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Free trials</div>
                        <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>{user.trialsRemaining} of {FREE_TRIAL_LIMIT} left · one per tool</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#16A34A" }}>{user.trialsRemaining}</div>
                    </div>
                  )}
                  <div style={{ padding: "6px 0" }}>
                    {PAID_FEATURES_ENABLED && (
                      <>
                        <a href="/generations" onClick={() => setShowMenu(false)}
                          style={{ display: "block", padding: "10px 16px", fontSize: 13, color: "#111", textDecoration: "none", fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F5F5FF")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          ✦ My Generations
                        </a>
                        <button onClick={() => { trackPaymentPopupTriggered("manual"); setShowPricing(true); setShowMenu(false); }}
                          style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", fontSize: 13, color: "#6366F1", cursor: "pointer", fontWeight: 600 }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F5F5FF")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          💳 Buy Credits
                        </button>
                      </>
                    )}
                    <div style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }} />
                    <button onClick={handleLogout}
                      style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", fontSize: 13, color: "#EF4444", cursor: "pointer", fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F0")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {showMenu && isMobile && user && (
            <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)" }}>
              <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.25)", maxHeight: "82vh", overflowY: "auto", padding: "10px 0 calc(10px + env(safe-area-inset-bottom))" }}>
                <div style={{ width: 36, height: 4, background: "#E2E8F0", borderRadius: 2, margin: "4px auto 10px" }} />
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{user.email}</div>
                </div>
                {PAID_FEATURES_ENABLED && user.plan === "free" && user.trialsRemaining === 0 && (
                  <div style={{ margin: "12px 16px 4px", background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", border: "1px solid #C7D2FE", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>🎁 Free trials used up</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>You&apos;ve used all {FREE_TRIAL_LIMIT} free trials, one per tool.</div>
                    <button onClick={() => { trackPaymentPopupTriggered("trial_exhausted"); setShowPricing(true); setShowMenu(false); }}
                      style={{ marginTop: 8, width: "100%", padding: "10px 12px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Buy Paid Plan
                    </button>
                  </div>
                )}
                {PAID_FEATURES_ENABLED && user.plan === "free" && user.trialsRemaining > 0 && (
                  <div style={{ margin: "12px 16px 4px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Free trials</div>
                      <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>{user.trialsRemaining} of {FREE_TRIAL_LIMIT} left · one per tool</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#16A34A" }}>{user.trialsRemaining}</div>
                  </div>
                )}
                <div style={{ padding: "8px 0" }}>
                  {PAID_FEATURES_ENABLED && (
                    <>
                      <a href="/generations" onClick={() => setShowMenu(false)}
                        style={{ display: "block", padding: "14px 16px", fontSize: 14.5, color: "#111", textDecoration: "none", fontWeight: 600 }}>
                        ✦ My Generations
                      </a>
                      <button onClick={() => { trackPaymentPopupTriggered("manual"); setShowPricing(true); setShowMenu(false); }}
                        style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", textAlign: "left", fontSize: 14.5, color: "#6366F1", cursor: "pointer", fontWeight: 700 }}>
                        💳 Buy Credits
                      </button>
                    </>
                  )}
                  <div style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }} />
                  <button onClick={handleLogout}
                    style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", textAlign: "left", fontSize: 14.5, color: "#EF4444", cursor: "pointer", fontWeight: 600 }}>
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={openModal} style={{ padding: "7px 16px", background: "transparent", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {t.navSignIn}
              </button>
              <button onClick={openModal} style={{ padding: "7px 16px", background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>
                {t.getStarted}
              </button>
            </div>
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
            prefillUser={user ? { name: user.name, email: user.email } : undefined}
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
                {mode === "signup" && <input type="text" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />}
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()} style={inputStyle} />
                <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()} style={inputStyle} />
                {authError && (
                  <div style={{ background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#C00" }}>{authError}</div>
                )}
                <button onClick={handleEmailAuth} disabled={authLoading}
                  style={{ padding: "12px", background: authLoading ? "#A5B4FC" : "#6366F1", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: authLoading ? "not-allowed" : "pointer" }}>
                  {authLoading ? "Please wait…" : mode === "signup" ? "✦ Create Account" : "→ Sign In"}
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

const inputStyle: React.CSSProperties = { border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "11px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
