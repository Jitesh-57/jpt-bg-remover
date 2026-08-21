import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import BeforeAfter from "./BeforeAfter";
import { HOME_SHOWCASE } from "@/lib/creatives";

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

const TOOLS = [
  { emoji: "🔍", name: "Image Upscaler", desc: "Enhance to 4K", href: "/upscale" },
  { emoji: "🪄", name: "Background Remover", desc: "One-click cut-out", href: "/editor?tool=remove-bg" },
  { emoji: "🗜️", name: "Compress Image", desc: "Shrink to any KB", href: "/compress-image" },
  { emoji: "🔀", name: "Convert Format", desc: "JPG · PNG · WebP", href: "/convert-image" },
  { emoji: "✂️", name: "Crop Image", desc: "Social ratios", href: "/crop-image" },
  { emoji: "↔️", name: "Resize Image", desc: "Exact pixels", href: "/resize-image" },
  { emoji: "🔄", name: "Rotate & Flip", desc: "Straighten photos", href: "/rotate-image" },
  { emoji: "🫥", name: "Blur Image", desc: "Hide sensitive info", href: "/blur-image" },
  { emoji: "🔳", name: "QR Code", desc: "Link → QR", href: "/qr-code-generator" },
  { emoji: "🔖", name: "Add Watermark", desc: "Protect photos", href: "/watermark-image" },
  { emoji: "😂", name: "Meme Generator", desc: "Top & bottom text", href: "/meme-generator" },
  { emoji: "📄", name: "Image to PDF", desc: "Photos → PDF", href: "/image-to-pdf" },
];

const WHY = [
  { emoji: "🚫", title: "No watermark", desc: "Every download is clean and full-resolution — free or not." },
  { emoji: "🔓", title: "No sign-up", desc: "Open a tool and go. No account, no credit card, no trial timer." },
  { emoji: "🔒", title: "Private by design", desc: "Most tools run in your browser, so your images never leave your device." },
  { emoji: "🧰", title: "All in one place", desc: "A dozen image tools under one roof — stop hopping between sites." },
];

const FAQS = [
  { q: "Is sjpt.io really free?", a: "Yes. The core image tools — upscale, compress, convert, crop, resize, watermark, blur, QR, and more — are free with no watermark and no sign-up." },
  { q: "Do I need to create an account?", a: "No. You can use the tools and download your results without signing up. A few advanced AI features have a generous free tier." },
  { q: "Are my images uploaded to a server?", a: "For most tools, no — the work happens right in your browser, so your images stay on your device. Where a tool needs the server, the image is used only to produce your result." },
  { q: "Will there be a watermark on my download?", a: "Never. Whatever you download from sjpt.io is clean and full quality." },
  { q: "What can I do on sjpt.io?", a: "Remove backgrounds, upscale to 4K, compress to a target size, convert formats, crop, resize, rotate, blur sensitive info, add watermarks, make memes, generate QR codes, and turn images into PDFs." },
];

export default function HomeHub() {
  return (
    <>
      <ScrollReveal />
      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#0F172A", background: "#fff", overflowX: "hidden" }}>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          className="jpt-animated-grad"
          style={{
            position: "relative",
            background: "linear-gradient(120deg,#EEF0FF 0%,#F6F5FF 40%,#F0FDF7 100%)",
            padding: "76px 24px 72px",
            overflow: "hidden",
          }}
        >
          {/* glow blob */}
          <div className="jpt-glow" aria-hidden style={{ position: "absolute", top: -180, right: -140, width: 520, height: 520, background: "conic-gradient(from 0deg,#C7D2FE,#DDD6FE,#BBF7D0,#C7D2FE)", filter: "blur(70px)", opacity: 0.5, borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,440px)", gap: 48, alignItems: "center" }} className="home-hero-grid">
            <div>
              <div className="jpt-rise" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.75)", border: "1px solid #E0E7FF", color: "#4F46E5", fontWeight: 700, fontSize: 12.5, borderRadius: 999, padding: "7px 15px", marginBottom: 22, letterSpacing: "0.04em", backdropFilter: "blur(6px)" }}>
                ✦ 12 free image tools · no watermark · no sign-up
              </div>
              <h1 className="jpt-rise" style={{ animationDelay: "0.05s", fontSize: "clamp(2.4rem,5.4vw,4rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.035em", margin: "0 0 18px" }}>
                Every image tool<br />you need,{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>free</span>.
              </h1>
              <p className="jpt-rise" style={{ animationDelay: "0.1s", fontSize: "clamp(1.05rem,2vw,1.25rem)", color: "#475569", lineHeight: 1.65, maxWidth: 520, margin: "0 0 30px" }}>
                Remove backgrounds, upscale to 4K, compress, convert, crop and more — all in your browser. No watermark, no account, nothing to install.
              </p>
              <div className="jpt-rise" style={{ animationDelay: "0.15s", display: "flex", flexWrap: "wrap", gap: 14 }}>
                <Link href="/editor" className="jpt-hover" style={{ background: GRAD, color: "#fff", borderRadius: 13, padding: "15px 30px", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 10px 28px rgba(99,102,241,0.34)" }}>
                  Open the editor →
                </Link>
                <Link href="/tools" className="jpt-hover" style={{ background: "#fff", color: "#334155", border: "1px solid #E2E8F0", borderRadius: 13, padding: "15px 26px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>
                  Explore all tools
                </Link>
              </div>
              <div className="jpt-rise" style={{ animationDelay: "0.2s", display: "flex", flexWrap: "wrap", gap: "10px 22px", marginTop: 26, fontSize: 13.5, color: "#64748B", fontWeight: 600 }}>
                <span>✓ 100% free</span><span>✓ No watermark</span><span>✓ Private in-browser</span>
              </div>
            </div>
            {/* Hero before/after visual */}
            <div className="jpt-float">
              <BeforeAfter
                before={HOME_SHOWCASE[1].before}
                after={HOME_SHOWCASE[1].after}
                alt="AI image upscale"
                emoji={HOME_SHOWCASE[1].emoji}
                grad={HOME_SHOWCASE[1].grad}
              />
              <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 12, fontWeight: 600 }}>Drag to compare — before vs after</p>
            </div>
          </div>
        </section>

        {/* ── TOOL GRID ────────────────────────────────────────── */}
        <section style={{ padding: "68px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3.4vw,2.4rem)", fontWeight: 900, letterSpacing: "-0.025em", textAlign: "center", margin: "0 0 8px" }}>One toolkit, every job</h2>
            <p style={{ textAlign: "center", color: "#64748B", fontSize: 16, margin: "0 0 40px" }}>Pick a tool and go — each opens instantly, free.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {TOOLS.map((t) => (
                <Link key={t.href} href={t.href} className="jpt-hover" style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #EAECF5", borderRadius: 16, padding: "18px 18px", textDecoration: "none", boxShadow: "0 6px 20px rgba(30,41,90,.05)" }}>
                  <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{t.emoji}</span>
                  <span>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 800, color: "#0F172A" }}>{t.name}</span>
                    <span style={{ display: "block", fontSize: 13, color: "#64748B", marginTop: 2 }}>{t.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BEFORE / AFTER SHOWCASE ──────────────────────────── */}
        <section style={{ padding: "68px 24px", background: "linear-gradient(180deg,#FAFAFF,#fff)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3.4vw,2.4rem)", fontWeight: 900, letterSpacing: "-0.025em", textAlign: "center", margin: "0 0 8px" }}>See the difference</h2>
            <p style={{ textAlign: "center", color: "#64748B", fontSize: 16, margin: "0 0 44px" }}>Drag each slider to compare before and after.</p>
            <div style={{ display: "grid", gap: 40 }}>
              {HOME_SHOWCASE.map((s, i) => (
                <div key={s.key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 36, alignItems: "center", direction: i % 2 ? "rtl" : "ltr" }} className="home-showcase-row">
                  <div style={{ direction: "ltr" }}>
                    <BeforeAfter before={s.before} after={s.after} alt={s.title} emoji={s.emoji} grad={s.grad} />
                  </div>
                  <div style={{ direction: "ltr" }}>
                    <div style={{ fontSize: 30, marginBottom: 10 }}>{s.emoji}</div>
                    <h3 style={{ fontSize: "clamp(1.3rem,2.6vw,1.7rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>{s.title}</h3>
                    <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7, margin: 0 }}>{s.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY sjpt ─────────────────────────────────────────── */}
        <section style={{ padding: "68px 24px", background: "#0B1020" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3.4vw,2.4rem)", fontWeight: 900, letterSpacing: "-0.025em", textAlign: "center", color: "#fff", margin: "0 0 40px" }}>
              Free, without the usual{" "}
              <span style={{ background: "linear-gradient(120deg,#818CF8,#A78BFA)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>catches</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
              {WHY.map((w) => (
                <div key={w.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "26px 22px" }}>
                  <div style={{ fontSize: 30, marginBottom: 12 }}>{w.emoji}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>{w.title}</h3>
                  <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.65, margin: 0 }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section style={{ padding: "64px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,3.2vw,2.2rem)", fontWeight: 900, letterSpacing: "-0.025em", textAlign: "center", margin: "0 0 28px" }}>Questions, answered</h2>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "#F8F9FC", border: "1px solid #EAECF5", borderRadius: 12, padding: "15px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15.5, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14.5, color: "#64748B", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────── */}
        <section style={{ padding: "16px 24px 84px", background: "#fff" }}>
          <div style={{ maxWidth: 940, margin: "0 auto", background: GRAD, borderRadius: 26, padding: "56px 32px", textAlign: "center", boxShadow: "0 24px 60px rgba(99,102,241,0.32)" }}>
            <h2 style={{ fontSize: "clamp(1.8rem,3.6vw,2.6rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 12px" }}>Ready to edit? It&apos;s free.</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.92)", margin: "0 0 26px" }}>No sign-up, no watermark, no catch. Just open a tool and go.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
              <Link href="/editor" className="jpt-hover" style={{ background: "#fff", color: "#4F46E5", borderRadius: 13, padding: "15px 32px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>Open the editor →</Link>
              <Link href="/tools" className="jpt-hover" style={{ background: "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 13, padding: "15px 28px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>Browse tools</Link>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .home-hero-grid { grid-template-columns: 1fr !important; }
          .home-showcase-row { grid-template-columns: 1fr !important; direction: ltr !important; }
        }
      `}</style>
    </>
  );
}
