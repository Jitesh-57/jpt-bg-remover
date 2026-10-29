import { seoJson, seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GuidesBlock from "@/app/_components/GuidesBlock";
import OwnerTodo, { SHOW_TODOS } from "@/app/_components/OwnerTodo";
import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/app/_components/ScrollReveal";
import WatermarkRemoverTool from "./WatermarkRemoverTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/watermark-remover`;
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";
const OG_IMAGE = `${BASE}/watermark-remover/og.jpg`;

// The page went live on 25 Jul 2026 (#134). Change UPDATED only when the tool or the page's text really changes.
const PUBLISHED = "2026-07-25";
const UPDATED = "2026-10-29";
const UPDATED_LABEL = "October 29, 2026";

const LAMA_URL = "https://github.com/advimman/lama";
const ORT_URL = "https://onnxruntime.ai/docs/tutorials/web/";

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Watermark Remover – Free, No Sign-Up, In Your Browser | Pixel Shine") },
  description: "Free AI watermark remover: paint over a logo, text, timestamp or signature and AI erases it. No sign-up, and your photo never leaves your browser.",
  keywords:
    "ai watermark remover, watermark remover, remove watermark, watermark remover online, remove watermark from image, remove watermark from photo, free watermark remover, image watermark remover",
  alternates: { canonical: URL },
  openGraph: {
    title: "Free AI Watermark Remover: Erase Logos, Text & Timestamps | Pixel Shine",
    description: "Paint over a watermark and AI rebuilds what was behind it. Free, no sign-up, and it runs privately in your browser, so your photo is never uploaded.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Product photo before and after a logo watermark was removed" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Watermark Remover | Pixel Shine",
    description: "Paint over a watermark and AI rebuilds what was behind it. Free, no sign-up, and your photo is never uploaded.",
    images: [OG_IMAGE],
  },
});

const ext: React.CSSProperties = { color: "var(--accent)", fontWeight: 700 };

/** `a` is the plain answer (also used in the FAQ structured data); `rich` is the same answer with its links. */
const FAQS: { q: string; a: string; rich?: React.ReactNode }[] = [
  { q: "How do I remove a watermark from an image for free?", a: "Upload your image, paint over the watermark with the brush and click Remove Painted Area. The AI rebuilds what was behind it — drag the slider to compare, then click Download." },
  { q: "Is it really free?", a: "Yes — completely. No sign-up, no credits, no limits and no watermark of our own on the result. It runs in your browser, so it costs us nothing per photo." },
  { q: "Is my photo uploaded anywhere?", a: "No. This AI watermark remover runs entirely on your own device, in your browser. Your photo never leaves your computer or phone." },
  {
    q: "Why does the first removal take a little longer?",
    a: "The first time, your browser downloads the AI model (about 109 MB). PixelShine uses LaMa, an open-source inpainting model, which runs locally through ONNX Runtime Web. The model is saved, so after that, removal starts straight away, usually in a second or two on a computer with a modern graphics card.",
    rich: <>The first time, your browser downloads the AI model (about 109 MB). PixelShine uses <a href={LAMA_URL} rel="noopener" target="_blank" style={ext}>LaMa</a>, an open-source inpainting model, which runs locally through <a href={ORT_URL} rel="noopener" target="_blank" style={ext}>ONNX Runtime Web</a>. The model is saved, so after that, removal starts straight away, usually in a second or two on a computer with a modern graphics card.</>,
  },
  { q: "How do I make the brush bigger or smaller?", a: "Use the Brush size slider. The circle on the image shows exactly how much the brush will cover — paint a little past the edges of the watermark for the cleanest result." },
  { q: "What if part of the watermark is still visible?", a: "Click Paint & remove more, brush over what's left and remove it again. Undo last removal takes you back a step if you don't like a result." },
  { q: "What kinds of watermarks can it remove?", a: "Logos, text overlays, date and time stamps, signatures, stamps and small objects. It works best when the watermark sits over sky, walls, fabric or other natural texture." },
  { q: "Does it work on my phone?", a: "Yes. Paint with your finger on phones and tablets. Older phones without graphics acceleration are slower, but it still works." },
  {
    q: "Should I only remove watermarks I own?",
    a: "Yes. Only remove watermarks from images you own or have permission to edit. A watermark often identifies who owns a photo. In the US, removing that kind of ownership information on purpose can break copyright law under 17 U.S.C. § 1202 (integrity of copyright management information), and other countries have similar rules. The U.S. Copyright Office FAQ is a good plain-English starting point. For more detail, read our guide Is It Legal to Remove a Watermark?. This isn't legal advice. If you're unsure, ask the copyright owner.",
    rich: <>Yes. Only remove watermarks from images you own or have permission to edit. A watermark often identifies who owns a photo. In the US, removing that kind of ownership information on purpose can break copyright law under <a href="https://www.law.cornell.edu/uscode/text/17/1202" rel="noopener" target="_blank" style={ext}>17 U.S.C. § 1202</a> (integrity of copyright management information), and other countries have similar rules. The <a href="https://www.copyright.gov/help/faq/" rel="noopener" target="_blank" style={ext}>U.S. Copyright Office FAQ</a> is a good plain-English starting point. For more detail, read our guide <Link href="/blog/is-it-legal-to-remove-a-watermark" style={ext}>Is It Legal to Remove a Watermark?</Link>. This isn&apos;t legal advice. If you&apos;re unsure, ask the copyright owner.</>,
  },
];

const FEATURES = [
  { t: "Paint & it's gone", d: "Brush over the watermark and AI inpainting rebuilds what was behind it — no smudge, no blur.", icon: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" },
  { t: "100% free, no limits", d: "No account, no credits, no daily cap and no watermark of our own on the result.", icon: "M12 3v18M5 12h14" },
  { t: "Private — never uploaded", d: "The AI runs in your browser, so your photo stays on your device the whole time.", icon: "M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" },
  { t: "Any kind of mark", d: "Logos, text, timestamps, signatures, stamps and small objects.", icon: "M4 7h16M4 12h10M4 17h7" },
  { t: "Full-quality download", d: "Only the area you paint is rebuilt; the rest of your photo is kept as it was. You download a high-quality JPG at the same size as your photo, up to 4,096 pixels on the long side. Supported formats: JPG, PNG and WebP.", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" },
  { t: "Undo & refine", d: "Remove more in as many passes as you like, and undo any step.", icon: "M13 3L4 14h7l-1 8 9-11h-7z" },
];

const REMOVES = [
  "Logo watermarks", "Text overlays", "Date & time stamps", "Signatures",
  "Stamps", "Captions", "Small objects", "Blemishes & spots",
];

const STEPS = [
  { t: "Upload your image", d: "Drag in or select the photo, screenshot or download that has the watermark you want gone." },
  { t: "Paint over the watermark", d: "Brush over it — the circle shows your brush size. Then click Remove Painted Area and the AI rebuilds what was behind it." },
  { t: "Download the clean image", d: "Compare with the slider, remove more if needed, then download — free, at full quality." },
];

/**
 * Real results from this tool: a mark was added to one of our own photos,
 * then removed here with the brush, and both images saved unretouched.
 */
const EXAMPLES = [
  { file: "logo-watermark", caption: "Logo watermark removed from a product photo",
    before: "Cream leather handbag on a marble table with a white NOVA STUDIO logo watermark across it",
    after: "The same handbag photo with the logo watermark removed by the PixelShine AI watermark remover" },
  { file: "text-timestamp", caption: "Text and timestamp cleared from a photo",
    before: "Travel selfie of a smiling woman in sunglasses with the text “© travelpix stock” and a 2026-08-14 17:32 timestamp over it",
    after: "The same travel selfie with the text and the timestamp removed" },
  { file: "date-stamp", caption: "Date stamp erased",
    before: "Living room with a candle and a stone bowl on a marble table, and an orange camera date stamp in the corner",
    after: "The same living room photo with the date stamp erased" },
  { file: "signature", caption: "Signature removed from artwork — the blossoms under it come back as a smoother wash of color",
    before: "Pastel illustration of a woman in a kimono in front of pink hills, with a handwritten signature in the lower right corner",
    after: "The same illustration with the signature removed; the corner where it was is filled with a smoother wash of color than the blossoms around it" },
];

/** What PixelShine offers, for the comparison table. Competitor columns are the owner's own test results. */
const COMPARE_ROWS: [string, string][] = [
  ["Price", "Free"],
  ["Account needed", "No"],
  ["Where your photo is processed", "In your browser, on your device"],
  ["Credits or daily cap", "None"],
  ["Adds its own watermark", "No"],
  ["Accepted formats", "JPG, PNG, WebP"],
  ["Download resolution", "Same as your photo, up to 4,096 px on the long side"],
  ["Result on our test images", ""],
];

function Frame({ src, label, alt }: { src: string; label: string; alt: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0, aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface-2)" }}>
      <span style={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: label === "After" ? "var(--success)" : "var(--accent)", background: "var(--surface)", borderRadius: 999, padding: "4px 10px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={764} height={573} loading="lazy" decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}

function BeforeAfter({ file, caption, before, after }: (typeof EXAMPLES)[number]) {
  return (
    <figure style={{ margin: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 16, boxShadow: "0 8px 24px rgba(30,41,90,.05)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <Frame src={`/watermark-remover/${file}-before.webp`} label="Before" alt={before} />
        <Frame src={`/watermark-remover/${file}-after.webp`} label="After" alt={after} />
      </div>
      <figcaption style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center", margin: "12px 0 2px", fontWeight: 600 }}>
        {caption} (764 × 573 px, one pass){" "}<OwnerTodo inline>removal time on your device</OwnerTodo>
      </figcaption>
    </figure>
  );
}

const RELATED = [
  { href: "/tiktok-watermark-remover", label: "TikTok No-Watermark" },
  { href: "/compress-image", label: "Compress Image" },
  { href: "/convert-image", label: "Convert Image" },
  { href: "/crop-image", label: "Crop Image" },
  { href: "/upscale", label: "Image Upscaler" },
  { href: "/watermark-image", label: "Add Watermark" },
  { href: "/invisible-watermark-remover", label: "Invisible Watermark & Metadata Remover" },
];

const h2: React.CSSProperties = { fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em", textWrap: "balance" };
const para: React.CSSProperties = { fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 14px" };

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "PixelShine AI Watermark Remover",
    url: URL,
    description: "Free AI watermark remover that runs in your browser. Paint over a logo, text, timestamp or signature and AI inpainting rebuilds what was behind it. No sign-up, and your photo is never uploaded.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Modern web browser. Downloads an AI model of about 109 MB on first use.",
    featureList: [
      "Remove logo watermarks, text overlays, date and time stamps, signatures, stamps and small objects",
      "AI inpainting runs in the browser; photos are never uploaded",
      "No account, no credits, no daily cap and no added watermark",
      "Full-quality download; only the painted area changes",
      "Multiple passes with undo",
      "Supports JPG, PNG and WebP",
    ],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "PixelShine", url: `${BASE}/` },
    // No aggregateRating: there are no collected reviews behind one, and made-up
    // ratings in structured data risk a Google manual action.
  };
  const pageLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    url: URL,
    name: "AI Watermark Remover | PixelShine",
    datePublished: PUBLISHED,
    dateModified: UPDATED,
    // TODO(owner): add "url" (an author or About page) once one exists.
    author: { "@type": "Person", name: "Jitesh", jobTitle: "Founder" },
    publisher: { "@type": "Organization", name: "PixelShine", url: `${BASE}/` },
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "AI Watermark Remover", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(breadcrumbLd) }} />
      <ScrollReveal />

      <div style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO */}
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "60px 24px 52px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "6px 14px", marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ✦ Free · in-browser · no sign-up
            </div>
            <h1 style={{ fontSize: "clamp(2.1rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 16px", textWrap: "balance" }}>
              Free AI Watermark Remover: Erase Watermarks From Photos{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>in Seconds</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem,2vw,1.15rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 14px" }}>
              PixelShine&apos;s AI watermark remover erases logos, text, timestamps and signatures from your photos for free. Upload a JPG, PNG or WebP, paint over the watermark, and AI inpainting rebuilds what was behind it. It all runs in your browser, so your photo is never uploaded, with no sign-up and no watermark of our own.
            </p>
            <p style={{ fontSize: 13, color: "var(--text-faint)", margin: "0 auto 28px", maxWidth: 640, lineHeight: 1.6 }}>
              Built and maintained by Jitesh, founder of PixelShine. Last updated <time dateTime={UPDATED}>{UPDATED_LABEL}</time>: new before-and-after examples and sources.
              {" "}<OwnerTodo inline>link &ldquo;Jitesh&rdquo; to an author or About page, and add one sentence of genuine background (for example, years building image tools).</OwnerTodo>
            </p>
            <div id="tool" style={{ scrollMarginTop: 80 }}><WatermarkRemoverTool /></div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 26, fontSize: 13.5, color: "var(--text-muted)", fontWeight: 600 }}>
              <span>✓ 100% free</span>
              <span>✓ No sign-up</span>
              <span>✓ Works on any device</span>
              <span>✓ Never uploaded</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-faint)", margin: "14px auto 0", maxWidth: 560, lineHeight: 1.6 }}>
              The first time, your browser downloads the AI model, which is about 109 MB. After that, a removal usually takes a second or two on a computer with a modern graphics card.
            </p>
          </div>
        </section>

        {/* BEFORE / AFTER SHOWCASE */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <h2 style={h2}>AI watermark removal: before &amp; after</h2>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                Real results from this tool, shown unretouched. We added each mark to one of our own photos, then removed it here with the brush.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: 20 }}>
              {EXAMPLES.map((e) => <BeforeAfter key={e.file} {...e} />)}
            </div>
          </div>
        </section>

        {/* FIRST-HAND TESTING — the owner's own results; stays out of production until written */}
        {SHOW_TODOS && (
          <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              <h2 style={{ ...h2, textAlign: "center" }}>What we found testing the AI watermark remover</h2>
              <p style={para}>We ran PixelShine on <OwnerTodo inline>number</OwnerTodo> of our own photos with watermarks, logos, date stamps and signatures, on <OwnerTodo inline>devices and browsers used</OwnerTodo>. Here&apos;s what happened, including where it fell short.</p>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 8px" }}>How we tested</h3>
              <ul style={{ ...para, paddingLeft: 20 }}>
                <li>Images: <OwnerTodo inline>what kinds of images you tested, all owned by you or used with permission</OwnerTodo></li>
                <li>Marks removed: <OwnerTodo inline>which mark types you tried</OwnerTodo></li>
                <li>Method: one pass with the brush painted slightly past the edges of the mark, then a second pass with &lsquo;Paint &amp; remove more&rsquo; only if needed</li>
              </ul>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 8px" }}>What worked well</h3>
              <OwnerTodo>your real observations, e.g. which backgrounds came out clean in one pass. The page says it works best over sky, walls, fabric and other natural texture — confirm or correct this.</OwnerTodo>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 8px" }}>Where it struggled</h3>
              <OwnerTodo>honest failures you saw, e.g. marks crossing faces, text, sharp edges or repeating patterns, and how many extra passes they needed.</OwnerTodo>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 8px" }}>Speed</h3>
              <p style={para}>The first removal is slower because your browser downloads the AI model (about 109 MB) and saves it. In our tests, later removals took <OwnerTodo inline>measured time</OwnerTodo> on <OwnerTodo inline>device</OwnerTodo> and <OwnerTodo inline>measured time</OwnerTodo> on <OwnerTodo inline>phone model</OwnerTodo>.</p>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: "18px 0 8px" }}>Tips from our testing</h3>
              <ul style={{ ...para, paddingLeft: 20 }}>
                <li>Paint a little past the edges of the watermark. <OwnerTodo inline>what you saw happen when you didn&apos;t</OwnerTodo></li>
                <li><OwnerTodo inline>any other tip from your own runs</OwnerTodo></li>
              </ul>
              <OwnerTodo>&ldquo;Tested by [name and role] on [test date]&rdquo;, plus an optional link to your About page.</OwnerTodo>
            </div>
          </section>
        )}

        {/* WHY USE IT — FEATURES */}
        <section style={{ padding: "56px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 38 }}>
              <h2 style={h2}>Why use PixelShine&apos;s AI watermark remover</h2>
              <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "0 auto", maxWidth: 700, lineHeight: 1.6 }}>
                PixelShine makes free online image tools, including this AI watermark remover, an image compressor, converter and cropper. The watermark remover is built to make watermarks vanish without leaving a smudge behind, and it runs entirely in your browser.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
              {FEATURES.map((f) => (
                <div key={f.t} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px", boxShadow: "0 6px 20px rgba(30,41,90,.04)" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                  </span>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{f.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ ...h2, textAlign: "center" }}>How to remove a watermark with AI</h2>
            <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "0 0 30px", textAlign: "center" }}>Removing a watermark with AI takes three steps. You don&apos;t need an account or an app.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "24px 0 0", textAlign: "center" }}>
              <strong style={{ color: "var(--text)" }}>How PixelShine works:</strong> the brush tells an AI inpainting model which pixels to rebuild, and the model fills them in from the surrounding image, all on your device. Model: <a href={LAMA_URL} rel="noopener" target="_blank" style={ext}>LaMa (Apache-2.0 licence)</a>, run with <a href={ORT_URL} rel="noopener" target="_blank" style={ext}>ONNX Runtime Web</a>. Built by Jitesh, founder of PixelShine.
            </p>
            <OwnerTodo>link &ldquo;Jitesh&rdquo; above to your About page once you have one.</OwnerTodo>
          </div>
        </section>

        {/* WHAT YOU CAN REMOVE */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 22px", letterSpacing: "-0.02em" }}>What you can remove</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {REMOVES.map((r) => (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span>{r}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON — competitor columns are the owner's own tests; stays out of production until filled */}
        {SHOW_TODOS && (
          <section style={{ padding: "56px 24px", background: "var(--surface-2)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <h2 style={{ ...h2, textAlign: "center" }}>How PixelShine compares to other AI watermark removers</h2>
              <p style={para}>We tried <OwnerTodo inline>names of 2–4 competing tools you actually tested</OwnerTodo> on the same images in <OwnerTodo inline>month and year of testing</OwnerTodo>. Here is how they differ on the things people ask us about most. Check each tool&apos;s own site for current terms, because pricing and limits change.</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "var(--surface)", borderRadius: 12 }}>
                  <thead>
                    <tr>{["", "PixelShine", "Competitor A", "Competitor B"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{k}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>{v || <OwnerTodo inline>your honest one-line verdict</OwnerTodo>}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}><OwnerTodo inline>add</OwnerTodo></td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}><OwnerTodo inline>add</OwnerTodo></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <OwnerTodo>2–3 sentences of honest takeaway, including where a competitor does better (for example, a feature PixelShine doesn&apos;t have).</OwnerTodo>
            </div>
          </section>
        )}

        {/* WHEN IT WORKS */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <h2 style={{ ...h2, textAlign: "center", marginBottom: 20 }}>When AI watermark removal works well, and when it struggles</h2>
            <p style={para}>The AI doesn&apos;t uncover the original pixels. It fills in the painted area with its best guess, based on what surrounds it. That is why results are cleanest when the watermark sits over sky, walls, fabric or other natural texture, where a convincing guess is easy to make.</p>
            <OwnerTodo>from your own testing, describe the cases where results are weaker (large marks over faces, text or fine repeating patterns) and what helps, such as removing in several smaller passes.</OwnerTodo>
            <p style={para}><strong style={{ color: "var(--text)" }}>Tip:</strong> paint a little past the edges of the watermark. Leftover outline pixels are the most common reason a faint trace remains.</p>
          </div>
        </section>

        {/* HOW IT WAS MADE */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <h2 style={{ ...h2, textAlign: "center", marginBottom: 20 }}>How this tool works and how we tested it</h2>
            <p style={para}>
              PixelShine uses an AI inpainting model, <a href={LAMA_URL} rel="noopener" target="_blank" style={ext}>LaMa</a> (big-lama, released under the Apache-2.0 licence), that runs entirely in your browser through ONNX Runtime Web — on your graphics card where the browser supports WebGPU, otherwise on the processor. When you click Remove Painted Area, the model looks at the pixels around your brush strokes and generates new pixels to fill the gap. Nothing is sent to our servers, which is why the first run includes a one-time download of about 109 MB.
            </p>
            <p style={para}>The before-and-after examples on this page were made with this tool from our own photos and haven&apos;t been retouched.</p>
            <OwnerTodo>how many images you tested (logos, text overlays, date stamps, signatures), on which devices and browsers, and how you judged quality (for example, against the original unwatermarked image).</OwnerTodo>
            <OwnerTodo>say whether AI helped write this page, e.g. &ldquo;We drafted parts of this page with AI help and checked every claim against the tool itself.&rdquo;</OwnerTodo>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "56px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.rich ?? f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", background: GRAD, borderRadius: 22, padding: "40px 30px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Ready to remove your watermark?</h2>
            <p style={{ margin: "0 0 24px", fontSize: 15.5, color: "rgba(255,255,255,.92)" }}>Upload your image and get a clean, watermark-free result — free, no sign-up.</p>
            <a href="#tool" className="jpt-hover" style={{ display: "inline-block", background: "var(--surface)", color: "var(--accent)", borderRadius: 12, padding: "15px 34px", fontSize: 16, fontWeight: 800, textDecoration: "none" }}>
              Remove Watermark Now →
            </a>
          </div>
        </section>

        {/* RELATED FREE TOOLS — internal linking */}
        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free image tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  {r.label}
                </Link>
              ))}
              <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", border: "1px solid #C7CDF5", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                All tools →
              </Link>
            </div>
          </div>
        </section>
      </div>
      <GuidesBlock path="/watermark-remover" />
    </>
  );
}
