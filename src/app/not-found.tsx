import type { Metadata } from "next";
import Link from "next/link";

// One title and one robots rule. Without this file the built-in 404 added its
// own <title> next to the site's, and a noindex next to the layout's
// "index, follow".
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const link: React.CSSProperties = {
    padding: "11px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)",
    color: "var(--text)", fontWeight: 700, fontSize: 14.5, textDecoration: "none",
  };
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 20px 120px", textAlign: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>404</div>
      <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", margin: "10px 0 12px" }}>This page isn&apos;t here</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.6, margin: "0 0 28px" }}>
        It may have moved. These are the places most people are looking for.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" style={{ ...link, background: "var(--grad-strong)", color: "#fff", border: "none" }}>Home</Link>
        <Link href="/creative" style={link}>AI photo apps</Link>
        <Link href="/tools" style={link}>Free tools</Link>
        <Link href="/blog" style={link}>Guides</Link>
      </div>
    </main>
  );
}
