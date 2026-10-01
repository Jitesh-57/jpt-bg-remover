import type { Metadata } from "next";
import Link from "next/link";
import HiddenMarksTool from "./HiddenMarksTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/invisible-watermark-remover`;
const GRAD = "linear-gradient(120deg,var(--accent),var(--accent-2))";

export const metadata: Metadata = {
  title: { absolute: "Invisible Watermark & Metadata Remover — Strip EXIF, GPS, C2PA & Hidden Characters | Pixel Shine" },
  description:
    "Remove hidden metadata from photos, PDFs and documents: EXIF, GPS location, XMP, C2PA Content Credentials, AI prompts and author names. Clean zero-width and hidden Unicode characters from text. Free, private, runs in your browser.",
  keywords:
    "invisible watermark remover, metadata remover, remove exif data, remove gps from photo, remove c2pa, content credentials remover, zero width character remover, hidden characters in text, remove metadata from pdf, remove metadata from word document",
  alternates: { canonical: URL },
  openGraph: {
    title: "Invisible Watermark & Metadata Remover | Pixel Shine",
    description: "Strip EXIF, GPS, XMP, C2PA and AI prompts from files, and hidden characters from text — free and private, in your browser.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invisible Watermark & Metadata Remover | Pixel Shine",
    description: "Remove hidden metadata and invisible characters — nothing is uploaded.",
  },
};

const FAQS = [
  { q: "What does this tool remove?", a: "From files: EXIF (camera, serial number, dates), GPS location, XMP and IPTC records, C2PA Content Credentials manifests, AI generation prompts saved in PNGs, comments, thumbnails, document author and company names, and audio tags. From text: zero-width characters, direction-control characters, Unicode tag characters, stray variation selectors and look-alike spaces." },
  { q: "Are my files uploaded anywhere?", a: "No. Cleaning happens entirely in your browser. Your files never leave your device, which is the point when you are removing private details like your location." },
  { q: "Does it reduce image quality?", a: "No. The tool never decodes or re-compresses the picture. It copies the image data byte-for-byte and only leaves out the metadata blocks, so the pixels are identical to the original." },
  { q: "Will my photo still be the right way up?", a: "Yes. Phone photos often rely on an EXIF rotation flag. The tool keeps just that one flag and removes everything else, so the photo still displays correctly." },
  { q: "Does it remove visible watermarks like logos or text?", a: "No — this tool is for hidden marks. To remove a visible watermark or logo from a photo you own, use our Watermark Remover." },
  { q: "Can it remove SynthID or other pixel-level AI watermarks?", a: "No. Watermarks like Google SynthID are woven into the pixels or into the word choices of AI text, not stored as metadata. No tool can reliably remove them without changing the content itself, and this tool doesn’t try." },
  { q: "What is a zero-width character?", a: "An invisible Unicode character, such as U+200B ZERO WIDTH SPACE, that takes up no space on screen. They can be used to fingerprint copied text or hide messages. Paste text into the Text tab to see each one highlighted." },
  { q: "Is it legal to remove metadata?", a: "Removing metadata from your own files — for privacy before you share them — is normal and widely done. Don’t use it to strip credit or copyright information from other people’s work, or to misrepresent where content came from; platform rules and copyright law may apply." },
];

const REMOVES = [
  "GPS location", "Camera & serial number", "EXIF dates", "XMP & IPTC", "C2PA Content Credentials", "AI prompts in PNG",
  "PDF author & producer", "Word / Excel / PowerPoint author", "Zero-width characters", "Hidden Unicode tags", "Bidi controls", "MP3 / FLAC / WAV tags",
];

const STEPS = [
  { t: "Add files or paste text", d: "Drop photos, PDFs, Office files or audio — or paste text into the Text tab. Everything stays on your device." },
  { t: "See what was hidden", d: "Each file gets a report: GPS coordinates, camera, software, AI prompts, Content Credentials, authors and more." },
  { t: "Download the clean copy", d: "Every cleaned file is re-checked automatically. Download one by one or all at once as a ZIP." },
];

const RELATED = [
  { icon: "🪄", title: "Watermark Remover", href: "/watermark-remover" },
  { icon: "🫥", title: "Blur Image", href: "/blur-image" },
  { icon: "🔀", title: "Convert Image", href: "/convert-image" },
  { icon: "🗜️", title: "Compress Image", href: "/compress-image" },
];

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "Invisible Watermark & Metadata Remover", applicationCategory: "UtilitiesApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: URL,
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)" }}>
        {/* HERO + TOOL */}
        <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 55%,var(--success-soft) 100%)", padding: "56px 20px 48px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "inline-block", background: "var(--accent-soft)", color: "var(--accent)", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "6px 14px", marginBottom: 16 }}>
                Free · Runs in your browser · Nothing uploaded
              </div>
              <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.14, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 14px" }}>
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Invisible Watermark</span>{" "}
                &amp; Metadata Remover
              </h1>
              <p style={{ fontSize: "clamp(1rem,2vw,1.12rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 660, margin: "0 auto" }}>
                See and strip what your files carry behind the scenes — GPS location, camera details, AI prompts, C2PA Content Credentials and author names — plus hidden characters in text. Lossless, private, free.
              </p>
            </div>
            <HiddenMarksTool />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "56px 24px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 32px", letterSpacing: "-0.02em", textAlign: "center" }}>
              How to remove hidden metadata
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 22px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, marginBottom: 14 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT IT REMOVES */}
        <section style={{ padding: "8px 24px 56px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,1.9rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 22px", letterSpacing: "-0.02em" }}>What it removes</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {REMOVES.map((r) => (
                <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span>{r}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 640, margin: "22px auto 0" }}>
              Not covered: visible watermarks and logos (use the <Link href="/watermark-remover" style={{ color: "var(--accent)" }}>Watermark Remover</Link>), and pixel-level AI watermarks such as SynthID, which live in the image itself rather than in its metadata.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "48px 24px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 28px", letterSpacing: "-0.02em", textAlign: "center" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
                <summary style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", cursor: "pointer" }}>{f.q}</summary>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED */}
        <section style={{ padding: "48px 24px 72px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.02em" }}>More free tools</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {RELATED.map((r) => (
                <Link key={r.href} href={r.href} className="jpt-hover" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                  <span>{r.icon}</span> {r.title}
                </Link>
              ))}
              <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                All tools →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
