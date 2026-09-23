"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "./_components/Icon";
import { AppRow, AfterImage } from "./_components/AppCard";
import AppCarousel from "./_components/AppCarousel";
import type { AppCat } from "@/lib/app-catalog";
import FeedCard from "./_components/FeedCard";
import { useDashboardUser } from "./_components/DashboardUser";
import { sendToCreate, openInEditor } from "./_components/handoff";
import { openPricing } from "@/lib/pricing-modal";
import { CREDIT_COST } from "@/lib/plans";
import type { AppCardData, FeedItem } from "@/lib/dashboard-feed.server";

export interface Feature {
  title: string;
  sub: string;
  href: string;
  icon: IconName;
  /** A direct image URL, or an app whose live creative to show (whole, or just its after half). */
  image: { kind: "url"; url: string } | { kind: "app"; app: AppCardData; full?: boolean } | null;
  gradient: [string, string];
}

interface Recent { id: number; label: string; thumb?: string; imageUrl?: string; timestamp: number }

type Mode = "create" | "edit";

const IDEAS = [
  "Cinematic portrait of a woman in a yellow raincoat, neon Tokyo street, rain, 35mm film",
  "Minimal product shot of a perfume bottle on travertine stone, soft morning light",
  "Cozy reading nook with plants and warm lamp light, isometric 3D render",
  "Studio Ghibli style countryside with a red train crossing a river at sunset",
];

const EDIT_IDEAS = ["Remove the background", "Make it golden hour", "Turn it into a Pixar-style character", "Restore and colourise this old photo"];

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SectionHead({ title, sub, href, cta }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="jpt-nav-item" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "var(--accent)", textDecoration: "none", whiteSpace: "nowrap" }}>
          {cta || "View all"} <Icon name="chevronRight" size={15} />
        </Link>
      )}
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("That file could not be read."));
    r.readAsDataURL(file);
  });
}

export default function HomeView({ features, popular, showcase, categories, community, appCount }: {
  features: Feature[];
  popular: AppCardData[];
  showcase: AppCardData[];
  categories: { id: AppCat; label: string }[];
  community: FeedItem[];
  appCount: number;
}) {
  const router = useRouter();
  const user = useDashboardUser();
  const [mode, setMode] = useState<Mode>("create");
  const [prompt, setPrompt] = useState("");
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<Recent[] | null>(null);
  const [hello, setHello] = useState("Welcome back");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHello(greeting()); }, []);
  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { recentCreations?: Recent[] } | null) => setRecent(Array.isArray(d?.recentCreations) ? d!.recentCreations : []))
      .catch(() => setRecent([]));
  }, []);

  const pickFile = async (f: File | undefined) => {
    setPhotoErr(null);
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setPhotoErr("Use a JPG, PNG or WebP image."); return; }
    if (f.size > 10 * 1024 * 1024) { setPhotoErr("That image is over 10 MB — try a smaller one."); return; }
    try { setPhoto({ url: await readFile(f), name: f.name }); } catch (e) { setPhotoErr((e as Error).message); }
  };

  const submit = async () => {
    if (sending) return;
    if (mode === "create") {
      const text = prompt.trim();
      if (!text) return;
      sendToCreate(text, (href) => router.push(href));
      return;
    }
    if (!photo) { fileRef.current?.click(); return; }
    setSending(true);
    const text = prompt.trim();
    await openInEditor(photo.url, text);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); }
  };

  const canSubmit = mode === "create" ? !!prompt.trim() : !!photo;
  const firstName = user.name.split(" ")[0];

  return (
    <div style={{ padding: "0 24px 60px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", padding: "46px 0 34px", textAlign: "center" }}>
          <div className="jpt-a-glow" aria-hidden style={{ position: "absolute", left: "50%", top: 30, width: 760, maxWidth: "120%", height: 360, transform: "translateX(-50%)", background: "radial-gradient(ellipse at center, var(--accent-soft) 0%, transparent 68%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div className="jpt-a-up" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)" }}>{hello}, {firstName} 👋</div>
            <h1 className="jpt-a-up" style={{ ["--d" as string]: "60ms", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", margin: "8px 0 22px", lineHeight: 1.1 }}>
              What will you <span className="jpt-grad-text">create</span> today?
            </h1>

            <div className="jpt-a-up" style={{ ["--d" as string]: "110ms", display: "inline-flex", maxWidth: "100%", overflowX: "auto", gap: 4, padding: 4, borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 14 }}>
              {([["create", "Create image", "sparkle"], ["edit", "Edit a photo", "editor"]] as [Mode, string, IconName][]).map(([id, label, icon]) => {
                const on = mode === id;
                return (
                  <button key={id} onClick={() => setMode(id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", whiteSpace: "nowrap", borderRadius: 999, border: on ? "1px solid var(--accent-border)" : "1px solid transparent", background: on ? "var(--accent-soft)" : "transparent", color: on ? "var(--accent)" : "var(--text-muted)", fontWeight: 700, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", transition: "all .18s ease" }}>
                    <Icon name={icon} size={15} /> {label}
                  </button>
                );
              })}
              <Link href="/app/apps" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", whiteSpace: "nowrap", borderRadius: 999, color: "var(--text-muted)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }} className="jpt-nav-item">
                <Icon name="apps" size={15} /> AI Apps
              </Link>
            </div>

            <div className="jpt-a-up" style={{ ["--d" as string]: "160ms", maxWidth: 780, margin: "0 auto", textAlign: "left", background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 20, padding: 14, boxShadow: "0 20px 60px rgba(0,0,0,.35), 0 0 0 1px var(--accent-soft)" }}>
              <div style={{ display: "flex", gap: 12 }}>
                {mode === "edit" && (
                  <button onClick={() => fileRef.current?.click()} aria-label={photo ? "Change photo" : "Upload a photo"} className="jpt-lift" style={{ position: "relative", width: 72, height: 72, flexShrink: 0, borderRadius: 14, border: `1.5px dashed ${photo ? "transparent" : "var(--border-strong)"}`, background: "var(--surface)", color: "var(--text-faint)", cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontFamily: "inherit", fontSize: 10.5, fontWeight: 700 }}>
                    {photo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photo.url} alt={photo.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : <><Icon name="upload" size={20} /> Upload</>}
                  </button>
                )}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={3}
                  placeholder={mode === "create" ? "Describe the image you want to create…" : photo ? "Describe the edit — or leave empty to open the editor" : "Upload a photo, then describe what to change…"}
                  style={{ flex: 1, minWidth: 0, resize: "none", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15.5, lineHeight: 1.55, fontFamily: "inherit", padding: "6px 4px" }}
                />
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ""; }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {mode === "create" ? (
                  <button onClick={() => setPrompt(IDEAS[Math.floor(Math.random() * IDEAS.length)])} className="jpt-nav-item" style={chip}>
                    <Icon name="wand" size={14} /> Surprise me
                  </button>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="jpt-nav-item" style={chip}>
                    <Icon name="image" size={14} /> {photo ? "Change photo" : "Choose photo"}
                  </button>
                )}
                <span style={{ ...chip, cursor: "default", border: "1px solid var(--border)" }}><Icon name="zap" size={13} /> {CREDIT_COST} credits</span>
                {photoErr && <span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{photoErr}</span>}
                <div style={{ flex: 1 }} />
                <button
                  onClick={submit}
                  disabled={!canSubmit && mode === "create"}
                  aria-label={mode === "create" ? "Create" : "Continue"}
                  className={canSubmit ? "jpt-sheen" : undefined}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12, border: "none", background: canSubmit ? "var(--grad-strong)" : "var(--surface-3)", color: canSubmit ? "#fff" : "var(--text-faint)", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: canSubmit || mode === "edit" ? "pointer" : "not-allowed", boxShadow: canSubmit ? "var(--glow)" : "none", transition: "background .2s ease" }}
                >
                  {sending ? "Opening…" : mode === "create" ? "Create" : photo ? "Edit photo" : "Upload photo"} <Icon name="arrowUp" size={16} />
                </button>
              </div>
            </div>

            <div className="jpt-a-up" style={{ ["--d" as string]: "220ms", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
              {(mode === "create" ? IDEAS.map((i) => i.split(",")[0]) : EDIT_IDEAS).map((idea, i) => (
                <button key={idea} onClick={() => setPrompt(mode === "create" ? IDEAS[i] : idea)} className="jpt-lift" style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  {idea}
                </button>
              ))}
            </div>

            {user.credits < CREDIT_COST && (
              <div className="jpt-a-up" style={{ ["--d" as string]: "260ms", display: "inline-flex", alignItems: "center", gap: 10, marginTop: 18, padding: "8px 8px 8px 14px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
                You&apos;re out of credits — packs start at ₹166, and never expire.
                <button onClick={() => openPricing("Get credits")} style={{ padding: "6px 12px", borderRadius: 999, border: "none", background: "var(--grad-strong)", color: "#fff", fontWeight: 800, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>Get credits</button>
              </div>
            )}
          </div>
        </section>

        {/* ── Feature banners ──────────────────────────────────────────── */}
        <section style={{ marginBottom: 44 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 14 }}>
            {features.map((f, i) => (
              <Link key={f.title} href={f.href} className="jpt-zoom jpt-a-up jpt-lift" style={{ ["--d" as string]: `${280 + i * 60}ms`, display: "block", borderRadius: 18, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
                <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "17px 17px 0 0", background: `linear-gradient(135deg, ${f.gradient[0]}, ${f.gradient[1]})` }}>
                  <div className="jpt-zoom-media" style={{ position: "absolute", inset: 0 }}>
                    <FeatureImage f={f} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 70%, rgba(8,8,10,.35) 100%)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={f.icon} size={18} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{f.title}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 1 }}>{f.sub}</span>
                  </span>
                  <Icon name="arrowRight" size={16} style={{ color: "var(--text-faint)" }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent creations ─────────────────────────────────────────── */}
        {recent === null ? null : recent.length > 0 && (
          <section className="jpt-a-up" style={{ marginBottom: 44 }}>
            <SectionHead title="Continue where you left off" href="/app/library" cta="My Creations" />
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
              {recent.map((c, i) => {
                const src = c.imageUrl || c.thumb;
                return (
                  <Link key={c.id} href="/app/library" className="jpt-zoom jpt-a-up" style={{ ["--d" as string]: `${i * 40}ms`, flex: "0 0 150px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)", aspectRatio: "4 / 5", position: "relative", textDecoration: "none" }}>
                    {src
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img className="jpt-zoom-media" src={src} alt={c.label} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}><Icon name="image" size={24} /></span>}
                    <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 10px 8px", background: "linear-gradient(180deg, transparent, rgba(8,8,10,.85))", fontSize: 11.5, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── AI apps carousel ─────────────────────────────────────────── */}
        {showcase.length > 0 && (
          <section className="jpt-a-up" style={{ marginBottom: 44 }}>
            <SectionHead title="Explore AI apps" sub="Upload a photo and pick a look — no prompt needed" href="/app/apps" cta={`All ${appCount} apps`} />
            <AppCarousel apps={showcase} categories={categories} />
          </section>
        )}

        {/* ── Popular apps ─────────────────────────────────────────────── */}
        {popular.length > 0 && (
          <section style={{ marginBottom: 44 }}>
            <SectionHead title="Popular AI apps" sub={`One tap, no prompt — ${appCount}+ apps to explore`} href="/app/apps" cta="All apps" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
              {popular.map((a, i) => <AppRow key={a.slug} a={a} delay={i * 40} />)}
            </div>
          </section>
        )}

        {/* ── Community ────────────────────────────────────────────────── */}
        {community.length > 0 && (
          <section>
            <SectionHead title="Trending in Community" sub="Made by creators — tap Recreate to make your own" href="/app/community" cta="Explore" />
            <div className="jpt-masonry">
              {community.map((it, i) => <FeedCard key={it.uid} item={it} delay={i * 35} onOpen={() => router.push("/app/community")} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FeatureImage({ f }: { f: Feature }) {
  const [broken, setBroken] = useState(false);
  const img = f.image;
  if (!img || broken) return null;
  if (img.kind === "url") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.url} alt="" referrerPolicy="no-referrer" loading="eager" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  if (img.full && img.app.main) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.app.main.url} alt="" loading="eager" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }
  return <AfterImage a={img.app} box={4 / 3} sizes="(max-width: 768px) 100vw, 320px" eager />;
}

const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 9,
  border: "1px solid transparent", background: "transparent", color: "var(--text-muted)",
  fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
};
