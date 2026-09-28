import type { Metadata } from "next";
import EditorLauncher from "./EditorLauncher";

export const metadata: Metadata = { title: "Page editor — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  return <EditorLauncher />;
}
