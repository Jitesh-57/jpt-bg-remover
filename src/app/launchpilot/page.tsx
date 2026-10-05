import type { Metadata } from "next";
import LaunchPilotClient from "./LaunchPilotClient";

export const metadata: Metadata = {
  title: "LaunchPilot — List your product on 70+ launch sites and directories",
  description: "LaunchPilot reads your website, writes a listing for Product Hunt, BetaList, G2, AlternativeTo and 70+ directories in each site's own style, and tracks every submission and launch date.",
  alternates: { canonical: "/launchpilot" },
};

export default function LaunchPilotPage() {
  return <LaunchPilotClient />;
}
