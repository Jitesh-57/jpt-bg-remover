import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | JPT AI",
  description: "Terms of Service for JPT AI — rules and conditions for using our AI image editing tools.",
};

export default function TermsPage() {
  return (
    <main style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#111", background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 48 }}>Last updated: June 23, 2025</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using JPT AI (&quot;the Service&quot;) at{" "}
          <a href="https://www.sjpt.io" style={{ color: "#6366F1" }}>www.sjpt.io</a>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          JPT AI provides AI-powered image editing tools including background removal, image upscaling, AI editing, headshot generation, and batch processing. The Service is provided on a credit-based system with both free and paid tiers.
        </Section>

        <Section title="3. Account Registration">
          You may sign in using your Google account. By signing in, you authorize JPT AI to access your basic Google profile information (name, email, profile picture). You are responsible for maintaining the security of your account and for all activities that occur under it.
        </Section>

        <Section title="4. Credits and Payments">
          <b>Free trials:</b> New users receive 5 free trials in total, usable on any 5 distinct tools or Creative Apps (a maximum of one free trial per distinct tool). Basic, non-AI tools such as Resize, Color Adjust and the standard Upscale are always free and unlimited, with no trial or credit required.
          <br /><br />
          <b>Paid plans:</b> Credits can be purchased through one-time payments processed by Razorpay. Purchased credits do not expire and are non-refundable except as required by applicable law.
          <br /><br />
          <b>Credit usage:</b> Different AI tools consume different amounts of credits as displayed in the editor. Credits are deducted when a transformation is successfully applied.
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to use JPT AI to:
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Process images that contain illegal content, including child sexual abuse material</li>
            <li>Generate or edit content that violates any applicable laws or regulations</li>
            <li>Infringe on any third party&apos;s intellectual property rights</li>
            <li>Attempt to reverse engineer, scrape, or abuse the Service</li>
            <li>Use automated bots or scripts to consume credits or overload the Service</li>
            <li>Misrepresent AI-generated or AI-edited content as unedited originals in deceptive ways</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <b>Your images:</b> You retain full ownership of images you upload and the results you download. By uploading an image, you confirm you have the right to process it.
          <br /><br />
          <b>Our service:</b> JPT AI, its logo, software, and AI models are owned by us and protected by intellectual property laws. You may not copy, reproduce, or distribute any part of our Service without written permission.
        </Section>

        <Section title="7. Privacy">
          Your use of the Service is also governed by our{" "}
          <a href="/privacy" style={{ color: "#6366F1" }}>Privacy Policy</a>, which is incorporated into these Terms by reference.
        </Section>

        <Section title="8. Disclaimer of Warranties">
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that AI results will meet your specific requirements. AI-generated results may vary in quality.
        </Section>

        <Section title="9. Limitation of Liability">
          To the fullest extent permitted by law, JPT AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data or profits, arising out of or in connection with your use of the Service.
        </Section>

        <Section title="10. Service Availability">
          We reserve the right to modify, suspend, or discontinue the Service (or any part of it) at any time with or without notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
        </Section>

        <Section title="11. Changes to Terms">
          We reserve the right to update these Terms at any time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated Terms.
        </Section>

        <Section title="12. Governing Law">
          These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in India.
        </Section>

        <Section title="13. Contact Us">
          If you have questions about these Terms of Service, please contact us at:
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
