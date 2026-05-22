import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPT Background Remover",
  description: "Remove image backgrounds instantly with AI — powered by Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
