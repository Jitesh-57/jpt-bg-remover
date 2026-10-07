import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Contact Pixel Shine | Pixel Shine" },
  description: "Contact the Pixel Shine team for support, billing questions, feedback, partnerships or copyright and takedown requests.",
  alternates: { canonical: "https://www.sjpt.io/contact" },
  robots: { index: true, follow: true },
};

const EMAIL = "support@sjpt.io";

const TOPICS: { title: string; body: string; subject: string }[] = [
  { title: "Help with a tool", body: "Something didn't work, a download failed or a result looks wrong. Tell us which tool you used, your browser and what you expected.", subject: "Support request" },
  { title: "Credits and payments", body: "Questions about a purchase, a missing credit pack or an invoice. Include the email on your account and the payment ID if you have it.", subject: "Billing question" },
  { title: "Copyright or takedown", body: "If you believe content on sjpt.io uses your work without permission, send the page URL and proof of ownership. We act on valid requests quickly.", subject: "Copyright / takedown request" },
  { title: "Privacy and data", body: "Ask for a copy of your data, correct it, or delete your account and everything linked to it.", subject: "Privacy request" },
  { title: "Feedback and partnerships", body: "Ideas for new tools, corrections to an article, or business enquiries.", subject: "Feedback" },
];

export default function ContactPage() {
  return (
    <main style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Contact us</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
          The quickest way to reach Pixel Shine is email. Write to{" "}
          <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", fontWeight: 700 }}>{EMAIL}</a>{" "}
          and we&apos;ll usually reply within two working days (Monday to Friday, India Standard Time).
        </p>

        <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
          {TOPICS.map((t) => (
            <a key={t.title} href={`mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}`}
              style={{ display: "block", padding: "20px 22px", borderRadius: 14, border: "1px solid var(--border, rgba(127,127,127,0.25))", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6, color: "var(--text)" }}>{t.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)" }}>{t.body}</div>
            </a>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Operator</h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>
          Pixel Shine (www.sjpt.io) is operated by Jitesh Patil, India.<br />
          Email: <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)" }}>{EMAIL}</a><br />
          More about us: <a href="/about" style={{ color: "var(--accent)" }}>About Pixel Shine</a> ·{" "}
          <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a> ·{" "}
          <a href="/terms" style={{ color: "var(--accent)" }}>Terms of Service</a>
        </p>
      </div>
    </main>
  );
}
