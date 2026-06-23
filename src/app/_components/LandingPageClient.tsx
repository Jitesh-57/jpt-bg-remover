"use client";

import { useRef, useState, useEffect } from "react";
import FAQAccordion from "@/app/_components/FAQAccordion";
import { landingImg } from "@/lib/landing-images";

// AI-generated landing images served from Supabase Storage (public "landing" bucket).
const thumb = (file: string) => landingImg(file);
const HERO_BEFORE = "https://cdn.pixelbin.io/v2/misty-band-06f445/original/landing/hero-before.jpg";
const HERO_AFTER = "https://cdn.pixelbin.io/v2/misty-band-06f445/original/landing/hero-after.png";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "✂️",
    title: "Background Removal",
    desc: "Instantly remove any background with AI precision. Works on people, products, objects, and complex scenes — in seconds.",
    img: thumb("bg-removal.png"),
    tool: "remove-bg",
  },
  {
    icon: "✨",
    title: "AI Image Editing",
    desc: "Describe any change in plain English. Transform lighting, swap backgrounds, add effects, change colors — just type what you want.",
    img: thumb("ai-edit.png"),
    tool: "ai-edit",
  },
  {
    icon: "🔍",
    title: "Image Upscaling",
    desc: "Enhance photo resolution and sharpness with AI. Recover fine details, reduce noise, and get sharper results from any image.",
    img: thumb("upscale.png"),
    tool: "upscale",
  },
  {
    icon: "🌅",
    title: "AI Background Generation",
    desc: "Generate stunning, photorealistic backgrounds from a text description. Studio bokeh, mountain sunsets, cityscapes — anything you imagine.",
    img: thumb("bg-generate.png"),
    tool: "generate-bg",
  },
  {
    icon: "↔️",
    title: "Smart Resize",
    desc: "Resize to any dimension with aspect ratio lock. Optimise for Instagram, LinkedIn, print, or any custom size.",
    img: thumb("resize.png"),
    tool: "resize",
  },
  {
    icon: "🎨",
    title: "Color & Light Adjustments",
    desc: "Fine-tune brightness, contrast, saturation, and sharpness with a real-time preview before saving.",
    img: thumb("color.png"),
    tool: "adjust",
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
    title: "E-commerce Sellers",
    stat: "94% higher conversion",
    desc: "Create clean white-background product photos instantly. Consistent, professional, and ready for Amazon, Flipkart, Shopify, and any marketplace.",
  },
  {
    icon: "🎥",
    title: "Content Creators",
    stat: "35% more shares",
    desc: "Make thumbnails, banners, and social posts stand out with AI-enhanced visuals. High-quality images get 35% more shares on social media.",
  },
  {
    icon: "💼",
    title: "LinkedIn Professionals",
    stat: "21× more profile views",
    desc: "Remove distracting backgrounds from headshots. Profiles with professional photos get 21× more profile views and 9× more connection requests.",
  },
  {
    icon: "📸",
    title: "Photographers",
    desc: "Quick background swaps, colour corrections, and 4K upscaling — without needing Photoshop or complex desktop software.",
  },
  {
    icon: "📣",
    title: "Marketing Teams",
    desc: "Produce on-brand visual content at scale. Edit dozens of images with consistent results using AI prompts. Ideal for ads, banners, and campaigns.",
  },
  {
    icon: "🎨",
    title: "Designers",
    desc: "Prototype and iterate faster. Use AI editing to explore ideas before committing to full production. Export PNG with transparent backgrounds.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "E-commerce Owner",
    avatar: "PS",
    quote: "I was spending 30 minutes per product photo in Photoshop. Now I process 40 images before morning coffee. JPT AI saved my business.",
    stars: 5,
  },
  {
    name: "Rahul Mehta",
    role: "Freelance Photographer",
    avatar: "RM",
    quote: "The 4K upscaling is incredible. I restored old family photos that were tiny and blurry — results look like they were shot on a professional camera.",
    stars: 5,
  },
  {
    name: "Sneha Patel",
    role: "Social Media Manager",
    avatar: "SP",
    quote: "Background removal is flawless even on complex hair. My team switched from remove.bg — same quality, way more tools in one place.",
    stars: 5,
  },
];

const COMPARISON = [
  { feature: "Background Removal", jpt: true, photoshop: true, removebg: true },
  { feature: "AI Image Editing (text prompts)", jpt: true, photoshop: false, removebg: false },
  { feature: "4K AI Upscaling", jpt: true, photoshop: false, removebg: false },
  { feature: "AI Background Generation", jpt: true, photoshop: false, removebg: false },
  { feature: "No watermark (free tier)", jpt: true, photoshop: false, removebg: false },
  { feature: "No account required to try", jpt: true, photoshop: false, removebg: true },
  { feature: "Works in browser (no install)", jpt: true, photoshop: false, removebg: true },
  { feature: "Batch processing", jpt: true, photoshop: true, removebg: true },
];

const FAQS = [
  {
    q: "Is JPT AI free to use?",
    a: "Yes — sign in with your Google account and get 10 free AI credits instantly. No credit card required. Free credits never expire.",
  },
  {
    q: "Will my results have a watermark?",
    a: "No watermarks, ever. Every image you download — whether on the free or paid plan — is clean and ready to use commercially.",
  },
  {
    q: "Do I need to create an account to try it?",
    a: "You can browse and explore the editor without an account. To process images, a free sign-in with Google takes under 10 seconds.",
  },
  {
    q: "What image formats does JPT AI support?",
    a: "JPT AI supports JPG, PNG, and WEBP upload. Downloads are available as PNG (with transparency) or JPG.",
  },
  {
    q: "How does AI background removal work?",
    a: "JPT AI uses deep learning image segmentation to detect subjects and separate them from backgrounds with pixel-level precision — no manual selection needed. Works on people, products, objects, and complex scenes.",
  },
  {
    q: "Can I upscale images to 4K online for free?",
    a: "Yes. Use the AI Upscale tool to enhance resolution up to 4× — for free with your daily credits. Upgrade for unlimited 4K upscaling.",
  },
  {
    q: "Is this good for e-commerce product photos?",
    a: "Absolutely. JPT AI is built for e-commerce. Remove backgrounds, replace with white, or generate custom backgrounds for your product photos — ready for Amazon, Flipkart, Shopify, and any marketplace.",
  },
  {
    q: "What happens to my images? Are they stored?",
    a: "Your images are processed securely and never used for AI training. Processed images are automatically deleted from our servers — you stay in full control.",
  },
  {
    q: "Can I edit images with just a text prompt?",
    a: "Yes. Type any change — 'make the background blurry', 'add dramatic studio lighting', 'change sky to golden sunset' — and JPT AI applies it instantly.",
  },
  {
    q: "Can I use JPT AI results commercially?",
    a: "Yes. All outputs are yours to use for personal, professional, or commercial purposes with no attribution required.",
  },
  {
    q: "How fast are the results?",
    a: "Most transformations complete in under 5 seconds. Background removal is near-instant. AI editing and upscaling typically take 5–15 seconds depending on image size.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. JPT AI runs entirely in your browser. Sign in and start editing — no downloads, no plugins, no desktop software required.",
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authTab, setAuthTab] = useState<"google" | "email">("google");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/me").then(r => r.json()).then((d: { authenticated?: boolean }) => {
      if (d.authenticated) setIsLoggedIn(true);
    }).catch(() => null);
  }, []);

  const uploadRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);
  const featureFileRef = useRef<HTMLInputElement>(null);
  const pendingFeatureTool = useRef<string>("");

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
    try { sessionStorage.setItem("jpt_pending_image", url); } catch {}
    window.location.href = "/editor";
  };

  const handleFeatureCardClick = (tool: string) => {
    pendingFeatureTool.current = tool;
    featureFileRef.current?.click();
  };

  const handleFeatureFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await readFile(file);
    const tool = pendingFeatureTool.current;
    try {
      sessionStorage.setItem("jpt_pending_image", url);
      sessionStorage.setItem("jpt_pending_tool", tool);
    } catch {}
    window.location.href = `/editor?tool=${tool}`;
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

  const savePending = () => {
    try {
      if (pendingType === "upload" && uploadImage) sessionStorage.setItem("jpt_pending_image", uploadImage.url);
      else if (pendingType === "prompt") {
        if (prompt.trim()) sessionStorage.setItem("jpt_pending_prompt", prompt.trim());
        if (refImage) sessionStorage.setItem("jpt_pending_image", refImage.url);
      }
    } catch {}
  };

  const handleOAuthRedirect = () => { savePending(); window.location.href = "/api/auth/google?next=/editor"; };

  const handleEmailAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) { setAuthError("Email and password required"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const url = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = authMode === "signup"
        ? { email: authEmail.trim(), password: authPassword, name: authName.trim() }
        : { email: authEmail.trim(), password: authPassword };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { ok?: boolean; error?: string; needsConfirmation?: boolean };
      if (!res.ok) { setAuthError(data.error || "Authentication failed"); return; }
      if (data.needsConfirmation) { setAuthError("✅ Check your email for a confirmation link, then sign in."); return; }
      savePending();
      window.location.href = "/editor";
    } catch { setAuthError("Network error. Please try again."); }
    finally { setAuthLoading(false); }
  };

  return (
    <div style={s.root}>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>✨ AI-Powered Image Editing — Free to Start</div>

          <h1 style={s.h1}>
            Free AI Image Editor<br />
            <span style={s.h1Accent}>Edit with a Single Prompt</span>
          </h1>

          <p style={s.heroPara}>
            Remove backgrounds free, upscale photos to 4K, generate AI backgrounds, resize, and transform
            images — all in one place. No watermark, no software needed.
          </p>

          {/* Upload Drop Zone */}
          <input ref={featureFileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFeatureFile(f); e.target.value = ""; }} />
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

          {/* Hero showcase — AI before/after */}
          <div style={s.heroShowcase}>
            <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", display: "flex" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <img src={HERO_BEFORE} alt="Before AI editing" style={{ ...s.heroShowcaseImg, borderRadius: 0 }} loading="eager" />
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 6, letterSpacing: 1 }}>BEFORE</div>
              </div>
              <div style={{ width: 3, background: "#fff", flexShrink: 0, zIndex: 2 }} />
              <div style={{ position: "relative", flex: 1 }}>
                <img src={HERO_AFTER} alt="After AI editing — sunny outdoor background" style={{ ...s.heroShowcaseImg, borderRadius: 0 }} loading="eager" />
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 6, letterSpacing: 1 }}>AFTER</div>
              </div>
            </div>
            <div style={s.heroShowcaseBadge}>✦ Real result from JPT AI</div>
          </div>
        </div>
      </section>

      {/* ── Product Highlights Bar ─────────────────────────────────────────── */}
      <section style={{ background: "#0F172A", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {[
            { icon: "🪄", label: "AI Background Removal" },
            { icon: "🔍", label: "4× Image Upscaling" },
            { icon: "✨", label: "Text-Prompt Editing" },
            { icon: "💼", label: "AI Headshot Generator" },
            { icon: "⚡", label: "Batch Process 100 Images" },
            { icon: "📤", label: "No Watermark on Download" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", whiteSpace: "nowrap" }}>{item.label}</span>
            </div>
          ))}
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
              <div key={f.title} style={{ ...s.featureCard, cursor: "pointer" }}
                onClick={() => handleFeatureCardClick(f.tool)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(99,102,241,0.18)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                <div style={s.featureImgWrap}>
                  {f.tool === "remove-bg" ? (
                    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden" }}>
                      {/* Left half — original with background */}
                      <div style={{ width: "50%", height: "100%", overflow: "hidden", position: "relative" }}>
                        <img
                          src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600"
                          alt="Original with background"
                          style={{ width: "200%", height: "100%", objectFit: "cover", objectPosition: "left center", display: "block" }}
                          loading="lazy"
                        />
                      </div>
                      {/* Right half — transparent checkerboard */}
                      <div style={{ width: "50%", height: "100%", overflow: "hidden", position: "relative",
                        backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                        backgroundSize: "16px 16px", backgroundPosition: "0 0,0 8px,8px -8px,-8px 0" }}>
                        <img
                          src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600"
                          alt="Background removed"
                          style={{ width: "200%", height: "100%", objectFit: "cover", objectPosition: "left center", display: "block", marginLeft: "-100%",
                            WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 40% 45%, black 55%, transparent 100%)",
                            maskImage: "radial-gradient(ellipse 80% 85% at 40% 45%, black 55%, transparent 100%)" }}
                          loading="lazy"
                        />
                      </div>
                      {/* Divider line */}
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#fff", boxShadow: "0 0 6px rgba(0,0,0,0.3)" }} />
                    </div>
                  ) : (
                    <img src={f.img} alt={f.title} style={s.featureImg} loading="lazy" />
                  )}
                </div>
                <div style={s.featureBody}>
                  <div style={s.featureIcon}>{f.icon}</div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <p style={s.featureDesc}>{f.desc}</p>
                  <div style={{ fontSize: 12, color: "#6366F1", fontWeight: 700, marginTop: 8 }}>Upload image to try →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#F4F5FB" }}>
        <div style={{ ...s.sectionInner, textAlign: "center" }}>
          <div style={s.sectionLabel}>HOW IT WORKS</div>
          <h2 style={s.h2}>Edit images in 3 simple steps</h2>
          <p style={{ ...s.sectionSub, maxWidth: 480, margin: "0 auto 48px" }}>From upload to download in seconds — no learning curve.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 780, margin: "0 auto" }}>
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
          <p style={s.sectionSub}>Whatever you create, JPT AI makes it faster — and the numbers prove it.</p>
          <div style={s.useCaseGrid}>
            {USE_CASES.map((u) => (
              <div key={u.title} style={s.useCaseCard}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{u.icon}</div>
                <div style={s.useCaseTitle}>{u.title}</div>
                {"stat" in u && u.stat && (
                  <div style={{ display: "inline-block", background: "#EEF2FF", color: "#6366F1", fontSize: 11, fontWeight: 800, borderRadius: 20, padding: "3px 10px", marginBottom: 8, letterSpacing: 0.3 }}>
                    📈 {u.stat}
                  </div>
                )}
                <p style={s.useCaseDesc}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#F4F5FB" }}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>TESTIMONIALS</div>
          <h2 style={s.h2}>Loved by creators worldwide</h2>
          <p style={s.sectionSub}>Real results from real users — no stock photos or made-up reviews.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#fff", borderRadius: 16, padding: "24px 22px", border: "1px solid #E5E7EF", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} style={{ color: "#F59E0B", fontSize: 16 }}>★</span>
                  ))}
                </div>
                <p style={{ margin: "0 0 18px", fontSize: 14, color: "#374151", lineHeight: 1.7, fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ───────────────────────────────────────────────── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionLabel}>COMPARISON</div>
          <h2 style={s.h2}>JPT AI vs the alternatives</h2>
          <p style={s.sectionSub}>One tool. Everything included. No hidden paywalls.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#6B7280", fontWeight: 700, fontSize: 13 }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#6366F1", fontWeight: 900, fontSize: 13, background: "#EEF2FF", borderRadius: "12px 12px 0 0" }}>✦ JPT AI</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#6B7280", fontWeight: 700, fontSize: 13 }}>Photoshop</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#6B7280", fontWeight: 700, fontSize: 13 }}>remove.bg</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 16px", color: "#374151", fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ textAlign: "center", padding: "12px 16px", background: "#EEF2FF" }}>
                      <span style={{ color: row.jpt ? "#10B981" : "#EF4444", fontSize: 18, fontWeight: 900 }}>{row.jpt ? "✓" : "✗"}</span>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 16px" }}>
                      <span style={{ color: row.photoshop ? "#10B981" : "#EF4444", fontSize: 18, fontWeight: 900 }}>{row.photoshop ? "✓" : "✗"}</span>
                    </td>
                    <td style={{ textAlign: "center", padding: "12px 16px" }}>
                      <span style={{ color: row.removebg ? "#10B981" : "#EF4444", fontSize: 18, fontWeight: 900 }}>{row.removebg ? "✓" : "✗"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SEO Rich Content ───────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#F4F5FB" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={s.sectionLabel}>ABOUT JPT AI</div>
          <h2 style={{ ...s.h2, marginBottom: 28 }}>The best free AI image editor online — no watermark, no signup friction</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 32, fontSize: 15, color: "#4B5563", lineHeight: 1.8 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Free AI Background Remover</h3>
              <p style={{ margin: "0 0 16px" }}>JPT AI&apos;s background remover uses deep learning to detect and separate subjects from any background in seconds. Whether you&apos;re editing product photos for e-commerce, removing backgrounds from portraits, or preparing images for marketing materials — our AI delivers clean cutouts with no manual effort.</p>
              <p style={{ margin: 0 }}>Unlike other online background removers, JPT AI outputs full-resolution PNG with transparency — no watermarks, no degraded quality, free to use.</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>AI Image Upscaler — Upscale to 4K Online Free</h3>
              <p style={{ margin: "0 0 16px" }}>Our AI upscaler uses super-resolution technology to enhance image quality by up to 4×. Restore old blurry photos, enlarge low-resolution product images, or upscale AI-generated art to print quality — all without Photoshop.</p>
              <p style={{ margin: 0 }}>Perfect for e-commerce sellers who need high-resolution product photos, photographers restoring old images, and creators upscaling AI-generated artwork.</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Edit Images with Text Prompts</h3>
              <p style={{ margin: "0 0 16px" }}>Describe any edit in plain English and JPT AI makes it happen. &ldquo;Make the background a sunset&rdquo;, &ldquo;add professional studio lighting&rdquo;, &ldquo;remove the object on the left&rdquo; — no Photoshop skills required.</p>
              <p style={{ margin: 0 }}>This is the fastest way to edit photos online for non-designers, social media managers, and anyone who needs quick, high-quality image edits without learning complex software.</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 10 }}>AI Headshots & Professional Photos</h3>
              <p style={{ margin: "0 0 16px" }}>Create professional AI headshots for LinkedIn, company directories, and resumes. Remove distracting backgrounds, replace with clean office or outdoor environments, and look polished in every photo.</p>
              <p style={{ margin: 0 }}>LinkedIn profiles with professional headshots get 21× more profile views. JPT AI makes it possible without expensive photography sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: "#fff" }}>
        <div style={{ ...s.sectionInner, maxWidth: 780 }}>
          <div style={s.sectionLabel}>FAQ</div>
          <h2 style={{ ...s.h2, marginBottom: 40 }}>Frequently asked questions about JPT AI</h2>
          <FAQAccordion faqs={FAQS} />
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
        <div style={s.modalOverlay} onClick={() => { setShowSignIn(false); setAuthError(""); }}>
          <div style={{ ...s.modalBox, maxWidth: 440, textAlign: "left" as const }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
              {pendingType === "upload" && uploadImage
                ? <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", maxHeight: 110 }}><img src={uploadImage.url} alt="preview" style={{ width: "100%", height: 110, objectFit: "cover" }} /></div>
                : <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>}
              <div style={{ fontWeight: 900, fontSize: 20, color: "#111" }}>Sign in to JPT AI</div>
              <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>Get <strong>10 free AI credits</strong> to start editing</p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: "flex", background: "#F0F0F8", borderRadius: 10, padding: 3, marginBottom: 18 }}>
              {(["google", "email"] as const).map(t => (
                <button key={t} onClick={() => { setAuthTab(t); setAuthError(""); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: authTab === t ? "#fff" : "none", fontWeight: 700, fontSize: 13, cursor: "pointer", color: authTab === t ? "#6366F1" : "#888", boxShadow: authTab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                  {t === "google" ? "🔵 Google" : "📧 Email"}
                </button>
              ))}
            </div>

            {authTab === "google" && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <button style={s.modalGoogleBtn} onClick={handleOAuthRedirect}>
                  <GoogleIcon />
                  Continue with Google
                </button>
                <div style={{ fontSize: 12, color: "#999", textAlign: "center" as const }}>Quick · No password needed</div>
              </div>
            )}

            {authTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <div style={{ display: "flex", gap: 4, justifyContent: "center", borderBottom: "1px solid #F0F0F0", paddingBottom: 10, marginBottom: 4 }}>
                  {(["signup", "login"] as const).map(m => (
                    <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontWeight: authMode === m ? 800 : 400, color: authMode === m ? "#6366F1" : "#888", borderBottom: authMode === m ? "2px solid #6366F1" : "2px solid transparent", padding: "4px 14px", fontSize: 14 }}>
                      {m === "signup" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>
                {authMode === "signup" && (
                  <input type="text" placeholder="Your name (optional)" value={authName} onChange={e => setAuthName(e.target.value)}
                    style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                )}
                <input type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                <input type="password" placeholder="Password (min 6 chars)" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                  style={{ border: "1.5px solid #E0E0EE", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                {authError && <div style={{ background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#C00" }}>{authError}</div>}
                <button onClick={handleEmailAuth} disabled={authLoading}
                  style={{ padding: "11px", background: authLoading ? "#A5B4FC" : "#6366F1", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: authLoading ? "not-allowed" : "pointer" }}>
                  {authLoading ? "Please wait…" : authMode === "signup" ? "✦ Create Account — Free" : "→ Sign In"}
                </button>
              </div>
            )}

            <button style={{ ...s.modalDismiss, display: "block", margin: "14px auto 0" }} onClick={() => { setShowSignIn(false); setAuthError(""); }}>Maybe later</button>
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
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 },
  featureCard: { background: "#fff", borderRadius: 18, border: "1px solid #EAECF0", overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" },
  featureImgWrap: { width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: "#F0F0F8" },
  featureImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  featureBody: { padding: "20px 22px 24px" },
  featureIcon: { fontSize: 28, marginBottom: 10 },
  featureTitle: { fontSize: 16, fontWeight: 800, marginBottom: 8 },
  featureDesc: { margin: 0, fontSize: 14, color: "#555", lineHeight: 1.65 },

  // Hero showcase
  heroShowcase: { position: "relative", width: "100%", maxWidth: 720, marginTop: 16, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.15)" },
  heroShowcaseImg: { width: "100%", display: "block" },
  heroShowcaseBadge: { position: "absolute", bottom: 14, right: 14, background: "rgba(15,23,42,0.85)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 100, backdropFilter: "blur(4px)" },

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
