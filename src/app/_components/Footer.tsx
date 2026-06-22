'use client'

const AI_TOOLS = [
  { label: "AI Upscale", href: "/upscale" },
  { label: "Remove Background", href: "/remove-bg" },
  { label: "AI Headshot", href: "/ai-headshot" },
  { label: "AI Editor", href: "/ai-editor" },
];

const TOOLS = [
  { label: "Image Editor", href: "/editor" },
  { label: "Batch Editor", href: "/batch-editor" },
  { label: "My Generations", href: "/generations" },
];

const COMPANY = [
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "mailto:patil.jitesh866@gmail.com" },
];

export default function Footer() {
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
              All-in-one AI image editor. Remove backgrounds, upscale photos, and edit images with simple text prompts.
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

          {/* AI Tools */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>AI Tools</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AI_TOOLS.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Tools</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TOOLS.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Company</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COMPANY.map(l => (
                <a key={l.href} href={l.href}
                  style={{ fontSize: 14, color: "#64748B", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2E8F0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            © {new Date().getFullYear()} JPT AI. All rights reserved.
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
  )
}
