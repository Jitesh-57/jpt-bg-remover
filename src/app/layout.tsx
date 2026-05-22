import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JPT AI Tools",
  description: "AI-powered image tools — Background Remover & AI Headshot Generator, powered by Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav className="jpt-nav">
          <div className="jpt-nav-inner">
            <a href="/" className="jpt-brand">
              <span className="jpt-brand-icon">✦</span>
              <span className="jpt-brand-text">JPT AI</span>
            </a>
            <div className="jpt-nav-divider" />
            <span className="jpt-section-label">AI Tools</span>
            <div className="jpt-nav-links">
              <a href="/editor" className="jpt-nav-link">
                <span>🖼️</span> AI Image Editor
              </a>
              <a href="/headshot" className="jpt-nav-link">
                <span>🎯</span> AI Headshot
              </a>
            </div>
            <div style={{ flex: 1 }} />
            <span className="jpt-gem-badge">✨ Gemini AI</span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
