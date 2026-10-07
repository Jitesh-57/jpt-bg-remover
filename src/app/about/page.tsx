import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "About Pixel Shine — Who We Are | Pixel Shine" },
  description: "Pixel Shine is an independent, browser-based photo editor with free image tools and pay-as-you-go AI features. Learn who builds it and how it works.",
  alternates: { canonical: "https://www.sjpt.io/about" },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <main style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>About Pixel Shine</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 48 }}>
          Pixel Shine is an independent photo editor that runs in your browser. It started as a single
          image upscaler and grew into a set of everyday image tools plus a small number of AI features
          for people who want more than a filter.
        </p>

        <Section title="Who builds it">
          Pixel Shine is designed, built and run by Jitesh, an independent developer based in India.
          There is no large company behind it: the tools, the guides on the blog and the support inbox
          are handled by the same small team. If something is broken or unclear, your message reaches
          the person who can fix it.
        </Section>

        <Section title="What you can do here">
          The free tools — upscaling, compressing, converting, cropping, resizing, rotating, blurring,
          watermarking your own images, making memes, QR codes and PDFs — run on your own device. Your
          files are not uploaded for these tools, there is no sign-up and there is no watermark on the
          result.
          <br /><br />
          The AI tools (image generation, AI photo editing, headshots and creative styles) run on
          credits you buy once. Credits never expire and nothing renews automatically.
        </Section>

        <Section title="How we write our guides">
          The articles on the <a href="/blog" style={{ color: "var(--accent)" }}>blog</a> and in the{" "}
          <a href="/answers" style={{ color: "var(--accent)" }}>AI guide</a> explain how to get better
          results from photo editing — fixing old photos, preparing profile pictures, sizing images for
          the web. We update or remove articles when a tool changes.
        </Section>

        <Section title="What we won't build">
          We don't offer tools for downloading other people&apos;s videos, removing watermarks or
          content credentials from work you don&apos;t own, or creating images of real people without
          their consent, and sexual content is not allowed on the AI tools. See our <a href="/terms" style={{ color: "var(--accent)" }}>Terms of Service</a> for the full rules.
        </Section>

        <Section title="Advertising">
          Some articles show ads served by Google AdSense. Ads help keep the free tools free. They never
          appear inside the editors or in the middle of a task. Read our{" "}
          <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a> to learn how ad
          cookies work and how to opt out of personalised ads.
        </Section>

        <Section title="Get in touch">
          Questions, feedback, bug reports or a takedown request — visit the{" "}
          <a href="/contact" style={{ color: "var(--accent)" }}>contact page</a>. We usually reply
          within two working days.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>{children}</div>
    </section>
  );
}
