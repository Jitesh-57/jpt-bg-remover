import type { Metadata } from "next";
import Link from "next/link";
import PromptBrowser from "./PromptBrowser";
import ScrollReveal from "@/app/_components/ScrollReveal";
import { PROMPT_COUNT, GROUPS } from "@/lib/prompts-80s";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/80s-ai-photo-prompts`;

export const metadata: Metadata = {
  title: { absolute: "100 Free 80s AI Photo Prompts (Copy & Paste) — ChatGPT & Gemini | JPT AI" },
  description:
    "100 free copy-paste prompts for the viral 80s AI photo trend. Yearbook, studio glamour, neon synthwave and Bollywood retro styles that keep your real face. Works in ChatGPT and Gemini.",
  keywords:
    "80s ai photo prompt, 80s ai photo trend, chatgpt 80s prompt, 80s yearbook ai, retro ai photo prompt, bollywood retro ai prompt, gemini 80s photo, ai yearbook prompt",
  alternates: { canonical: URL },
  openGraph: {
    title: "100 Free 80s AI Photo Prompts (Copy & Paste)",
    description:
      "The viral 80s AI photo trend, solved: 100 ready-made prompts for ChatGPT and Gemini — yearbook, studio glamour, neon and Bollywood retro.",
    url: URL,
    type: "article",
    siteName: "JPT AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "100 Free 80s AI Photo Prompts",
    description: "Copy-paste prompts for the viral 80s AI photo trend — works in ChatGPT and Gemini.",
  },
};

const STEPS = [
  { t: "Pick a prompt", d: "Choose a style below and hit Copy. Every prompt already includes the line that stops the AI changing your face." },
  { t: "Upload a clear photo", d: "Open ChatGPT or Gemini, attach a front-facing, well-lit photo, and paste the prompt. Front-facing works best." },
  { t: "Generate and refine", d: "If the face drifts, re-send with “keep my exact facial features unchanged”. Try a different year for a different look." },
  { t: "Polish it here", d: "Bring the result back to sjpt.io to upscale it to 4K, crop it for Instagram, or compress it for sharing — all free." },
];

const FAQS = [
  { q: "What is the 80s AI photo trend?", a: "It's a viral trend where people use ChatGPT or Gemini to restyle a normal photo of themselves as an authentic-looking 1980s picture — big hair, shoulder pads, studio lighting and film grain. Popular versions include yearbook portraits, studio glamour shots, neon synthwave and vintage Bollywood styling." },
  { q: "How do I keep my own face in the photo?", a: "That's the single most important line in the prompt. Every prompt here starts by telling the AI to preserve your exact facial features, bone structure and natural skin tone, and to change only hair, makeup, wardrobe, lighting and background. If the face still drifts, send the instruction again on its own." },
  { q: "Do these prompts work in Gemini as well as ChatGPT?", a: "Yes. The same prompt structure works in ChatGPT, Google Gemini and most image models — they all respond to the same pattern of identity-lock, styling detail and a specific year." },
  { q: "What photo should I upload for the best result?", a: "A clear, front-facing, well-lit photo at a decent resolution. Avoid heavy sunglasses, extreme angles and busy backgrounds — the model has more to work with when your face is clearly visible." },
  { q: "Why do the prompts mention a specific year like 1986?", a: "Naming an exact year rather than just “the 80s” makes the output far more specific — the model picks period-accurate hair, clothing and film stock instead of a generic retro filter. Change the year to shift the look across the decade." },
  { q: "Is it safe to upload my photo to an AI tool?", a: "Use your judgement. Avoid uploading photos containing documents, private surroundings, or other people who haven't agreed to it. Note that some platforms add visible or hidden watermarks to AI-generated images. The free tools on sjpt.io run in your browser, so images you edit here aren't uploaded to a server." },
  { q: "Are these prompts free to use?", a: "Yes — all 100 are free to copy and use, with no sign-up. You'll need access to ChatGPT or Gemini to generate the image itself." },
];

const RELATED = [
  { icon: "🔍", title: "Upscale your result to 4K", href: "/upscale" },
  { icon: "✂️", title: "Crop for Instagram", href: "/crop-image" },
  { icon: "🗜️", title: "Compress before sharing", href: "/compress-image" },
  { icon: "🪄", title: "Remove the background", href: "/editor?tool=remove-bg" },
];

export default function Page() {
  const howToLd = {
    "@context": "https://schema.org", "@type": "HowTo",
    name: "How to do the 80s AI photo trend",
    description: "Turn a normal photo into an authentic-looking 1980s portrait using a copy-paste prompt in ChatGPT or Gemini.",
    step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "80s AI Photo Prompts", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        {/* HERO */}
        <section style={{ padding: "64px 24px 40px", textAlign: "center" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="jpt-pill" style={{ marginBottom: 18 }}>🔥 Trending now</div>
            <h1 className="jpt-h1">
              100 free <span className="jpt-grad-text">80s AI photo</span> prompts
            </h1>
            <p className="jpt-lead" style={{ maxWidth: 620, margin: "0 auto 26px" }}>
              Copy, paste, and get an authentic-looking 1980s portrait that still looks like you.
              Yearbook, studio glamour, neon synthwave and vintage Bollywood — works in ChatGPT and Gemini.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", justifyContent: "center", fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>✓ {PROMPT_COUNT} prompts</span>
              <span>✓ No sign-up</span>
              <span>✓ Keeps your real face</span>
              <span>✓ ChatGPT &amp; Gemini</span>
            </div>
          </div>
        </section>

        {/* TRUST NOTE */}
        <section style={{ padding: "0 24px 44px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text)" }}>Before you upload anywhere:</strong> avoid photos showing documents,
            private surroundings, or other people who haven&apos;t agreed to it. These prompts run in ChatGPT or Gemini —
            the free editing tools on this site run in your browser, so images you edit <em>here</em> never reach a server.
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "0 24px 56px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 className="jpt-h2" style={{ textAlign: "center" }}>How to do the trend</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 18, marginTop: 28 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 20px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--grad-strong)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 12 }}>{i + 1}</div>
                  <h3 className="jpt-h3">{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROMPTS */}
        <section style={{ padding: "0 24px 64px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <h2 className="jpt-h2" style={{ textAlign: "center" }}>All {PROMPT_COUNT} prompts</h2>
            <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "0 0 32px" }}>
              {GROUPS.length} styles. Every prompt is written to keep your real face — tap Copy and paste it straight into ChatGPT or Gemini.
            </p>
            <PromptBrowser />
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "0 24px 56px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 className="jpt-h2" style={{ textAlign: "center" }}>Questions</h2>
            <div style={{ marginTop: 26 }}>
              {FAQS.map((f) => (
                <details key={f.q} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "15px 18px", marginBottom: 10 }}>
                  <summary style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                  <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED TOOLS */}
        <section style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Finish your 80s photo here — free</h2>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: "0 0 18px" }}>
              Generated your image? These run in your browser, no sign-up.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
                  <span>{r.icon}</span> {r.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
