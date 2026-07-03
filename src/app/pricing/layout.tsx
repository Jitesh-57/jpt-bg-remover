import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — JPT AI Image Editor Plans",
  description: "Simple, transparent pricing for JPT AI. Start free with no credit card. Upgrade for unlimited AI background removal, 4K upscaling, and AI photo editing.",
  alternates: { canonical: "https://www.sjpt.io/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
