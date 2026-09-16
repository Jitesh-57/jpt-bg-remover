import type { Metadata } from "next";
import Link from "next/link";
import PromptLibrary from "./PromptLibrary";
import ScrollReveal from "@/app/_components/ScrollReveal";
import {
  PROMPTS, PROMPT_COUNT, CATEGORIES, PLATFORMS, promptsInCategory,
} from "@/lib/prompt-library";
import { matchLibraryImages, LIBRARY_BUCKET } from "@/lib/prompt-library-images";
import { listBucketImagesServer } from "@/lib/prompt-images.server";
import { BRAND } from "@/lib/brand";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/prompts`;

export const metadata: Metadata = {
  title: { absolute: `${PROMPT_COUNT} Free AI Photo Prompts — Copy, Paste, Generate | ${BRAND}` },
  description:
    `A library of ${PROMPT_COUNT} free AI image prompts you can copy: headshots, film looks, YouTube thumbnails, Instagram covers, product shots, ads and restoration. Sized for Instagram, TikTok, X, Facebook, LinkedIn, YouTube and Pinterest.`,
  keywords:
    "ai photo prompts, ai image prompts, free prompt library, chatgpt image prompts, gemini image prompts, instagram ai prompts, youtube thumbnail prompt, ai headshot prompt, product photography prompt, nano banana prompts",
  alternates: { canonical: URL },
  openGraph: {
    title: `${PROMPT_COUNT} free AI photo prompts`,
    description:
      "Copy-paste prompts for portraits, trends, thumbnails, covers, product shots and ads — each one sized for the platform it's meant for.",
    url: URL,
    type: "website",
    siteName: BRAND,
  },
  twitter: {
    card: "summary_large_image",
    title: `${PROMPT_COUNT} free AI photo prompts`,
    description: "Portraits, film looks, thumbnails, covers, product shots and ads. Copy, paste, generate.",
  },
};

const FAQS = [
  {
    q: "What is this prompt library?",
    a: `${PROMPT_COUNT} prompts you can copy and paste into an AI image tool. Each one is written out in full — subject, wardrobe, setting, lighting, lens and finish — because that level of detail is what separates a result you can use from a result that looks generic. They are grouped by what you are making and tagged with the aspect ratio and the platform they are composed for.`,
  },
  {
    q: "Where do I paste them?",
    a: `Anywhere that takes an image prompt. "Use it" sends the prompt straight into the ${BRAND} editor with your photo, which is the fastest route. The same text also works in ChatGPT, Google Gemini, Midjourney and most other image models — the structure they respond to is the same.`,
  },
  {
    q: "Are the prompts free?",
    a: "Yes. Every prompt on this page is free to copy and use, with no account. Generating an image inside Pixel Shine uses credits; generating it in a tool you already pay for does not cost you anything here.",
  },
  {
    q: "Will the result still look like me?",
    a: "Every prompt involving a person leads with the instruction to keep your face, bone structure and skin tone exactly as they are. That instruction is what does the work, so keep it at the front if you edit the prompt. A sharp, front-facing, well-lit source photo helps more than any wording.",
  },
  {
    q: "Why do the prompts mention an aspect ratio?",
    a: "Because composition is platform-specific. A YouTube thumbnail needs the face large and the left side empty for a headline; an Instagram story has to keep the top and bottom clear of the app's own interface; a Pinterest pin is read at about 236 pixels wide. The ratio on each card is what that prompt is composed for.",
  },
  {
    q: "Can I edit a prompt?",
    a: "They are written to be edited. Swap the wardrobe, the setting, the colour or the decade and leave the structure alone — the identity instruction first, then the scene, then the light, then the finish. That order is what the models respond to most reliably.",
  },
  {
    q: "Do you copy prompts from other sites?",
    a: "No. Every prompt here is written for this product and tested against the models it actually runs. Copied prompt text would be someone else's work, and duplicate content besides.",
  },
];

export default async function PromptsPage() {
  // Resolved server-side so the image URLs are in the HTML rather than
  // arriving after a client fetch. An unreachable bucket yields {} and every
  // card falls back to its designed placeholder.
  const files = await listBucketImagesServer(LIBRARY_BUCKET);
  const images = matchLibraryImages(PROMPTS, files);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${PROMPT_COUNT} free AI photo prompts`,
    numberOfItems: PROMPT_COUNT,
    itemListElement: PROMPTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `${URL}/${p.slug}`,
    })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Prompts", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ background: "var(--bg)", color: "var(--text)" }}>
        {/* HERO */}
        <section style={{ padding: "62px 24px 34px", textAlign: "center" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="jpt-pill" style={{ marginBottom: 18 }}>✨ Prompt library</div>
            <h1 className="jpt-h1">
              {PROMPT_COUNT} <span className="jpt-grad-text">AI photo prompts</span>, free to copy
            </h1>
            <p className="jpt-lead" style={{ maxWidth: 640, margin: "0 auto 24px" }}>
              Written in full — wardrobe, set, lighting, lens and finish — and composed for the
              platform each one is meant for. Copy it anywhere, or send it straight into the editor
              with your own photo.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", justifyContent: "center", fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>✓ {CATEGORIES.length} categories</span>
              <span>✓ {PLATFORMS.length} platform sizes</span>
              <span>✓ No sign-up to copy</span>
              <span>✓ Keeps your real face</span>
            </div>
          </div>
        </section>

        {/* CATEGORY OVERVIEW — also the internal-link surface for crawlers */}
        <section style={{ padding: "0 24px 30px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 12 }}>
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/prompts?c=${c.id}`}
                className="jpt-hover"
                style={{
                  display: "flex", gap: 12, alignItems: "flex-start", textDecoration: "none",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "14px 15px",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1.2 }}>{c.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "var(--text)" }}>
                    {c.name}
                    <span style={{ color: "var(--text-faint)", fontWeight: 700 }}> · {promptsInCategory(c.id).length}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>
                    {c.blurb}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* THE LIBRARY */}
        <PromptLibrary images={images} />

        {/* HOW TO WRITE ONE */}
        <section style={{ padding: "0 24px 58px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <h2 className="jpt-h2" style={{ textAlign: "center" }}>How these are built</h2>
            <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "0 0 26px", lineHeight: 1.7 }}>
              Every prompt here follows the same order, because it is the order the models answer to.
              Keep it when you edit one, and change only the middle.
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {[
                ["Identity first", "Say what must not change before you say what should. If the face is mentioned last, it is the first thing to drift."],
                ["Then the scene", "Wardrobe, setting, props. Be specific — \"a cream linen suit\" beats \"nice clothes\" every time."],
                ["Then the light", "Direction, quality and colour. This is the single biggest difference between a snapshot and a photograph."],
                ["Then the camera", "Lens, angle, depth of field, framing. A long lens from across the street looks nothing like a phone held at arm's length."],
                ["Finish last", "Grade, grain, the print or film stock. Say \"real photograph, natural skin texture\" unless you want an illustration."],
              ].map(([t, d], i) => (
                <li key={t} style={{ display: "flex", gap: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "15px 17px" }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: "var(--accent-strong)", minWidth: 22 }}>{i + 1}</span>
                  <span>
                    <strong style={{ display: "block", fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{t}</strong>
                    <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{d}</span>
                  </span>
                </li>
              ))}
            </ol>
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

        {/* RELATED */}
        <section style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Keep going</h2>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", margin: "0 0 18px" }}>
              Prompts are one way in. These do the same jobs with the settings already chosen.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { icon: "✦", title: "All AI apps", href: "/creative" },
                { icon: "🔥", title: "80s photo prompts", href: "/80s-ai-photo-prompts" },
                { icon: "🧰", title: "Free tools", href: "/tools" },
                { icon: "🔍", title: "Upscale a result", href: "/upscale" },
                { icon: "✂️", title: "Crop for Instagram", href: "/crop-image" },
              ].map((r) => (
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
