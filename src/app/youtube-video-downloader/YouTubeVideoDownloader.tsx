"use client";

import { useState } from "react";

interface Resolved {
  title: string;
  author: string;
  cover: string;
  media: string;
  filename: string;
}

const GRAD = "linear-gradient(120deg,#FF0000,#C4302B)";

export default function YouTubeVideoDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Resolved | null>(null);

  const submit = async () => {
    const link = url.trim();
    if (!link) { setError("Paste a YouTube video link first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't process this link."); return; }
      if (!data.media) { setError("No downloadable video found for this link."); return; }
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

  const dl = (mediaUrl: string) =>
    `/api/video/download?url=${encodeURIComponent(mediaUrl)}&name=jpt-youtube-video&type=video`;

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 20px", borderRadius: 12, fontSize: 14.5, fontWeight: 800, textDecoration: "none", cursor: "pointer", border: "none",
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#111827", background: "#fff" }}>
      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg,#FFF5F5 0%,#fff 55%,#FFF7F0 100%)", padding: "72px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFEBEB", color: "#C4302B", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ▶️ JPT AI · 100% FREE
          </div>
          <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.4rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0F172A", margin: "0 0 16px" }}>
            Free YouTube <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Video Downloader</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "#4B5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 34px" }}>
            Paste a <strong>YouTube</strong> link and download the video as an HD MP4 — free, no app, no sign-up.
          </p>

          {/* Paste box */}
          <div style={{ maxWidth: 620, margin: "0 auto", background: "#fff", border: "1px solid #F3E1E1", borderRadius: 18, padding: 14, boxShadow: "0 12px 40px rgba(196,48,43,0.12)" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 260px" }}>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Paste YouTube video link here…"
                  style={{ width: "100%", boxSizing: "border-box", padding: "14px 14px 14px 42px", borderRadius: 12, border: "1.5px solid #EEDDDD", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>🔗</span>
                {!url && (
                  <button onClick={pasteFromClipboard} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#FFEBEB", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "#C4302B", cursor: "pointer" }}>Paste</button>
                )}
              </div>
              <button
                onClick={submit}
                disabled={loading}
                style={{ ...btnBase, flex: "0 0 auto", minWidth: 170, background: GRAD, color: "#fff", boxShadow: "0 6px 20px rgba(196,48,43,0.4)", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "jptspin 0.8s linear infinite" }} /> Processing…</> : "✨ Download Video"}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: 10, background: "#FFF1F0", border: "1px solid #FFC4C4", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#C0392B", textAlign: "left" }}>{error}</div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>Works with youtube.com and youtu.be video links.</div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ maxWidth: 620, margin: "24px auto 0", background: "#fff", border: "1px solid #F3E1E1", borderRadius: 18, padding: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.06)", textAlign: "left" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                {result.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.cover} alt={result.title} style={{ width: 150, height: 84, objectFit: "cover", borderRadius: 10, flexShrink: 0, background: "#F1F5F9" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 30 }}>▶️</div>
                )}
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{result.title}</div>
                  {result.author && <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>{result.author}</div>}
                  <a href={dl(result.media)} style={{ ...btnBase, background: GRAD, color: "#fff", boxShadow: "0 4px 16px rgba(196,48,43,0.35)" }}>⬇ Download Video (HD)</a>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "#C4302B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.3rem)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Three steps, clean download</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 28 }}>
            {[
              { n: "01", t: "Copy the YouTube link", d: "On the video, tap Share → Copy Link. On desktop, copy the URL from your browser's address bar." },
              { n: "02", t: "Paste & download", d: "Paste it in the box above and hit Download Video. We fetch the video in seconds." },
              { n: "03", t: "Save the HD MP4", d: "Download the video in HD — ready to watch offline, edit, or archive." },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: "center" }}>
                <div style={{ width: 66, height: 66, background: "#fff", border: "2px solid #F7D6D6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 4px 20px rgba(196,48,43,0.12)", fontSize: 20, fontWeight: 900, color: "#C4302B" }}>{s.n}</div>
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
            { i: "🎬", t: "HD Quality" },
            { i: "📥", t: "MP4 Download" },
            { i: "📱", t: "Any Device" },
            { i: "⚡", t: "Instant & Unlimited" },
            { i: "🆓", t: "Free · No Sign-Up" },
          ].map((c) => (
            <div key={c.t} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBF5F5", border: "1px solid #F3E1E1", borderRadius: 999, padding: "9px 16px" }}>
              <span style={{ fontSize: 15 }}>{c.i}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{c.t}</span>
            </div>
          ))}
        </div>
        <p style={{ maxWidth: 720, margin: "22px auto 0", textAlign: "center", fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.6 }}>
          Please respect creators&apos; rights and YouTube&apos;s Terms of Service — only download videos you have permission to use (for example, your own content or videos with a download/Creative-Commons licence), and credit the original creator.
        </p>
      </section>

      {/* WHY BEST */}
      <section style={{ padding: "72px 24px", background: "#0F172A" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Why <span style={{ color: "#F87171" }}>JPT AI</span> is a great free YouTube video downloader
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "12px 0 0" }}>The simplest way to save YouTube videos as clean HD MP4 files.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 44 }}>
            {[
              { icon: "👍", title: "Entirely Free to Use", accent: "#F59E0B", desc: "Download YouTube videos in seconds. No hidden fees, no charges — completely free, every time." },
              { icon: "🎬", title: "HD MP4 Video", accent: "#F87171", desc: "Save crisp, high-definition MP4 files you can watch offline, edit, or keep — no quality shortcuts." },
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
              Why choose <span style={{ color: "#F87171" }}>JPT AI</span> for YouTube downloads
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "12px 0 0", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              Save YouTube videos without the hassle. Just paste, and download.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 44 }}>
            {[
              { icon: "🎯", title: "Intuitive & Perfect Results", desc: "A clean, one-paste flow with easy-to-follow steps. Save videos effortlessly, in full quality." },
              { icon: "⚡", title: "No Install, No Sign-Up", desc: "No apps to download and no account to create. Paste a YouTube link and get your video — free and unlimited." },
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
            <div style={{ fontSize: 12, fontWeight: 700, color: "#C4302B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(1.7rem,3vw,2.1rem)", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Frequently asked questions</h2>
          </div>
          {[
            { q: "Is the YouTube video downloader free?", a: "Yes — it's completely free with no sign-up and no app. Paste a link and download." },
            { q: "What formats can I download?", a: "Videos download as HD MP4 files that play on virtually any device or editor." },
            { q: "Does it work on iPhone and Android?", a: "Yes — it runs in your phone or computer's browser. There's nothing to install." },
            { q: "Can I download private or age-restricted videos?", a: "No. The tool works with public videos only. Private, members-only, or some age-restricted videos can't be fetched." },
            { q: "Is it legal to download YouTube videos?", a: "Downloading for personal use of content you own or that's licensed for download (e.g. Creative Commons) is generally fine. Always respect YouTube's Terms of Service and the creator's rights — don't re-upload or monetise others' work without permission." },
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
