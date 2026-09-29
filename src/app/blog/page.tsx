import type { Metadata } from "next";
import BlogIndex from "./_components/BlogIndex";

export const metadata: Metadata = {
  title: { absolute: "Image Upscaling Blog — Tips, Tutorials & Guides | Pixel Shine" },
  description:
    "Learn how to upscale images, enhance photo quality, fix blurry pictures, and get print-ready resolution. Free upscaling tutorials and guides from Pixel Shine.",
  keywords: [
    "image upscaling tips",
    "upscale image tutorial",
    "enhance photo quality guide",
    "fix blurry photo",
    "ai image upscaler guide",
  ],
  alternates: { canonical: "https://www.sjpt.io/blog" },
  openGraph: {
    title: "Image Upscaling Blog | Pixel Shine",
    description: "Tutorials, guides and tips for upscaling and enhancing images for free.",
    type: "website",
  },
};

/* Covers follow the creatives uploaded in /admin, re-read with the creative gallery's cadence. */
export const revalidate = 300;

export default function BlogIndexPage() {
  return <BlogIndex page={1} />;
}
