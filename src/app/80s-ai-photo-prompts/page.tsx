import type { Metadata } from "next";
import Link from "next/link";
import PromptBrowser from "./PromptBrowser";
import ScrollReveal from "@/app/_components/ScrollReveal";
import { PROMPT_COUNT, GROUPS, PROMPTS } from "@/lib/prompts-80s";
import { matchImages } from "@/lib/prompt-images";
import { listBucketImagesServer } from "@/lib/prompt-images.server";

export const revalidate = 300;

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/80s-ai-photo-prompts`;

export const metadata: Metadata = {
  title: { absolute: "100 Free 80s AI Photo Prompts (Copy & Paste) — ChatGPT & Gemini | Pixel Shine" },
  description:
    "100 free copy-paste prompts for the viral 80s AI photo trend. Motorcycle and classic-car portraits, rainy streets, weddings, disco nights and family albums — all written to keep your real face. Works in ChatGPT and Gemini.",
  keywords:
    "80s ai photo prompt, 80s ai photo trend, chatgpt 80s prompt, retro ai photo prompt, 1980s ai photo, vintage bollywood ai prompt, gemini 80s photo, 80s indian photo prompt, ai photo prompt copy paste",
  alternates: { canonical: URL },
  openGraph: {
    title: "100 Free 80s AI Photo Prompts (Copy & Paste)",
    description:
      "The viral 80s AI photo trend, solved: 100 ready-made prompts for ChatGPT and Gemini — street, travel, romance, weddings, disco and family portraits.",
    url: URL,
    type: "article",
    siteName: "Pixel Shine",
  },
  twitter: {
    card: "summary_large_image",
    title: "100 Free 80s AI Photo Prompts",
    description: "Copy-paste prompts for the viral 80s AI photo trend — works in ChatGPT and Gemini.",
  },
};

const FAQS = [
  { q: "What is the 80s AI photo trend?", a: "It's a viral trend where people use ChatGPT or Gemini to restyle a normal photo of themselves as an authentic-looking 1980s picture — big hair, shoulder pads, studio lighting and film grain. The prompts here cover motorcycle and classic-car portraits, rainy streets and tea stalls, cafés and park benches, weddings and receptions, disco floors, village roads, and formal family studio portraits." },
  { q: "How do I keep my own face in the photo?", a: "That's the single most important instruction, and every prompt here carries it: preserve your recognisable identity, facial features, facial structure and natural skin tone, and do not copy the reference person's face. If the face still drifts, send that instruction again on its own." },
  { q: "Do these prompts work in Gemini as well as ChatGPT?", a: "Yes. The same prompt structure works in ChatGPT, Google Gemini and most image models — they all respond to the same pattern of identity-lock first, then the scene, styling and camera detail to copy." },
  { q: "What photo should I upload for the best result?", a: "A clear, front-facing, well-lit photo at a decent resolution. Avoid heavy sunglasses, extreme angles and busy backgrounds — the model has more to work with when your face is clearly visible." },
  { q: "Do I need a reference image as well as my photo?", a: "These prompts are written to work alongside a reference image — the picture whose composition, pose, framing and styling you want to copy. Upload your own photo as the identity reference, add the reference image, then paste the prompt. The prompt tells the model to take only the look from the reference and keep your face from your photo." },
  { q: "Is it safe to upload my photo to an AI tool?", a: "Use your judgement. Avoid uploading photos containing documents, private surroundings, or other people who haven't agreed to it. Note that some platforms add visible or hidden watermarks to AI-generated images. The free tools on Pixel Shine keep your image private — nothing you edit there is saved or shared." },
  { q: "Are these prompts free to use?", a: "Yes — all 100 are free to copy and use, with no sign-up. You'll need access to ChatGPT or Gemini to generate the image itself." },
];

const RELATED = [
  { icon: "✨", title: "The full prompt library", href: "/prompts" },
  { icon: "🔍", title: "Upscale your result to 4K", href: "/upscale" },
  { icon: "✂️", title: "Crop for Instagram", href: "/crop-image" },
  { icon: "🗜️", title: "Compress before sharing", href: "/compress-image" },
  { icon: "🪄", title: "Remove the background", href: "/editor?tool=remove-bg" },
];

export default async function Page() {
  // Resolved on the server so the image URLs ship in the HTML.
  const files = await listBucketImagesServer();
  const resolvedImages = matchImages(PROMPTS, files);

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
              Pick the look, copy the prompt, keep your own face. Motorcycles and classic cars,
              rainy streets, weddings, disco nights and family albums — works in ChatGPT and Gemini.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", justifyContent: "center", fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>✓ {PROMPT_COUNT} prompts</span>
              <span>✓ No sign-up</span>
              <span>✓ Keeps your real face</span>
              <span>✓ ChatGPT &amp; Gemini</span>
            </div>
          </div>
        </section>

        {/* PROMPTS */}
        <section style={{ padding: "8px 24px 64px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <h2 className="jpt-h2" style={{ textAlign: "center" }}>All {PROMPT_COUNT} prompts</h2>
            <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "0 0 32px" }}>
              {GROUPS.length} styles. Every prompt is written to keep your real face — tap Copy and paste it straight into ChatGPT or Gemini.
            </p>
            <PromptBrowser initialImages={resolvedImages} />
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
              Generated your image? These are free, with no sign-up.
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
