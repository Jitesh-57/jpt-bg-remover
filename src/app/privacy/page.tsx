import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | JPT AI" },
  description: "Privacy Policy for JPT AI — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111", background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 48 }}>Last updated: June 23, 2025</p>

        <Section title="1. Introduction">
          JPT AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{" "}
          <a href="https://www.sjpt.io" style={{ color: "#6366F1" }}>www.sjpt.io</a> and provides AI-powered image editing tools. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
        </Section>

        <Section title="2. Information We Collect">
          <b>Account information:</b> When you sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive or store your Google password.
          <br /><br />
          <b>Usage data:</b> We collect information about how you use our tools — which features you use, images processed (not stored permanently), and credit usage.
          <br /><br />
          <b>Payment information:</b> Payments are processed by Razorpay. We do not store your card details. We receive a payment confirmation and your plan status.
          <br /><br />
          <b>Images:</b> Images you upload are used solely to perform the AI transformation you request. They are temporarily stored to process your request and are not used for training AI models or shared with third parties.
        </Section>

        <Section title="3. How We Use Your Information">
          We use your information to:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Provide and operate the JPT AI service</li>
            <li>Manage your account, credits, and subscription plan</li>
            <li>Process payments and send receipts</li>
            <li>Respond to support requests</li>
            <li>Improve our AI tools and service quality</li>
            <li>Send important service updates (not marketing spam)</li>
          </ul>
        </Section>

        <Section title="4. Data Storage and Security">
          Your account data (name, email, credits, plan) is stored securely in Supabase, a trusted cloud database provider. Images you process are temporarily handled by PixelBin (our AI processing partner) and are not permanently stored after your session. We use HTTPS encryption for all data in transit.
        </Section>

        <Section title="5. Third-Party Services">
          We work with the following trusted third-party services:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><b>Google OAuth</b> — for sign-in (email, name, profile picture only)</li>
            <li><b>Supabase</b> — secure database and authentication</li>
            <li><b>PixelBin</b> — AI image processing</li>
            <li><b>Razorpay</b> — payment processing</li>
            <li><b>Vercel</b> — hosting and infrastructure</li>
          </ul>
          Each of these services has their own Privacy Policy and we encourage you to review them.
        </Section>

        <Section title="6. Data Retention">
          We retain your account data as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Processed images are not stored permanently.
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
          <a href="mailto:support@sjpt.io" style={{ color: "#6366F1" }}>support@sjpt.io</a>.
        </Section>

        <Section title="8. Cookies">
          We use essential cookies only — for session authentication and keeping you logged in. We do not use tracking or advertising cookies.
        </Section>

        <Section title="9. Children's Privacy">
          JPT AI is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="11. Contact Us">
          If you have questions about this Privacy Policy, please contact us at:
          <br /><br />
          <b>JPT AI</b><br />
          Email: <a href="mailto:support@sjpt.io" style={{ color: "#6366F1" }}>support@sjpt.io</a><br />
          Website: <a href="https://www.sjpt.io" style={{ color: "#6366F1" }}>www.sjpt.io</a>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: "#111" }}>{title}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: "#444", margin: 0 }}>{children}</p>
    </div>
  );
}
