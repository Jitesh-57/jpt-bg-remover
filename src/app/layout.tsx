import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./_components/NavBar";
import Footer from "./_components/Footer";

export const metadata: Metadata = {
  title: "JPT AI",
  description: "JPT AI — All-in-one AI image editor. Remove backgrounds, upscale photos, generate AI backgrounds, and edit images with a simple text prompt.",
  verification: { google: "oaUjZEOCATyjaE5OvAHr6gXTXGjt6wJnk436SYbf1O4" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
