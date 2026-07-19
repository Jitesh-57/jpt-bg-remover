'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";
import { PAID_FEATURES_ENABLED } from "@/lib/features";

const AI_TOOLS = [
  { labelKey: "AI Upscale",         href: "/upscale" },
  { labelKey: "Remove Background",  href: "/remove-bg" },
  { labelKey: "AI Headshot",        href: "/ai-headshot" },
  { labelKey: "AI Editor",          href: "/ai-editor" },
  { labelKey: "Creative Apps",      href: "/creative" },
];

const ALL_TOOLS = [
  { labelKey: "Image Editor",    href: "/editor" },
  { labelKey: "Batch Editor",    href: "/batch-editor" },
  { labelKey: "My Generations",  href: "/generations" },
];

// Free, in-browser tools — the SEO landing pages. Shown in free-only mode.
const FREE_TOOLS = [
  { labelKey: "Image Upscaler",   href: "/upscale" },
  { labelKey: "Image Compressor", href: "/compress-image" },
  { labelKey: "Image Converter",  href: "/convert-image" },
  { labelKey: "Crop Image",       href: "/crop-image" },
  { labelKey: "Rotate & Flip",    href: "/rotate-image" },
  { labelKey: "Add Watermark",    href: "/watermark-image" },
  { labelKey: "Meme Generator",   href: "/meme-generator" },
  { labelKey: "Image to PDF",     href: "/image-to-pdf" },
  { labelKey: "TikTok Watermark Remover", href: "/tiktok-watermark-remover" },
  { labelKey: "Instagram Video Downloader", href: "/instagram-video-downloader" },
  { labelKey: "YouTube Video Downloader", href: "/youtube-video-downloader" },
];

const ALL_COMPANY = [
  { labelKey: "Pricing", href: "/pricing" },
  { labelKey: "Blog",    href: "/blog" },
  { labelKey: "Contact", href: "mailto:patil.jitesh866@gmail.com" },
];

// In free-only mode drop the paid links (My Generations, Pricing). The Blog
// stays — it's kept as an upscale-only content hub.
const TOOLS = PAID_FEATURES_ENABLED ? ALL_TOOLS : ALL_TOOLS.filter(l => l.href !== "/generations");
const COMPANY = PAID_FEATURES_ENABLED ? ALL_COMPANY : ALL_COMPANY.filter(l => l.href !== "/pricing");

export default function Footer() {
  const { t, locale, setLocale } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/lp/")) return null;

  const currentLang = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

  return (
    <footer style={{ background: "#0F172A", color: "#94A3B8", padding: "60px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#6366F1" }}>✦</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>JPT AI</span>
            </a>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748B", margin: "0 0 20px", maxWidth: 260 }}>
              {t.footerTagline}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", textDecoration: "none", fontSize: 16 }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                𝕏
              </a>
            </div>
          </div>

          {/* AI Tools (paid mode) or Free Tools (free-only mode) */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{PAID_FEATURES_ENABLED ? t.footerAiTools : "Free Tools"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(PAID_FEATURES_ENABLED ? AI_TOOLS : FREE_TOOLS).map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.labelKey}
                </a>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{t.footerTools}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TOOLS.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.labelKey}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{t.footerCompany}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COMPANY.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.labelKey}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Language Picker */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🌐 {t.footerLanguage}
            </span>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setLangOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#E2E8F0", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.nativeName}</span>
                <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
              </button>
              {langOpen && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#1E293B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 280, zIndex: 200, boxShadow: "0 -8px 32px rgba(0,0,0,0.4)" }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: locale === lang.code ? "rgba(99,102,241,0.2)" : "transparent", color: locale === lang.code ? "#818CF8" : "#94A3B8", fontSize: 13, cursor: "pointer", fontWeight: locale === lang.code ? 700 : 400, textAlign: "left" }}
                      onMouseEnter={e => { if (locale !== lang.code) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (locale !== lang.code) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 18 }}>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            © {new Date().getFullYear()} JPT AI. {t.footerRights}
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map(l => (
              <a key={l.href} href={l.href}
                style={{ fontSize: 13, color: "#475569", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
