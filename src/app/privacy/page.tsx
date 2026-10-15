import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import type { Metadata } from "next";

export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("Privacy Policy | Pixel Shine") },
  description: "Privacy Policy for Pixel Shine — how we collect, use, and protect your data.",
  alternates: { canonical: "https://www.sjpt.io/privacy" },
  robots: { index: true, follow: true },
});

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 48 }}>Last updated: October 14, 2026</p>

        <Section title="1. Introduction">
          Pixel Shine (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{" "}
          <a href="https://www.sjpt.io" style={{ color: "var(--accent)" }}>www.sjpt.io</a> and provides AI-powered image editing tools. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
        </Section>

        <Section title="2. Information We Collect">
          <b>Account information:</b> When you sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive or store your Google password.
          <br /><br />
          <b>Usage data:</b> We collect information about how you use our website and tools — the pages you visit, which features you use, how you found us (such as the referring website or campaign link), your approximate location (country and city) and type of device, the images you process and the prompts you write, and credit usage.
          <br /><br />
          <b>Payment information:</b> Payments are processed by Razorpay. We do not store your card details. We receive a payment confirmation and your plan status.
          <br /><br />
          <b>Images:</b> Images you upload, and the images you create from them, are used to perform the AI transformation you request and are kept with your account so we can run, support and improve the service. They are not used to train AI models, and are not sold or shared with anyone other than the partners that process them (see section 5).
        </Section>

        <Section title="3. How We Use Your Information">
          We use your information to:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Provide and operate the Pixel Shine service</li>
            <li>Manage your account, credits, and subscription plan</li>
            <li>Process payments and send receipts</li>
            <li>Respond to support requests</li>
            <li>Improve our AI tools and service quality</li>
            <li>Send important service updates (not marketing spam)</li>
          </ul>
        </Section>

        <Section title="4. Data Storage and Security">
          Your account data (name, email, credits, plan) is stored securely in Supabase, a trusted cloud database provider. Images you process with our AI tools are sent to fal.ai, our AI processing partner, which runs the image models (such as Google's Nano Banana Pro). The images you create are saved to your account so you can find them in My Creations, and you can delete them there at any time. We use HTTPS encryption for all data in transit.
        </Section>

        <Section title="5. Third-Party Services">
          We work with the following trusted third-party services:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><b>Google OAuth</b> — for sign-in (email, name, profile picture only)</li>
            <li><b>Supabase</b> — secure database and authentication</li>
            <li><b>fal.ai</b> — AI image processing</li>
            <li><b>Google Analytics</b> — measuring visits and how the site is used</li>
            <li><b>Razorpay</b> — payment processing</li>
            <li><b>Vercel</b> — hosting and infrastructure</li>
          </ul>
          Each of these services has their own Privacy Policy and we encourage you to review them.
        </Section>

        <Section title="6. Data Retention">
          We retain your account data as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Uploaded and created images, and the prompts used with them, are kept with your account until you ask us to delete them or your account; images you create can also be deleted from My Creations at any time.
        </Section>

        <Section title="7. Your Rights">
          You have the right to:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Withdraw consent at any time</li>
          </ul>
          To exercise these rights, contact us at{" "}
          <a href="mailto:support@sjpt.io" style={{ color: "var(--accent)" }}>support@sjpt.io</a>.
        </Section>

        <Section title="8. Cookies">
          We use cookies to keep you signed in, and first-party cookies that remember how you first reached us (for example, the referring website or campaign link) so we can understand how people find and use the service. Google Analytics and Google&apos;s ad measurement set their own cookies to measure visits and how our ads perform. We do not sell your data.
        </Section>

        <Section title="9. Children's Privacy">
          Pixel Shine is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="11. Contact Us">
          If you have questions about this Privacy Policy, please contact us at:
          <br /><br />
          <b>Pixel Shine</b><br />
          Email: <a href="mailto:support@sjpt.io" style={{ color: "var(--accent)" }}>support@sjpt.io</a><br />
          Website: <a href="https://www.sjpt.io" style={{ color: "var(--accent)" }}>www.sjpt.io</a>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>{title}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>{children}</p>
    </div>
  );
}
