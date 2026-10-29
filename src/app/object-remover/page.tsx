import { seoJson, seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import { CREDIT_COST } from "@/lib/plans";
import type { Metadata } from "next";
import Link from "next/link";
import { TrialPill } from "@/app/_components/TrialOffer";
import ObjectRemoverTool from "./ObjectRemoverTool";

const BASE = "https://www.sjpt.io";
const URL = `${BASE}/object-remover`;
const OG_IMAGE = `${BASE}/object-remover/remove-person-from-photo.webp`;

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("AI Object Remover: Remove Objects From Photos | Pixel Shine") },
  description: "Remove unwanted objects and people from photos with AI. Brush over anything, press Remove, and the gap is filled to match. Full resolution, no watermark.",
  keywords: "ai object remover, remove object from photo, remove person from photo, remove unwanted objects from photos, object eraser, magic eraser online, remove people from background",
  alternates: { canonical: URL },
  openGraph: {
    title: "AI Object Remover — Remove Objects & People From Photos | Pixel Shine",
    description: "Brush over anything in a photo and AI removes it, filling the gap from what's around it.",
    url: URL,
    type: "website",
    siteName: "Pixel Shine",
    images: [{ url: OG_IMAGE, width: 1536, height: 1024, alt: "A stranger removed from the background of a travel selfie" }],
  },
});

/** The owner's before/after examples: the brushed area in red on the left, the result on the right. */
const EXAMPLES = [
  {
    src: "/object-remover/remove-person-from-photo.webp",
    alt: "Travel selfie of a woman in a sunny European square with a man in a cap and backpack brushed in red behind her, next to the same photo with the man removed and the street filled in",
    h: "Remove a person from a photo",
    p: [
      "A stranger walked into your shot. Brush over them — cap, backpack, legs and the shadow at their feet — and press Remove.",
      "The AI rebuilds what was behind them from the rest of the picture: the paving stones, the shop fronts, the trees. You stay exactly as you were.",
    ],
  },
  {
    src: "/object-remover/remove-object-from-product-photo.webp",
    alt: "Cream leather handbag on a marble coffee table with a pink takeaway cup brushed in red beside it, next to the same photo with the cup gone and the flowers and table filled in",
    h: "Clean up a product photo",
    p: [
      "A coffee cup, a price tag, a cable — the one thing that makes a product photo look like a snapshot. Brush over it and it's gone.",
      "The marble, the vase and the light behind it carry on as if it was never there, so the bag is the only thing you look at.",
    ],
  },
  {
    src: "/object-remover/remove-vase-from-room-photo.webp",
    alt: "Living room with a pink ribbed vase of eucalyptus brushed in red on a marble table, next to the same room with the vase removed and the sofa and cushion behind it rebuilt",
    h: "Remove an object from a room photo",
    p: [
      "Big objects work too. Here a vase and its branches are removed from the front of the picture.",
      "The sofa, the cushion and the reflection on the table are drawn back in behind it — handy for interior shots, rental listings and moodboards.",
    ],
  },
];

const STEPS = [
  { n: "1", t: "Upload a photo", d: "A JPG, PNG or WebP. Big photos are kept at up to 3,072 pixels on the long side." },
  { n: "2", t: "Brush over what to remove", d: "Paint over the person, object or text, a little past its edges. Brushed too much? Switch to Erase and take it back off." },
  { n: "3", t: "Press Remove", d: "AI removes it and fills the space from what's around it. Drag the slider to compare before and after, then download." },
];

const REMOVES = [
  "People in the background", "Tourists and crowds", "Photobombers", "Cars and bikes",
  "Signs, poles and bins", "Power lines and wires", "Text, dates and logos", "Cups, cables and clutter",
  "Spots, stains and dust", "Price tags and stickers",
];

const TIPS = [
  { t: "Brush a little past the edges.", d: "A thin outline of the object left behind is the most common reason for a trace. Go a few pixels wider than you think." },
  { t: "Include the shadow and reflection.", d: "A person's shadow on the ground or a vase's reflection on a glossy table belongs to the object. Brush it too, or it stays behind." },
  { t: "Remove big things in two passes.", d: "For a large object, remove most of it first, then press “Brush & remove more” and clean up what's left. Each pass works on the last result." },
  { t: "Use a big brush for big areas.", d: "Turn the Brush Size up for a person or a car, and down for a wire or a few letters of text." },
  { t: "Start from the full-size photo.", d: "The result keeps the size you upload (up to 3,072 pixels), so a screenshot or a compressed copy gives you less to work with." },
];

const FAQS = [
  { q: "How do I remove an object from a photo?", a: "Upload the photo, brush over the object and press Remove. AI takes it out and fills the space from the picture around it. Drag the slider to compare before and after, then download the result." },
  { q: "How do I remove a person from a photo?", a: "Brush over the whole person, including their shadow, and press Remove. The AI rebuilds the scene behind them. It works best when what's behind them is fairly simple — a street, grass, sand, sky, a wall. If another person is directly behind them, expect to need a second pass." },
  { q: "How much does it cost?", a: `Each removal uses ${CREDIT_COST} credits. Brushing, undoing and comparing are free; only pressing Remove uses credits, and a removal that fails costs nothing. Credits come with a monthly plan or a one-time pack, and pack credits never expire.` },
  { q: "Does it lower the quality of my photo?", a: "No. The result comes back at the size you uploaded (up to 3,072 pixels on the long side), and only the area you brushed is changed. There's no watermark." },
  { q: "I brushed over too much. How do I fix it?", a: "Switch to Erase and brush over the part you want to keep: it takes the brush off. Undo steps back one stroke, and Clear starts again." },
  { q: "Part of the object is still there. What now?", a: "Press “Brush & remove more”, brush over what's left and remove it again. Each pass works on the last result, and Undo goes back a step." },
  { q: "Can it remove text, dates or a watermark?", a: "It removes text, dates and logos you brush over. For watermarks on photos you own, the free watermark remover works in your browser without credits." },
  { q: "Is this the same as a magic eraser?", a: "It does the same job: you mark something and it disappears. Here the fill is made by an AI image model that looks at the whole photo, which helps with bigger objects and busy backgrounds." },
  { q: "Is my photo private?", a: "Your photo is sent to our AI partner to make the edit and saved to your account so you can find it in My Creations. It isn't used to train AI models and isn't sold. See our privacy policy for details." },
  { q: "Do I need an account?", a: "Yes, because removals use credits. Sign in with Google or email; your photo waits for you while you do." },
];

const RELATED = [
  { href: "/remove-bg", t: "Background remover", d: "Cut the subject out and drop the whole background." },
  { href: "/watermark-remover", t: "Watermark remover", d: "Free, runs in your browser." },
  { href: "/upscale", t: "Image upscaler", d: "Make a small photo sharp and large." },
  { href: "/ai-editor", t: "AI image editor", d: "Describe a change in words and AI makes it." },
];

export default function Page() {
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "AI Object Remover", applicationCategory: "MultimediaApplication", operatingSystem: "Web", url: URL,
    description: "Remove unwanted objects and people from photos by brushing over them. AI fills the space to match the rest of the photo.",
    image: OG_IMAGE,
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "AI Object Remover", item: URL },
    ],
  };
  const h2: React.CSSProperties = { fontSize: "clamp(1.4rem,3vw,1.75rem)", fontWeight: 900, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 12px", textWrap: "balance" };
  const intro: React.CSSProperties = { fontSize: 16, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 680, margin: "0 auto 30px", textAlign: "center" };
  const body: React.CSSProperties = { fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.7, margin: 0 };
  const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 };
  const link: React.CSSProperties = { color: "var(--accent-strong)", fontWeight: 700 };

  return (
    <main style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seoJson(breadcrumbLd) }} />

      <section style={{ background: "linear-gradient(160deg,var(--surface-2) 0%,var(--surface) 60%)", padding: "48px 16px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent-strong)", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "5px 12px" }}>
            AI tool · {CREDIT_COST} credits per removal
          </span>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.03em", margin: "16px 0 12px", textWrap: "balance" }}>
            AI Object Remover
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 660, margin: "0 auto 14px" }}>
            Remove unwanted objects, people and text from any photo. Brush over what you don&apos;t want, press Remove, and AI fills the space so it looks like it was never there.
          </p>
          <div style={{ marginBottom: 26 }}><TrialPill source="object-remover" /></div>
          <div id="tool" style={{ scrollMarginTop: 80 }}>
            <ObjectRemoverTool />
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={h2}>Before and after: objects removed with AI</h2>
          <p style={intro}>Red shows what was brushed. Everything else in the photo stays as it was.</p>
          <div style={{ display: "grid", gap: 40 }}>
            {EXAMPLES.map((e, i) => (
              <figure key={e.src} style={{ margin: 0, display: "flex", flexWrap: "wrap", gap: 26, alignItems: "center", flexDirection: i % 2 ? "row-reverse" : "row" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.src} alt={e.alt} width={1536} height={1024} loading={i === 0 ? "eager" : "lazy"} decoding="async"
                  style={{ flex: "1 1 520px", minWidth: 0, width: "100%", maxWidth: 680, height: "auto", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }} />
                <figcaption style={{ flex: "1 1 280px", minWidth: 0, display: "grid", gap: 10 }}>
                  <h3 style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.01em", margin: 0 }}>{e.h}</h3>
                  {e.p.map((t) => <p key={t} style={body}>{t}</p>)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 16px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={h2}>How to remove an object from a photo</h2>
          <p style={intro}>Three steps, and you can see the result before you download it.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ ...card, background: "var(--bg)" }}>
                <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent-strong)", fontWeight: 900 }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "12px 0 6px" }}>{s.t}</h3>
                <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 16px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={h2}>What can you remove from a photo?</h2>
          <p style={intro}>
            Almost anything you can brush over. The AI looks at everything around it — the sky, the water, the wall, the pattern on the floor — and continues it into the space.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {REMOVES.map((r) => (
              <span key={r} style={{ fontSize: 14.5, fontWeight: 700, padding: "9px 15px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)" }}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 16px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          <div style={{ ...card, background: "var(--bg)", display: "grid", gap: 10, alignContent: "start" }}>
            <h2 style={{ ...h2, textAlign: "left", fontSize: 21, margin: 0 }}>Remove people from the background</h2>
            <p style={body}>Travel photos are the classic case: a landmark, your best smile, and a stranger walking through the frame. Brush over them and their shadow, and they&apos;re gone.</p>
            <p style={body}>Several people? Remove one or two at a time. Smaller areas give the AI more of the real scene to work from.</p>
          </div>
          <div style={{ ...card, background: "var(--bg)", display: "grid", gap: 10, alignContent: "start" }}>
            <h2 style={{ ...h2, textAlign: "left", fontSize: 21, margin: 0 }}>Remove unwanted objects from product photos</h2>
            <p style={body}>Shop and marketplace photos sell better when the product is the only thing in them. Take out cups, cables, tags and dust without reshooting.</p>
            <p style={body}>
              Want a plain background instead? Use the <Link href="/remove-bg" style={link}>background remover</Link>, then the <Link href="/upscale" style={link}>image upscaler</Link> for a sharper, larger file.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 16px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <h2 style={h2}>How do you get a clean result?</h2>
          <p style={intro}>Most traces left behind come down to one of these.</p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
            {TIPS.map((t, i) => (
              <li key={t.t} style={{ ...card, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ flex: "0 0 auto", width: 28, height: 28, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13.5 }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 15.5, marginBottom: 3 }}>{t.t}</strong>
                  <span style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{t.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ padding: "56px 16px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 14 }}>
          <h2 style={h2}>What can&apos;t it do?</h2>
          <p style={body}>
            The AI fills the space with what is most likely behind the object, not what was really there. If something important was hidden — a face behind a person, words on a sign behind a pole — it can&apos;t bring that back.
          </p>
          <p style={body}>
            Very large areas, like most of the photo, give it little to work from and can look painted. Busy patterns such as crowds, text or fine fences sometimes need a second pass.
          </p>
          <h2 style={{ ...h2, marginTop: 18 }}>How much does it cost?</h2>
          <p style={body}>
            Each removal uses {CREDIT_COST} credits. Brushing, undoing and comparing cost nothing, and a removal that fails isn&apos;t charged. Credits come with a <Link href="/pricing" style={link}>monthly plan or a one-time pack</Link>; pack credits never expire. The result has no watermark and is saved in My Creations.
          </p>
        </div>
      </section>

      <section style={{ padding: "56px 16px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <h2 style={h2}>Questions people ask</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {FAQS.map((f) => (
              <details key={f.q} className="jpt-faq">
                <summary className="jpt-faq-q">
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", lineHeight: 1.4, margin: 0 }}>{f.q}</h3>
                  <span className="jpt-faq-icon" aria-hidden />
                </summary>
                <div style={{ padding: "0 24px 20px", color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "8px 16px 64px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ ...h2, fontSize: 20 }}>More photo tools</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 18 }}>
            {RELATED.map((r) => (
              <Link key={r.href} href={r.href} className="jpt-lift" style={{ ...card, padding: 16, textDecoration: "none", color: "var(--text)", display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 15 }}>{r.t} →</strong>
                <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{r.d}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
