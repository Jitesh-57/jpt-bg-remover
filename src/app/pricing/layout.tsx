import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Pricing — Pixel Shine Monthly Plans & Credit Packs" },
  description: "Pixel Shine pricing: monthly AI credit plans from ₹415 (≈ $5) you can cancel any time, or one-time add-on packs from ₹166 that never expire. Free tools stay free.",
  alternates: { canonical: "https://www.sjpt.io/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
