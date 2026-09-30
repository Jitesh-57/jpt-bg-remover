import type { Metadata } from "next";
import Link from "next/link";
import { CREDIT_COST, PACKS } from "@/lib/plans";

export const metadata: Metadata = {
  title: { absolute: "Docs — How Pixel Shine Works | Pixel Shine" },
  description: "How Pixel Shine works: credits and pricing, AI Studio, creative apps, the AI image editor, free browser tools, prompts and your account.",
  alternates: { canonical: "https://www.sjpt.io/docs" },
  openGraph: { title: "Pixel Shine Docs", description: "Everything about using Pixel Shine, in one place.", url: "https://www.sjpt.io/docs", type: "website" },
};

type Section = { id: string; title: string; body: React.ReactNode };

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: "0 0 14px", fontSize: 15.5, color: "var(--text-muted)", lineHeight: 1.75 }}>{children}</p>
);
const L = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{children}</Link>
);
const Steps = ({ items }: { items: React.ReactNode[] }) => (
  <ol style={{ margin: "0 0 16px", paddingLeft: 22, color: "var(--text-muted)", fontSize: 15.5, lineHeight: 1.75 }}>
    {items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
  </ol>
);

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting started",
    body: (
      <>
        <P>Pixel Shine is an AI photo studio. There are two kinds of tools:</P>
        <Steps items={[
          <><strong style={{ color: "var(--text)" }}>Free tools</strong> — crop, resize, compress, convert, blur and more. They run in your browser, need no account and never use credits.</>,
          <><strong style={{ color: "var(--text)" }}>AI tools</strong> — AI Studio, creative apps, the AI image editor and image creation. These need an account and use credits.</>,
        ]} />
        <P>Sign in with Google or with an email and password from <strong style={{ color: "var(--text)" }}>Sign in</strong> at the top of any page. Once you are signed in, <L href="/app">Dashboard</L> is your home for everything you make.</P>
      </>
    ),
  },
  {
    id: "credits",
    title: "Credits and pricing",
    body: (
      <>
        <P>Every AI generation costs <strong style={{ color: "var(--text)" }}>{CREDIT_COST} credits</strong>. Credits come in one-time packs — there is no subscription, and credits never expire.</P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "4px 0 18px" }}>
          {PACKS.map((p) => (
            <div key={p.id} style={{ border: `1px solid ${p.popular ? "var(--accent-border)" : "var(--border)"}`, background: p.popular ? "var(--accent-soft)" : "var(--surface)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", margin: "4px 0 2px", fontVariantNumeric: "tabular-nums" }}>{p.credits} credits</div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>₹{p.inr} (about ${p.usd}) · {p.generations} generations</div>
            </div>
          ))}
        </div>
        <P>Buy credits from <L href="/pricing">Pricing</L> or the <strong style={{ color: "var(--text)" }}>Buy credits</strong> button. Payments are handled by Razorpay and charged in Indian rupees. Your balance shows next to your name and in <L href="/app/credits">Credits</L>, with a history of every purchase and generation.</P>
        <P>Some new accounts get a small free trial, depending on where they sign up. If you get one, a message tells you when you first sign in.</P>
      </>
    ),
  },
  {
    id: "ai-studio",
    title: "AI Studio",
    body: (
      <>
        <P><L href="/app/studio">AI Studio</L> lets you edit a photo by describing what you want, then keep refining it in plain words.</P>
        <Steps items={[
          "Upload a photo. The studio scans it and shows what it found, with ideas made for that photo.",
          "Pick an idea or type your own request, for example “put this product on a marble table”.",
          "Check what the studio understood, then press Generate. That is when credits are used.",
          "Keep going: every result becomes a new version you can compare with the original, continue from, or download.",
        ]} />
        <P>Reading your photo and requests is free while you have credits. Without credits, you can try it on one photo, then you are asked to buy credits.</P>
      </>
    ),
  },
  {
    id: "creative-apps",
    title: "Creative apps",
    body: (
      <>
        <P><L href="/creative">Creative apps</L> are one-click looks: professional headshots, Ghibli style, 3D figurines, vintage glamour, saree photoshoots and many more. Each app page shows a before and after, so you know what you will get.</P>
        <Steps items={["Open an app.", "Upload a clear photo, ideally one person facing the camera in good light.", `Generate. It uses ${CREDIT_COST} credits, and the result is saved to My Creations.`]} />
      </>
    ),
  },
  {
    id: "editing",
    title: "Editing and creating images",
    body: (
      <>
        <P><strong style={{ color: "var(--text)" }}>AI image editor</strong> (<L href="/app/editor">open</L>) — upload a photo and describe the change: remove an object, change the background, change clothing, fix the lighting.</P>
        <P><strong style={{ color: "var(--text)" }}>Create image</strong> (<L href="/app/create">open</L>) — describe a picture and get a new image from text.</P>
        <P><strong style={{ color: "var(--text)" }}>Recreate</strong> (<L href="/app/recreate">open</L>) — take the look of any photo you like and apply it with your own face.</P>
        <P>Each generation uses {CREDIT_COST} credits. If one does not come out right, change your wording and try again. Being specific about what to keep and what to change helps most.</P>
      </>
    ),
  },
  {
    id: "free-tools",
    title: "Free tools",
    body: (
      <>
        <P>The free tools work entirely in your browser, so your photo is not uploaded anywhere. There is no sign-in and no watermark.</P>
        <P>
          <L href="/crop-image">Crop</L> · <L href="/resize-image">Resize</L> · <L href="/compress-image">Compress</L> · <L href="/convert-image">Convert</L> · <L href="/blur-image">Blur</L> · <L href="/rotate-image">Rotate &amp; flip</L> · <L href="/watermark-image">Add watermark</L> · <L href="/image-to-pdf">Image to PDF</L> · <L href="/meme-generator">Meme generator</L> · <L href="/qr-code-generator">QR code</L>. See <L href="/tools">all free tools</L>.
        </P>
      </>
    ),
  },
  {
    id: "prompts",
    title: "Prompts",
    body: (
      <>
        <P>The <L href="/prompts">prompt library</L> collects ready-made prompts for popular looks, each with an example image. Copy one and use it in AI Studio or the AI image editor, or in your favourite model.</P>
        <P>There are collections for specific models, such as <L href="/nano-banana-pro-prompts">Nano Banana Pro</L>, <L href="/gpt-image-2-prompts">GPT Image</L> and <L href="/seedream-4-5-prompts">Seedream 4.5</L>, and for <L href="/prompts/video">video</L>.</P>
      </>
    ),
  },
  {
    id: "creations",
    title: "My Creations",
    body: (
      <P>Every AI result is saved to <L href="/app/library">My Creations</L> in your dashboard, so you can find it and download it again later.</P>
    ),
  },
  {
    id: "account",
    title: "Account and help",
    body: (
      <>
        <P>Your account details are in <L href="/app/settings">Settings</L>. Credits stay on your account; they don't expire.</P>
        <P>Stuck, charged but no credits, or a result that went wrong? Email <strong style={{ color: "var(--text)" }}>support@sjpt.io</strong> with the email you signed in with, and what happened.</P>
        <P>See also our <L href="/privacy">Privacy policy</L> and <L href="/terms">Terms</L>.</P>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100vh", padding: "48px 20px 80px" }}>
      <div className="jpt-docs" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 40, alignItems: "start" }}>
        <aside className="jpt-docs-nav" style={{ position: "sticky", top: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>On this page</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>{s.title}</a>
            ))}
          </nav>
        </aside>

        <article style={{ minWidth: 0 }}>
          <div style={{ display: "inline-block", background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Docs</div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.8px", lineHeight: 1.15 }}>How Pixel Shine works</h1>
          <p style={{ margin: "0 0 36px", fontSize: 17, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 640 }}>
            Credits, the AI tools, the free tools and your account, explained in one place.
          </p>
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 80, paddingTop: i ? 28 : 0, marginTop: i ? 28 : 0, borderTop: i ? "1px solid var(--border)" : "none" }}>
              <h2 style={{ margin: "0 0 14px", fontSize: 23, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
