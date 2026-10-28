import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import { NOINDEX } from "@/lib/seo/index-policy";
import type { Metadata } from "next";
import DeleteRequest from "./DeleteRequest";

/**
 * /delete-account — how to delete a Pixel Shine account.
 *
 * Google Play asks every app that creates accounts for a web page where people
 * can ask for that, even without the app installed; this is the address given
 * in Play Console (Data safety → Delete account URL). Requests are recorded by
 * /api/account/delete-request and carried out by hand (docs/play-store.md).
 */
export const metadata: Metadata = seoMeta({
  title: { absolute: brandedTitle("Delete your account | Pixel Shine") },
  description: "How to delete your Pixel Shine account and the photos in it, from the website or our Android apps such as AI Age Progression.",
  alternates: { canonical: "https://www.sjpt.io/delete-account" },
  robots: NOINDEX,
});

export default function DeleteAccountPage() {
  return (
    <main style={{ fontFamily: "var(--font)", color: "var(--text)", background: "var(--surface)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Delete your Pixel Shine account</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
          This page explains how to delete your account with Pixel Shine (www.sjpt.io), including an account you use in
          our Android apps, such as <b>AI Age Progression</b>. One account covers the website and the apps, so deleting
          it removes it everywhere.
        </p>

        <Section title="Ask for deletion">
          <DeleteRequest />
          <b>In the AI Age Progression app:</b> open the <b>Account</b> tab, tap <b>Delete account</b>, then{" "}
          <b>Delete my account</b>.
          <br /><br />
          <b>By email:</b> write to{" "}
          <a href="mailto:support@sjpt.io?subject=Delete%20my%20account" style={{ color: "var(--accent)" }}>support@sjpt.io</a>{" "}
          from the email address you sign in with, with the subject &quot;Delete my account&quot;.
        </Section>

        <Section title="What gets deleted">
          <ul style={{ paddingLeft: 20, lineHeight: 2, margin: 0 }}>
            <li>Your account: your name, email address and profile picture</li>
            <li>The photos you uploaded and the images you created, with the prompts used for them</li>
            <li>Your credits and plan, including any credits you haven&apos;t used</li>
            <li>Your activity history linked to the account</li>
          </ul>
        </Section>

        <Section title="What we keep">
          Our payment providers (Razorpay on the website, Google Play in the apps) keep their own records of payments
          for as long as tax and accounting law requires. We keep nothing else linked to you.
        </Section>

        <Section title="How long it takes">
          We delete the account and its data within 30 days of your request. Deletion is permanent and can&apos;t be
          undone, so save any images you want to keep first.
        </Section>

        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          More on how we handle your data: <a href="/privacy" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
        </p>
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
