import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Editor — Edit Images with Text Prompts Online",
  description: "Edit any photo with plain English prompts. Remove backgrounds, change lighting, generate new backgrounds, and upscale quality — all in one free AI editor.",
  alternates: { canonical: "https://www.sjpt.io/editor" },
  robots: { index: false, follow: true },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
