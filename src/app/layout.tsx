import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./_components/NavBar";

export const metadata: Metadata = {
  title: "JPT AI Tools",
  description: "AI-powered image tools — Background Remover & AI Headshot Generator, powered by Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
