"use client";

import { useState } from "react";

interface Resolved {
  title: string;
  author: string;
  cover: string;
  duration: number;
  noWatermark: string;
  hd: string;
  music: string;
}

const GRAD = "linear-gradient(120deg,#6366F1,#8B5CF6)";

function fmtDur(s: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoWatermarkRemover() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Resolved | null>(null);

  const submit = async () => {
    const link = url.trim();
    if (!link) { setError("Paste a TikTok video link first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/video/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't process this link."); return; }
      if (!data.noWatermark) { setError("No downloadable video found for this link."); return; }
      setResult(data as Resolved);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pasteFromClipboard = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) setUrl(t.trim()); } catch { /* clipboard blocked */ }
  };

  const nameSlug = (result?.author || "tiktok").replace(/[^a-z0-9]+/gi, "-").slice(0, 30) || "tiktok";
  const dl = (mediaUrl: string, type: "video" | "audio") =>
    `/api/video/download?url=${encodeURIComponent(mediaUrl)}&name=jpt-${nameSlug}-nowatermark&type=${type}`;

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 20px", borderRadius: 12, fontSize: 14.5, fontWeight: 800, textDecoration: "none", cursor: "pointer", border: "none",
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#fff" }}>
      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg,#F5F5FF 0%,#fff 50%,#F0FDF4 100%)", padding: "72px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ☁️ JPT AI · 100% FREE
          </div>
          <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.4rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 16px" }}>
            Free TikTok <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Watermark Remover</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 34px" }}>
            Paste a TikTok link and download the video <strong>without the watermark</strong> in HD — free, no app, no sign-up.
          </p>

          {/* Paste box */}
          <div style={{ maxWidth: 620, margin: "0 auto", background: "#fff", border: "1px solid #E6E8F2", borderRadius: 18, padding: 14, boxShadow: "0 12px 40px rgba(99,102,241,0.12)" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 260px" }}>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Paste TikTok video link here…"
                  style={{ width: "100%", boxSizing: "border-box", padding: "14px 14px 14px 42px", borderRadius: 12, border: "1.5px solid #E0E0EE", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>🔗</span>
                {!url && (
                  <button onClick={pasteFromClipboard} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#F1F5F9", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#6366F1", cursor: "pointer" }}>Paste</button>
                )}
              </div>
              <button
                onClick={submit}
                disabled={loading}
                style={{ ...btnBase, flex: "0 0 auto", minWidth: 170, background: GRAD, color: "#fff", boxShadow: "0 6px 20px rgba(99,102,241,0.4)", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "jptspin 0.8s linear infinite" }} /> Processing…</> : "✨ Remove Watermark"}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: 10, background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#C0392B", textAlign: "left" }}>{error}</div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>Works with tiktok.com, vm.tiktok.com & vt.tiktok.com links.</div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ maxWidth: 620, margin: "24px auto 0", background: "#fff", border: "1px solid #EAECF5", borderRadius: 18, padding: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.06)", textAlign: "left" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                {result.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.cover} alt={result.title} style={{ width: 92, height: 122, objectFit: "cover", borderRadius: 12, flexShrink: 0, background: "#F1F5F9" }} />
                )}
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{result.title}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>
                    {result.author && <>@{result.author}</>}{result.duration ? <> · {fmtDur(result.duration)}</> : null}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <a href={dl(result.noWatermark, "video")} style={{ ...btnBase, background: GRAD, color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>⬇ Download (No Watermark)</a>
                    <div style={{ display: "flex", gap: 8 }}>
                      {result.hd && result.hd !== result.noWatermark && (
                        <a href={dl(result.hd, "video")} style={{ ...btnBase, flex: 1, background: "#EEF2FF", color: "#6366F1" }}>⬇ HD</a>
                      )}
                      {result.music && (
                        <a href={dl(result.music, "audio")} style={{ ...btnBase, flex: 1, background: "#F1F5F9", color: "#334155" }}>🎵 Audio (MP3)</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.3rem)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Three steps, no watermark</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 28 }}>
            {[
              { n: "01", t: "Copy the TikTok link", d: "In the TikTok app, tap Share → Copy Link. Or copy the URL from your browser." },
              { n: "02", t: "Paste & remove", d: "Paste it in the box above and hit Remove Watermark. We fetch the clean version instantly." },
              { n: "03", t: "Download HD", d: "Download the watermark-free MP4 in HD — or grab just the audio as MP3." },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{ width: 66, height: 66, background: "#fff", border: "2px solid #E0E7FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 4px 20px rgba(99,102,241,0.12)", fontSize: 20, fontWeight: 900, color: "#6366F1" }}>{s.n}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / trust */}
      <section style={{ padding: "0 24px 40px", background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { i: "🚫", t: "No Watermark" },
            { i: "🎬", t: "HD Quality" },
            { i: "🎵", t: "Extract Audio (MP3)" },
            { i: "⚡", t: "Instant & Unlimited" },
            { i: "🆓", t: "Free · No Sign-Up" },
          ].map((c) => (
            <div key={c.t} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F5F6FB", border: "1px solid #EAECF5", borderRadius: 999, padding: "9px 16px" }}>
              <span style={{ fontSize: 15 }}>{c.i}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{c.t}</span>
            </div>
          ))}
        </div>
        <p style={{ maxWidth: 720, margin: "22px auto 0", textAlign: "center", fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.6 }}>
          Please respect creators&apos; rights — only download videos you have permission to use, and credit the original creator when you re-share.
        </p>
      </section>

      {/* WHY BEST */}
      <section style={{ padding: "72px 24px", background: "#0F172A" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Why <span style={{ color: "#818CF8" }}>JPT AI</span> is the best free TikTok watermark remover
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "12px 0 0" }}>The simplest way to save clean, watermark-free TikTok videos in HD.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 44 }}>
            {[
              { icon: "👍", title: "Entirely Free to Use", accent: "#F59E0B", desc: "Remove the TikTok watermark and download videos in seconds. No hidden fees, no charges — completely free, every time." },
              { icon: "🎬", title: "HD Video + MP3 Audio", accent: "#818CF8", desc: "Save clean, watermark-free videos in crisp HD quality — or pull just the sound out as an MP3 in one tap." },
              { icon: "🖥️", title: "Works on Any Device", accent: "#34D399", desc: "Runs smoothly on Windows, Mac, Linux, iPhone, iPad and Android — nothing to download, nothing to install." },
            ].map((c) => (
              <div key={c.title} style={{ background: "#1E293B", border: "1px solid #263349", borderRadius: 18, padding: "28px 24px" }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{c.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px", color: c.accent }}>{c.title}</h3>
                <p style={{ fontSize: 13.5, color: "#94A3B8", lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section style={{ padding: "72px 24px", background: "#0B1120" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Why choose <span style={{ color: "#818CF8" }}>JPT AI</span> for TikTok downloads
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "12px 0 0", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              Save high-quality TikTok videos without the watermark and without the hassle. Just paste, and download.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 44 }}>
            {[
              { icon: "🎯", title: "Intuitive & Perfect Results", desc: "A clean, one-paste flow with easy-to-follow steps and flawless output. Remove the watermark effortlessly and keep the full quality of your TikTok videos." },
              { icon: "⚡", title: "No Install, No Sign-Up", desc: "No apps to download and no account to create. Paste a TikTok link and get your clean, watermark-free video instantly — free and unlimited." },
            ].map((c) => (
              <div key={c.title} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 18, padding: "30px 26px" }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{c.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#fff" }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "40px 24px 88px", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.1rem)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Frequently asked questions</h2>
          </div>
          {[
            { q: "Is the TikTok watermark remover free?", a: "Yes — it's completely free with no sign-up, no app, and no limit on how many videos you download." },
            { q: "Does it remove the TikTok logo and username?", a: "It fetches the original, clean version of the video without the moving TikTok watermark and username overlay." },
            { q: "Can I download in HD?", a: "Yes. When an HD source is available you'll see an HD button; otherwise the standard no-watermark MP4 is provided." },
            { q: "Can I download just the sound?", a: "Yes — use the Audio (MP3) button to save just the track from the video." },
            { q: "Do I need to install anything?", a: "No. Paste the link and download — nothing to install, works on phone and computer." },
            { q: "Is it legal?", a: "Downloading is a personal-use convenience. Always respect the creator's rights and TikTok's terms — only reuse videos you have permission to use, and credit the creator." },
          ].map((f) => (
            <details key={f.q} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
              <summary style={{ fontSize: 15, fontWeight: 700, color: "#111827", cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <style>{`@keyframes jptspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
