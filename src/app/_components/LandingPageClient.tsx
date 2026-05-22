"use client";

import { useRef, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "✂️",
    title: "Background Removal",
    desc: "Instantly remove any background with AI precision. Works on people, products, objects, and complex scenes — in seconds.",
  },
  {
    icon: "✨",
    title: "AI Image Editing",
    desc: "Describe any change in plain English. Transform lighting, swap backgrounds, add effects, change colors — just type what you want.",
  },
  {
    icon: "🔍",
    title: "Image Upscaling",
    desc: "Enhance photo resolution and sharpness with AI. Recover fine details, reduce noise, and get sharper results from any image.",
  },
  {
    icon: "🌅",
    title: "AI Background Generation",
    desc: "Generate stunning, photorealistic backgrounds from a text description. Studio bokeh, mountain sunsets, cityscapes — anything you imagine.",
  },
  {
    icon: "↔️",
    title: "Smart Resize",
    desc: "Resize to any dimension with aspect ratio lock. Optimise for Instagram, LinkedIn, print, or any custom size.",
  },
  {
    icon: "🎨",
    title: "Color & Light Adjustments",
    desc: "Fine-tune brightness, contrast, saturation, and sharpness with a real-time preview before saving.",
  },
];

const STEPS = [
  {
    icon: "🖼️",
    title: "Upload your image",
    desc: "Drag and drop, click to browse, or describe what you want in the prompt box.",
  },
  {
    icon: "⚡",
    title: "Edit with AI",
    desc: "Pick a tool from the sidebar or type a prompt — JPT AI handles the heavy lifting instantly.",
  },
  {
    icon: "⬇️",
    title: "Download the result",
    desc: "Save your edited image in full quality. PNG or JPG, ready to use anywhere.",
  },
];

const USE_CASES = [
  {
    icon: "🛍️",
    title: "E-commerce",
    desc: "Create clean white-background product photos. Consistent, professional, and ready for any marketplace.",
  },
  {
    icon: "🎥",
    title: "Content Creators",
    desc: "Make thumbnails, banners, and social posts stand out with AI-enhanced visuals in minutes.",
  },
  {
    icon: "📸",
    title: "Photographers",
    desc: "Quick background swaps, colour corrections, and upscaling — without needing complex desktop software.",
  },
  {
    icon: "📣",
    title: "Marketing Teams",
    desc: "Produce on-brand visual content at scale. Edit dozens of images with consistent results using AI prompts.",
  },
  {
    icon: "🎨",
    title: "Designers",
    desc: "Prototype and iterate faster. Use AI editing to explore ideas before committing to full production.",
  },
  {
    icon: "🙌",
    title: "Personal Use",
    desc: "Make your photos shine — remove unwanted backgrounds, fix lighting, or add creative effects effortlessly.",
  },
];

const FAQS = [
  {
    q: "Is JPT AI free to use?",
    a: "Yes — sign in with your Google account and start editing immediately. No credit card required to get started.",
  },
  {
    q: "What image formats does JPT AI support?",
    a: "JPT AI supports JPG, PNG, and WEBP files. Images are automatically optimised for processing.",
  },
  {
    q: "How does background removal work?",
    a: "JPT AI uses advanced image segmentation to detect subjects and separate them from backgrounds with pixel-level precision — no manual selection needed.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Your images are processed securely and never used for training models. History is saved to your own Google Drive — you stay in control.",
  },
  {
    q: "Can I edit images with just a text prompt?",
    a: "Absolutely. Type any change you want — 'make the background blurry', 'add dramatic lighting', 'change sky to sunset' — and JPT AI applies it.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. JPT AI runs entirely in your browser. Sign in and start editing — no downloads, no plugins, no setup.",
  },
];

// ─── Google Icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPageClient() {
  const [prompt, setPrompt] = useState("");
  const [refImage, setRefImage] = useState<{ url: string } | null>(null);
  const [uploadImage, setUploadImage] = useState<{ url: string; name: string } | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [pendingType, setPendingType] = useState<"upload" | "prompt" | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await readFile(file);
    setUploadImage({ url, name: file.name.replace(/\.[^.]+$/, "") || "image" });
    setPendingType("upload");
    setShowSignIn(true);
  };

  const handleRefFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await readFile(file);
    setRefImage({ url });
  };

  const handleGenerate = () => {
    if (!prompt.trim() && !refImage) return;
    setPendingType("prompt");
    setShowSignIn(true);
  };

  const handleOAuthRedirect = () => {
    try {
      if (pendingType === "upload" && uploadImage) {
        sessionStorage.setItem("jpt_pending_image", uploadImage.url);
      } else if (pendingType === "prompt") {
        if (prompt.trim()) sessionStorage.setItem("jpt_pending_prompt", prompt.trim());
        if (refImage) sessionStorage.setItem("jpt_pending_image", refImage.url);
      }
    } catch {}
    window.location.href = "/api/auth/google?next=/editor";
  };

  return (
    <div style={s.root}>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>✨ AI-Powered Image Editing — Free to Start</div>

          <h1 style={s.h1}>
            Edit Any Image<br />
            <span style={s.h1Accent}>with a Single Prompt</span>
          </h1>

          <p style={s.heroPara}>
            Remove backgrounds, upscale quality, generate AI backgrounds, resize, and transform
            photos — all in one place, powered by JPT AI&apos;s intelligent image processing engine.
          </p>

          {/* Upload Drop Zone */}
          <div
            style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            onClick={() => uploadRef.current?.click()}
          >
            <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            <span style={{ fontSize: 40 }}>🖼️</span>
            <div>
              <div style={s.dropTitle}>Drop an image here to start editing</div>
              <div style={s.dropHint}>or <span style={{ color: "#6366F1", fontWeight: 700 }}>click to browse</span> &nbsp;·&nbsp; JPG · PNG · WEBP</div>
            </div>
          </div>

          {/* OR divider */}
          <div style={s.orRow}>
            <div style={s.orLine} />
            <span style={s.orText}>or describe what you want</span>
            <div style={s.orLine} />
          </div>

          {/* Prompt Bar */}
          <div style={s.promptBar}>
            <input ref={refRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleRefFile(e.target.files[0])} />

            {refImage ? (
              <div style={s.refThumb}>
                <img src={refImage.url} alt="ref" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
                <button style={s.removeRef} onClick={() => setRefImage(null)} aria-label="Remove reference image">×</button>
              </div>
            ) : (
              <button style={s.attachBtn} onClick={() => refRef.current?.click()} title="Attach reference image">
                <span style={{ fontSize: 20 }}>📎</span>
              </button>
            )}

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
              placeholder="e.g. Remove background and add a sunset sky, make it cinematic..."
              style={s.promptInput}
            />

            <button
              style={{ ...s.generateBtn, ...(!prompt.trim() && !refImage ? s.generateBtnOff : {}) }}
              onClick={handleGenerate}
            >
              Generate →
            </button>
          </div>

          {/* Stats */}
          <div style={s.statsRow}>
            {([["6", "AI tools"], ["∞", "Edits / day"], ["Free", "To start"]] as [string, string][]).map(([val, label]) => (
              <div key={label} style={s.statItem}>
                <span style={s.statVal}>{val}</span>
                <span style={s.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>FEATURES</div>
          <h2 style={s.h2}>Everything you need to edit images with AI</h2>
          <p style={s.sectionSub}>Six powerful tools in one editor — no plugins, no complex software.</p>
          <div style={s.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div style={s.featureTitle}>{f.title}</div>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#F4F5FB" }}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>HOW IT WORKS</div>
          <h2 style={s.h2}>Edit images in 3 simple steps</h2>
          <p style={s.sectionSub}>From upload to download in seconds — no learning curve.</p>
          <div style={s.stepsRow}>
            {STEPS.map((step, i) => (
              <div key={i} style={s.stepCard}>
                <div style={s.stepNum}>{i + 1}</div>
                <div style={{ fontSize: 38, margin: "14px 0 10px" }}>{step.icon}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ──────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>USE CASES</div>
          <h2 style={s.h2}>Built for creators, teams, and businesses</h2>
          <p style={s.sectionSub}>Whatever you create, JPT AI makes it faster.</p>
          <div style={s.useCaseGrid}>
            {USE_CASES.map((u) => (
              <div key={u.title} style={s.useCaseCard}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{u.icon}</div>
                <div style={s.useCaseTitle}>{u.title}</div>
                <p style={s.useCaseDesc}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#F4F5FB" }}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>FAQ</div>
          <h2 style={s.h2}>Frequently asked questions</h2>
          <div style={s.faqGrid}>
            {FAQS.map((item) => (
              <div key={item.q} style={s.faqItem}>
                <div style={s.faqQ}>{item.q}</div>
                <p style={s.faqA}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <h2 style={s.ctaH2}>Start editing for free</h2>
          <p style={s.ctaSub}>No credit card required. Sign in with Google and start transforming images in seconds.</p>
          <a href="/api/auth/google?next=/editor" style={s.ctaBtn}>
            <GoogleIcon />
            Get Started Free
          </a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerBrand}>
            <span>✦</span>
            <span style={{ fontWeight: 800 }}>JPT AI</span>
          </div>
          <div style={s.footerLinks}>
            <a href="/editor" style={s.footerLink}>AI Editor</a>
            <a href="/headshot" style={s.footerLink}>AI Headshot</a>
          </div>
          <div style={s.footerCopy}>© 2025 JPT AI. All rights reserved.</div>
        </div>
      </footer>

      {/* ── Sign-in Modal ──────────────────────────────────────────────────── */}
      {showSignIn && (
        <div style={s.modalOverlay} onClick={() => setShowSignIn(false)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            {pendingType === "upload" && uploadImage ? (
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", maxHeight: 130 }}>
                <img src={uploadImage.url} alt="preview" style={{ width: "100%", height: 130, objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ fontSize: 44, marginBottom: 12 }}>✨</div>
            )}

            <div style={s.modalTitle}>
              {pendingType === "upload" ? "Sign in to edit this image" : "Sign in to generate"}
            </div>
            <p style={s.modalSub}>
              {pendingType === "upload"
                ? "Your image is ready. Sign in with Google — it will be waiting in the editor."
                : "Your prompt is ready. Sign in to process it with JPT AI — everything will be preserved."}
            </p>

            {pendingType === "prompt" && prompt && (
              <div style={s.promptPreview}>&ldquo;{prompt}&rdquo;</div>
            )}

            <div style={s.modalFeatures}>
              {["✂️ Remove Background", "🔍 Upscale Image", "✨ AI Edit", "↔️ Resize", "🎨 Adjust Colors", "📂 Drive History"].map((f) => (
                <div key={f} style={s.modalFeatureRow}>
                  <span style={{ color: "#10B981", fontWeight: 700, fontSize: 12 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button style={s.modalGoogleBtn} onClick={handleOAuthRedirect}>
              <GoogleIcon />
              Continue with Google
            </button>
            <button style={s.modalDismiss} onClick={() => setShowSignIn(false)}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { fontFamily: "system-ui,-apple-system,sans-serif", color: "#111", background: "#fff" },

  // Hero
  hero: { background: "linear-gradient(160deg, #F0F0FF 0%, #FAFAFE 60%, #fff 100%)", padding: "72px 24px 80px", textAlign: "center" },
  heroInner: { maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 },
  badge: { display: "inline-block", background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 700 },
  h1: { margin: 0, fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.1 },
  h1Accent: { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroPara: { margin: 0, fontSize: 18, color: "#555", lineHeight: 1.7, maxWidth: 580 },

  dropZone: { width: "100%", maxWidth: 620, display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "2px dashed #D0D0F0", borderRadius: 16, padding: "22px 28px", cursor: "pointer", transition: "all 0.2s", boxSizing: "border-box" },
  dropZoneActive: { borderColor: "#6366F1", background: "#EEEEFF" },
  dropTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  dropHint: { fontSize: 13, color: "#888" },

  orRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", maxWidth: 620 },
  orLine: { flex: 1, height: 1, background: "#E0E0F0" },
  orText: { fontSize: 12, color: "#AAA", fontWeight: 600, whiteSpace: "nowrap" },

  promptBar: { display: "flex", gap: 8, width: "100%", maxWidth: 620, alignItems: "center" },
  attachBtn: { width: 46, height: 46, borderRadius: 10, border: "1.5px solid #E0E0EE", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" },
  refThumb: { position: "relative", flexShrink: 0 },
  removeRef: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#EF4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontWeight: 700 },
  promptInput: { flex: 1, height: 46, border: "1.5px solid #E0E0EE", borderRadius: 10, padding: "0 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "#111", minWidth: 0 },
  generateBtn: { height: 46, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none", borderRadius: 10, padding: "0 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "opacity 0.2s" },
  generateBtnOff: { opacity: 0.45, cursor: "not-allowed" },

  statsRow: { display: "flex", gap: 32, marginTop: 4 },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  statVal: { fontSize: 22, fontWeight: 900, color: "#6366F1" },
  statLabel: { fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },

  // Sections
  section: { padding: "80px 24px", background: "#fff" },
  sectionInner: { maxWidth: 1100, margin: "0 auto" },
  sectionLabel: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#6366F1", textTransform: "uppercase", marginBottom: 12 },
  h2: { margin: "0 0 12px", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1.15 },
  sectionSub: { margin: "0 0 48px", fontSize: 16, color: "#666", lineHeight: 1.6 },

  // Feature grid
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  featureCard: { background: "#F7F8FC", borderRadius: 16, padding: "24px 22px", border: "1px solid #EAECF0" },
  featureIcon: { fontSize: 30, marginBottom: 12 },
  featureTitle: { fontSize: 16, fontWeight: 800, marginBottom: 8 },
  featureDesc: { margin: 0, fontSize: 14, color: "#555", lineHeight: 1.65 },

  // Steps
  stepsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 },
  stepCard: { background: "#fff", borderRadius: 16, padding: "28px 24px", textAlign: "center", border: "1px solid #E5E7EF", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  stepNum: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" },
  stepTitle: { fontSize: 16, fontWeight: 800, marginBottom: 8 },
  stepDesc: { margin: 0, fontSize: 14, color: "#555", lineHeight: 1.65 },

  // Use cases
  useCaseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 },
  useCaseCard: { background: "#F7F8FC", borderRadius: 14, padding: "22px 20px", border: "1px solid #EAECF0" },
  useCaseTitle: { fontSize: 15, fontWeight: 800, marginBottom: 8 },
  useCaseDesc: { margin: 0, fontSize: 13, color: "#555", lineHeight: 1.65 },

  // FAQ
  faqGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
  faqItem: { background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1px solid #E5E7EF" },
  faqQ: { fontSize: 15, fontWeight: 800, marginBottom: 8 },
  faqA: { margin: 0, fontSize: 14, color: "#555", lineHeight: 1.65 },

  // CTA
  ctaSection: { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", padding: "80px 24px", textAlign: "center" },
  ctaInner: { maxWidth: 580, margin: "0 auto" },
  ctaH2: { margin: "0 0 14px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.8px" },
  ctaSub: { margin: "0 0 32px", fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.65 },
  ctaBtn: { display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: "#333", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", transition: "transform 0.15s" },

  // Footer
  footer: { background: "#111", padding: "32px 24px" },
  footerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" },
  footerBrand: { display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 16 },
  footerLinks: { display: "flex", gap: 24 },
  footerLink: { color: "#999", fontSize: 14, textDecoration: "none" },
  footerCopy: { color: "#666", fontSize: 13 },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" },
  modalBox: { background: "#fff", borderRadius: 20, padding: "32px 28px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" },
  modalTitle: { fontSize: 22, fontWeight: 900, letterSpacing: "-0.4px", marginBottom: 10 },
  modalSub: { margin: "0 0 16px", fontSize: 14, color: "#666", lineHeight: 1.6 },
  promptPreview: { background: "#F4F5FB", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#333", fontStyle: "italic", marginBottom: 16, textAlign: "left" },
  modalFeatures: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, textAlign: "left" },
  modalFeatureRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#333" },
  modalGoogleBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", border: "1.5px solid #DDD", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, color: "#333", cursor: "pointer", width: "100%", boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  modalDismiss: { marginTop: 12, background: "none", border: "none", color: "#AAA", fontSize: 13, cursor: "pointer", textDecoration: "underline" },
};
