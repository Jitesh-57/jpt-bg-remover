import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Batch Image Editor — Process Multiple Photos at Once",
  description: "Upload multiple images and apply AI transformations in bulk. Remove backgrounds, upscale, or edit dozens of photos at once. Free to try — no software needed.",
  alternates: { canonical: "https://www.sjpt.io/batch-editor" },
};

export default function BatchEditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
