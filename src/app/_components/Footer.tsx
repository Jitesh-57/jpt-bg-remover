'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";
import { PAID_FEATURES_ENABLED } from "@/lib/features";
import BrandLogo from "./BrandLogo";
import { BLOG_TOPICS, topicHref } from "@/lib/blog-topics";

// Each link goes to the page search engines index for that job (see
// docs/seo/keyword-map.md), not to the app screen behind it.
const AI_TOOLS = [
  { labelKey: "AI Photo Editor",    href: "/ai-editor" },
  { labelKey: "AI Headshot Generator", href: "/ai-headshot" },
  { labelKey: "Remove Background",  href: "/remove-bg" },
  { labelKey: "Image Upscaler",     href: "/upscale" },
  { labelKey: "Object Remover",     href: "/object-remover" },
  { labelKey: "AI Image Generator", href: "/app/create" },
  { labelKey: "All AI Photo Apps",  href: "/creative" },
];

// The AI apps people search for most, linked from every page.
const POPULAR_APPS = [
  { labelKey: "Ghibli Style Photo",    href: "/creative/ghibli-style" },
  { labelKey: "AI Action Figure",      href: "/creative/3d-figurine" },
  { labelKey: "AI Saree Photoshoot",   href: "/creative/saree-photoshoot" },
  { labelKey: "Professional Headshot", href: "/creative/professional-headshot" },
  { labelKey: "Restore Old Photos",    href: "/creative/restore-old-photos" },
  { labelKey: "AI Baby Photoshoot",    href: "/creative/baby-photoshoot" },
  { labelKey: "Photo to Anime",        href: "/creative/anime-style" },
];

// Free, in-browser tools, the photo editor first.
const FREE_TOOLS = [
  { labelKey: "Free Photo Editor", href: "/editor" },
  { labelKey: "Compress Image",   href: "/compress-image" },
  { labelKey: "Resize Image",     href: "/resize-image" },
  { labelKey: "Crop Image",       href: "/crop-image" },
  { labelKey: "Convert Image",    href: "/convert-image" },
  { labelKey: "Blur Image",       href: "/blur-image" },
  { labelKey: "Add Watermark",    href: "/watermark-image" },
  { labelKey: "Image to PDF",     href: "/image-to-pdf" },
  { labelKey: "Meme Generator",   href: "/meme-generator" },
  { labelKey: "All free tools",   href: "/tools" },
];

const ALL_COMPANY = [
  { labelKey: "All Tools", href: "/tools" },
  { labelKey: "Prompt Library", href: "/prompts" },
  { labelKey: "80s AI Prompts", href: "/80s-ai-photo-prompts" },
  { labelKey: "Pricing", href: "/pricing" },
  { labelKey: "Blog",    href: "/blog" },
  { labelKey: "Contact", href: "mailto:patil.jitesh866@gmail.com" },
];

// In free-only mode drop the paid links: the AI columns and Pricing.
const COMPANY = PAID_FEATURES_ENABLED ? ALL_COMPANY : ALL_COMPANY.filter(l => l.href !== "/pricing");

export default function Footer() {
  const { t, locale, setLocale } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/lp/") || pathname === "/editor" || pathname?.startsWith("/app") || pathname?.startsWith("/m/")) return null;

  const currentLang = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

  return (
    <footer style={{ background: "var(--bg-elevated)", color: "var(--text-faint)", padding: "60px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="jpt-footer-grid" style={{ marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}>
              <BrandLogo height={34} variant="wordmark" />
            </a>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)", margin: "0 0 20px", maxWidth: 260 }}>
              {t.footerTagline}
            </p>
            {/* The 𝕏 button linked to twitter.com itself, not to an account. Add it
                back here with the real profile URL once there is one. */}
          </div>

          {(PAID_FEATURES_ENABLED
            ? [{ title: t.footerAiTools, links: AI_TOOLS }, { title: "Popular AI apps", links: POPULAR_APPS }, { title: "Free tools", links: FREE_TOOLS }]
            : [{ title: "Free tools", links: FREE_TOOLS }]
          ).map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <a key={l.href} href={l.href}
                    style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                    {l.labelKey}
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Guides — the blog's topic hubs, linked sitewide so every post is two clicks from any page. */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Guides</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...BLOG_TOPICS.map((t) => ({ href: t.link ?? topicHref(t), label: t.name })), { href: "/guides", label: "All guides" }].map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{t.footerCompany}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COMPANY.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                  {l.labelKey}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Language Picker */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🌐 {t.footerLanguage}
            </span>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setLangOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-soft)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.nativeName}</span>
                <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
              </button>
              {langOpen && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 280, zIndex: 200, boxShadow: "0 -8px 32px rgba(0,0,0,0.4)" }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", background: locale === lang.code ? "var(--accent-border)" : "transparent", color: locale === lang.code ? "var(--accent)" : "var(--text-faint)", fontSize: 13, cursor: "pointer", fontWeight: locale === lang.code ? 700 : 400, textAlign: "left" }}
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

        {/*
          Attribution for the prompt library.

          CC BY 4.0 permits commercial use on one condition: credit. This line
          is that condition, which makes it part of the licence rather than a
          footer nicety — it stays even if the footer is redesigned.
        */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 18, paddingBottom: 18, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Prompt data adapted from{" "}
          <a href="https://github.com/YouMind-OpenLab" target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--text-faint)", textDecoration: "underline" }}>
            YouMind OpenLab
          </a>
          , licensed{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--text-faint)", textDecoration: "underline" }}>
            CC BY 4.0
          </a>
          . Each prompt credits its original author.
        </div>

        {/* Featured on directories (backlink badges) */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="https://turbo0.com/item/pixelshine" target="_blank" rel="noopener noreferrer">
            <img src="https://img.turbo0.com/badge-listed-light.svg" alt="Listed on Turbo0" style={{ height: 54, width: "auto" }} />
          </a>
          <a href="https://neeed.directory/products/pixelshine" target="_blank" rel="noopener">
            <img src="https://neeed.directory/badges/neeed-badge-light.svg" alt="Featured on neeed.directory" width={139} height={38} />
          </a>
          <a href="https://smollaunch.com" target="_blank" rel="noopener">
            <img src="https://smollaunch.com/badges/featured.svg" alt="PixelShine — Featured on Smol Launch" loading="lazy" width={250} height={60} />
          </a>
          <a href="https://ufind.best/products/pixelshine" target="_blank" rel="noopener">
            <img src="https://ufind.best/badges/ufind-best-badge-light.svg" alt="Featured on ufind.best" width={150} />
          </a>
          <a href="https://openhunts.com" target="_blank" rel="noopener noreferrer" title="OpenHunts Club">
            <img src="https://cdn.openhunts.com/badges/club.webp" alt="OpenHunts Club Member" width={195} style={{ height: "auto" }} />
          </a>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Pixel Shine. {t.footerRights}
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map(l => (
              <a key={l.href} href={l.href}
                style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-faint)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
