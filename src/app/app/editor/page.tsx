import type { Metadata } from "next";
import EditorStudio from "./EditorStudio";

export const metadata: Metadata = { title: "AI Image Editor", robots: { index: false, follow: false } };

export default function EditorPage() {
  return <EditorStudio />;
}
